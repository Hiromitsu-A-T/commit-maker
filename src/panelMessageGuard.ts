import { WebviewInboundMessage } from './panelMessages';

type Validator<T> = (value: unknown) => value is T;

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function sanitizeMessage(message: unknown): WebviewInboundMessage | undefined {
  if (!message || typeof message !== 'object') return undefined;
  const candidate = message as { type?: unknown };
  if (!isString(candidate.type)) return undefined;

  switch (candidate.type) {
    case 'ready':
      return { type: 'ready' };
    case 'apiKeyProviderChanged':
    case 'commitProviderChanged':
      return isString((candidate as any).value)
        ? { type: candidate.type, value: (candidate as any).value }
        : undefined;
    case 'submitApiKey':
      return isString((candidate as any).value) && isString((candidate as any).provider)
        ? { type: 'submitApiKey', value: (candidate as any).value, provider: (candidate as any).provider }
        : undefined;
    case 'commitPromptChanged':
      return isString((candidate as any).value) ? { type: 'commitPromptChanged', value: (candidate as any).value } : undefined;
    case 'savePromptPreset':
      return isString((candidate as any).title) && isString((candidate as any).body)
        ? { type: 'savePromptPreset', title: (candidate as any).title, body: (candidate as any).body }
        : undefined;
    case 'applyPromptPreset':
    case 'deletePromptPreset':
      return isString((candidate as any).id)
        ? { type: candidate.type, id: (candidate as any).id }
        : undefined;
    case 'commitModelChanged':
    case 'commitCustomModelChanged':
      return isString((candidate as any).value)
        ? { type: candidate.type, value: (candidate as any).value }
        : undefined;
    case 'commitIncludeUnstagedChanged':
    case 'commitIncludeUntrackedChanged':
    case 'commitIncludeBinaryChanged':
      return isBoolean((candidate as any).value)
        ? { type: candidate.type, value: (candidate as any).value }
        : undefined;
    case 'commitMaxPromptChanged': {
      const value = (candidate as any).value;
      if (!value || (value.mode !== 'unlimited' && value.mode !== 'limited')) return undefined;
      return { type: 'commitMaxPromptChanged', value: { mode: value.mode, value: value.value ?? null } };
    }
    case 'commitReasoningChanged':
    case 'commitVerbosityChanged':
      return isString((candidate as any).value)
        ? { type: candidate.type, value: (candidate as any).value as any }
        : undefined;
    case 'commitGenerate': {
      const value = (candidate as any).value || {};
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
      return isString((candidate as any).url) ? { type: 'openExternal', url: (candidate as any).url } : undefined;
    case 'languageChanged':
      return isString((candidate as any).value) ? { type: 'languageChanged', value: (candidate as any).value } : undefined;
    default:
      return undefined;
  }
}
