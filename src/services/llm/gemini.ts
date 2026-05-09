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
      const data = raw ? JSON.parse(raw) as any : {};
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text || typeof text !== 'string') {
        throw new Error(strings.msgLlmEmptyGemini);
      }
      return text;
    }
  });
}

function buildGeminiEndpoint(base: string, model: string): string {
  const u = new URL(base);
  const path = u.pathname.replace(/\/$/, '');
  u.pathname = path.endsWith(GEMINI_GENERATE_SUFFIX)
    ? path
    : `${path}/${model}${GEMINI_GENERATE_SUFFIX}`;
  u.searchParams.delete('key');
  return u.toString();
}
