import type { TinoCardData } from "../types";

const STORAGE_KEY = "tino_cards_v1";

/**
 * `audioUrl` gerado via URL.createObjectURL só é válido durante a sessão atual do navegador —
 * ao recarregar a página ele vira um link morto. Antes de persistir, removemos essa referência
 * (o resto do cartão, incluindo a waveform, continua intacto). O player simplesmente não aparece
 * mais depois do reload, até existir upload real pro backend no Passo 4.
 */
function sanitizeForStorage(card: TinoCardData): TinoCardData {
  if (!card.audioUrl?.startsWith("blob:")) return card;
  const sanitized: TinoCardData = { ...card };
  delete sanitized.audioUrl;
  return sanitized;
}

export function loadStoredCards(): TinoCardData[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TinoCardData[]) : null;
  } catch {
    return null;
  }
}

export function saveStoredCards(cards: TinoCardData[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards.map(sanitizeForStorage)));
  } catch {
    // localStorage cheio ou indisponível — a sessão segue normal, só não persiste
  }
}

export function clearStoredCards(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // idem
  }
}
