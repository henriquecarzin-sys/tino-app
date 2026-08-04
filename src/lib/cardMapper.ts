import type { TinoCardData, TinoTom } from "../types";

export interface CardRow {
  id: string;
  criado_em: string;
  duracao: string;
  tom: TinoTom;
  ideia_central: string;
  acoes: string[];
  evitar: string[];
  surpreendente: string;
  resposta_direta: string;
  resposta_polida: string;
  audio_path: string | null;
  waveform: number[] | null;
}

export function mapRowToCard(row: CardRow, audioUrl?: string): TinoCardData {
  return {
    id: row.id,
    criadoEm: row.criado_em,
    duracao: row.duracao,
    tom: row.tom,
    ideiaCentral: row.ideia_central,
    acoes: row.acoes ?? [],
    evitar: row.evitar ?? [],
    surpreendente: row.surpreendente,
    respostaDirecta: row.resposta_direta,
    respostaPolida: row.resposta_polida,
    audioUrl,
    waveform: row.waveform ?? undefined,
  };
}
