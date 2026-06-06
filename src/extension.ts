import * as vscode from 'vscode';
import { CommitPanelProvider } from './panel';
import { CommitController } from './commitController';
import { ProviderId, LanguageCode, isLanguageCode, isProviderId } from './types';
import { getApiKeySecretName } from './providerSettings';
import { buildProviderCapabilities, COMMIT_LANGUAGE_STORAGE_KEY } from './constants';
import { getStrings, DEFAULT_LANGUAGE } from './i18n/strings';
import {
  buildCodexLoginCommand,
  buildCodexTerminalEnvironment,
  ensureCodexHome,
  getCodexCommand,
  inspectCodexCli,
  logoutCodexCli
} from './services/codexCli';

type ApiKeyPanelState = Record<ProviderId, { ready: boolean; preview?: string; length?: number }>;

const CODEX_LOGIN_POLL_INTERVAL_MS = 3000;
const CODEX_LOGIN_POLL_TIMEOUT_MS = 5 * 60 * 1000;

let codexLoginPollTimer: ReturnType<typeof setInterval> | undefined;
let codexLoginPollUntil = 0;
let codexLoginPollRunning = false;
let codexLoginFocusDisposable: vscode.Disposable | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const language = getLanguage(context);
  const strings = getStrings(language);
  const output = vscode.window.createOutputChannel('Commit Maker');
  const viewProvider = new CommitPanelProvider(context.extensionUri);
  const commitController = new CommitController(context, viewProvider, output);

  context.subscriptions.push(
    output,
    viewProvider,
    commitController,
    vscode.window.registerWebviewViewProvider('commitMakerView', viewProvider, {
      webviewOptions: {
        retainContextWhenHidden: true
      }
    }),
    vscode.commands.registerCommand('commitMaker.showPanel', () => viewProvider.reveal()),
    vscode.commands.registerCommand('commitMaker.saveApiKey', () => saveApiKey(context))
  );

  // Webview からの API キー保存要求を処理
  viewProvider.onDidSubmitApiKey(async payload => {
    await storeApiKey(context, payload.provider, payload.value);
    await refreshApiKeyState(context, viewProvider);
    void vscode.window.showInformationMessage(strings.msgApiKeySaved);
  });
  viewProvider.onDidChangeApiKeyProvider(async () => {
    await refreshApiKeyState(context, viewProvider);
  });
  viewProvider.onDidRequestCodexLogin(async () => {
    await openCodexLoginTerminal(context, viewProvider);
  });
  viewProvider.onDidRequestCodexLogout(async () => {
    await logoutCodex(context, viewProvider);
  });
  viewProvider.onDidRequestCodexRefresh(async () => {
    await refreshApiKeyState(context, viewProvider);
  });

  // 初期状態で保存済みキーを反映
  void refreshApiKeyState(context, viewProvider);
}

export function deactivate(): void {
  stopCodexLoginAutoRefresh();
}

async function saveApiKey(context: vscode.ExtensionContext): Promise<void> {
  const language = getLanguage(context);
  const strings = getStrings(language);
  const providerCapabilities = buildProviderCapabilities(strings);
  const provider = await vscode.window.showQuickPick(
    providerCapabilities.filter(p => p.requiresApiKey).map(p => ({ label: p.label, value: p.id })),
    { placeHolder: strings.msgApiKeySavePick }
  );
  if (!provider) {
    return;
  }
  const providerId = provider.value as ProviderId;
  if (providerId === 'local' || providerId === 'codex') {
    return;
  }
  const config = vscode.workspace.getConfiguration('commitMaker');
  const secretKey = getApiKeySecretName(config, providerId);
  if (!secretKey) {
    return;
  }

  const value = await vscode.window.showInputBox({
    prompt: strings.msgApiKeyInputPrompt.replace('{provider}', provider.label),
    password: true,
    ignoreFocusOut: true
  });
  if (!value) {
    return;
  }
  await context.secrets.store(secretKey, value);
  void vscode.window.showInformationMessage(strings.msgApiKeySaved);
}

async function storeApiKey(context: vscode.ExtensionContext, provider: ProviderId, value: string): Promise<void> {
  if (!isProviderId(provider) || provider === 'local' || provider === 'codex') {
    return;
  }
  const config = vscode.workspace.getConfiguration('commitMaker');
  const secretKey = getApiKeySecretName(config, provider);
  if (!secretKey) {
    return;
  }
  if (!value) {
    await context.secrets.delete(secretKey);
    return;
  }
  await context.secrets.store(secretKey, value);
}

function maskKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.length <= 8) return '****';
  return value.slice(0, 2) + '...' + value.slice(-4);
}

