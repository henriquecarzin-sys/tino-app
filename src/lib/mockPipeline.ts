import { wait } from "./time";
import { formatDuration } from "./waveform";
import { SIMULATED_RESULTS } from "../data/mockCards";
import type { RecordingResult } from "../hooks/useAudioRecorder";
import type { TinoCardData } from "../types";

const UPLOAD_STEPS = [12, 28, 47, 66, 84, 100];
const GENERATION_MS = 1300;

export async function runMockPipeline(
  result: RecordingResult,
  resultIndex: number,
  onStatus?: (label: string | null) => void,
): Promise<TinoCardData> {
  for (const percent of UPLOAD_STEPS) {
    await wait(90 + Math.random() * 90);
    onStatus?.(`Enviando áudio… ${percent}%`);
  }
  onStatus?.(null);

  await wait(GENERATION_MS);

  const template = SIMULATED_RESULTS[resultIndex % SIMULATED_RESULTS.length];

  return {
    ...template,
    id: `card-${Date.now()}`,
    criadoEm: new Date().toISOString(),
    duracao: formatDuration(result.durationMs),
    audioUrl: URL.createObjectURL(result.blob),
    waveform: result.waveform,
  };
}
