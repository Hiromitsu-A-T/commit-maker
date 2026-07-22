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
      body: buildClaudeBody(model, prompt)
    }),
    parse: raw => {
      const data = raw ? JSON.parse(raw) as any : {};
      const text = extractClaudeText(data);
      if (!text) {
        throw new Error(strings.msgLlmEmptyClaude);
      }
      return text;
    }
  });
}

function buildClaudeBody(model: string, prompt: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    max_tokens: DEFAULT_CLAUDE_MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }]
  };
  if (!isClaudeTemperatureDeprecated(model)) {
    body.temperature = 0;
  }
  return body;
}

function isClaudeTemperatureDeprecated(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  return [
    'claude-opus-4-7',
    'claude-opus-4-8',
    'claude-sonnet-5',
    'claude-fable-5',
    'claude-mythos-5'
  ].some(prefix => normalized === prefix || normalized.startsWith(`${prefix}-`));
}

function extractClaudeText(payload: any): string | undefined {
  if (!Array.isArray(payload?.content)) {
    return undefined;
  }
  const text = payload.content
    .filter((block: any) => typeof block?.text === 'string' && block.text.trim())
    .map((block: any) => block.text.trim())
    .join('\n');
  return text || undefined;
}
