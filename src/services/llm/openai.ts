import {
  getAllowedReasoningOptions,
  getDefaultReasoningForModel,
  getAllowedVerbosityOptions,
  getDefaultVerbosityForModel
} from '../../modelCapabilities';
import { DEFAULT_REASONING_EFFORT, DEFAULT_VERBOSITY, DEFAULT_MODEL_BY_PROVIDER } from '../../constants';
import { ReasoningEffort, VerbositySetting } from '../../types';
import { asRecord, callLlmJson, createAbortController, sanitizeLlmErrorText, validateHttps } from './shared';
import { getStrings, DEFAULT_LANGUAGE } from '../../i18n/strings';

export interface OpenAiCallParams {
  prompt: string;
  model: string;
  apiKey: string;
  endpoint: string;
  reasoning?: ReasoningEffort;
  verbosity?: VerbositySetting;
  maxOutputTokens: number;
  abortSignal?: AbortSignal;
  timeoutMs: number;
  logger?: (message: string) => void;
}

let cachedModels: { ids: Set<string>; fetchedAt: number; apiKey: string; origin: string } | undefined;

function resolveReasoning(model: string, requested?: ReasoningEffort): ReasoningEffort | undefined {
  const allowed = getAllowedReasoningOptions(model);
  if (!allowed) {
    return requested;
  }
  const desired = requested ?? getDefaultReasoningForModel(model);
  if (desired && allowed.includes(desired)) {
    return desired;
  }
  // 要求値が許可外の場合はモデルごとのデフォルトで送る
  const fallback = getDefaultReasoningForModel(model);
  return fallback ?? allowed[0];
}

function resolveVerbosity(model: string, requested?: VerbositySetting): VerbositySetting | undefined {
  const allowed = getAllowedVerbosityOptions(model);
  if (!allowed || allowed.length === 0) {
    return requested;
  }
  const desired = requested ?? getDefaultVerbosityForModel(model);
  if (desired && allowed.includes(desired)) {
    return desired;
  }
  return getDefaultVerbosityForModel(model) ?? allowed[0];
}

export async function callOpenAi({
  prompt,
  model,
  apiKey,
  endpoint,
  reasoning = DEFAULT_REASONING_EFFORT,
  verbosity = DEFAULT_VERBOSITY,
  maxOutputTokens,
  abortSignal,
  timeoutMs,
  logger
}: OpenAiCallParams): Promise<string> {
  const strings = getStrings(DEFAULT_LANGUAGE);

  validateHttps(endpoint, 'OpenAI endpoint');
  const { controller, dispose } = createAbortController(abortSignal, timeoutMs);
  try {
    controller.signal.throwIfAborted();
    const resolvedModel = await ensureModelExists(model, apiKey, endpoint, controller.signal, logger);
    const effectiveReasoning = resolveReasoning(resolvedModel, reasoning);
    const effectiveVerbosity = resolveVerbosity(resolvedModel, verbosity);
    if (getAllowedReasoningOptions(resolvedModel)?.length === 0) {
      throw new Error(`Model "${resolvedModel}" is not supported on /v1/responses (reasoning.effort unsupported).`);
    }
    return await callLlmJson({
      label: 'OpenAI',
      endpoint: ensureResponsesEndpoint(endpoint),
      abortSignal: controller.signal,
      timeoutMs: 0,
      logger,
      buildRequest: url => {
        const body: Record<string, unknown> = {
          model: resolvedModel,
          input: prompt,
          max_output_tokens: maxOutputTokens
        };
        if (effectiveReasoning) {
          body.reasoning = { effort: effectiveReasoning };
        }
        // 推論を指定する要求では temperature を省き、none または未指定時だけ付ける。
        if (!effectiveReasoning || effectiveReasoning === 'none') {
          body.temperature = 0;
        }
        if (effectiveVerbosity) {
          body.text = { format: { type: 'text' }, verbosity: effectiveVerbosity };
        }
        return {
          url,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body
        };
      },
      parse: raw => {
        const data = asRecord(raw ? JSON.parse(raw) : undefined);
        // HTTP 200 でも、出力上限などで未完成の応答は SCM へ反映しない。
        if (data.status === 'incomplete' || data.status === 'failed') {
          const reason = data.status === 'incomplete'
            ? asRecord(data.incomplete_details).reason
            : asRecord(data.error).message;
          const detail = typeof reason === 'string' && reason.trim()
            ? ` (${sanitizeLlmErrorText(reason)})` : '';
          throw new Error(`OpenAI: response ${data.status}${detail}.`);
        }
        const text = extractOpenAiText(data) || extractFromChat(data);
        if (!text || !text.trim()) {
          throw new Error(strings.msgLlmEmptyOpenAi);
        }
        return text;
      }
    });
  } finally {
    dispose();
  }
}

