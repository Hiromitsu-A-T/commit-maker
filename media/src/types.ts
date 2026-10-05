interface PanelElements {
  language: HTMLSelectElement | null;
  apiKeySection: HTMLElement | null;
  apiKeyCloudPanel: HTMLElement | null;
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
  model: HTMLSelectElement | null;
  modelGroup: HTMLElement | null;
  customModelRow: HTMLElement | null;
  customModel: HTMLInputElement | null;
  localModelPanel: HTMLElement | null;
  localModelName: HTMLSelectElement | null;
  localModelStatus: HTMLElement | null;
  localModelGuidance: HTMLElement | null;
  localModelGuidanceBadge: HTMLElement | null;
  localModelGuidanceSize: HTMLElement | null;
  localModelGuidanceText: HTMLElement | null;
  localModelGuidanceDetails: HTMLElement | null;
  localModelDownload: HTMLButtonElement | null;
  localModelCancel: HTMLButtonElement | null;
  localModelDelete: HTMLButtonElement | null;
  localModelTest: HTMLButtonElement | null;
  localModelHint: HTMLElement | null;
  codexAuthPanel: HTMLElement | null;
  codexAuthStatus: HTMLElement | null;
  codexAuthHint: HTMLElement | null;
  codexAuthLogin: HTMLButtonElement | null;
  codexAuthRefresh: HTMLButtonElement | null;
  codexAuthLogout: HTMLButtonElement | null;
  reasoningLabel: HTMLElement | null;
  reasoning: HTMLSelectElement | null;
  verbosity: HTMLSelectElement | null;
  reasoningRow: HTMLElement | null;
  verbosityRow: HTMLElement | null;
  statusRow: HTMLElement | null;
  result: HTMLElement | null;
  errorSection: HTMLElement | null;
  errorBox: HTMLElement | null;
}

interface PanelStateSnapshot {
  commitStatus: string;
  commitProgress?: string;
  commitIncludeUnstaged: boolean;
  commitIncludeUntracked: boolean;
  commitIncludeBinary: boolean;
  commitProvider?: string;
  commitModel?: string;
  commitCustomModel?: string;
  commitReasoning?: string;
  commitCodexReasoning?: string;
  commitVerbosity?: string;
  apiKeyProvider?: string;
  apiKeys?: Record<string, { ready: boolean }>;
  localModel?: { id?: string; status: string; label: string; sizeLabel: string; downloadedBytes?: number; totalBytes?: number; hasPartialDownload?: boolean };
}

// 同梱スクリプトの読み込み順に対応するブラウザー側の型定義。
interface Window {
  CommitMakerElements: { queryElements: typeof queryElements };
  CommitMakerDom: {
    renderSelect: typeof renderSelect;
    show: typeof show;
    setDisabled: typeof setDisabled;
    updateBadges: typeof updateBadges;
  };
  CommitMakerEvents: {
    onInput: typeof onInput;
    onChange: typeof onChange;
    bindCheckbox: typeof bindCheckbox;
    bindSelectValue: typeof bindSelectValue;
  };
  CommitMakerRender: {
    renderStatus: typeof renderStatus;
    renderApiKeyBadges: typeof renderApiKeyBadges;
  };
  CommitMakerState: { cloneState: typeof cloneState; mergeState: typeof mergeState };
}
