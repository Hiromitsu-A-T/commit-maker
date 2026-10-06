import * as crypto from 'crypto';
import * as vscode from 'vscode';
import {
  DEFAULT_PROVIDER,
  DEFAULT_CODEX_REASONING_EFFORT,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_VERBOSITY,
  CODEX_REASONING_EFFORT_OPTIONS,
  MODEL_SUGGESTIONS_BY_PROVIDER,
  REASONING_EFFORT_OPTIONS,
  VERBOSITY_OPTIONS,
  getDefaultCommitPrompt,
  getDefaultPromptPresets,
  buildProviderCapabilities,
  buildProviderOptions,
  buildProviderIssueUrls
} from './constants';
import {
  ProviderId,
  ApiKeySubmission,
  ProviderOption,
  CodexReasoningEffort,
  ReasoningEffort,
  VerbositySetting,
  PromptPreset,
  LanguageCode,
  LocalModelOption
} from './types';
import { WebviewInboundMessage, WebviewOutboundMessage, PanelState } from './panelMessages';
import { sanitizeMessage } from './panelMessageGuard';
import { renderPanelBody } from './panelBody';
import {
  getAllowedReasoningMap,
  getAllowedVerbosityMap
} from './modelCapabilities';
import { DEFAULT_INCLUDE_FLAGS, DEFAULT_PROMPT_LIMIT, getDefaultModelForProvider } from './defaults';
import { DEFAULT_LANGUAGE, STRINGS } from './i18n/strings';
import { UiStrings } from './i18n/types';
import { SUPPORTED_LANG_CODES } from './i18n/languages';
import { createDefaultLocalModelState, getLocalModelOptions } from './services/localModel';
import { serializeForInlineScript } from './webviewSerialization';

interface RenderContext {
  cspSource: string;
  nonce: string;
  providerOptions: ProviderOption[];
  providerIssueUrls: Record<ProviderId, string>;
  codexReasoningOptions: typeof CODEX_REASONING_EFFORT_OPTIONS;
  reasoningOptions: typeof REASONING_EFFORT_OPTIONS;
  reasoningOptionsByModel: Record<string, ReasoningEffort[]>;
  verbosityOptions: typeof VERBOSITY_OPTIONS;
  verbosityOptionsByModel: Record<string, VerbositySetting[]>;
  promptPresets: PromptPreset[];
  providerSupportsReasoning: Record<ProviderId, boolean>;
  providerSupportsVerbosity: Record<ProviderId, boolean>;
  styleUri: vscode.Uri;
  scriptUri: vscode.Uri;
  strings: UiStrings;
  languageOptions: { code: LanguageCode; label: string }[];
  localModelOptions: LocalModelOption[];
  allowedStateKeys: (keyof PanelState)[];
}

const ALLOWED_STATE_KEYS: (keyof PanelState)[] = [
  'language',
  'apiKeyProvider',
  'apiKeys',
  'commitPrompt',
  'promptPresets',
  'activePromptPresetId',
  'commitProvider',
  'commitModel',
  'commitCustomModel',
  'commitModelSuggestions',
  'commitRecommendedModelsLabel',
  'commitStatus',
  'commitResult',
  'commitLastError',
  'commitProgress',
  'commitIncludeUnstaged',
  'commitIncludeUntracked',
  'commitIncludeBinary',
  'commitMaxPromptChars',
  'commitMaxPromptMode',
  'commitReasoning',
  'commitCodexReasoning',
  'commitVerbosity',
  'localModel',
  'strings',
  'promptToast'
];

