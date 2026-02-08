import * as vscode from 'vscode';
import {
  DEFAULT_PROVIDER,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_VERBOSITY,
  MODEL_SUGGESTIONS_BY_PROVIDER,
  REASONING_EFFORT_OPTIONS,
  VERBOSITY_OPTIONS,
  getDefaultCommitPrompt,
  getDefaultPromptPresets,
  buildProviderCapabilities,
  buildProviderOptions,
  buildProviderIssueUrls
} from './constants';
import { ProviderId, ProviderOption, ReasoningEffort, VerbositySetting, PromptPreset, LanguageCode } from './types';
import { WebviewInboundMessage, WebviewOutboundMessage, PanelState } from './panelMessages';
import { sanitizeMessage } from './panelMessageGuard';
import { renderPanelBody } from './panelBody';
import {
  getAllowedReasoningMap,
  getAllowedVerbosityMap,
  getVerbosityBlocklistPatterns
} from './modelCapabilities';
import { DEFAULT_INCLUDE_FLAGS, DEFAULT_PROMPT_LIMIT, getDefaultModelForProvider } from './defaults';
import { DEFAULT_LANGUAGE, STRINGS } from './i18n/strings';
import { UiStrings } from './i18n/types';
import { SUPPORTED_LANG_CODES } from './i18n/languages';

interface RenderContext {
  cspSource: string;
  nonce: string;
  providerOptions: ProviderOption[];
  providerIssueUrls: Record<ProviderId, string>;
  reasoningOptions: typeof REASONING_EFFORT_OPTIONS;
  reasoningOptionsByModel: Record<string, ReasoningEffort[]>;
  verbosityOptions: typeof VERBOSITY_OPTIONS;
  verbosityOptionsByModel: Record<string, VerbositySetting[]>;
  promptPresets: PromptPreset[];
  providerSupportsReasoning: Record<ProviderId, boolean>;
  providerSupportsVerbosity: Record<ProviderId, boolean>;
  verbosityBlocklistPatterns: string[];
  styleUri: vscode.Uri;
  scriptUri: vscode.Uri;
  strings: UiStrings;
  languageOptions: { code: LanguageCode; label: string }[];
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
  'commitIncludeUnstaged',
  'commitIncludeUntracked',
  'commitIncludeBinary',
  'commitMaxPromptChars',
  'commitMaxPromptMode',
  'commitReasoning',
  'commitVerbosity',
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
      claude: { ready: false }
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
    commitIncludeUnstaged: DEFAULT_INCLUDE_FLAGS.includeUnstaged,
    commitIncludeUntracked: DEFAULT_INCLUDE_FLAGS.includeUntracked,
    commitIncludeBinary: DEFAULT_INCLUDE_FLAGS.includeBinary,
    commitMaxPromptChars: DEFAULT_PROMPT_LIMIT.maxPromptChars,
    commitMaxPromptMode: DEFAULT_PROMPT_LIMIT.maxPromptMode,
    commitReasoning: DEFAULT_REASONING_EFFORT,
    commitVerbosity: DEFAULT_VERBOSITY,
    strings: STRINGS[language] ?? STRINGS[DEFAULT_LANGUAGE],
    promptToast: undefined
  };
}

const DEFAULT_STATE: PanelState = createDefaultState();

