import { ANTHROPIC_API_VERSION, DEFAULT_CLAUDE_MAX_TOKENS } from '../../constants';
import { asRecord, callLlmJson } from './shared';
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
      const data = asRecord(raw ? JSON.parse(raw) : undefined);
      // 本文があっても、出力・コンテキスト上限で途切れた応答は完成とみなさない。
      if (data.stop_reason === 'max_tokens' || data.stop_reason === 'model_context_window_exceeded') {
        throw new Error(`Claude: response incomplete (${data.stop_reason}).`);
      }
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
    'claude-opus-5',
    'claude-sonnet-5',
    'claude-fable-5',
    'claude-mythos-5'
  ].some(prefix => normalized === prefix || normalized.startsWith(`${prefix}-`));
}

function extractClaudeText(payload: unknown): string | undefined {
  const content = asRecord(payload).content;
  if (!Array.isArray(content)) {
    return undefined;
  }
  const text = content
    .flatMap(block => {
      const text = asRecord(block).text;
      return typeof text === 'string' && text.trim() ? [text.trim()] : [];
    })
    .join('\n');
  return text || undefined;
}
