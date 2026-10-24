/** 成功本文・診断本文・モデル一覧で同じ受信上限を適用する。 */
export const MAX_RESPONSE_BYTES = 1024 * 1024;
export const MAX_ERROR_BYTES = 8192;

export async function readBoundedText(response: Response, maxBytes = MAX_RESPONSE_BYTES): Promise<string> {
  const length = Number(response.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxBytes) {
    await response.body?.cancel();
    throw new Error('HTTP response exceeds the byte limit.');
  }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error('HTTP response exceeds the byte limit.');
      chunks.push(value);
    }
    return Buffer.concat(chunks, bytes).toString('utf8');
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export async function rejectRedirect(response: Response): Promise<void> {
  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel();
    throw new Error('HTTP redirects are not allowed for provider requests.');
  }
}
