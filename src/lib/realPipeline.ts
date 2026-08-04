import { supabase } from "./supabaseClient";
import { formatDuration } from "./waveform";
import { mapRowToCard, type CardRow } from "./cardMapper";
import type { RecordingResult } from "../hooks/useAudioRecorder";
import type { TinoCardData } from "../types";

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

/**
 * Sobe o áudio pro Storage e chama a edge function que transcreve + gera o cartão.
 *
 * Sobre progresso de upload: o SDK do Supabase Storage não expõe % de progresso hoje
 * (limitação conhecida da lib, não nossa). Em vez de fabricar uma porcentagem falsa,
 * mostramos um status indeterminado — é honesto e evita informação errada. Se um dia
 * isso importar de verdade, dá pra trocar por upload via signed URL + XMLHttpRequest
 * manual, que expõe `upload.onprogress`.
 */
export async function runRealPipeline(
  result: RecordingResult,
  userId: string,
  onStatus?: (label: string | null) => void,
): Promise<TinoCardData> {
  if (!supabase) throw new Error("Supabase não configurado.");

  const path = `${userId}/${Date.now()}.${extensionFromMimeType(result.mimeType)}`;

  onStatus?.("Enviando áudio…");
  const { error: uploadError } = await supabase.storage
    .from("audio-recordings")
    .upload(path, result.blob, { contentType: result.mimeType, upsert: false });

  if (uploadError) {
    throw new Error("Não foi possível enviar o áudio. Verifique sua conexão e tente de novo.");
  }
  onStatus?.(null);

  const { data, error: fnError } = await supabase.functions.invoke<{ card: CardRow }>(
    "generate-card",
    {
      body: {
        audioPath: path,
        duracao: formatDuration(result.durationMs),
        waveform: result.waveform,
      },
    },
  );

  if (fnError || !data?.card) {
    throw new Error("Não conseguimos gerar o cartão a partir desse áudio. Tente novamente.");
  }

  const { data: signedUrlData } = await supabase.storage
    .from("audio-recordings")
    .createSignedUrl(path, 60 * 60);

  return mapRowToCard(data.card, signedUrlData?.signedUrl);
}

export async function fetchRemoteCards(): Promise<TinoCardData[]> {
  if (!supabase) return [];
  const client = supabase;

  const { data, error } = await client
    .from("cards")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error || !data) return [];

  const rows = data as CardRow[];

  return Promise.all(
    rows.map(async (row) => {
      if (!row.audio_path) return mapRowToCard(row);
      const { data: signed } = await client.storage
        .from("audio-recordings")
        .createSignedUrl(row.audio_path, 60 * 60);
      return mapRowToCard(row, signed?.signedUrl);
    }),
  );
}

export async function deleteAllRemoteCards(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("cards").delete().eq("user_id", userId);
}
