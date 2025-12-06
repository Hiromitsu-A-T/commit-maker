import * as vscode from 'vscode';
import { CommitPanelProvider } from './panel';
import { CommitController } from './commitController';
import { ProviderId, LanguageCode, isLanguageCode } from './types';
import { getApiKeySecretName } from './providerSettings';
import { buildProviderCapabilities, COMMIT_LANGUAGE_STORAGE_KEY } from './constants';
import { getStrings, DEFAULT_LANGUAGE } from './i18n/strings';

export function activate(context: vscode.ExtensionContext): void {
  const language = getLanguage(context);
  const strings = getStrings(language);
  const providerCapabilities = buildProviderCapabilities(strings);
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

  // 初期状態で保存済みキーを反映
  void refreshApiKeyState(context, viewProvider);

  void viewProvider.reveal();
}

export function deactivate(): void {
  // no-op
}

async function saveApiKey(context: vscode.ExtensionContext): Promise<void> {
  const language = getLanguage(context);
  const strings = getStrings(language);
  const providerCapabilities = buildProviderCapabilities(strings);
  const provider = await vscode.window.showQuickPick(
    providerCapabilities.map(p => ({ label: p.label, value: p.id })),
    { placeHolder: strings.msgApiKeySavePick }
  );
  if (!provider) {
    return;
  }
  const providerId = provider.value as 'openai' | 'gemini' | 'claude';
  const config = vscode.workspace.getConfiguration('commitMaker');
  const secretKey = getApiKeySecretName(config, providerId);

  const value = await vscode.window.showInputBox({
    prompt: strings.msgApiKeyInputPrompt.replace('{provider}', provider.label),
    password: true,
    ignoreFocusOut: true
  });
  if (!value) {
    return;
  }
  await context.secrets.store(secretKey ?? '', value);
  void vscode.window.showInformationMessage(strings.msgApiKeySaved);
}

async function storeApiKey(context: vscode.ExtensionContext, provider: ProviderId, value: string): Promise<void> {
  const config = vscode.workspace.getConfiguration('commitMaker');
  const secretKey = getApiKeySecretName(config, provider);
  await context.secrets.store(secretKey ?? '', value);
}

function maskKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.length <= 8) return '****';
  return value.slice(0, 2) + '...' + value.slice(-4);
}

async function refreshApiKeyState(context: vscode.ExtensionContext, panel: CommitPanelProvider): Promise<void> {
  const config = vscode.workspace.getConfiguration('commitMaker');
  const keys: Record<ProviderId, string | undefined> = {
    openai: getApiKeySecretName(config, 'openai'),
    gemini: getApiKeySecretName(config, 'gemini'),
    claude: getApiKeySecretName(config, 'claude')
  };
  const apiKeys: Record<ProviderId, { ready: boolean; preview?: string; length?: number }> = {
    openai: { ready: false },
    gemini: { ready: false },
    claude: { ready: false }
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
  panel.updateState({ apiKeys });
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
