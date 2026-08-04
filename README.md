# TINO — Passo 1/4: estrutura + tela principal (mock)

## Rodar localmente
```bash
npm install
npm run dev
```
Abra o endereço que o Vite mostrar no terminal (geralmente http://localhost:5173).

## O que já funciona
- Botão de gravar com 3 estados: **idle → gravando → processando**, com timer, ondas sonoras e
  indicador de processamento não-genérico (anel de pontos).
- Ao tocar, a gravação roda por um tempo (ou até você tocar de novo pra parar), processa por ~1.7s
  e insere um novo `TinoCard` no topo da lista, com animação de entrada.
- 3 cartões mockados iniciais + 3 resultados simulados em rotação (cobrindo os 4 tons: urgente,
  cobrança leve, informativo, ideia).
- Componente `TinoCard` com bloco "O Surpreendente" visualmente destacado (o diferencial do produto).
- Botões de copiar nas respostas rápidas (direta/educada).

## Estrutura
```
src/
  components/
    RecordOrb.tsx    -> botão de gravação (estados + animações)
    Waveform.tsx      -> barras de onda sonora reutilizáveis
    TinoCard.tsx      -> cartão de ação
  data/
    mockCards.ts      -> cartões iniciais + resultados simulados
  lib/
    tom.ts            -> mapeamento de cor/label por tom
  pages/
    Home.tsx          -> tela principal
  types.ts            -> tipos compartilhados (TinoCardData, RecorderState, etc.)
```

## Próximos passos (fora de escopo aqui)
- Passo 2: gravação de áudio real (MediaRecorder) + upload
- Passo 3: device_id / autenticação leve
- Passo 4: backend (transcrição + geração do cartão)

## Passo 2 — o que mudou
- Gravação **real** de áudio via `MediaRecorder` (`src/hooks/useAudioRecorder.ts`), com:
  - Pedido de permissão do microfone com feedback visual próprio ("Aguardando permissão…").
  - Tratamento de erro (permissão negada, sem microfone, navegador sem suporte) via banner no topo da tela — sem `alert()`.
  - Corte automático em 3 minutos (`MAX_RECORDING_MS`) pra evitar blobs enormes.
  - Descarte de toques acidentais (< 700ms).
  - Escolha automática do melhor `mimeType` suportado pelo navegador (webm/opus, mp4, ogg).
- Waveform do orb agora é **dado real** do microfone (Web Audio API `AnalyserNode`), não mais CSS decorativo.
- Cada gravação guarda uma waveform reduzida (32 pontos) que vira a "assinatura visual" do áudio no cartão.
- `src/lib/uploadAudio.ts`: contrato de upload mockado (`Blob -> Promise<{audioUrl, uploadId}>` com `onProgress`).
  Hoje devolve um Object URL local; no Passo 4 é só trocar o corpo da função por uma chamada real
  (ex: URL pré-assinada do Supabase Storage), nenhum componente muda.
- Novo componente `AudioPlayback.tsx`: player do áudio original dentro do cartão, com waveform real e
  progresso de reprodução colorido de acordo com o tom do cartão.
- Cartões novos (gerados por gravação real) mostram a duração real captada — os 3 cartões mockados do
  Passo 1 continuam como estavam (sem player, já que não têm áudio de verdade por trás).

### Limitação conhecida (esperada neste passo)
O conteúdo do cartão (ideia central, ações, "o Surpreendente"...) ainda vem de um pool de resultados
simulados em rotação — só a duração, o áudio e a waveform são reais. Isso só muda no Passo 4, quando
existir transcrição + geração de fato.

## Passo 3 — o que mudou
- **`device_id` anônimo** (`src/lib/deviceId.ts`): UUID gerado no primeiro acesso e persistido em
  `localStorage`. Sem cadastro, sem senha — o dispositivo é a identidade por enquanto.
- **Persistência local dos cartões** (`src/lib/cardsStorage.ts`): é o que dá utilidade real ao
  device_id sem precisar de backend — seus cartões sobrevivem a um reload da página.
  - `audioUrl` (Object URL) é removido ao salvar, porque não sobrevive a um reload de qualquer
    forma (é uma referência em memória do navegador). O cartão continua com todo o resto —
    inclusive a waveform — só o player de áudio some até existir upload real (Passo 4).
- **Painel "Este dispositivo"** (ícone de impressão digital no header): mostra o device_id
  (copiável), quantos cartões estão salvos, e permite limpar os dados locais — com confirmação
  em dois toques (sem `window.confirm`, pra manter a identidade visual do produto).
- **`src/lib/apiClient.ts`**: wrapper de fetch que já anexa `X-Device-Id` em todo request.
  Nenhum endpoint existe ainda — é só a peça que o Passo 4 vai efetivamente usar, já testada
  quanto a tipos e sem custo de complexidade hoje.
- Refactor: `CopyButton` (antes duplicado dentro do `TinoCard`) virou componente próprio,
  reaproveitado no painel de configurações.

### Decisão de design: por que não pedir e-mail/login ainda?
Cadastro é fricção — e o TINO vende "clareza mental em segundos", não "crie sua conta primeiro".
device_id anônimo dá 90% do valor de uma conta (histórico, identificação no backend) com 0% da
fricção. Login por e-mail/telefone só entra quando o produto precisar de algo que device_id não
resolve sozinho: sincronizar entre aparelhos, recuperar histórico após limpar o navegador, ou
faturamento.

## Passo 4 — backend real (Supabase + transcrição)

### O que mudou
- **Identidade real**: `supabase.auth.signInAnonymously()` substitui o header `X-Device-Id`
  (Passo 3) como fonte de segurança. O device_id local continua existindo e sendo mostrado
  no painel em **modo mock**, mas o RLS do banco nunca confia nele — só em `auth.uid()`.
  Isso é importante: um header custom é forjável pelo próprio client; um JWT assinado
  pelo Supabase Auth não é.
- **`supabase/migrations/0001_init.sql`**: tabela `cards` (RLS por `auth.uid()`) + bucket
  privado `audio-recordings` (RLS por pasta `{user_id}/...`).
- **`supabase/functions/generate-card`**: edge function que transcreve (Whisper) e gera o
  cartão (Claude, com o prompt dos 3 Ss) — roda no servidor, nunca no browser.
- **`src/lib/realPipeline.ts`**: upload real pro Storage + chamada da edge function.
- **`src/lib/mockPipeline.ts`**: o antigo comportamento do Passo 2/3, preservado como
  fallback — se `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` não estiverem definidas,
  o app inteiro roda em modo mock automaticamente (útil pra rodar `npm run dev` sem
  precisar configurar backend primeiro; aparece um badge "modo mock" no header).
- `EmptyState.tsx`: com backend real, um usuário novo genuinamente tem zero cartões —
  isso não existia nos passos anteriores (sempre tinha os 3 cards mockados de seed).

### Setup (precisa de uma conta Supabase + Supabase CLI)

1. Crie um projeto em supabase.com e instale a CLI (`npm i -g supabase` ou via docs oficiais).

2. Rode a migration:
   ```bash
   supabase login
   supabase link --project-ref SEU_PROJECT_REF
   supabase db push
   ```

3. Configure os segredos da edge function (**nunca** no `.env` do frontend):
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

4. Faça o deploy da edge function:
   ```bash
   supabase functions deploy generate-card
   ```

5. Habilite o **Anonymous Sign-in** no painel do Supabase
   (Authentication > Providers > Anonymous Sign-ins > Enable).

6. Configure o frontend:
   ```bash
   cp .env.example .env.local
   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (Project Settings > API)
   ```

7. `npm run dev` — o badge "modo mock" deve sumir do header, e um novo áudio gravado
   agora passa por transcrição e geração de verdade.

### Decisões de segurança (importantes)
- **RLS nunca confia em input do client.** `auth.uid()` vem de um JWT assinado pelo
  Supabase — é a única fonte de identidade confiável nas policies.
- **A edge function reusa o service role key só internamente**, e valida o JWT do
  usuário manualmente (`auth.getUser(jwt)`) antes de fazer qualquer coisa — nunca
  confia num `user_id` vindo do corpo da requisição.
- **Chaves de LLM/transcrição nunca tocam o frontend.** Ficam em `supabase secrets`,
  acessíveis só dentro da edge function (ambiente de servidor).
- O bucket de áudio é **privado**; o player usa signed URLs com expiração curta,
  nunca URLs públicas permanentes.

### Limitação conhecida
`supabase-js` não expõe progresso real (%) de upload no método `.storage.upload()`.
Em vez de fabricar uma porcentagem falsa, o modo real mostra um status indeterminado
("Enviando áudio…"). Pra progresso real, a rota é usar signed upload URL +
`XMLHttpRequest` manual (`upload.onprogress`) — fica como próximo incremento se isso
importar de verdade pro produto.

### Gargalos de custo/escala (retomando o que eu já tinha sinalizado no Passo 1)
- **Whisper (`whisper-1`) cobra por minuto de áudio** — a essa altura, com áudio real
  chegando, vale medir a duração média real dos seus usuários antes de projetar custo
  em 1M usuários. Groq (`whisper-large-v3-turbo`) é o swap mais direto se o custo/latência
  apertar — a função `transcribeAudio` já é isolada o suficiente pra trocar sem tocar
  no resto do pipeline.
- **Cada áudio agora gera 1 chamada de transcrição + 1 chamada de LLM**, ambas síncronas
  dentro da mesma invocação da edge function — em picos de uso isso significa requests
  mais longos (a pessoa fica esperando os dois passos). Se a latência virar problema,
  o próximo passo natural é separar em fila (ex: pg_cron / Supabase Queues) com
  polling ou realtime no lugar de uma function síncrona.
