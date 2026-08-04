import { useCallback, useEffect, useRef, useState } from "react";
import { computeRmsLevel, downsampleWaveform, sampleFrequencyBars } from "../lib/waveform";

export type MicPermission = "idle" | "solicitando" | "concedida" | "negada" | "indisponivel";

export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  /** Waveform completa da gravação, já reduzida a um tamanho fixo (ver `waveformSamples`) */
  waveform: number[];
}

interface UseAudioRecorderOptions {
  /** Corta a gravação automaticamente após esse tempo (proteção contra blobs gigantes) */
  maxDurationMs?: number;
  /** Quantas barras o waveform "ao vivo" (durante a gravação) deve ter */
  barCount?: number;
  /** Quantos pontos guardar no waveform final salvo no cartão */
  waveformSamples?: number;
  onRecordingComplete: (result: RecordingResult) => void;
}

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function pickSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

function isRecordingSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

export function useAudioRecorder({
  maxDurationMs = 180_000,
  barCount = 7,
  waveformSamples = 32,
  onRecordingComplete,
}: UseAudioRecorderOptions) {
  const [permission, setPermission] = useState<MicPermission>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => new Array(barCount).fill(0.08));
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const maxDurationTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const mimeTypeRef = useRef("audio/webm");
  const waveformHistoryRef = useRef<number[]>([]);
  const lastHistorySampleRef = useRef(0);
  const onCompleteRef = useRef(onRecordingComplete);

  useEffect(() => {
    onCompleteRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

  const teardown = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (elapsedTimerRef.current !== null) window.clearInterval(elapsedTimerRef.current);
    if (maxDurationTimerRef.current !== null) window.clearTimeout(maxDurationTimerRef.current);
    rafRef.current = null;
    elapsedTimerRef.current = null;
    maxDurationTimerRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      void audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    recorderRef.current = null;
  }, []);

  // limpeza garantida se o componente desmontar no meio de uma gravação
  useEffect(() => teardown, [teardown]);

  const tickLevels = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqData);
    setLevels(sampleFrequencyBars(freqData, barCount));

    const timeData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(timeData);
    const overallLevel = computeRmsLevel(timeData);

    const now = performance.now();
    if (now - lastHistorySampleRef.current > 90) {
      waveformHistoryRef.current.push(Math.max(0.04, overallLevel));
      lastHistorySampleRef.current = now;
    }

    rafRef.current = requestAnimationFrame(tickLevels);
  }, [barCount]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }, []);

  const start = useCallback(async () => {
    if (isRecording) return;
    setError(null);

    if (!isRecordingSupported()) {
      setPermission("indisponivel");
      setError("Seu navegador não suporta gravação de áudio. Tente atualizar ou usar outro navegador.");
      return;
    }

    setPermission("solicitando");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("Permita o acesso ao microfone nas configurações do navegador pra gravar.");
      } else if (name === "NotFoundError") {
        setError("Nenhum microfone foi encontrado neste dispositivo.");
      } else {
        setError("Não foi possível acessar o microfone. Tente novamente.");
      }
      setPermission("negada");
      return;
    }

    const mimeType = pickSupportedMimeType();
    if (!mimeType) {
      stream.getTracks().forEach((track) => track.stop());
      setPermission("indisponivel");
      setError("Seu navegador não suporta o formato de gravação necessário.");
      return;
    }

    setPermission("concedida");
    streamRef.current = stream;
    mimeTypeRef.current = mimeType;
    chunksRef.current = [];
    waveformHistoryRef.current = [];
    lastHistorySampleRef.current = 0;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const durationMs = performance.now() - startedAtRef.current;
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      const waveform = downsampleWaveform(waveformHistoryRef.current, waveformSamples);

      teardown();
      setIsRecording(false);
      setElapsedMs(0);
      setLevels(new Array(barCount).fill(0.08));

      onCompleteRef.current({ blob, mimeType: mimeTypeRef.current, durationMs, waveform });
    };

    recorder.start(250);
    recorderRef.current = recorder;
    startedAtRef.current = performance.now();
    setIsRecording(true);

    elapsedTimerRef.current = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAtRef.current);
    }, 100);

    maxDurationTimerRef.current = window.setTimeout(stop, maxDurationMs);
    rafRef.current = requestAnimationFrame(tickLevels);
  }, [barCount, isRecording, maxDurationMs, stop, teardown, tickLevels, waveformSamples]);

  return { permission, isRecording, elapsedMs, levels, error, start, stop };
}
