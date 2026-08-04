import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Fingerprint, TriangleAlert, X } from "lucide-react";
import { RecordOrb } from "../components/RecordOrb";
import { TinoCard } from "../components/TinoCard";
import { SettingsSheet } from "../components/SettingsSheet";
import { EmptyState } from "../components/EmptyState";
import { MOCK_CARDS } from "../data/mockCards";
import { useAudioRecorder, type RecordingResult } from "../hooks/useAudioRecorder";
import { useDeviceId } from "../hooks/useDeviceId";
import { useSupabaseSession } from "../hooks/useSupabaseSession";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { runRealPipeline, fetchRemoteCards, deleteAllRemoteCards } from "../lib/realPipeline";
import { runMockPipeline } from "../lib/mockPipeline";
import { loadStoredCards, saveStoredCards, clearStoredCards } from "../lib/cardsStorage";
import type { RecorderState, TinoCardData } from "../types";

const MAX_RECORDING_MS = 180_000; // 3 min — protege contra blobs enormes / uso indevido
const MIN_RECORDING_MS = 700; // evita gerar cartão a partir de um toque acidental

type PipelinePhase = "idle" | "processando";

export default function Home() {
  const deviceId = useDeviceId();
  const { status: sessionStatus, userId } = useSupabaseSession();

  const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>("idle");
  const [statusOverride, setStatusOverride] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cards, setCards] = useState<TinoCardData[]>(() =>
    isSupabaseConfigured ? [] : (loadStoredCards() ?? MOCK_CARDS),
  );
  const [cardsLoading, setCardsLoading] = useState(isSupabaseConfigured);
  const [newCardId, setNewCardId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const resultIndexRef = useRef(0);

  // modo backend real: carrega o histórico assim que a sessão anônima estiver pronta
  useEffect(() => {
    if (!isSupabaseConfigured || sessionStatus !== "pronta") return;

    let active = true;
    setCardsLoading(true);

    fetchRemoteCards()
      .then((remoteCards) => {
        if (active) setCards(remoteCards);
      })
      .catch(() => {
        if (active) setErrorMessage("Não foi possível carregar seus cartões salvos.");
      })
      .finally(() => {
        if (active) setCardsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessionStatus]);

  // modo mock: persiste localmente a cada mudança (comportamento do Passo 3, inalterado)
  useEffect(() => {
    if (isSupabaseConfigured) return;
    saveStoredCards(cards);
  }, [cards]);

  const handleRecordingComplete = useCallback(
    async (result: RecordingResult) => {
      if (result.durationMs < MIN_RECORDING_MS) {
        setErrorMessage("Áudio muito curto — segure um pouco mais antes de soltar.");
        setPipelinePhase("idle");
        return;
      }

      setPipelinePhase("processando");
      setErrorMessage(null);

      try {
        const onStatus = (label: string | null) => setStatusOverride(label ?? undefined);
        const novoCard =
          isSupabaseConfigured && userId
            ? await runRealPipeline(result, userId, onStatus)
            : await runMockPipeline(result, resultIndexRef.current, onStatus);

        if (!isSupabaseConfigured) resultIndexRef.current += 1;

        setCards((prev) => [novoCard, ...prev]);
        setNewCardId(novoCard.id);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Não foi possível gerar o cartão. Tente de novo.",
        );
      } finally {
        setStatusOverride(undefined);
        setPipelinePhase("idle");
      }
    },
    [userId],
  );

  const recorder = useAudioRecorder({
    maxDurationMs: MAX_RECORDING_MS,
    barCount: 7,
    waveformSamples: 32,
    onRecordingComplete: handleRecordingComplete,
  });

  useEffect(() => {
    if (recorder.error) setErrorMessage(recorder.error);
  }, [recorder.error]);

  useEffect(() => {
    if (sessionStatus === "erro") {
      setErrorMessage("Não foi possível iniciar sua sessão. Tente recarregar a página.");
    }
  }, [sessionStatus]);

  // libera os Object URLs (modo mock) quando a tela desmonta, pra não vazar memória
  useEffect(() => {
    return () => {
      if (isSupabaseConfigured) return;
      cards.forEach((card) => {
        if (card.audioUrl) URL.revokeObjectURL(card.audioUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClearCards = async () => {
    if (isSupabaseConfigured && userId) {
      await deleteAllRemoteCards(userId);
      setCards([]);
    } else {
      clearStoredCards();
      setCards(MOCK_CARDS);
    }
    setNewCardId(null);
  };

  const recorderState: RecorderState = recorder.isRecording
    ? "gravando"
    : pipelinePhase === "processando"
      ? "processando"
      : "idle";

  const isBusyStartingSession = isSupabaseConfigured && sessionStatus === "carregando";

  const handlePress = () => {
    if (recorder.isRecording) {
      recorder.stop();
      return;
    }
    if (pipelinePhase === "processando" || recorder.permission === "solicitando") return;
    if (isBusyStartingSession) return;

    setErrorMessage(null);
    void recorder.start();
  };

  const identityId = isSupabaseConfigured ? (userId ?? "") : deviceId;
  const identityLabel = isSupabaseConfigured ? "ID da conta anônima" : "ID do dispositivo";
  const identityDescription = isSupabaseConfigured
    ? "O TINO não pede cadastro. Você tem uma conta anônima no Supabase que guarda seus cartões na nuvem — sem e-mail, sem senha."
    : "O TINO ainda não pede cadastro. Seus cartões ficam salvos neste dispositivo, identificados por um ID anônimo.";

  return (
    <div className="min-h-dvh bg-noise">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-10 sm:px-6">
        {/* header */}
        <header className="flex items-center justify-between gap-2 py-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral">
              <AudioLines className="h-[18px] w-[18px] text-ink" strokeWidth={2.4} />
            </span>
            <div className="leading-none">
              <div className="flex items-center gap-1.5">
                <p className="font-display text-base font-bold tracking-tight text-text-hi">TINO</p>
                {!isSupabaseConfigured && (
                  <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-text-lo">
                    modo mock
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-lo">áudio vira ação</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Sua identidade"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border-soft text-text-lo transition-colors hover:border-text-lo hover:text-text-hi"
          >
            <Fingerprint className="h-4 w-4" />
          </button>
        </header>

        {/* aviso de erro (mic, sessão, ou pipeline de geração) */}
        {errorMessage && (
          <div className="mb-2 flex items-start gap-2 rounded-xl border border-amber/30 bg-amber-dim px-3 py-2.5 text-xs text-amber">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="flex-1 leading-relaxed">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              aria-label="Fechar aviso"
              className="shrink-0 text-amber/70 transition-colors hover:text-amber"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* hero: orb de gravação */}
        <section className="flex flex-col items-center gap-1 py-6">
          <RecordOrb
            state={recorderState}
            elapsedSeconds={Math.floor(recorder.elapsedMs / 1000)}
            levels={recorder.levels}
            permission={recorder.permission}
            statusOverride={statusOverride}
            onPress={handlePress}
          />
        </section>

        {/* lista de cartões */}
        <section className="mt-4 flex-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wide text-text-lo">
              Seus cartões
            </h2>
            <span className="font-mono text-xs text-text-lo">{cards.length}</span>
          </div>

          {cardsLoading ? (
            <p className="py-8 text-center text-sm text-text-lo">Carregando seus cartões…</p>
          ) : cards.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-3">
              {cards.map((card) => (
                <TinoCard key={card.id} data={card} isNew={card.id === newCardId} />
              ))}
            </div>
          )}
        </section>
      </div>

      <SettingsSheet
        open={settingsOpen}
        identityId={identityId}
        identityLabel={identityLabel}
        description={identityDescription}
        cardCount={cards.length}
        onClose={() => setSettingsOpen(false)}
        onClearCards={handleClearCards}
      />
    </div>
  );
}
