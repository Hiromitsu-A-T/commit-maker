import { WebviewInboundMessage } from './panelMessages';
import {
  isLanguageCode,
  isCodexReasoningEffort,
  isProviderId,
  isReasoningEffort,
  isVerbositySetting
} from './types';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function sanitizeMessage(message: unknown): WebviewInboundMessage | undefined {
  if (!message || typeof message !== 'object') return undefined;
  const candidate = message as Record<string, unknown>;
  if (!isString(candidate.type)) return undefined;

  switch (candidate.type) {
    case 'ready':
      return { type: 'ready' };
    case 'apiKeyProviderChanged':
    case 'commitProviderChanged':
      return isProviderId(candidate.value)
        ? { type: candidate.type, value: candidate.value }
        : undefined;
    case 'submitApiKey':
      return isString(candidate.value) && isProviderId(candidate.provider)
        ? { type: 'submitApiKey', value: candidate.value, provider: candidate.provider }
        : undefined;
    case 'commitPromptChanged':
      return isString(candidate.value) ? { type: 'commitPromptChanged', value: candidate.value } : undefined;
    case 'savePromptPreset':
      return isString(candidate.title) && isString(candidate.body)
        ? { type: 'savePromptPreset', title: candidate.title, body: candidate.body }
        : undefined;
    case 'applyPromptPreset':
    case 'deletePromptPreset':
      return isString(candidate.id)
        ? { type: candidate.type, id: candidate.id }
        : undefined;
    case 'commitModelChanged':
    case 'commitCustomModelChanged':
      return isString(candidate.value)
        ? { type: candidate.type, value: candidate.value }
        : undefined;
    case 'commitIncludeUnstagedChanged':
    case 'commitIncludeUntrackedChanged':
    case 'commitIncludeBinaryChanged':
      return isBoolean(candidate.value)
        ? { type: candidate.type, value: candidate.value }
        : undefined;
    case 'commitMaxPromptChanged': {
      if (!candidate.value || typeof candidate.value !== 'object') return undefined;
      const value = candidate.value as Record<string, unknown>;
      if (value.mode !== 'unlimited' && value.mode !== 'limited') return undefined;
      if (value.mode === 'unlimited') {
        return { type: 'commitMaxPromptChanged', value: { mode: 'unlimited', value: null } };
      }
      if (value.value === null || value.value === 0) {
        // 入力モードは維持し、文字数の上限だけ解除する。
        return { type: 'commitMaxPromptChanged', value: { mode: 'limited', value: null } };
      }
      if (typeof value.value !== 'number' || !Number.isFinite(value.value) || value.value < 1) {
        return undefined;
      }
      return { type: 'commitMaxPromptChanged', value: { mode: 'limited', value: Math.floor(value.value) } };
    }
    case 'commitReasoningChanged':
      return isReasoningEffort(candidate.value)
        ? { type: candidate.type, value: candidate.value }
        : undefined;
    case 'commitCodexReasoningChanged':
      return isCodexReasoningEffort(candidate.value)
        ? { type: candidate.type, value: candidate.value }
        : undefined;
    case 'commitVerbosityChanged':
      return isVerbositySetting(candidate.value)
        ? { type: candidate.type, value: candidate.value }
        : undefined;
    case 'localModelChanged':
      return isString(candidate.value)
        ? { type: candidate.type, value: candidate.value }
        : undefined;
    case 'localModelDownload':
    case 'localModelCancelDownload':
    case 'localModelDelete':
    case 'localModelTest':
    case 'localModelRefresh':
    case 'codexLogin':
    case 'codexLogout':
    case 'codexRefresh':
      return { type: candidate.type };
    case 'commitGenerate': {
      const value = candidate.value && typeof candidate.value === 'object'
        ? candidate.value as Record<string, unknown> : {};
      return {
        type: 'commitGenerate',
        value: {
          includeUnstaged: Boolean(value.includeUnstaged),
          includeUntracked: Boolean(value.includeUntracked),
          includeBinary: Boolean(value.includeBinary)
        }
      };
    }
    case 'commitApply':
      return { type: 'commitApply' };
    case 'openExternal':
      return isString(candidate.url) ? { type: 'openExternal', url: candidate.url } : undefined;
    case 'languageChanged':
      return isLanguageCode(candidate.value)
        ? { type: 'languageChanged', value: candidate.value }
        : undefined;
    default:
      return undefined;
  }
}
