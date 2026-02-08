import { GEMINI_GENERATE_SUFFIX } from '../../constants';
import { callLlmJson } from './shared';
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
      url: buildGeminiEndpoint(base, model, apiKey),
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
      const data = raw ? JSON.parse(raw) as any : {};
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text || typeof text !== 'string') {
        throw new Error(strings.msgLlmEmptyGemini);
      }
      return text;
    }
  });
}

function buildGeminiEndpoint(base: string, model: string, apiKey: string): string {
  const normalized = base.replace(/\/$/, '');
  const url = normalized.includes(GEMINI_GENERATE_SUFFIX)
    ? normalized
    : `${normalized}/${model}${GEMINI_GENERATE_SUFFIX}`;
  const u = new URL(url);
  if (!u.searchParams.has('key')) {
    u.searchParams.set('key', apiKey);
  }
  return u.toString();
}
