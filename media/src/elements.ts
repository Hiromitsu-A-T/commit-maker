import { PanelElements } from './types';

export function queryElements(): PanelElements {
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
  return {
    language: get('language') as HTMLSelectElement | null,
    apiKeyProvider: get('apiKeyProvider') as HTMLSelectElement | null,
    apiKeyInput: get('apiKeyInput') as HTMLInputElement | null,
    apiKeyPreview: get('apiKeyPreview'),
    apiKeySave: get('apiKeySave') as HTMLButtonElement | null,
    apiKeyClear: get('apiKeyClear') as HTMLButtonElement | null,
    apiKeyIssue: get('apiKeyIssue') as HTMLButtonElement | null,
    apiKeyStatusRow: get('apiKeyStatusRow'),
    generate: get('generate') as HTMLButtonElement | null,
    apply: get('apply') as HTMLButtonElement | null,
    includeUnstaged: get('includeUnstaged') as HTMLInputElement | null,
    includeUntracked: get('includeUntracked') as HTMLInputElement | null,
    includeBinary: get('includeBinary') as HTMLInputElement | null,
    maxPromptMode: get('maxPromptMode') as HTMLSelectElement | null,
    maxPromptValue: get('maxPromptValue') as HTMLInputElement | null,
    prompt: get('prompt') as HTMLTextAreaElement | null,
    promptSaved: get('promptSaved'),
    promptPreset: get('promptPreset') as HTMLSelectElement | null,
    presetName: get('presetName') as HTMLInputElement | null,
    presetAdd: get('presetAdd') as HTMLButtonElement | null,
    presetDelete: get('presetDelete') as HTMLButtonElement | null,
    provider: get('provider') as HTMLSelectElement | null,
    providerRow: get('providerRow'),
    providerHelp: get('providerHelp'),
    model: get('model') as HTMLSelectElement | null,
    modelGroup: get('modelGroup'),
    modelHelp: get('modelHelp'),
    customModelRow: get('customModelRow'),
    customModel: get('customModel') as HTMLInputElement | null,
    reasoning: get('reasoning') as HTMLSelectElement | null,
    verbosity: get('verbosity') as HTMLSelectElement | null,
    reasoningRow: get('reasoningRow'),
    verbosityRow: get('verbosityRow'),
    statusRow: get('statusRow'),
    result: get('result'),
    errorSection: get('errorSection'),
    errorBox: get('errorBox')
  };
}
