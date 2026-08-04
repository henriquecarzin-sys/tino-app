import { getOrCreateDeviceId } from "./deviceId";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** Corpo já como objeto — vira JSON automaticamente */
  json?: unknown;
}

/**
 * Wrapper fino sobre fetch. Nenhum endpoint real existe ainda (isso é o Passo 4),
 * mas todo request já sai com o device_id no header — é assim que o backend vai
 * saber "de quem" são os cartões, sem exigir cadastro nem token de sessão.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": getOrCreateDeviceId(),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `Erro ${response.status} ao chamar ${path}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