function createDefaultState(language: LanguageCode = DEFAULT_LANGUAGE): PanelState {
  const defaultModel = getDefaultModelForProvider(DEFAULT_PROVIDER);
  const promptPresets = getDefaultPromptPresets(language);
  return {
    language,
    apiKeyProvider: DEFAULT_PROVIDER,
    apiKeys: {
      openai: { ready: false },
      gemini: { ready: false },
      claude: { ready: false },
      codex: { ready: false },
      local: { ready: false }
    },
    commitPrompt: getDefaultCommitPrompt(language),
    promptPresets: [...promptPresets],
    activePromptPresetId: promptPresets[0].id,
    commitProvider: DEFAULT_PROVIDER,
    commitModel: defaultModel,
    commitCustomModel: defaultModel,
    commitModelSuggestions: [...MODEL_SUGGESTIONS_BY_PROVIDER[DEFAULT_PROVIDER]],
    commitRecommendedModelsLabel: MODEL_SUGGESTIONS_BY_PROVIDER[DEFAULT_PROVIDER].join(', '),
    commitStatus: 'idle',
    commitResult: undefined,
    commitLastError: undefined,
    commitProgress: undefined,
    commitIncludeUnstaged: DEFAULT_INCLUDE_FLAGS.includeUnstaged,
    commitIncludeUntracked: DEFAULT_INCLUDE_FLAGS.includeUntracked,
    commitIncludeBinary: DEFAULT_INCLUDE_FLAGS.includeBinary,
    commitMaxPromptChars: DEFAULT_PROMPT_LIMIT.maxPromptChars,
    commitMaxPromptMode: DEFAULT_PROMPT_LIMIT.maxPromptMode,
    commitReasoning: DEFAULT_REASONING_EFFORT,
    commitCodexReasoning: DEFAULT_CODEX_REASONING_EFFORT,
    commitVerbosity: DEFAULT_VERBOSITY,
    localModel: createDefaultLocalModelState(),
    strings: STRINGS[language] ?? STRINGS[DEFAULT_LANGUAGE],
    promptToast: undefined
  };
}

