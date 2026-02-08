import { ANTHROPIC_API_VERSION, DEFAULT_CLAUDE_MAX_TOKENS } from '../../constants';
import { callLlmJson } from './shared';
import { getStrings, DEFAULT_LANGUAGE } from '../../i18n/strings';

export interface ClaudeCallParams {
  prompt: string;
  model: string;
  apiKey: string;
  endpoint: string;
  abortSignal?: AbortSignal;
  timeoutMs: number;
  logger?: (message: string) => void;
}

export async function callClaude({
  prompt,
  model,
  apiKey,
  endpoint,
  abortSignal,
  timeoutMs,
  logger
}: ClaudeCallParams): Promise<string> {
  const strings = getStrings(DEFAULT_LANGUAGE);
  return callLlmJson({
    label: 'Claude',
    endpoint,
    abortSignal,
    timeoutMs,
    logger,
    buildRequest: base => ({
      url: base,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_API_VERSION
      },
      body: {
        model,
        max_tokens: DEFAULT_CLAUDE_MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0
      }
    }),
    parse: raw => {
      const data = raw ? JSON.parse(raw) as any : {};
      const text = data?.content?.[0]?.text || data?.content?.[0]?.text?.[0];
      if (!text || typeof text !== 'string') {
        throw new Error(strings.msgLlmEmptyClaude);
      }
      return text;
    }
  });
}
