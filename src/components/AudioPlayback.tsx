import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Waveform } from "./Waveform";
import { TOM_CONFIG } from "../lib/tom";
import type { TinoTom } from "../types";

interface AudioPlaybackProps {
  audioUrl: string;
  duracao: string;
  waveform?: number[];
  tom: TinoTom;
}

export function AudioPlayback({ audioUrl, duracao, waveform, tom }: AudioPlaybackProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLabel, setCurrentLabel] = useState("0:00");
  const tomConfig = TOM_CONFIG[tom];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.duration > 0 && Number.isFinite(audio.duration)) {
        setProgress(audio.currentTime / audio.duration);
      }
      const mm = Math.floor(audio.currentTime / 60);
      const ss = Math.floor(audio.currentTime % 60);
      setCurrentLabel(`${mm}:${ss.toString().padStart(2, "0")}`);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentLabel("0:00");
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface-2 px-3 py-2.5">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pausar áudio original" : "Ouvir áudio original"}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 ${tomConfig.bg} ${tomConfig.accent}`}
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
        )}
      </button>

      <Waveform
        levels={waveform && waveform.length > 0 ? waveform : undefined}
        bars={waveform?.length ?? 24}
        className="h-6 flex-1"
        progress={progress}
        progressClassName={tomConfig.dot}
      />

      <span className="w-9 shrink-0 text-right font-mono text-[11px] text-text-lo">
        {isPlaying ? currentLabel : duracao}
      </span>
    </div>
  );
}
