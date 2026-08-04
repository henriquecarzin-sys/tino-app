/**
 * Calcula o nível de volume (0–1) a partir dos dados no domínio do tempo do AnalyserNode.
 * Usa RMS (root mean square), que é uma medida de "volume percebido" melhor que o pico bruto.
 */
export function computeRmsLevel(timeDomainData: Uint8Array): number {
  let sumSquares = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    const normalized = (timeDomainData[i] - 128) / 128;
    sumSquares += normalized * normalized;
  }
  const rms = Math.sqrt(sumSquares / timeDomainData.length);
  // ganho leve pra voz em volume baixo não deixar as barras "mortas"
  return Math.min(1, rms * 3.2);
}

/**
 * Reduz os bins de frequência do AnalyserNode para um número fixo de barras,
 * pulando o primeiro bin (grave/DC demais, deixa a barra sempre alta e "mentindo").
 */
export function sampleFrequencyBars(freqData: Uint8Array, barCount: number): number[] {
  const usableBins = freqData.length - 1;
  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    const idx = 1 + Math.round((i / Math.max(1, barCount - 1)) * (usableBins - 1));
    bars.push(freqData[idx] / 255);
  }
  return bars;
}

/**
 * Reduz (ou expande) uma série de amostras de amplitude para um tamanho fixo,
 * pra guardar uma "assinatura visual" compacta do áudio gravado no cartão.
 */
export function downsampleWaveform(samples: number[], target: number): number[] {
  if (samples.length === 0) return new Array(target).fill(0.06);

  if (samples.length <= target) {
    return Array.from({ length: target }, (_, i) => {
      const idx = Math.min(samples.length - 1, Math.floor((i / target) * samples.length));
      return samples[idx];
    });
  }

  const chunkSize = samples.length / target;
  const out: number[] = [];
  for (let i = 0; i < target; i++) {
    const start = Math.floor(i * chunkSize);
    const end = Math.max(start + 1, Math.floor((i + 1) * chunkSize));
    const slice = samples.slice(start, end);
    out.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return out;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}
