import * as vscode from 'vscode';
import {
  supportsVerbosity,
  getAllowedReasoningOptions,
  getDefaultReasoningForModel,
  getAllowedVerbosityOptions,
  getDefaultVerbosityForModel
} from '../../modelCapabilities';
import { DEFAULT_REASONING_EFFORT, DEFAULT_VERBOSITY, DEFAULT_MODEL_BY_PROVIDER } from '../../constants';
import { ReasoningEffort, VerbositySetting } from '../../types';
import { callLlmJson } from './shared';
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

let cachedModels: { ids: Set<string>; fetchedAt: number } | undefined;

function resolveReasoning(model: string, requested?: ReasoningEffort): ReasoningEffort | undefined {
  const allowed = getAllowedReasoningOptions(model);
  if (!allowed) {
    return requested;
  }
  const desired = (requested ?? getDefaultReasoningForModel(model)) as ReasoningEffort | undefined;
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

  const resolvedModel = await ensureModelExists(model, apiKey, endpoint, logger);
  const effectiveReasoning = resolveReasoning(resolvedModel, reasoning);
  const effectiveVerbosity = resolveVerbosity(resolvedModel, verbosity);
  if (getAllowedReasoningOptions(resolvedModel)?.length === 0) {
    throw new Error(`Model "${resolvedModel}" is not supported on /v1/responses (reasoning.effort unsupported).`);
  }
  const attempt = async (modelId: string): Promise<string> =>
    callLlmJson({
      label: 'OpenAI',
      endpoint: ensureResponsesEndpoint(endpoint),
      abortSignal,
      timeoutMs,
      logger,
      buildRequest: base => {
        const url = base;
        const body: Record<string, unknown> = {
          model: modelId,
          input: prompt,
          max_output_tokens: maxOutputTokens
        };
        if (effectiveReasoning) {
          body.reasoning = { effort: effectiveReasoning };
        }
        // temperature は gpt-5.1 系で reasoning ≠ none の場合に非対応のため条件付きで付与
        if (!effectiveReasoning || effectiveReasoning === 'none') {
          body.temperature = 0;
        }
        if (supportsVerbosity(modelId) && effectiveVerbosity) {
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
        const data = raw ? JSON.parse(raw) as any : {};
        const text =
          data.output_text ||
          data.output?.[0]?.content?.[0]?.text ||
          data.output ||
          extractFromResponses(data) ||
          extractFromChat(data);
        if (typeof text !== 'string' || !text.trim()) {
          throw new Error(strings.msgLlmEmptyOpenAi);
        }
        return text;
      }
    });

  return attempt(resolvedModel);
}

async function ensureModelExists(
  requested: string,
  apiKey: string,
  endpoint: string,
  logger?: (message: string) => void
): Promise<string> {
  const preferred = requested?.trim() || DEFAULT_MODEL_BY_PROVIDER.openai;
  const available = await listAvailableModels(apiKey, endpoint, logger);
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
  logger?: (message: string) => void
): Promise<Set<string>> {
  const now = Date.now();
  if (cachedModels && now - cachedModels.fetchedAt < 5 * 60 * 1000) {
    return cachedModels.ids;
  }
  try {
    const base = new URL(endpoint);
    const url = `${base.origin}/v1/models`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    if (!res.ok) {
      logger?.(`OpenAI: /models returned ${res.status}, skipping availability check`);
      throw new Error(`models list failed: ${res.status}`);
    }
    const data = await res.json();
    const list = Array.isArray((data as any)?.data) ? (data as any).data : [];
    const ids = new Set<string>(list.map((m: any) => m.id).filter(Boolean));
    cachedModels = { ids, fetchedAt: now };
    return ids;
  } catch (error) {
    logger?.(`OpenAI: model list fetch failed (${String(error)}), proceeding without filter`);
    return new Set<string>();
  }
}

function shouldUseResponses(base: string, model: string): boolean {
  return base.includes('/responses');
}

function ensureResponsesEndpoint(endpoint: string): string {
  return endpoint.includes('/responses') ? endpoint : endpoint.replace(/\/$/, '') + '/responses';
}

function extractFromResponses(payload: any): string | undefined {
  const outputs = payload?.output ?? payload?.outputs;
  if (Array.isArray(outputs)) {
    const first = outputs[0];
    if (first?.content?.[0]?.text) {
      return first.content[0].text as string;
    }
  }
  if (payload?.response_text) {
    return payload.response_text as string;
  }
  return undefined;
}

function extractFromChat(payload: any): string | undefined {
  const choices = payload?.choices;
  if (Array.isArray(choices) && choices[0]?.message?.content) {
    return choices[0].message.content as string;
  }
  return undefined;
}
