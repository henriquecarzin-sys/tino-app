export type TinoTom = "urgente" | "cobranca_leve" | "informativo" | "ideia";

export interface TinoCardData {
  id: string;
  criadoEm: string; // ISO string, mockado
  duracao: string; // ex: "1:42"
  tom: TinoTom;
  ideiaCentral: string;
  acoes: string[];
  evitar: string[];
  surpreendente: string;
  respostaDirecta: string;
  respostaPolida: string;
  /** Presente apenas em cartões gerados a partir de uma gravação real (Passo 2+) */
  audioUrl?: string;
  /** Waveform real (downsampled) do áudio gravado, usada no player do cartão */
  waveform?: number[];
}

export type RecorderState = "idle" | "gravando" | "processando";

export interface TomConfig {
  label: string;
  accent: string; // classe de cor tailwind (texto/borda)
  bg: string; // classe de fundo (chip)
  dot: string; // classe de fundo do indicador
}