async function ensureModelExists(
  requested: string,
  apiKey: string,
  endpoint: string,
  abortSignal: AbortSignal,
  logger?: (message: string) => void
): Promise<string> {
  const preferred = requested?.trim() || DEFAULT_MODEL_BY_PROVIDER.openai;
  const available = await listAvailableModels(apiKey, endpoint, abortSignal, logger);
  if (available.size === 0) {
    // モデル一覧取得に失敗した場合は指定をそのまま使う
    return preferred;
  }
  if (available.has(preferred)) {
    return preferred;
  }
  throw new Error(`Model "${preferred}" not available for this API key.`);
}

async function listAvailableModels(
  apiKey: string,
  endpoint: string,
  abortSignal: AbortSignal,
  logger?: (message: string) => void
): Promise<Set<string>> {
  const now = Date.now();
  const origin = new URL(endpoint).origin;
  // モデル一覧は接続先と認証情報ごとに保持する。
  if (cachedModels && cachedModels.apiKey === apiKey && cachedModels.origin === origin && now - cachedModels.fetchedAt < 5 * 60 * 1000) {
    return cachedModels.ids;
  }
  try {
    const url = `${origin}/v1/models`;
    const res = await fetch(url, {
      signal: abortSignal,
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    if (!res.ok) {
      logger?.(`OpenAI: /models returned ${res.status}, skipping availability check`);
      throw new Error(`models list failed: ${res.status}`);
    }
    const data = asRecord(await res.json());
    const list = Array.isArray(data.data) ? data.data : [];
    const ids = new Set(list.map(item => asRecord(item).id)
      .filter((id): id is string => typeof id === 'string' && Boolean(id)));
    cachedModels = { ids, fetchedAt: now, apiKey, origin };
    return ids;
  } catch (error) {
    abortSignal.throwIfAborted();
    logger?.(`OpenAI: model list fetch failed (${String(error)}), proceeding without filter`);
    return new Set<string>();
  }
}

function ensureResponsesEndpoint(endpoint: string): string {
  return endpoint.includes('/responses') ? endpoint : endpoint.replace(/\/$/, '') + '/responses';
}

function extractOpenAiText(payload: Record<string, unknown>): string | undefined {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text;
  }

  const outputs = payload.output ?? payload.outputs;
  const collected: string[] = [];
  if (Array.isArray(outputs)) {
    for (const item of outputs) {
      // 複数の出力を順に集め、空の出力だけを除く。
      const output = asRecord(item);
      const contents = output.content;
      if (Array.isArray(contents)) {
        for (const chunk of contents) {
          const content = asRecord(chunk);
          if (typeof content.text === 'string' && content.text.trim()) collected.push(content.text);
          else if (typeof content.output_text === 'string' && content.output_text.trim()) collected.push(content.output_text);
          else if (typeof chunk === 'string' && chunk.trim()) collected.push(chunk);
        }
      }
      // message 形式の互換応答も同じ順序で収集する。
      const message = asRecord(output.message);
      if (typeof message.content === 'string' && message.content.trim()) {
        collected.push(message.content);
      } else if (Array.isArray(message.content)) {
        for (const chunk of message.content) {
          const content = asRecord(chunk);
          if (typeof content.text === 'string' && content.text.trim()) collected.push(content.text);
        }
      }
    }
    if (collected.length) {
      return collected.join('\n');
    }
  }

  // 旧形式の response_text は文字列の場合だけ受け入れる。
  return typeof payload.response_text === 'string' ? payload.response_text : undefined;
}

function extractFromChat(payload: Record<string, unknown>): string | undefined {
  const choice = asRecord(Array.isArray(payload.choices) ? payload.choices[0] : undefined);
  const content = asRecord(choice.message).content;
  return typeof content === 'string' ? content : undefined;
}
