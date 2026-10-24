/** 設定のスコープと独立した、実行時の資源上限。 */
export function boundedInteger(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.floor(value))) : fallback;
}

export const limitOutputTokens = (value: unknown, fallback = 8192): number => boundedInteger(value, fallback, 64, 16384);
export const limitTimeout = (value: unknown): number => boundedInteger(value, 300000, 1000, 600000);
export const limitContext = (value: unknown): number => boundedInteger(value, 32768, 1024, 262144);
export const limitThreads = (value: unknown): number => boundedInteger(value, 0, 0, 64);
export const limitGpuLayers = (value: unknown): number => boundedInteger(value, 99, 0, 256);
export const limitKeepAlive = (value: unknown): number => boundedInteger(value, 300000, 1000, 300000);
