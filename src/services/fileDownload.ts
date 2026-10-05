import * as crypto from 'crypto';
import * as fs from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export interface DownloadProgress {
  downloadedBytes: number;
  totalBytes?: number;
}

/** モデルと runtime で共通の転送処理。URL の許可と検証後の配置は呼び出し元が決める。 */
export async function downloadToFile(
  url: string,
  filePath: string,
  abortSignal?: AbortSignal,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  abortSignal?.throwIfAborted();
  const response = await fetch(url, { signal: abortSignal });
  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`HTTP ${response.status}: ${detail || response.statusText}`);
  }
  const length = Number(response.headers.get('content-length'));
  const totalBytes = Number.isFinite(length) && length > 0 ? length : undefined;
  let downloadedBytes = 0;

  // pipeline が書き込みの待機・エラー・中止時の全ストリーム解放を担当する。
  await pipeline(
    Readable.fromWeb(response.body),
    async function* (source) {
      for await (const chunk of source) {
        downloadedBytes += chunk.length;
        yield chunk;
        onProgress?.({ downloadedBytes, totalBytes });
      }
    },
    fs.createWriteStream(filePath, { flags: 'w' }),
    { signal: abortSignal }
  );
}

export async function sha256File(filePath: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(filePath)) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}
