import { createAbortController } from './llm/shared';
import { readBoundedText, MAX_ERROR_BYTES } from './httpResponse';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { addAbortSignal, Readable } from 'stream';
import { pipeline } from 'stream/promises';

export interface DownloadProgress {
  downloadedBytes: number;
  totalBytes?: number;
}

export interface DownloadLimits {
  maxBytes: number;
  timeoutMs: number;
}

/** 上限・期限・転送先を検証してからストリームを保存する。 */
export async function downloadToFile(
  url: string,
  filePath: string,
  limits: DownloadLimits,
  abortSignal?: AbortSignal,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  if (!Number.isSafeInteger(limits.maxBytes) || limits.maxBytes <= 0 ||
      !Number.isFinite(limits.timeoutMs) || limits.timeoutMs <= 0) {
    throw new Error('Download byte limit and deadline are required.');
  }
  const { controller, dispose } = createAbortController(abortSignal, Math.min(limits.timeoutMs, 1800000));
  try {
    controller.signal.throwIfAborted();
    const response = await fetchDownload(url, controller.signal);
    if (!response.ok || !response.body) {
      const detail = await readBoundedText(response, MAX_ERROR_BYTES);
      throw new Error(`HTTP ${response.status}: ${detail || response.statusText}`);
    }
    const length = Number(response.headers.get('content-length'));
    const totalBytes = Number.isFinite(length) && length > 0 ? length : undefined;
    if (totalBytes && totalBytes > limits.maxBytes) {
      await response.body.cancel();
      throw new Error('Download exceeds the byte limit.');
    }
    let downloadedBytes = 0;
    await pipeline(
      Readable.fromWeb(response.body),
      async function* (source) {
        for await (const chunk of source) {
          downloadedBytes += chunk.length;
          if (downloadedBytes > limits.maxBytes) throw new Error('Download exceeds the byte limit.');
          yield chunk;
          onProgress?.({ downloadedBytes, totalBytes });
        }
      },
      fs.createWriteStream(filePath, { flags: 'w', mode: 0o600 }),
      { signal: controller.signal }
    );
  } catch (error) {
    await fs.promises.rm(filePath, { force: true }).catch(() => undefined);
    throw error;
  } finally {
    dispose();
  }
}

async function fetchDownload(value: string, signal: AbortSignal): Promise<Response> {
  const original = new URL(value);
  let current = original;
  for (let redirects = 0; redirects <= 5; redirects++) {
    if (current.protocol !== 'https:' || current.username || current.password || !approvedDownloadOrigin(original, current)) {
      throw new Error('Unapproved download redirect destination.');
    }
    const response = await fetch(current.href, { signal, redirect: 'manual' });
    if (response.status < 300 || response.status >= 400) return response;
    await response.body?.cancel();
    const location = response.headers.get('location');
    if (!location) throw new Error('Download redirect has no destination.');
    current = new URL(location, current);
  }
  throw new Error('Too many download redirects.');
}

function approvedDownloadOrigin(original: URL, target: URL): boolean {
  if (target.origin === original.origin) return true;
  if (target.port && target.port !== '443') return false;
  if (original.hostname === 'github.com') return target.hostname === 'release-assets.githubusercontent.com';
  if (original.hostname === 'huggingface.co') {
    return target.hostname === 'huggingface.co' || target.hostname.endsWith('.hf.co');
  }
  return false;
}

export async function sha256File(filePath: string, abortSignal?: AbortSignal): Promise<string> {
  abortSignal?.throwIfAborted();
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);
  if (abortSignal) addAbortSignal(abortSignal, stream);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  abortSignal?.throwIfAborted();
  return hash.digest('hex');
}