export class CommitPanelProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  private view?: vscode.WebviewView;
  private ready = false;
  private state: PanelState = createDefaultState();

  private readonly viewDisposables: vscode.Disposable[] = [];
  private readonly onApiKeyProviderEmitter = new vscode.EventEmitter<ProviderId>();
  private readonly onApiKeySubmitEmitter = new vscode.EventEmitter<ApiKeySubmission>();
  private readonly onCommitPromptEmitter = new vscode.EventEmitter<string>();
  private readonly onCommitProviderEmitter = new vscode.EventEmitter<ProviderId>();
  private readonly onCommitModelEmitter = new vscode.EventEmitter<string>();
  private readonly onCommitCustomModelEmitter = new vscode.EventEmitter<string>();
  private readonly onCommitGenerateEmitter = new vscode.EventEmitter<{ includeUnstaged: boolean; includeUntracked: boolean; includeBinary: boolean }>();
  private readonly onCommitApplyEmitter = new vscode.EventEmitter<void>();
  private readonly onCommitIncludeUnstagedEmitter = new vscode.EventEmitter<boolean>();
  private readonly onCommitIncludeUntrackedEmitter = new vscode.EventEmitter<boolean>();
  private readonly onCommitIncludeBinaryEmitter = new vscode.EventEmitter<boolean>();
  private readonly onCommitMaxPromptEmitter = new vscode.EventEmitter<{ mode: 'unlimited' | 'limited'; value: number | null }>();
  private readonly onCommitReasoningEmitter = new vscode.EventEmitter<ReasoningEffort>();
  private readonly onCommitCodexReasoningEmitter = new vscode.EventEmitter<CodexReasoningEffort>();
  private readonly onCommitVerbosityEmitter = new vscode.EventEmitter<VerbositySetting>();
  private readonly onLocalModelDownloadEmitter = new vscode.EventEmitter<void>();
  private readonly onLocalModelEmitter = new vscode.EventEmitter<string>();
  private readonly onLocalModelCancelDownloadEmitter = new vscode.EventEmitter<void>();
  private readonly onLocalModelDeleteEmitter = new vscode.EventEmitter<void>();
  private readonly onLocalModelTestEmitter = new vscode.EventEmitter<void>();
  private readonly onLocalModelRefreshEmitter = new vscode.EventEmitter<void>();
  private readonly onCodexLoginEmitter = new vscode.EventEmitter<void>();
  private readonly onCodexLogoutEmitter = new vscode.EventEmitter<void>();
  private readonly onCodexRefreshEmitter = new vscode.EventEmitter<void>();
  private readonly onLanguageEmitter = new vscode.EventEmitter<LanguageCode>();
  private readonly onSavePromptPresetEmitter = new vscode.EventEmitter<{ title: string; body: string }>();
  private readonly onApplyPromptPresetEmitter = new vscode.EventEmitter<{ id: string }>();
  private readonly onDeletePromptPresetEmitter = new vscode.EventEmitter<{ id: string }>();

  public readonly onDidChangeCommitPrompt = this.onCommitPromptEmitter.event;
  public readonly onDidChangeApiKeyProvider = this.onApiKeyProviderEmitter.event;
  public readonly onDidSubmitApiKey = this.onApiKeySubmitEmitter.event;
  public readonly onDidChangeCommitProvider = this.onCommitProviderEmitter.event;
  public readonly onDidChangeCommitModel = this.onCommitModelEmitter.event;
  public readonly onDidChangeCommitCustomModel = this.onCommitCustomModelEmitter.event;
  public readonly onDidRequestCommitGenerate = this.onCommitGenerateEmitter.event;
  public readonly onDidRequestCommitApply = this.onCommitApplyEmitter.event;
  public readonly onDidChangeCommitIncludeUnstaged = this.onCommitIncludeUnstagedEmitter.event;
  public readonly onDidChangeCommitIncludeUntracked = this.onCommitIncludeUntrackedEmitter.event;
  public readonly onDidChangeCommitIncludeBinary = this.onCommitIncludeBinaryEmitter.event;
  public readonly onDidChangeCommitMaxPrompt = this.onCommitMaxPromptEmitter.event;
  public readonly onDidChangeCommitReasoning = this.onCommitReasoningEmitter.event;
  public readonly onDidChangeCommitCodexReasoning = this.onCommitCodexReasoningEmitter.event;
  public readonly onDidChangeCommitVerbosity = this.onCommitVerbosityEmitter.event;
  public readonly onDidRequestLocalModelDownload = this.onLocalModelDownloadEmitter.event;
  public readonly onDidChangeLocalModel = this.onLocalModelEmitter.event;
  public readonly onDidRequestLocalModelCancelDownload = this.onLocalModelCancelDownloadEmitter.event;
  public readonly onDidRequestLocalModelDelete = this.onLocalModelDeleteEmitter.event;
  public readonly onDidRequestLocalModelTest = this.onLocalModelTestEmitter.event;
  public readonly onDidRequestLocalModelRefresh = this.onLocalModelRefreshEmitter.event;
  public readonly onDidRequestCodexLogin = this.onCodexLoginEmitter.event;
  public readonly onDidRequestCodexLogout = this.onCodexLogoutEmitter.event;
  public readonly onDidRequestCodexRefresh = this.onCodexRefreshEmitter.event;
  public readonly onDidChangeLanguage = this.onLanguageEmitter.event;
  public readonly onDidSavePromptPreset = this.onSavePromptPresetEmitter.event;
  public readonly onDidApplyPromptPreset = this.onApplyPromptPresetEmitter.event;
  public readonly onDidDeletePromptPreset = this.onDeletePromptPresetEmitter.event;

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    this.ready = false;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')]
    };
    this.attach(webviewView);
  }

  public async reveal(): Promise<void> {
    if (this.view && this.view.show) {
      this.view.show(true);
      return;
    }
    await vscode.commands.executeCommand('workbench.view.extension.commitMakerContainer');
  }

  public updateState(partial: Partial<PanelState>): void {
    this.state = { ...this.state, ...partial };
    // JSON通信でundefinedが省略されても、画面の前回表示を明示的に消す。
    this.state.commitResult ??= '';
    this.state.commitLastError ??= '';
    this.state.commitProgress ??= '';
    this.postState();
  }

  public dispose(): void {
    this.disposeViewDisposables();
    this.onApiKeyProviderEmitter.dispose();
    this.onApiKeySubmitEmitter.dispose();
    this.onCommitPromptEmitter.dispose();
    this.onCommitProviderEmitter.dispose();
    this.onCommitModelEmitter.dispose();
    this.onCommitCustomModelEmitter.dispose();
    this.onCommitGenerateEmitter.dispose();
    this.onCommitApplyEmitter.dispose();
    this.onCommitIncludeUnstagedEmitter.dispose();
    this.onCommitIncludeUntrackedEmitter.dispose();
    this.onCommitIncludeBinaryEmitter.dispose();
    this.onCommitMaxPromptEmitter.dispose();
    this.onSavePromptPresetEmitter.dispose();
    this.onApplyPromptPresetEmitter.dispose();
    this.onDeletePromptPresetEmitter.dispose();
    this.onCommitReasoningEmitter.dispose();
    this.onCommitCodexReasoningEmitter.dispose();
    this.onCommitVerbosityEmitter.dispose();
    this.onLocalModelDownloadEmitter.dispose();
    this.onLocalModelEmitter.dispose();
    this.onLocalModelCancelDownloadEmitter.dispose();
    this.onLocalModelDeleteEmitter.dispose();
    this.onLocalModelTestEmitter.dispose();
    this.onLocalModelRefreshEmitter.dispose();
    this.onCodexLoginEmitter.dispose();
    this.onCodexLogoutEmitter.dispose();
    this.onCodexRefreshEmitter.dispose();
    this.onLanguageEmitter.dispose();
  }

  private attach(webviewView: vscode.WebviewView): void {
    this.disposeViewDisposables();
    webviewView.webview.html = this.renderHtml(webviewView.webview);

    this.viewDisposables.push(
      webviewView.webview.onDidReceiveMessage((msg: unknown) => {
        const safeMessage = sanitizeMessage(msg);
        if (safeMessage) {
          this.handleMessage(safeMessage);
        }
      })
    );

    this.viewDisposables.push(
      webviewView.onDidDispose(() => {
        this.view = undefined;
        this.ready = false;
        this.disposeViewDisposables();
      })
    );
  }

  private handleMessage(message: WebviewInboundMessage): void {
    // 受信値の検査は sanitizeMessage、種類ごとの処理はここで担当する。
    switch (message.type) {
      case 'ready':
        return this.handleReady();
      case 'apiKeyProviderChanged':
        return this.handleApiKeyProviderChanged(message.value);
      case 'submitApiKey':
        return this.handleSubmitApiKey(message);
      case 'commitPromptChanged':
        return this.handleCommitPromptChanged(message.value);
      case 'savePromptPreset':
        return this.handleSavePromptPreset(message);
      case 'applyPromptPreset':
        return this.handleApplyPromptPreset(message);
      case 'deletePromptPreset':
        return this.handleDeletePromptPreset(message);
      case 'commitProviderChanged':
        return this.handleCommitProviderChanged(message.value);
      case 'commitModelChanged':
        return this.handleCommitModelChanged(message.value);
      case 'commitCustomModelChanged':
        return this.handleCommitCustomModelChanged(message.value);
      case 'commitIncludeUnstagedChanged':
        return this.handleCommitIncludeUnstagedChanged(message.value);
      case 'commitIncludeUntrackedChanged':
        return this.handleCommitIncludeUntrackedChanged(message.value);
      case 'commitIncludeBinaryChanged':
        return this.handleCommitIncludeBinaryChanged(message.value);
      case 'commitMaxPromptChanged':
        return this.handleCommitMaxPromptChanged(message.value);
      case 'commitReasoningChanged':
        return this.handleCommitReasoningChanged(message.value);
      case 'commitCodexReasoningChanged':
        return this.handleCommitCodexReasoningChanged(message.value);
      case 'commitVerbosityChanged':
        return this.handleCommitVerbosityChanged(message.value);
      case 'localModelChanged':
        return this.handleLocalModelChanged(message.value);
      case 'localModelDownload':
        return this.onLocalModelDownloadEmitter.fire();
      case 'localModelCancelDownload':
        return this.onLocalModelCancelDownloadEmitter.fire();
      case 'localModelDelete':
        return this.onLocalModelDeleteEmitter.fire();
      case 'localModelTest':
        return this.onLocalModelTestEmitter.fire();
      case 'localModelRefresh':
        return this.onLocalModelRefreshEmitter.fire();
      case 'codexLogin':
        return this.onCodexLoginEmitter.fire();
      case 'codexLogout':
        return this.onCodexLogoutEmitter.fire();
      case 'codexRefresh':
        return this.onCodexRefreshEmitter.fire();
      case 'languageChanged':
        return this.handleLanguageChanged(message.value);
      case 'commitGenerate':
        return this.onCommitGenerateEmitter.fire(message.value);
      case 'commitApply':
        return this.onCommitApplyEmitter.fire();
      case 'openExternal':
        return this.handleOpenExternal(message.url);
      default: {
        const unhandled: never = message;
        throw new Error(`Unhandled webview message: ${String(unhandled)}`);
      }
    }
  }

  private handleReady(): void {
    this.ready = true;
    this.postState();
  }

  private handleApiKeyProviderChanged(value: ProviderId): void {
    this.state.apiKeyProvider = value;
    this.onApiKeyProviderEmitter.fire(value);
  }

  private handleSubmitApiKey(message: Extract<WebviewInboundMessage, { type: 'submitApiKey' }>): void {
    this.onApiKeySubmitEmitter.fire({ value: message.value, provider: message.provider });
  }

  private handleCommitPromptChanged(value: string | undefined): void {
    this.state.commitPrompt = value ?? '';
    this.onCommitPromptEmitter.fire(this.state.commitPrompt);
  }

  private handleSavePromptPreset(message: Extract<WebviewInboundMessage, { type: 'savePromptPreset' }>): void {
    this.onSavePromptPresetEmitter.fire({ title: message.title, body: message.body });
  }

  private handleApplyPromptPreset(message: Extract<WebviewInboundMessage, { type: 'applyPromptPreset' }>): void {
    this.onApplyPromptPresetEmitter.fire({ id: message.id });
  }

  private handleDeletePromptPreset(message: Extract<WebviewInboundMessage, { type: 'deletePromptPreset' }>): void {
    this.onDeletePromptPresetEmitter.fire({ id: message.id });
  }

  private handleCommitProviderChanged(value: ProviderId): void {
    this.state.commitProvider = value;
    this.onCommitProviderEmitter.fire(value);
    this.state.apiKeyProvider = value;
    this.onApiKeyProviderEmitter.fire(value);
  }

  private handleCommitModelChanged(value: string | undefined): void {
    this.state.commitModel = value ?? '';
    this.onCommitModelEmitter.fire(this.state.commitModel);
  }

  private handleCommitCustomModelChanged(value: string | undefined): void {
    this.state.commitCustomModel = value ?? '';
    this.onCommitCustomModelEmitter.fire(this.state.commitCustomModel);
  }

  private handleCommitIncludeUnstagedChanged(value: unknown): void {
    this.state.commitIncludeUnstaged = Boolean(value);
    this.onCommitIncludeUnstagedEmitter.fire(this.state.commitIncludeUnstaged);
  }

  private handleCommitIncludeUntrackedChanged(value: unknown): void {
    this.state.commitIncludeUntracked = Boolean(value);
    this.onCommitIncludeUntrackedEmitter.fire(this.state.commitIncludeUntracked);
  }

  private handleCommitIncludeBinaryChanged(value: unknown): void {
    this.state.commitIncludeBinary = Boolean(value);
    this.onCommitIncludeBinaryEmitter.fire(this.state.commitIncludeBinary);
  }

  private handleCommitMaxPromptChanged(value: { mode: 'unlimited' | 'limited'; value: number | null } | undefined): void {
    this.state.commitMaxPromptMode = value?.mode ?? 'unlimited';
    this.state.commitMaxPromptChars = value?.value ?? null;
    this.onCommitMaxPromptEmitter.fire({
      mode: this.state.commitMaxPromptMode,
      value: this.state.commitMaxPromptChars
    });
  }

  private handleCommitReasoningChanged(value: ReasoningEffort): void {
    this.state.commitReasoning = value;
    this.onCommitReasoningEmitter.fire(value);
  }

  private handleCommitCodexReasoningChanged(value: CodexReasoningEffort): void {
    this.state.commitCodexReasoning = value;
    this.onCommitCodexReasoningEmitter.fire(value);
  }

  private handleCommitVerbosityChanged(value: VerbositySetting): void {
    this.state.commitVerbosity = value;
    this.onCommitVerbosityEmitter.fire(value);
  }

  private handleLocalModelChanged(value: string | undefined): void {
    if (!value) return;
    this.state.localModel = {
      ...this.state.localModel,
      id: value
    };
    this.onLocalModelEmitter.fire(value);
  }

  private handleLanguageChanged(value: LanguageCode): void {
    const lang = value || DEFAULT_LANGUAGE;
    this.state.language = lang;
    this.state.strings = STRINGS[lang] ?? STRINGS[DEFAULT_LANGUAGE];
    this.onLanguageEmitter.fire(this.state.language);
    this.rerenderWebview();
  }

  private handleOpenExternal(url: string | undefined): void {
    if (url && isAllowedExternalUrl(url, this.getAllowedExternalUrls())) {
      void vscode.env.openExternal(vscode.Uri.parse(url));
    }
  }

  private getAllowedExternalUrls(): Set<string> {
    const language = this.state.language || DEFAULT_LANGUAGE;
    const strings = STRINGS[language] ?? STRINGS[DEFAULT_LANGUAGE];
    return new Set(
      Object.values(buildProviderIssueUrls(buildProviderCapabilities(strings)))
        .map(normalizeExternalUrl)
        .filter((value): value is string => Boolean(value))
    );
  }

  private postState(): void {
    if (!this.view || !this.ready) {
      return;
    }
    const payload: WebviewOutboundMessage = { type: 'state', state: this.state };
    this.view.webview.postMessage(payload).then(undefined, () => undefined);
  }

  private disposeViewDisposables(): void {
    while (this.viewDisposables.length) {
      this.viewDisposables.pop()?.dispose();
    }
  }

  private rerenderWebview(): void {
    if (!this.view) return;
    this.ready = false;
    this.view.webview.html = this.renderHtml(this.view.webview);
  }

  private renderHtml(webview: vscode.Webview): string {
    const ctx = this.getRenderContext(webview);
    const bootstrap = {
      strings: ctx.strings,
      languageOptions: ctx.languageOptions,
      providerOptions: ctx.providerOptions,
      codexReasoningOptions: ctx.codexReasoningOptions,
      reasoningOptions: ctx.reasoningOptions,
      reasoningOptionsByModel: ctx.reasoningOptionsByModel,
      verbosityOptions: ctx.verbosityOptions,
      verbosityOptionsByModel: ctx.verbosityOptionsByModel,
      providerIssueUrls: ctx.providerIssueUrls,
      providerSupportsReasoning: ctx.providerSupportsReasoning,
      providerSupportsVerbosity: ctx.providerSupportsVerbosity,
      promptPresets: ctx.promptPresets,
      localModelOptions: ctx.localModelOptions,
      allowedStateKeys: ctx.allowedStateKeys,
      defaultState: this.state
    };
    return /* html */ `<!DOCTYPE html>
  <html lang="${ctx.strings.langCode}">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${ctx.cspSource} 'unsafe-inline'; img-src ${ctx.cspSource} https:; script-src ${ctx.cspSource} 'nonce-${ctx.nonce}';" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="stylesheet" href="${ctx.styleUri}" />
    </head>
    <body class="app-pending" aria-busy="true">
      ${renderPanelBody(ctx.strings)}
      <script nonce="${ctx.nonce}">window.CommitMakerBootstrap = ${serializeForInlineScript(bootstrap)};</script>
      <script src="${webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'ui', 'elements.js'))}" nonce="${ctx.nonce}"></script>
      <script src="${webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'ui', 'dom.js'))}" nonce="${ctx.nonce}"></script>
      <script src="${webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'ui', 'render.js'))}" nonce="${ctx.nonce}"></script>
      <script src="${webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'ui', 'events.js'))}" nonce="${ctx.nonce}"></script>
      <script src="${webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'ui', 'state.js'))}" nonce="${ctx.nonce}"></script>
      <script src="${ctx.scriptUri}" nonce="${ctx.nonce}"></script>
    </body>
  </html>`;
  }


  private getRenderContext(webview: vscode.Webview): RenderContext {
    const language = this.state.language || DEFAULT_LANGUAGE;
    const strings = STRINGS[language] ?? STRINGS[DEFAULT_LANGUAGE];
    const providerCapabilities = buildProviderCapabilities(strings);
    const providerSupportsReasoning = Object.fromEntries(
      providerCapabilities.map(p => [p.id, p.supportsReasoning])
    ) as Record<ProviderId, boolean>;
    const providerSupportsVerbosity = Object.fromEntries(
      providerCapabilities.map(p => [p.id, p.supportsVerbosity])
    ) as Record<ProviderId, boolean>;
    return {
      cspSource: webview.cspSource,
      nonce: getNonce(),
      providerOptions: buildProviderOptions(providerCapabilities),
      providerIssueUrls: buildProviderIssueUrls(providerCapabilities),
      codexReasoningOptions: CODEX_REASONING_EFFORT_OPTIONS,
      reasoningOptions: REASONING_EFFORT_OPTIONS,
      reasoningOptionsByModel: getAllowedReasoningMap(),
      verbosityOptions: VERBOSITY_OPTIONS,
      verbosityOptionsByModel: getAllowedVerbosityMap(),
      promptPresets: getDefaultPromptPresets(language),
      providerSupportsReasoning,
      providerSupportsVerbosity,
      styleUri: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'panel.css')),
      scriptUri: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'panel.js')),
      strings,
      languageOptions: SUPPORTED_LANG_CODES.map(code => ({
        code,
        label: STRINGS[code]?.languageName ?? code
      })),
      localModelOptions: getLocalModelOptions(),
      allowedStateKeys: ALLOWED_STATE_KEYS
    };
  }
}

function getNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

function normalizeExternalUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function isAllowedExternalUrl(value: string, allowed: Set<string>): boolean {
  const normalized = normalizeExternalUrl(value);
  return Boolean(normalized && allowed.has(normalized));
}
