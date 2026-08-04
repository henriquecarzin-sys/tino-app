// supabase/functions/generate-card/index.ts
//
// Fluxo: recebe o caminho do áudio já enviado ao Storage -> transcreve (Whisper) ->
// gera o cartão estruturado (Claude, framework dos 3 Ss) -> salva em `cards` -> retorna.
//
// Segredos necessários (supabase secrets set ...):
//   OPENAI_API_KEY       — transcrição (Whisper)
//   ANTHROPIC_API_KEY    — geração do cartão (Claude)
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem automaticamente no runtime.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOM_VALUES = ["urgente", "cobranca_leve", "informativo", "ideia"] as const;
type Tom = (typeof TOM_VALUES)[number];

interface GenerateCardPayload {
  audioPath: string;
  duracao: string;
  waveform: number[];
}

interface GeneratedCardFields {
  tom: Tom;
  ideiaCentral: string;
  acoes: string[];
  evitar: string[];
  surpreendente: string;
  respostaDirecta: string;
  respostaPolida: string;
}

const SYSTEM_PROMPT = `Você é o motor de análise do TINO, um assistente que transforma áudios em cartões de ação seguindo o framework dos "3 Ss": Simples, Sexy e Surpreendente.

Dada a transcrição de um áudio (geralmente uma mensagem de voz do WhatsApp), gere um cartão de ação em JSON com este formato exato, sem nenhum texto fora do JSON:

{
  "tom": "urgente" | "cobranca_leve" | "informativo" | "ideia",
  "ideiaCentral": string (uma frase, o essencial do áudio),
  "acoes": string[] (ações concretas e específicas, no máximo 4),
  "evitar": string[] (armadilhas ou erros a evitar, no máximo 3; pode ser um array vazio),
  "surpreendente": string (o diferencial do produto: uma contradição, risco ou segunda intenção que a pessoa NÃO disse explicitamente, mas está implícita no que foi dito),
  "respostaDirecta": string (uma resposta curta e direta que a pessoa poderia mandar de volta),
  "respostaPolida": string (a mesma resposta, em tom mais educado e cordial)
}

Regras para o campo "surpreendente" (o mais importante — é o diferencial do TINO):
- Nunca repita algo que já foi dito explicitamente no áudio.
- Procure por: promessa implícita, urgência não declarada, uma segunda demanda escondida atrás da primeira, um padrão que se repete, ou um risco que a pessoa está minimizando.
- Se genuinamente não houver nada implícito relevante, diga isso claramente em vez de inventar algo forçado — mas isso deve ser raro.

Responda APENAS com o JSON puro, sem markdown, sem \`\`\`json, sem texto antes ou depois.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError("Não autenticado.", 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const jwt = authHeader.replace("Bearer ", "");

    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData.user) return jsonError("Sessão inválida.", 401);
    const userId = userData.user.id;

    const payload = (await req.json()) as Partial<GenerateCardPayload>;
    if (!payload.audioPath || !payload.duracao) {
      return jsonError("audioPath e duracao são obrigatórios.", 400);
    }

    // valida que o áudio pertence mesmo a este usuário antes de gastar tokens com ele
    if (!payload.audioPath.startsWith(`${userId}/`)) {
      return jsonError("audioPath não pertence a este usuário.", 403);
    }

    const { data: signedUrlData, error: signedUrlError } = await admin.storage
      .from("audio-recordings")
      .createSignedUrl(payload.audioPath, 60);

    if (signedUrlError || !signedUrlData) {
      return jsonError("Não foi possível acessar o áudio enviado.", 500);
    }

    const transcript = await transcribeAudio(signedUrlData.signedUrl);
    if (!transcript.trim()) {
      return jsonError("Não conseguimos identificar fala no áudio.", 422);
    }

    const generated = await generateCardFromTranscript(transcript);

    const { data: inserted, error: insertError } = await admin
      .from("cards")
      .insert({
        user_id: userId,
        duracao: payload.duracao,
        tom: generated.tom,
        ideia_central: generated.ideiaCentral,
        acoes: generated.acoes,
        evitar: generated.evitar,
        surpreendente: generated.surpreendente,
        resposta_direta: generated.respostaDirecta,
        resposta_polida: generated.respostaPolida,
        audio_path: payload.audioPath,
        waveform: payload.waveform ?? [],
      })
      .select()
      .single();

    if (insertError || !inserted) {
      console.error(insertError);
      return jsonError("Falha ao salvar o cartão.", 500);
    }

    return new Response(JSON.stringify({ card: inserted }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return jsonError("Erro inesperado ao gerar o cartão.", 500);
  }
});

async function transcribeAudio(audioUrl: string): Promise<string> {
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) throw new Error("Não foi possível baixar o áudio pra transcrever.");
  const audioBlob = await audioResponse.blob();

  const form = new FormData();
  form.append("file", audioBlob, "audio.webm");
  form.append("model", "whisper-1");
  form.append("language", "pt");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Falha na transcrição (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { text: string };
  return data.text;
}

async function generateCardFromTranscript(transcript: string): Promise<GeneratedCardFields> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Transcrição do áudio:\n\n${transcript}` }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha na geração do cartão (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { content: { type: string; text?: string }[] };
  const rawText = data.content.find((block) => block.type === "text")?.text ?? "";
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  let parsed: GeneratedCardFields;
  try {
    parsed = JSON.parse(cleaned) as GeneratedCardFields;
  } catch {
    throw new Error("Resposta do modelo não veio em JSON válido.");
  }

  return {
    tom: TOM_VALUES.includes(parsed.tom) ? parsed.tom : "informativo",
    ideiaCentral: parsed.ideiaCentral ?? "",
    acoes: Array.isArray(parsed.acoes) ? parsed.acoes.slice(0, 4) : [],
    evitar: Array.isArray(parsed.evitar) ? parsed.evitar.slice(0, 3) : [],
    surpreendente: parsed.surpreendente ?? "",
    respostaDirecta: parsed.respostaDirecta ?? "",
    respostaPolida: parsed.respostaPolida ?? "",
  };
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
