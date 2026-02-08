export interface PanelElements {
  language: HTMLSelectElement | null;
  apiKeyProvider: HTMLSelectElement | null;
  apiKeyInput: HTMLInputElement | null;
  apiKeyPreview: HTMLElement | null;
  apiKeySave: HTMLButtonElement | null;
  apiKeyClear: HTMLButtonElement | null;
  apiKeyIssue: HTMLButtonElement | null;
  apiKeyStatusRow: HTMLElement | null;
  generate: HTMLButtonElement | null;
  apply: HTMLButtonElement | null;
  includeUnstaged: HTMLInputElement | null;
  includeUntracked: HTMLInputElement | null;
  includeBinary: HTMLInputElement | null;
  maxPromptMode: HTMLSelectElement | null;
  maxPromptValue: HTMLInputElement | null;
  prompt: HTMLTextAreaElement | null;
  promptSaved: HTMLElement | null;
  promptPreset: HTMLSelectElement | null;
  presetName: HTMLInputElement | null;
  presetAdd: HTMLButtonElement | null;
  presetDelete: HTMLButtonElement | null;
  provider: HTMLSelectElement | null;
  providerRow: HTMLElement | null;
  providerHelp: HTMLElement | null;
  model: HTMLSelectElement | null;
  modelGroup: HTMLElement | null;
  modelHelp: HTMLElement | null;
  customModelRow: HTMLElement | null;
  customModel: HTMLInputElement | null;
  reasoning: HTMLSelectElement | null;
  verbosity: HTMLSelectElement | null;
  reasoningRow: HTMLElement | null;
  verbosityRow: HTMLElement | null;
  statusRow: HTMLElement | null;
  result: HTMLElement | null;
  errorSection: HTMLElement | null;
  errorBox: HTMLElement | null;
}

export interface PanelStateSnapshot {
  commitStatus: string;
  commitIncludeUnstaged: boolean;
  commitIncludeUntracked: boolean;
  commitIncludeBinary: boolean;
  commitProvider?: string;
  commitModel?: string;
  commitCustomModel?: string;
  commitReasoning?: string;
  commitVerbosity?: string;
  apiKeys?: Record<string, { ready: boolean }>;
}
