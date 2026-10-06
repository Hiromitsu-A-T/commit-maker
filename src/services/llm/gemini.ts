import { GEMINI_GENERATE_SUFFIX } from '../../constants';
import { asRecord, callLlmJson } from './shared';
import { getStrings, DEFAULT_LANGUAGE } from '../../i18n/strings';

export interface GeminiCallParams {
  prompt: string;
  model: string;
  apiKey: string;
  endpoint: string;
  abortSignal?: AbortSignal;
  timeoutMs: number;
  logger?: (message: string) => void;
}

export async function callGemini({
  prompt,
  model,
  apiKey,
  endpoint,
  abortSignal,
  timeoutMs,
  logger
}: GeminiCallParams): Promise<string> {
  const strings = getStrings(DEFAULT_LANGUAGE);
  return callLlmJson({
    label: 'Gemini',
    endpoint,
    abortSignal,
    timeoutMs,
    logger,
    buildRequest: base => ({
      url: buildGeminiEndpoint(base, model),
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      }
    }),
    parse: raw => {
      const data = asRecord(raw ? JSON.parse(raw) : undefined);
      const candidate = asRecord(Array.isArray(data.candidates) ? data.candidates[0] : undefined);
      // 出力上限までの部分文章を SCM へ渡さない。
      if (candidate.finishReason === 'MAX_TOKENS') {
        throw new Error('Gemini: response incomplete (MAX_TOKENS).');
      }
      const parts = asRecord(candidate.content).parts;
      const text = asRecord(Array.isArray(parts) ? parts[0] : undefined).text;
      if (!text || typeof text !== 'string') {
        throw new Error(strings.msgLlmEmptyGemini);
      }
      return text;
    }
  });
}

function buildGeminiEndpoint(base: string, model: string): string {
  const url = new URL(base);
  const path = url.pathname.replace(/\/$/, '');
  url.pathname = path.endsWith(GEMINI_GENERATE_SUFFIX)
    ? path
    : `${path}/${model}${GEMINI_GENERATE_SUFFIX}`;
  url.searchParams.delete('key');
  return url.toString();
}
