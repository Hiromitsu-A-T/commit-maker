import { getStrings, DEFAULT_LANGUAGE } from '../../i18n/strings';
import { setTimeout as wait } from 'timers/promises';

class HttpError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export interface PostJsonOptions {
  headers: Record<string, string>;
  body: unknown;
  controller: AbortController;
  label: string;
  parse: (raw: string) => string;
}

export interface LlmJsonCallConfig {
  label: string;
  endpoint: string;
  abortSignal?: AbortSignal;
  timeoutMs: number;
  buildRequest: (endpoint: string) => { url: string; headers: Record<string, string>; body: unknown };
  parse: (raw: string) => string;
  logger?: (message: string) => void;
}

/**
 * 親の AbortSignal とタイムアウトを束ねた AbortController を生成する。
 * 呼び出し元は finally で dispose を呼んでリスナーとタイマーを解放する。
 */
export function createAbortController(
  abortSignal?: AbortSignal,
  timeoutMs?: number
): { controller: AbortController; dispose: () => void } {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let externalListener: (() => void) | undefined;

  if (abortSignal?.aborted) {
    controller.abort();
  } else if (abortSignal) {
    externalListener = () => controller.abort();
    abortSignal.addEventListener('abort', externalListener, { once: true });
  }
  if (timeoutMs && timeoutMs > 0) {
    timer = setTimeout(() => controller.abort(), timeoutMs);
  }

  const dispose = (): void => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (abortSignal && externalListener) {
      abortSignal.removeEventListener('abort', externalListener);
      externalListener = undefined;
    }
  };

  return { controller, dispose };
}

export async function callLlmJson({
  label,
  endpoint,
  abortSignal,
  timeoutMs,
  buildRequest,
  parse,
  logger
}: LlmJsonCallConfig): Promise<string> {
  validateHttps(endpoint, `${label} endpoint`);
  const { controller, dispose } = createAbortController(abortSignal, timeoutMs);
  try {
    const { url, headers, body } = buildRequest(endpoint);
    const options: PostJsonOptions = { headers, body, controller, label, parse };
    return await postJsonWithBackoff(url, options, 3, logger);
  } finally {
    dispose();
  }
}

export function validateHttps(endpoint: string | undefined, label: string): void {
  if (!endpoint) return;
  const strings = getStrings(DEFAULT_LANGUAGE);
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch (error) {
    throw new Error(strings.msgHttpsInvalid.replace('{label}', label), { cause: error });
  }
  if (url.protocol !== 'https:') {
    throw new Error(strings.msgHttpsRequired.replace('{label}', label));
  }
}

export async function postJsonWithBackoff(
  url: string,
  { headers, body, controller, label, parse }: PostJsonOptions,
  maxAttempts = 3,
  logger?: (message: string) => void
): Promise<string> {
  const strings = getStrings(DEFAULT_LANGUAGE);
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      controller.signal.throwIfAborted();
      logger?.(
        strings.logLlmAttempt
          .replace('{label}', label)
          .replace('{attempt}', String(attempt))
          .replace('{max}', String(maxAttempts))
      );
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!res.ok) {
        const text = await res.text();
        throw new HttpError(
          strings.msgHttpError
            .replace('{label}', label)
            .replace('{status}', String(res.status))
            .replace('{text}', sanitizeLlmErrorText(text || res.statusText)),
          res.status
        );
      }
      const raw = await res.text();
      return parse(raw);
    } catch (error) {
      lastError = error;
      const retryable = isRetryable(error);
      if (!retryable || attempt === maxAttempts) {
        throw error;
      }
      const delayMs = 500 * Math.pow(2, attempt - 1);
      logger?.(
        strings.logLlmRetry
          .replace('{label}', label)
          .replace('{delay}', String(delayMs))
          .replace('{error}', sanitizeLlmErrorText(String(error)))
      );
      await wait(delayMs, undefined, { signal: controller.signal });
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function isRetryable(error: unknown): boolean {
  if (error instanceof Error && 'name' in error && error.name === 'AbortError') {
    return false;
  }
  if (error instanceof HttpError) return error.status === 429;
  // fetch の通信エラーは cause.code に入る場合もある。本文の数字で HTTP 再試行を判定しない。
  const cause = error instanceof Error ? error.cause : undefined;
  const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
  const msg = String(error);
  return ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT'].some(value => code === value || msg.includes(value));
}

/** 外部 JSON のオブジェクトだけを扱い、各フィールドは利用箇所で型を絞る。 */
export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

export function sanitizeLlmErrorText(text: string): string {
  const redacted = text
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(/\bsk-(?:proj-|ant-api\d*-)?[A-Za-z0-9_-]{8,}\b/g, '[REDACTED_API_KEY]')
    .replace(/\bAIza[0-9A-Za-z_-]{20,}\b/g, '[REDACTED_API_KEY]');
  return redacted.length > 1000 ? `${redacted.slice(0, 1000)}...` : redacted;
}
