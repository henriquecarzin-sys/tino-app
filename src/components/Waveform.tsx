interface WaveformProps {
  /** Nº de barras quando não há `levels` real (usa a animação decorativa padrão) */
  bars?: number;
  className?: string;
  barClassName?: string;
  /**
   * Níveis reais (0–1), vindos do microfone (ao vivo) ou de um waveform salvo (player).
   * Quando presente, substitui a animação decorativa por alturas controladas.
   */
  levels?: number[];
  /** Progresso de reprodução (0–1). Quando definido, colore as barras já "tocadas". */
  progress?: number;
  progressClassName?: string;
}

// Alturas e atrasos variados para simular uma onda sonora orgânica quando não há dados reais
const HEIGHT_SCALE = [0.5, 0.85, 1, 0.65, 0.4, 0.9, 0.55, 0.75, 0.45];
const DELAYS = [0, 0.12, 0.24, 0.08, 0.32, 0.04, 0.28, 0.16, 0.2];

export function Waveform({
  bars = 9,
  className = "",
  barClassName = "bg-coral",
  levels,
  progress,
  progressClassName,
}: WaveformProps) {
  const count = levels?.length ?? bars;

  return (
    <div className={`flex items-center justify-center gap-[3px] ${className}`}>
      {Array.from({ length: count }).map((_, i) => {
        const height = levels ? levels[i] : HEIGHT_SCALE[i % HEIGHT_SCALE.length];
        const isPlayed = progress !== undefined && i / count < progress;

        const colorClass =
          progress === undefined ? barClassName : isPlayed ? (progressClassName ?? barClassName) : "bg-text-lo/30";

        return (
          <span
            key={i}
            className={[
              "w-[3px] rounded-full",
              levels ? "transition-[height] duration-100 ease-out" : "animate-bar",
              colorClass,
            ].join(" ")}
            style={{
              height: `${Math.max(10, height * 100)}%`,
              animationDelay: levels ? undefined : `${DELAYS[i % DELAYS.length]}s`,
            }}
          />
        );
      })}
    </div>
  );
}