async function refreshApiKeyState(context: vscode.ExtensionContext, panel: CommitPanelProvider): Promise<ApiKeyPanelState> {
  const config = vscode.workspace.getConfiguration('commitMaker');
  const keys: Record<ProviderId, string | undefined> = {
    openai: getApiKeySecretName(config, 'openai'),
    gemini: getApiKeySecretName(config, 'gemini'),
    claude: getApiKeySecretName(config, 'claude'),
    codex: undefined,
    local: undefined
  };
  const apiKeys: ApiKeyPanelState = {
    openai: { ready: false },
    gemini: { ready: false },
    claude: { ready: false },
    codex: { ready: false },
    local: { ready: false }
  };
  for (const provider of Object.keys(keys) as ProviderId[]) {
    const envValue = getEnvVarNames(provider).map(name => process.env[name]).find(Boolean);
    const secretKey = keys[provider];
    const secretValue = secretKey ? await context.secrets.get(secretKey) : undefined;
    const value = secretValue ?? envValue;
    const fromEnv = !secretValue && Boolean(envValue);
    if (value) {
      apiKeys[provider] = {
        ready: true,
        preview: fromEnv ? 'env' : maskKey(value),
        length: value.length
      };
    }
  }
  try {
    const codexHome = await ensureCodexHome(context);
    const codexStatus = await inspectCodexCli(config, codexHome);
    apiKeys.codex = {
      ready: codexStatus.ready,
      preview: codexStatus.preview,
      length: codexStatus.preview?.length
    };
  } catch (error) {
    apiKeys.codex = {
      ready: false,
      preview: 'not available',
      length: undefined
    };
  }
  panel.updateState({ apiKeys });
  return apiKeys;
}

async function openCodexLoginTerminal(context: vscode.ExtensionContext, panel: CommitPanelProvider): Promise<void> {
  const strings = getStrings(getLanguage(context));
  const config = vscode.workspace.getConfiguration('commitMaker');
  try {
    const codexHome = await ensureCodexHome(context);
    const terminal = vscode.window.createTerminal({
      name: 'Commit Maker Codex',
      env: buildCodexTerminalEnvironment(codexHome)
    });
    terminal.show(true);
    terminal.sendText(buildCodexLoginCommand(getCodexCommand(config)));
    startCodexLoginAutoRefresh(context, panel);
    void vscode.window.showInformationMessage(
      strings.msgCodexLoginTerminalOpened ?? 'Codex login started in a dedicated Commit Maker terminal.'
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(
      (strings.msgCodexLoginFailed ?? 'Failed to start Codex login: {detail}').replace('{detail}', detail)
    );
  }
}

async function logoutCodex(context: vscode.ExtensionContext, panel: CommitPanelProvider): Promise<void> {
  const strings = getStrings(getLanguage(context));
  const config = vscode.workspace.getConfiguration('commitMaker');
  try {
    stopCodexLoginAutoRefresh();
    const codexHome = await ensureCodexHome(context);
    await logoutCodexCli(config, codexHome);
    await refreshApiKeyState(context, panel);
    void vscode.window.showInformationMessage(strings.msgCodexLogoutComplete ?? 'Signed out from Commit Maker Codex.');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(
      (strings.msgCodexLogoutFailed ?? 'Failed to sign out from Codex: {detail}').replace('{detail}', detail)
    );
  }
}

function startCodexLoginAutoRefresh(context: vscode.ExtensionContext, panel: CommitPanelProvider): void {
  stopCodexLoginAutoRefresh();
  codexLoginPollUntil = Date.now() + CODEX_LOGIN_POLL_TIMEOUT_MS;
  codexLoginFocusDisposable = vscode.window.onDidChangeWindowState(state => {
    if (state.focused) {
      void refreshCodexLoginUntilReady(context, panel);
    }
  });
  codexLoginPollTimer = setInterval(() => {
    void refreshCodexLoginUntilReady(context, panel);
  }, CODEX_LOGIN_POLL_INTERVAL_MS);
  void refreshCodexLoginUntilReady(context, panel);
}

function stopCodexLoginAutoRefresh(): void {
  if (codexLoginPollTimer) {
    clearInterval(codexLoginPollTimer);
    codexLoginPollTimer = undefined;
  }
  codexLoginFocusDisposable?.dispose();
  codexLoginFocusDisposable = undefined;
  codexLoginPollRunning = false;
  codexLoginPollUntil = 0;
}

async function refreshCodexLoginUntilReady(context: vscode.ExtensionContext, panel: CommitPanelProvider): Promise<void> {
  if (codexLoginPollRunning) {
    return;
  }
  if (!codexLoginPollUntil || Date.now() > codexLoginPollUntil) {
    stopCodexLoginAutoRefresh();
    return;
  }
  codexLoginPollRunning = true;
  try {
    const apiKeys = await refreshApiKeyState(context, panel);
    if (apiKeys.codex?.ready) {
      stopCodexLoginAutoRefresh();
    }
  } finally {
    codexLoginPollRunning = false;
  }
}

function getEnvVarNames(provider: ProviderId): string[] {
  if (provider === 'openai') return ['COMMIT_MAKER_OPENAI_API_KEY', 'OPENAI_API_KEY', 'openai_api_key'];
  if (provider === 'gemini') return ['COMMIT_MAKER_GEMINI_API_KEY', 'GOOGLE_API_KEY', 'google_api_key'];
  if (provider === 'claude') return ['COMMIT_MAKER_CLAUDE_API_KEY', 'ANTHROPIC_API_KEY', 'anthropic_api_key'];
  return [];
}

function getLanguage(context: vscode.ExtensionContext): LanguageCode {
  const stored = context.globalState.get<string>(COMMIT_LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
  return isLanguageCode(stored) ? stored : DEFAULT_LANGUAGE;
}