export class CommitPanelProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  private view?: vscode.WebviewView;
  private ready = false;
  private state: PanelState = createDefaultState();

  private readonly viewDisposables: vscode.Disposable[] = [];
  private readonly onApiKeyProviderEmitter = new vscode.EventEmitter<ProviderId>();
  private readonly onApiKeySubmitEmitter = new vscode.EventEmitter<{ value: string; provider: ProviderId }>();
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
  private readonly onCommitVerbosityEmitter = new vscode.EventEmitter<VerbositySetting>();
  private readonly onLanguageEmitter = new vscode.EventEmitter<LanguageCode>();
  private readonly onSavePromptPresetEmitter = new vscode.EventEmitter<{ title: string; body: string }>();
  private readonly onApplyPromptPresetEmitter = new vscode.EventEmitter<{ id: string }>();
  private readonly onDeletePromptPresetEmitter = new vscode.EventEmitter<{ id: string }>();
  private readonly messageHandlers: Partial<Record<WebviewInboundMessage['type'], (message: WebviewInboundMessage) => void>>;

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
  public readonly onDidChangeCommitVerbosity = this.onCommitVerbosityEmitter.event;
  public readonly onDidChangeLanguage = this.onLanguageEmitter.event;
  public readonly onDidSavePromptPreset = this.onSavePromptPresetEmitter.event;
  public readonly onDidApplyPromptPreset = this.onApplyPromptPresetEmitter.event;
  public readonly onDidDeletePromptPreset = this.onDeletePromptPresetEmitter.event;

  constructor(private readonly extensionUri: vscode.Uri) {
    this.messageHandlers = {
      ready: () => this.handleReady(),
      apiKeyProviderChanged: message =>
        this.handleApiKeyProviderChanged((message as Extract<WebviewInboundMessage, { type: 'apiKeyProviderChanged' }>).value),
      submitApiKey: message =>
        this.handleSubmitApiKey(message as Extract<WebviewInboundMessage, { type: 'submitApiKey' }>),
      commitPromptChanged: message =>
        this.handleCommitPromptChanged((message as Extract<WebviewInboundMessage, { type: 'commitPromptChanged' }>).value),
      savePromptPreset: message =>
        this.handleSavePromptPreset(message as Extract<WebviewInboundMessage, { type: 'savePromptPreset' }>),
      applyPromptPreset: message =>
        this.handleApplyPromptPreset(message as Extract<WebviewInboundMessage, { type: 'applyPromptPreset' }>),
      deletePromptPreset: message =>
        this.handleDeletePromptPreset(message as Extract<WebviewInboundMessage, { type: 'deletePromptPreset' }>),
      commitProviderChanged: message =>
        this.handleCommitProviderChanged((message as Extract<WebviewInboundMessage, { type: 'commitProviderChanged' }>).value),
      commitModelChanged: message =>
        this.handleCommitModelChanged((message as Extract<WebviewInboundMessage, { type: 'commitModelChanged' }>).value),
      commitCustomModelChanged: message =>
        this.handleCommitCustomModelChanged((message as Extract<WebviewInboundMessage, { type: 'commitCustomModelChanged' }>).value),
      commitIncludeUnstagedChanged: message =>
        this.handleCommitIncludeUnstagedChanged((message as Extract<WebviewInboundMessage, { type: 'commitIncludeUnstagedChanged' }>).value),
      commitIncludeUntrackedChanged: message =>
        this.handleCommitIncludeUntrackedChanged((message as Extract<WebviewInboundMessage, { type: 'commitIncludeUntrackedChanged' }>).value),
      commitIncludeBinaryChanged: message =>
        this.handleCommitIncludeBinaryChanged((message as Extract<WebviewInboundMessage, { type: 'commitIncludeBinaryChanged' }>).value),
      commitMaxPromptChanged: message =>
        this.handleCommitMaxPromptChanged((message as Extract<WebviewInboundMessage, { type: 'commitMaxPromptChanged' }>).value),
      commitReasoningChanged: message =>
        this.handleCommitReasoningChanged((message as Extract<WebviewInboundMessage, { type: 'commitReasoningChanged' }>).value),
      commitVerbosityChanged: message =>
        this.handleCommitVerbosityChanged((message as Extract<WebviewInboundMessage, { type: 'commitVerbosityChanged' }>).value),
      languageChanged: message =>
        this.handleLanguageChanged((message as Extract<WebviewInboundMessage, { type: 'languageChanged' }>).value),
      commitGenerate: message =>
        this.handleCommitGenerate((message as Extract<WebviewInboundMessage, { type: 'commitGenerate' }>).value),
      commitApply: () => this.handleCommitApply(),
      openExternal: message =>
        this.handleOpenExternal((message as Extract<WebviewInboundMessage, { type: 'openExternal' }>).url)
    };
  }

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    this.ready = false;
    webviewView.webview.options = {
      enableScripts: true
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
    this.onCommitReasoningEmitter.dispose();
    this.onCommitVerbosityEmitter.dispose();
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
    const handler = this.messageHandlers[message.type];
    if (handler) {
      handler(message);
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

  private handleCommitVerbosityChanged(value: VerbositySetting): void {
    this.state.commitVerbosity = value;
    this.onCommitVerbosityEmitter.fire(value);
  }

  private handleLanguageChanged(value: LanguageCode): void {
    const lang = value || DEFAULT_LANGUAGE;
    this.state.language = lang;
    this.state.strings = STRINGS[lang] ?? STRINGS[DEFAULT_LANGUAGE];
    this.onLanguageEmitter.fire(this.state.language);
    this.rerenderWebview();
  }

  private handleCommitGenerate(value: { includeUnstaged: boolean; includeUntracked: boolean; includeBinary: boolean } | undefined): void {
    this.onCommitGenerateEmitter.fire(value ?? { includeUnstaged: true, includeUntracked: false, includeBinary: true });
  }

  private handleCommitApply(): void {
    this.onCommitApplyEmitter.fire();
  }

  private handleOpenExternal(url: string | undefined): void {
    if (url) {
      vscode.env.openExternal(vscode.Uri.parse(url));
    }
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
      reasoningOptions: ctx.reasoningOptions,
      reasoningOptionsByModel: ctx.reasoningOptionsByModel,
      verbosityOptions: ctx.verbosityOptions,
      verbosityOptionsByModel: ctx.verbosityOptionsByModel,
      providerIssueUrls: ctx.providerIssueUrls,
      providerSupportsReasoning: ctx.providerSupportsReasoning,
      providerSupportsVerbosity: ctx.providerSupportsVerbosity,
      verbosityBlocklistPatterns: ctx.verbosityBlocklistPatterns,
      promptPresets: ctx.promptPresets,
      allowedStateKeys: ctx.allowedStateKeys,
      defaultState: createDefaultState(this.state.language || DEFAULT_LANGUAGE)
    };
    return /* html */ `<!DOCTYPE html>
  <html lang="${ctx.strings.langCode}">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${ctx.cspSource} 'unsafe-inline'; img-src ${ctx.cspSource} https:; script-src ${ctx.cspSource} 'nonce-${ctx.nonce}';" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="stylesheet" href="${ctx.styleUri}" />
    </head>
    <body>
      ${renderPanelBody(ctx.strings)}
      <script nonce="${ctx.nonce}">window.CommitMakerBootstrap = ${JSON.stringify(bootstrap)};</script>
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
      reasoningOptions: REASONING_EFFORT_OPTIONS,
      reasoningOptionsByModel: getAllowedReasoningMap(),
      verbosityOptions: VERBOSITY_OPTIONS,
      verbosityOptionsByModel: getAllowedVerbosityMap(),
      promptPresets: getDefaultPromptPresets(language),
      providerSupportsReasoning,
      providerSupportsVerbosity,
      verbosityBlocklistPatterns: getVerbosityBlocklistPatterns(),
      styleUri: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'panel.css')),
      scriptUri: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'panel.js')),
      strings,
      languageOptions: SUPPORTED_LANG_CODES.map(code => ({
        code: code as LanguageCode,
        label: STRINGS[code]?.languageName ?? code
      })),
      allowedStateKeys: ALLOWED_STATE_KEYS
    };
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
