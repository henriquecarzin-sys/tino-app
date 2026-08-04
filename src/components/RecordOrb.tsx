import { useEffect, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Waveform } from "./Waveform";
import type { RecorderState } from "../types";
import type { MicPermission } from "../hooks/useAudioRecorder";

interface RecordOrbProps {
  state: RecorderState;
  elapsedSeconds: number;
  /** Barras reais do microfone (0–1) enquanto `state === "gravando"` */
  levels: number[];
  /** Estado de permissão do mic — só usado para dar feedback enquanto o navegador pergunta */
  permission: MicPermission;
  /** Sobrescreve a mensagem rotativa de processamento (ex: progresso de upload) */
  statusOverride?: string;
  onPress: () => void;
}

const PROCESSING_MESSAGES = [
  "Transcrevendo o áudio…",
  "Separando o sinal do ruído…",
  "Procurando o que não foi dito…",
  "Montando o cartão TINO…",
];

export function RecordOrb({
  state,
  elapsedSeconds,
  levels,
  permission,
  statusOverride,
  onPress,
}: RecordOrbProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (state !== "processando") {
      setMsgIndex(0);
      return;
    }
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % PROCESSING_MESSAGES.length);
    }, 850);
    return () => clearInterval(id);
  }, [state]);

  const mm = Math.floor(elapsedSeconds / 60);
  const ss = elapsedSeconds % 60;
  const timeLabel = `${mm}:${ss.toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-40 w-40 items-center justify-center">
        {state === "gravando" && (
          <>
            <span className="animate-rec-ring pointer-events-none absolute inset-0 rounded-full border-2 border-coral" />
            <span
              className="animate-rec-ring pointer-events-none absolute inset-0 rounded-full border-2 border-coral"
              style={{ animationDelay: "0.55s" }}
            />
          </>
        )}

        <button
          type="button"
          onClick={onPress}
          disabled={state === "processando" || permission === "solicitando"}
          aria-label={
            state === "idle"
              ? "Gravar áudio"
              : state === "gravando"
                ? "Parar gravação"
                : "Processando áudio, aguarde"
          }
          className={[
            "relative flex h-32 w-32 items-center justify-center rounded-full",
            "transition-[transform,box-shadow,background-color] duration-300 ease-out",
            "active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/40",
            "disabled:cursor-not-allowed",
            state === "idle" &&
              "animate-idle-breathe bg-gradient-to-br from-coral to-[#e14b3a] shadow-[0_10px_40px_-8px_rgba(255,107,91,0.55)]",
            state === "gravando" &&
              "scale-110 bg-gradient-to-br from-coral to-[#e14b3a] shadow-[0_10px_50px_-6px_rgba(255,107,91,0.7)]",
            state === "processando" && "border border-border bg-surface-2 shadow-none",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {state === "idle" && <Mic className="h-11 w-11 text-ink" strokeWidth={2.2} />}

          {state === "gravando" && (
            <div className="flex h-11 items-center gap-3">
              <Waveform levels={levels} className="h-9 w-11" barClassName="bg-ink" />
              <Square className="h-5 w-5 fill-ink text-ink" />
            </div>
          )}

          {state === "processando" && (
            <div className="relative h-11 w-11">
              <div className="animate-orbit absolute inset-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * 45}deg)` }}>
                    <span
                      className="animate-dot absolute left-1/2 top-0 h-[7px] w-[7px] -translate-x-1/2 rounded-full bg-violet"
                      style={{ animationDelay: `${i * 0.11}s` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </button>
      </div>

      <div className="flex h-6 items-center justify-center">
        {state === "idle" && permission === "solicitando" && (
          <p className="animate-pulse text-sm text-text-lo">Aguardando permissão do microfone…</p>
        )}
        {state === "idle" && permission !== "solicitando" && (
          <p className="text-sm text-text-lo">Toque para gravar um áudio</p>
        )}
        {state === "gravando" && (
          <p className="font-mono text-sm tabular-nums text-coral-soft">
            {timeLabel} · toque para parar
          </p>
        )}
        {state === "processando" && (
          <p key={statusOverride ?? msgIndex} className="animate-pop-in text-sm text-violet-soft">
            {statusOverride ?? PROCESSING_MESSAGES[msgIndex]}
          </p>
        )}
      </div>
    </div>
  );
}
