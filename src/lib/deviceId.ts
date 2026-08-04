const STORAGE_KEY = "tino_device_id";

function generateUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // fallback pra navegadores sem crypto.randomUUID (Safari antigo, contexto não seguro)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retorna o device_id anônimo deste navegador, criando um na primeira vez.
 * É a base da "autenticação leve" do TINO: sem login, sem senha — o dispositivo
 * é a identidade até existir uma conta real na nuvem (fora de escopo por enquanto).
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const created = generateUuid();
    window.localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    // localStorage bloqueado (ex: modo privado restrito) — segue com um id efêmero de sessão
    return generateUuid();
  }
}
