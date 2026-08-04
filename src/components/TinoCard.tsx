import { CircleCheck, TriangleAlert, Brain, Clock3 } from "lucide-react";
import type { TinoCardData } from "../types";
import { TOM_CONFIG } from "../lib/tom";
import { AudioPlayback } from "./AudioPlayback";
import { CopyButton } from "./CopyButton";

interface TinoCardProps {
  data: TinoCardData;
  isNew?: boolean;
}

export function TinoCard({ data, isNew }: TinoCardProps) {
  const tom = TOM_CONFIG[data.tom];

  return (
    <article
      className={[
        "overflow-hidden rounded-2xl border border-border-soft bg-surface",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]",
        isNew ? "animate-card-enter" : "",
      ].join(" ")}
    >
      {/* faixa de tom */}
      <div className={`h-[3px] w-full ${tom.dot}`} />

      <div className="p-4 sm:p-5">
        {/* header */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tom.bg} ${tom.accent}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${tom.dot}`} />
            {tom.label}
          </span>
          {!data.audioUrl && (
            <span className="flex items-center gap-1 font-mono text-xs text-text-lo">
              <Clock3 className="h-3.5 w-3.5" />
              {data.duracao}
            </span>
          )}
        </div>

        {/* player do áudio original — só existe em cartões gerados a partir de uma gravação real */}
        {data.audioUrl && (
          <div className="mb-3.5">
            <AudioPlayback
              audioUrl={data.audioUrl}
              duracao={data.duracao}
              waveform={data.waveform}
              tom={data.tom}
            />
          </div>
        )}

        {/* ideia central */}
        <h3 className="font-display text-[17px] font-semibold leading-snug text-text-hi">
          {data.ideiaCentral}
        </h3>

        {/* ações */}
        <ul className="mt-4 space-y-2">
          {data.acoes.map((acao, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-text-mid">
              <CircleCheck className={`mt-0.5 h-4 w-4 shrink-0 ${tom.accent}`} strokeWidth={2} />
              <span>{acao}</span>
            </li>
          ))}
        </ul>

        {/* evitar */}
        {data.evitar.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-dashed border-border-soft pt-3">
            {data.evitar.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-text-lo">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" strokeWidth={2} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {/* o surpreendente — diferencial do produto, precisa se destacar dos outros blocos */}
        <div className="relative mt-4 overflow-hidden rounded-xl border border-violet/25 bg-violet-dim p-3.5">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet/10 blur-2xl"
          />
          <div className="relative flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet/15">
              <Brain className="h-3.5 w-3.5 text-violet-soft" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-soft">
                O Surpreendente
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text-hi/90">{data.surpreendente}</p>
            </div>
          </div>
        </div>

        {/* respostas rápidas */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-border-soft bg-surface-2 p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-lo">
                Resposta direta
              </p>
              <CopyButton text={data.respostaDirecta} />
            </div>
            <p className="text-sm text-text-mid">{data.respostaDirecta}</p>
          </div>

          <div className="rounded-xl border border-border-soft bg-surface-2 p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-lo">
                Resposta educada
              </p>
              <CopyButton text={data.respostaPolida} />
            </div>
            <p className="text-sm text-text-mid">{data.respostaPolida}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
