import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

export type SessionStatus = "desativada" | "carregando" | "pronta" | "erro";

interface UseSupabaseSessionResult {
  status: SessionStatus;
  userId: string | null;
}

/**
 * Cria (ou recupera) uma sessão anônima do Supabase Auth. Essa é a identidade real usada
 * pelo RLS no backend — o header X-Device-Id do Passo 3 é só um id local pra UI/telemetria,
 * nunca uma fonte confiável de autorização (um client poderia forjar esse header).
 */
export function useSupabaseSession(): UseSupabaseSessionResult {
  const [status, setStatus] = useState<SessionStatus>(
    isSupabaseConfigured ? "carregando" : "desativada",
  );
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;

    let active = true;

    const ensureSession = async () => {
      const { data: existing } = await client.auth.getSession();

      if (existing.session?.user) {
        if (active) {
          setUserId(existing.session.user.id);
          setStatus("pronta");
        }
        return;
      }

      const { data, error } = await client.auth.signInAnonymously();
      if (!active) return;

      if (error || !data.user) {
        setStatus("erro");
        return;
      }
      setUserId(data.user.id);
      setStatus("pronta");
    };

    void ensureSession();

    return () => {
      active = false;
    };
  }, []);

  return { status, userId };
}
