import * as vscode from 'vscode';
import * as path from 'path';
import {
  COMMIT_INCLUDE_UNSTAGED_STORAGE_KEY,
  COMMIT_INCLUDE_UNTRACKED_STORAGE_KEY,
  COMMIT_INCLUDE_BINARY_STORAGE_KEY,
  COMMIT_API_KEY_PROVIDER_STORAGE_KEY,
  COMMIT_MODEL_STORAGE_KEY,
  COMMIT_LOCAL_MODEL_STORAGE_KEY,
  COMMIT_MAX_PROMPT_CHARS_STORAGE_KEY,
  COMMIT_PROMPT_STORAGE_KEY,
  COMMIT_PROVIDER_STORAGE_KEY,
  COMMIT_CODEX_REASONING_STORAGE_KEY,
  DEFAULT_CODEX_REASONING_EFFORT,
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_LOCAL_CONTEXT_SIZE,
  DEFAULT_LOCAL_GPU_LAYERS,
  DEFAULT_LOCAL_KEEP_ALIVE_MS,
  DEFAULT_LOCAL_MAX_OUTPUT_TOKENS,
  DEFAULT_LOCAL_MODEL_ID,
  DEFAULT_PROVIDER,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_VERBOSITY,
  COMMIT_REASONING_STORAGE_KEY,
  COMMIT_VERBOSITY_STORAGE_KEY,
  getDefaultCommitPrompt,
  getDefaultPromptPresets,
  COMMIT_LANGUAGE_STORAGE_KEY
} from './constants';
import { CommitPanelProvider } from './panel';
import {
  ProviderId,
  isCodexReasoningEffort,
  isProviderId,
  isReasoningEffort,
  isVerbositySetting,
  PromptPreset,
  isLanguageCode
} from './types';
import { collectDiff, GitRepositoryLike, DEFAULT_DIFF_COLLECTION_LIMIT_CHARS } from './services/diffCollector';
import { applyPromptLimit, buildLocalDiffDigest, getLocalPromptCharLimit } from './promptLimit';
import { callOpenAi } from './services/llm/openai';
import { callClaude } from './services/llm/claude';
import { callGemini } from './services/llm/gemini';
import { callLocalLlm, LocalLlmCallParams, stopLocalLlmRuntime } from './services/llm/local';
import { callCodex } from './services/llm/codex';
import {
  deleteLocalModel,
  downloadLocalModel,
  createDefaultLocalModelState,
  getLocalModelDefinition,
  inspectLocalModel,
  resolveLocalModelId
} from './services/localModel';
import { resolveLocalGenerationSettings, resolveLocalRuntimeArgs } from './services/localModelProfiles';
import { ensureLocalRuntime, resolveLocalRuntimeVersion } from './services/localRuntime';
import {
  applyPresetById,
  deletePresetById,
  normalizePresets,
  resolveActivePresetId,
  upsertPreset
} from './promptPresets';
import { getApiKeySecretName, getEndpoint, getApiKeyEnvironmentNames } from './providerSettings';
import { ensureCodexHome, getCodexCommand } from './services/codexCli';
import {
  DEFAULT_INCLUDE_FLAGS,
  DEFAULT_PROMPT_LIMIT,
  getDefaultModelForProvider,
  resolveCodexReasoningSetting,
  resolveReasoningSetting,
  resolveVerbositySetting
} from './defaults';
import { loadPromptPresetsFromStorage, persistPromptPresets } from './promptPresetStorage';
import { toPanelState, withStatus } from './panelSync';
import { CommitState } from './commitState';
import { DEFAULT_LANGUAGE, getStrings } from './i18n/strings';
import { buildCommitPrompt } from './commitPrompt';
import {
  getAllowedReasoningOptions,
  getDefaultReasoningForModel,
  getAllowedVerbosityOptions,
  getDefaultVerbosityForModel
} from './modelCapabilities';
import { buildProviderCapabilities } from './constants';
import { getExplicitConfigurationValue, getUserConfigurationValue } from './configScope';

interface GitRepository extends GitRepositoryLike {
  rootUri: vscode.Uri;
  inputBox: { value: string };
}

interface GitApi {
  repositories: GitRepository[];
}

export class CommitController implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private state: CommitState;
  private currentAbortController: AbortController | undefined;
  private activeGenerationId = 0;
  private currentModelDownloadAbortController: AbortController | undefined;
  private currentLocalTestAbortController: AbortController | undefined;
  private localModelRevision = 0;
  private disposed = false;
  private promptToastTimer: ReturnType<typeof setTimeout> | undefined;
  private get strings() {
    return getStrings(this.state.language || DEFAULT_LANGUAGE);
  }

  private get providerLabels(): Record<ProviderId, string> {
    const caps = buildProviderCapabilities(this.strings);
    return Object.fromEntries(caps.map(p => [p.id, p.label])) as Record<ProviderId, string>;
  }

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly panel: CommitPanelProvider,
    private readonly output: vscode.OutputChannel
  ) {
    this.state = this.loadState();
    this.normalizeModelForProvider();
    this.normalizeReasoningForModel();
    this.normalizeVerbosityForModel();
    this.hydratePanel();
    void this.refreshLocalModelState();
    this.registerPanelHandlers();
    this.registerCommands();
  }

  public dispose(): void {
    this.disposed = true;
    this.localModelRevision += 1;
    if (this.promptToastTimer) clearTimeout(this.promptToastTimer);
    this.currentAbortController?.abort();
    this.activeGenerationId += 1;
    this.currentModelDownloadAbortController?.abort();
    this.currentLocalTestAbortController?.abort();
    stopLocalLlmRuntime();
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
  }

  private hydratePanel(): void {
    this.panel.updateState({
      ...toPanelState({ ...this.state, promptToast: undefined }),
      ...withStatus(this.state, 'idle'),
      commitResult: undefined,
      commitLastError: undefined
    });
  }

  private registerPanelHandlers(): void {
    this.disposables.push(
      this.panel.onDidChangeCommitPrompt(value => {
        this.state.prompt = value ?? '';
        void this.context.globalState.update(COMMIT_PROMPT_STORAGE_KEY, this.state.prompt);
      }),
      this.panel.onDidSavePromptPreset(payload => {
        void this.savePromptPreset(payload.title, payload.body);
      }),
      this.panel.onDidApplyPromptPreset(payload => {
        void this.applyPromptPreset(payload.id);
      }),
      this.panel.onDidDeletePromptPreset(payload => {
        void this.deletePromptPreset(payload.id);
      }),
      this.panel.onDidChangeLanguage(value => {
        this.setLanguage(value);
      }),
      this.panel.onDidChangeApiKeyProvider(value => {
        if (isProviderId(value)) {
          this.state.apiKeyProvider = value;
          void this.context.globalState.update(COMMIT_API_KEY_PROVIDER_STORAGE_KEY, value);
        }
      }),
      this.panel.onDidChangeCommitProvider(value => {
        if (isProviderId(value)) {
          this.setProvider(value);
        }
      }),
      this.panel.onDidChangeCommitModel(value => {
        if (value) {
          this.setModel(value);
        }
      }),
      this.panel.onDidChangeLocalModel(value => {
        if (value) {
          void this.setLocalModel(value);
        }
      }),
      this.panel.onDidChangeCommitCustomModel(value => {
        if (value) {
          this.setModel(value, true);
        }
      }),
      this.panel.onDidChangeCommitIncludeUnstaged(value => {
        this.state.includeUnstaged = Boolean(value);
        void this.context.workspaceState.update(COMMIT_INCLUDE_UNSTAGED_STORAGE_KEY, this.state.includeUnstaged);
      }),
      this.panel.onDidChangeCommitIncludeUntracked(value => {
        this.state.includeUntracked = Boolean(value);
        void this.context.workspaceState.update(COMMIT_INCLUDE_UNTRACKED_STORAGE_KEY, this.state.includeUntracked);
      }),
      this.panel.onDidChangeCommitIncludeBinary(value => {
        this.state.includeBinary = Boolean(value);
        void this.context.workspaceState.update(COMMIT_INCLUDE_BINARY_STORAGE_KEY, this.state.includeBinary);
      }),
      this.panel.onDidChangeCommitMaxPrompt(payload => {
        const { mode, value } = payload;
        this.state.maxPromptMode = mode;
        this.state.maxPromptChars = mode === 'limited' && value ? value : null;
        void this.context.workspaceState.update(COMMIT_MAX_PROMPT_CHARS_STORAGE_KEY, this.state.maxPromptChars);
      }),
      this.panel.onDidChangeCommitReasoning(value => {
        if (isReasoningEffort(value)) {
          this.state.reasoning = value;
          void this.context.workspaceState.update(COMMIT_REASONING_STORAGE_KEY, value);
          this.panel.updateState({ commitReasoning: value });
        }
      }),
      this.panel.onDidChangeCommitCodexReasoning(value => {
        if (isCodexReasoningEffort(value)) {
          this.state.codexReasoning = value;
          void this.context.workspaceState.update(COMMIT_CODEX_REASONING_STORAGE_KEY, value);
          this.panel.updateState({ commitCodexReasoning: value });
        }
      }),
      this.panel.onDidChangeCommitVerbosity(value => {
        if (isVerbositySetting(value)) {
          this.state.verbosity = value;
          void this.context.workspaceState.update(COMMIT_VERBOSITY_STORAGE_KEY, value);
          this.panel.updateState({ commitVerbosity: value });
        }
      }),
      this.panel.onDidRequestCommitGenerate(payload => {
        const includeUnstaged = Boolean(payload?.includeUnstaged ?? this.state.includeUnstaged);
        const includeUntracked = Boolean(payload?.includeUntracked ?? this.state.includeUntracked);
        const includeBinary = Boolean(payload?.includeBinary ?? this.state.includeBinary);
        void this.generateCommitMessage(includeUnstaged, includeUntracked, includeBinary);
      }),
      this.panel.onDidRequestCommitApply(() => {
        void this.applyCommitMessage();
      }),
      this.panel.onDidRequestLocalModelDownload(() => {
        void this.downloadLocalModel();
      }),
      this.panel.onDidRequestLocalModelCancelDownload(() => {
        this.cancelLocalModelDownload();
      }),
      this.panel.onDidRequestLocalModelDelete(() => {
        void this.deleteLocalModel();
      }),
      this.panel.onDidRequestLocalModelTest(() => {
        void this.testLocalModel();
      }),
      this.panel.onDidRequestLocalModelRefresh(() => {
        void this.refreshLocalModelState();
      })
    );
  }

  private registerCommands(): void {
    this.disposables.push(
      vscode.commands.registerCommand('commitMaker.cancelCommitFromSCM', () => {
        void this.cancelCurrent(this.strings.msgCancelled);
      }),
      vscode.commands.registerCommand('commitMaker.generateCommitFromSCM', async (scmArg?: unknown) => {
        await this.generateAndApplyFromCommand(scmArg);
      })
    );
  }

  private loadState(): CommitState {
    const storedLanguage = this.context.globalState.get<string>(COMMIT_LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
    const language = isLanguageCode(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;
    const defaultPresets = getDefaultPromptPresets(language);
    const { presets, activeId } = loadPromptPresetsFromStorage(this.context, defaultPresets);
    const promptFromGlobal = this.context.globalState.get<string>(COMMIT_PROMPT_STORAGE_KEY);
    const promptFromWorkspace = this.context.workspaceState.get<string>(COMMIT_PROMPT_STORAGE_KEY);
    const prompt =
      promptFromGlobal ??
      promptFromWorkspace ??
      presets.find(p => p.id === activeId)?.prompt ??
      getDefaultCommitPrompt(language);
    // 旧ワークスペース保存からグローバルへ自動移行
    if (!promptFromGlobal && promptFromWorkspace) {
      void this.context.globalState.update(COMMIT_PROMPT_STORAGE_KEY, promptFromWorkspace);
    }
    const config = vscode.workspace.getConfiguration('commitMaker');
    const configuredProvider = config.get<string>('provider', DEFAULT_PROVIDER);
    const defaultProvider = isProviderId(configuredProvider) ? configuredProvider : DEFAULT_PROVIDER;
    const storedProvider = this.context.workspaceState.get<string>(COMMIT_PROVIDER_STORAGE_KEY);
    const provider = isProviderId(storedProvider) ? storedProvider : defaultProvider;
    const storedApiKeyProvider = this.context.globalState.get<string>(COMMIT_API_KEY_PROVIDER_STORAGE_KEY);
    const apiKeyProvider = isProviderId(storedApiKeyProvider) ? storedApiKeyProvider : provider;
    const storedModel = this.context.workspaceState.get<string>(COMMIT_MODEL_STORAGE_KEY);
    const storedLocalModelId = this.context.workspaceState.get<string>(COMMIT_LOCAL_MODEL_STORAGE_KEY);
    const storedGlobalLocalModelId = this.context.globalState.get<string>(COMMIT_LOCAL_MODEL_STORAGE_KEY);
    const localModelId = resolveLocalModelId(storedLocalModelId || storedGlobalLocalModelId || (provider === 'local' ? storedModel : undefined));
    const configuredModel = getExplicitConfigurationValue<string>(config, 'model');
    const model = provider === 'local'
      ? resolveLocalModelId(storedModel || localModelId)
      : storedModel || configuredModel?.trim() || getDefaultModelForProvider(provider);
    const includeUnstaged = this.context.workspaceState.get<boolean>(
      COMMIT_INCLUDE_UNSTAGED_STORAGE_KEY,
      DEFAULT_INCLUDE_FLAGS.includeUnstaged
    );
    const includeUntracked = this.context.workspaceState.get<boolean>(
      COMMIT_INCLUDE_UNTRACKED_STORAGE_KEY,
      DEFAULT_INCLUDE_FLAGS.includeUntracked
    );
    const includeBinary = this.context.workspaceState.get<boolean>(
      COMMIT_INCLUDE_BINARY_STORAGE_KEY,
      DEFAULT_INCLUDE_FLAGS.includeBinary
    );
    const maxPromptChars = this.context.workspaceState.get<number | null>(
      COMMIT_MAX_PROMPT_CHARS_STORAGE_KEY,
      DEFAULT_PROMPT_LIMIT.maxPromptChars
    );
    const configuredReasoning = config.get<string>('reasoningEffort', DEFAULT_REASONING_EFFORT);
    const storedReasoning = this.context.workspaceState.get<string>(COMMIT_REASONING_STORAGE_KEY);
    const reasoning = resolveReasoningSetting(storedReasoning, configuredReasoning);
    const configuredCodexReasoning = config.get<string>('codexReasoningEffort', DEFAULT_CODEX_REASONING_EFFORT);
    const storedCodexReasoning = this.context.workspaceState.get<string>(COMMIT_CODEX_REASONING_STORAGE_KEY);
    const codexReasoning = resolveCodexReasoningSetting(storedCodexReasoning, configuredCodexReasoning);
    const configuredVerbosity = config.get<string>('verbosity', DEFAULT_VERBOSITY);
    const storedVerbosity = this.context.workspaceState.get<string>(COMMIT_VERBOSITY_STORAGE_KEY);
    const verbosity = resolveVerbositySetting(storedVerbosity, configuredVerbosity);
    return {
      prompt,
      provider,
      model,
      customModel: model,
      includeUnstaged,
      includeUntracked,
      includeBinary,
      maxPromptChars,
      maxPromptMode: maxPromptChars ? 'limited' : DEFAULT_PROMPT_LIMIT.maxPromptMode,
      status: 'idle',
      reasoning,
      codexReasoning,
      verbosity,
      promptPresets: presets,
      activePromptPresetId: activeId,
      apiKeyProvider,
      language,
      localModelId,
      localModel: createDefaultLocalModelState(localModelId)
    };
  }

  private setLanguage(language: CommitState['language']): void {
    const previousDefaultPrompt = getDefaultCommitPrompt(this.state.language);
    const hasCustomPrompt = Boolean(this.state.prompt && this.state.prompt !== previousDefaultPrompt);
    this.state.language = language;
    const defaults = getDefaultPromptPresets(language);
    this.state.promptPresets = normalizePresets(this.state.promptPresets, defaults);
    this.state.activePromptPresetId = resolveActivePresetId(this.state.promptPresets, this.state.activePromptPresetId, defaults);
    // 利用者の指示を維持し、既定の指示だけを新しい言語へ切り替える。
    if (!hasCustomPrompt) {
      this.state.prompt = getDefaultCommitPrompt(language);
    }
    void this.context.globalState.update(COMMIT_LANGUAGE_STORAGE_KEY, language);
    this.panel.updateState(toPanelState(this.state));
  }

  private getDefaultPresets(): PromptPreset[] {
    return getDefaultPromptPresets(this.state.language || DEFAULT_LANGUAGE);
  }

  private setProvider(provider: ProviderId): void {
    if (provider !== this.state.provider && this.currentAbortController) {
      void this.cancelCurrent();
    }
    this.state.provider = provider;
    this.state.apiKeyProvider = provider;
    const fallbackModel = provider === 'local'
      ? resolveLocalModelId(this.state.localModelId || DEFAULT_LOCAL_MODEL_ID)
      : getDefaultModelForProvider(provider);
    // クラウドは既定モデル、Local は直前に選んだモデルを使用する。
    this.setModel(fallbackModel, true);

    void this.context.workspaceState.update(COMMIT_PROVIDER_STORAGE_KEY, provider);
    void this.context.globalState.update(COMMIT_API_KEY_PROVIDER_STORAGE_KEY, provider);
    this.panel.updateState(toPanelState(this.state));
  }

  private setModel(model: string, isCustom = false): void {
    const nextModel = this.state.provider === 'local' ? resolveLocalModelId(model) : model;
    if (this.state.provider === 'local' && this.isLocalModelBusy() && nextModel !== this.state.localModelId) {
      this.panel.updateState(toPanelState(this.state));
      return;
    }
    if (nextModel !== this.state.model && this.currentAbortController) {
      void this.cancelCurrent();
    }
    this.state.model = nextModel;
    if (this.state.provider === 'local') {
      this.state.localModelId = nextModel;
      this.state.customModel = nextModel;
      if (!this.isLocalModelBusy()) {
        this.state.localModel = createDefaultLocalModelState(nextModel);
        void this.refreshLocalModelState();
      }
      void this.context.workspaceState.update(COMMIT_LOCAL_MODEL_STORAGE_KEY, nextModel);
      void this.context.globalState.update(COMMIT_LOCAL_MODEL_STORAGE_KEY, nextModel);
    } else if (isCustom) {
      this.state.customModel = nextModel;
    }
    this.normalizeReasoningForModel();
    this.normalizeVerbosityForModel();
    void this.context.workspaceState.update(COMMIT_MODEL_STORAGE_KEY, nextModel);
    this.panel.updateState({
      commitModel: this.state.model,
      commitCustomModel: this.state.customModel,
      localModel: this.state.localModel,
      commitReasoning: this.state.reasoning,
      commitVerbosity: this.state.verbosity
    });
  }

  private normalizeReasoningForModel(): void {
    const allowed = getAllowedReasoningOptions(this.state.model);
    if (!allowed || allowed.length === 0) {
      return;
    }
    const current = this.state.reasoning;
    if (!current || !allowed.includes(current)) {
      const next = getDefaultReasoningForModel(this.state.model) ?? allowed[0];
      this.state.reasoning = next;
      void this.context.workspaceState.update(COMMIT_REASONING_STORAGE_KEY, next);
    }
  }

  private normalizeVerbosityForModel(): void {
    const allowed = getAllowedVerbosityOptions(this.state.model);
    if (!allowed || allowed.length === 0) {
      return;
    }
    const current = this.state.verbosity;
    if (!current || !allowed.includes(current)) {
      const next = getDefaultVerbosityForModel(this.state.model) ?? allowed[0];
      this.state.verbosity = next;
      void this.context.workspaceState.update(COMMIT_VERBOSITY_STORAGE_KEY, next);
    }
  }

  /** Local の旧 ID を移行し、クラウドでは保存済みのカスタムモデルも維持する。 */
  private normalizeModelForProvider(): void {
    const provider = this.state.provider || DEFAULT_PROVIDER;
    const currentModel = this.state.model;
    if (provider === 'local') {
      const localModelId = resolveLocalModelId(currentModel || this.state.localModelId);
      this.state.localModelId = localModelId;
      this.state.model = localModelId;
      this.state.customModel = localModelId;
      void this.context.workspaceState.update(COMMIT_LOCAL_MODEL_STORAGE_KEY, localModelId);
      void this.context.globalState.update(COMMIT_LOCAL_MODEL_STORAGE_KEY, localModelId);
      return;
    }
    if (!currentModel) {
      const fallback = getDefaultModelForProvider(provider);
      this.state.model = fallback;
      this.state.customModel = fallback;
    }
  }

  private async refreshLocalModelState(): Promise<void> {
    if (this.disposed || this.isLocalModelBusy()) return;
    const revision = ++this.localModelRevision;
    const config = vscode.workspace.getConfiguration('commitMaker');
    const localModel = await inspectLocalModel(this.context, config, this.state.localModelId);
    if (!this.isCurrentLocalModelOperation(revision)) return;
    this.state.localModel = localModel;
    this.panel.updateState({ localModel });
  }

  private async setLocalModel(modelId: string): Promise<void> {
    if (this.isLocalModelBusy()) {
      this.panel.updateState(toPanelState(this.state));
      return;
    }
    const next = resolveLocalModelId(modelId);
    this.state.localModelId = next;
    void this.context.workspaceState.update(COMMIT_LOCAL_MODEL_STORAGE_KEY, next);
    void this.context.globalState.update(COMMIT_LOCAL_MODEL_STORAGE_KEY, next);
    if (this.state.provider === 'local') {
      this.state.model = next;
      this.state.customModel = next;
      void this.context.workspaceState.update(COMMIT_MODEL_STORAGE_KEY, next);
    }
    this.state.localModel = createDefaultLocalModelState(next);
    this.panel.updateState({
      localModel: this.state.localModel,
      commitModel: this.state.model,
      commitCustomModel: this.state.customModel
    });
    await this.refreshLocalModelState();
  }

  private async downloadLocalModel(): Promise<void> {
    if (this.disposed || this.isLocalModelBusy()) {
      return;
    }
    const config = vscode.workspace.getConfiguration('commitMaker');
    const controller = new AbortController();
    this.currentModelDownloadAbortController = controller;
    const revision = ++this.localModelRevision;
    const modelId = this.state.localModelId;
    let lastPanelUpdate = 0;
    try {
      const pending = await inspectLocalModel(this.context, config, modelId);
      controller.signal.throwIfAborted();
      if (!this.isCurrentLocalModelOperation(revision)) return;
      this.state.localModel = { ...pending, status: 'downloading', downloadedBytes: 0, error: undefined };
      this.panel.updateState({ localModel: this.state.localModel });

      const localModel = await downloadLocalModel(this.context, config, modelId, controller.signal, progress => {
        if (!this.isCurrentLocalModelOperation(revision)) return;
        const now = Date.now();
        const totalBytes = progress.totalBytes ?? this.state.localModel?.totalBytes;
        const isComplete = Boolean(totalBytes && progress.downloadedBytes >= totalBytes);
        if (!isComplete && now - lastPanelUpdate < 500) return;
        lastPanelUpdate = now;
        this.state.localModel = {
          ...this.state.localModel,
          status: 'downloading',
          downloadedBytes: progress.downloadedBytes,
          totalBytes
        };
        this.panel.updateState({ localModel: this.state.localModel });
      });
      this.state.localModel = { ...localModel, status: 'loading', error: undefined };
      this.panel.updateState({ localModel: this.state.localModel });
      const localModelDefinition = getLocalModelDefinition(config, modelId);
      await ensureLocalRuntime(this.context, this.context.extensionUri, config, {
        runtimeVersion: resolveLocalRuntimeVersion(localModelDefinition),
        abortSignal: controller.signal,
        logger: this.createLlmLogger(config)
      });
      controller.signal.throwIfAborted();
      if (!this.isCurrentLocalModelOperation(revision)) return;
      this.state.localModel = localModel;
      this.panel.updateState({ localModel });
      void vscode.window.showInformationMessage(this.strings.msgLocalModelDownloadComplete);
    } catch (error) {
      if (!this.isCurrentLocalModelOperation(revision)) return;
      const aborted = controller.signal.aborted;
      const detail = error instanceof Error ? error.message : String(error);
      const localModel = await inspectLocalModel(this.context, config, modelId);
      if (!this.isCurrentLocalModelOperation(revision)) return;
      this.state.localModel = {
        ...localModel,
        status: aborted ? localModel.status : 'error',
        error: aborted ? undefined : detail
      };
      this.panel.updateState({ localModel: this.state.localModel });
      if (aborted) {
        void vscode.window.showInformationMessage(this.strings.msgLocalModelDownloadCancelled);
      } else {
        void vscode.window.showErrorMessage(this.strings.msgLocalModelDownloadFailed.replace('{detail}', detail));
      }
    } finally {
      this.currentModelDownloadAbortController = undefined;
    }
  }

  private cancelLocalModelDownload(): void {
    this.currentModelDownloadAbortController?.abort();
  }

  private async deleteLocalModel(): Promise<void> {
    if (this.disposed || this.isLocalModelBusy()) return;
    const revision = ++this.localModelRevision;
    const config = vscode.workspace.getConfiguration('commitMaker');
    this.state.localModel = { ...this.state.localModel, status: 'loading' };
    this.panel.updateState({ localModel: this.state.localModel });
    stopLocalLlmRuntime();
    try {
      const localModel = await deleteLocalModel(this.context, config, this.state.localModelId);
      if (!this.isCurrentLocalModelOperation(revision)) return;
      this.state.localModel = localModel;
      this.panel.updateState({ localModel });
      void vscode.window.showInformationMessage(this.strings.msgLocalModelDeleted);
    } catch (error) {
      if (!this.isCurrentLocalModelOperation(revision)) return;
      const detail = error instanceof Error ? error.message : String(error);
      const localModel = await inspectLocalModel(this.context, config, this.state.localModelId);
      if (!this.isCurrentLocalModelOperation(revision)) return;
      this.state.localModel = { ...localModel, status: 'error', error: detail };
      this.panel.updateState({ localModel: this.state.localModel });
      void vscode.window.showErrorMessage(detail);
    }
  }

  private async testLocalModel(): Promise<void> {
    if (this.disposed || this.isLocalModelBusy()) return;
    const prev = this.state.localModel;
    if (!prev || prev.status !== 'ready') {
      void vscode.window.showErrorMessage(this.strings.msgLocalModelMissing);
      return;
    }
    const controller = new AbortController();
    const revision = ++this.localModelRevision;
    this.currentLocalTestAbortController = controller;
    this.state.localModel = { ...prev, status: 'loading' };
    this.panel.updateState({ localModel: this.state.localModel });
    try {
      const runtime = await this.getLocalRuntimeConfig(controller.signal, prev);
      await callLocalLlm({
        ...runtime,
        prompt: 'Return exactly: local model ready',
        abortSignal: controller.signal,
        maxOutputTokens: 64
      });
      if (controller.signal.aborted || !this.isCurrentLocalModelOperation(revision)) return;
      this.state.localModel = { ...prev, status: 'ready', error: undefined };
      this.panel.updateState({ localModel: this.state.localModel });
      void vscode.window.showInformationMessage(this.strings.localModelStatusReady);
    } catch (error) {
      if (controller.signal.aborted || !this.isCurrentLocalModelOperation(revision)) return;
      const detail = error instanceof Error ? error.message : String(error);
      this.state.localModel = { ...prev, status: 'error', error: detail };
      this.panel.updateState({ localModel: this.state.localModel });
      void vscode.window.showErrorMessage(this.strings.msgLocalServerStartFailed.replace('{detail}', detail));
    } finally {
      this.currentLocalTestAbortController = undefined;
    }
  }

  private isLocalModelBusy(): boolean {
    return Boolean(this.currentModelDownloadAbortController || this.currentLocalTestAbortController) ||
      this.state.localModel?.status === 'loading' ||
      (this.state.provider === 'local' && this.state.status === 'loading');
  }

  private isCurrentLocalModelOperation(revision: number): boolean {
    return !this.disposed && revision === this.localModelRevision;
  }

  /** 成功した生成の ID を返し、SCM 側が待機後にも所有権を確認できるようにする。 */
  private async generateCommitMessage(
    includeUnstaged: boolean,
    includeUntracked: boolean,
    includeBinary: boolean,
    progress?: (message: string) => void,
    repo?: GitRepository
  ): Promise<number | undefined> {
    if (this.disposed || (this.state.provider === 'local' && this.isLocalModelBusy())) return undefined;
    const state = { ...this.state };
    // この生成の設定と signal を保持し、後から始まる生成と混ぜない。
    const { generationId, abortSignal } = this.startGeneration();
    const report = (message: string): void => this.reportGenerationProgress(generationId, message, progress);
    try {
      const targetRepo = repo ?? (await this.getRepositoryOrThrow());
      if (!this.isCurrentGeneration(generationId)) return undefined;
      report(this.strings.msgCommitGenerateFetchingDiff);
      const diff = await this.prepareDiff(targetRepo, includeUnstaged, includeUntracked, includeBinary, state);
      if (!this.isCurrentGeneration(generationId)) return undefined;
      report(this.strings.msgCommitGenerateCallingLlm);
      const result = state.provider === 'local'
        ? await this.generateLocalCommitMessage(diff, state, abortSignal, report)
        : await this.callLlm(buildCommitPrompt(diff, state), state, abortSignal);
      if (!this.isCurrentGeneration(generationId)) return undefined;
      this.handleGenerationSuccess(result);
      return generationId;
    } catch (error) {
      if (!this.isCurrentGeneration(generationId)) return undefined;
      this.handleGenerationError(error);
      return undefined;
    } finally {
      await this.finishGeneration(generationId);
    }
  }

  private startGeneration(): { generationId: number; abortSignal: AbortSignal } {
    this.currentAbortController?.abort();
    const controller = new AbortController();
    this.currentAbortController = controller;
    const generationId = ++this.activeGenerationId;
    this.setStatus('loading', { result: undefined, lastError: undefined, progressMessage: undefined });
    return { generationId, abortSignal: controller.signal };
  }

  private async finishGeneration(generationId: number): Promise<void> {
    if (!this.isCurrentGeneration(generationId)) return;
    this.currentAbortController = undefined;
    await vscode.commands.executeCommand('setContext', 'commitMaker.commitGenerating', false);
  }

  private isCurrentGeneration(generationId: number): boolean {
    return generationId === this.activeGenerationId;
  }

  private handleGenerationSuccess(result: string): void {
    this.setStatus('ready', { result: result.trim(), lastError: undefined, progressMessage: undefined });
  }

  private handleGenerationError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.setStatus('error', { lastError: message, progressMessage: undefined });
    void vscode.window.showErrorMessage(`${this.strings.msgCommitGenerateFailedPrefix}${message}`);
  }

  private async prepareDiff(
    repo: GitRepository,
    includeUnstaged: boolean,
    includeUntracked: boolean,
    includeBinary: boolean,
    state: CommitState
  ): Promise<string> {
    const config = vscode.workspace.getConfiguration('commitMaker');
    const maxCollectedChars = getUserConfigurationValue<number>(
      config,
      'diffCollectionLimitChars',
      DEFAULT_DIFF_COLLECTION_LIMIT_CHARS
    );
    let diff = await collectDiff(repo, {
      includeUnstaged,
      includeUntracked,
      includeBinary,
      maxCollectedChars,
      logger: this.output
    });
    diff = applyPromptLimit(diff, state.maxPromptMode ?? 'unlimited', state.maxPromptChars);
    if (!diff.trim()) {
      throw new Error(this.strings.msgDiffEmpty);
    }
    return diff;
  }

  private async applyCommitMessage(repo?: GitRepository): Promise<void> {
    const result = this.state.result;
    if (!result) {
      void vscode.window.showInformationMessage(this.strings.msgCommitNotGenerated);
      return;
    }
    const targetRepo = repo ?? (await this.getRepository());
    if (!targetRepo) {
      void vscode.window.showErrorMessage(this.strings.msgRepoNotFound);
      return;
    }
    targetRepo.inputBox.value = result;
    void vscode.window.showInformationMessage(this.strings.msgCommitApplySuccess);
  }

  private async savePromptPreset(title: string, body: string): Promise<void> {
    const name = title.trim();
    const content = body;
    if (!name || !content) return;
    const { presets, activeId, prompt, action } = upsertPreset(
      this.state.promptPresets,
      this.state.activePromptPresetId,
      name,
      content,
      this.getDefaultPresets()
    );
    await this.syncPromptPresets(presets, activeId, prompt, {
      toast: this.strings.toastSaved
        .replace('{action}', action === 'created' ? this.strings.actionCreatedLabel : this.strings.actionUpdatedLabel)
        .replace('{timestamp}', this.formatTimestamp())
    });
  }

  private async applyPromptPreset(id: string): Promise<void> {
    const next = applyPresetById(this.state.promptPresets, id, this.getDefaultPresets());
    if (!next) return;
    await this.syncPromptPresets(next.presets, next.activeId, next.prompt);
  }

  private async deletePromptPreset(id: string): Promise<void> {
    const next = deletePresetById(this.state.promptPresets, id, this.getDefaultPresets());
    if (!next) return;
    await this.syncPromptPresets(next.presets, next.activeId, next.prompt, {
      toast: this.strings.toastDeleted.replace('{timestamp}', this.formatTimestamp())
    });
  }

  private async generateAndApplyFromCommand(scmArg?: unknown): Promise<void> {
    const repo = await this.getRepositoryFromScmArg(scmArg);
    if (!repo) {
      void vscode.window.showErrorMessage(this.strings.msgRepoNotFound);
      return;
    }
    await this.runWithScmProgress(this.strings.msgCommitGenerateTitle, this.state.provider === 'local', async report => {
      const generationId = await this.generateCommitMessage(
        this.state.includeUnstaged,
        this.state.includeUntracked,
        this.state.includeBinary,
        report,
        repo
      );
      if (generationId === undefined || !this.isCurrentGeneration(generationId)) {
        // 完了処理の待機中に中止・置換された生成も、SCM へ反映しない。
        return;
      }
      report(this.strings.msgCommitApplyProgress);
      await this.applyCommitMessage(repo);
    }).catch(error => {
      this.handleGenerationError(error);
    });
  }

  private async runWithScmProgress<T>(
    title: string,
    showNotification: boolean,
    work: (report: (message: string) => void) => Promise<T>
  ): Promise<T> {
    const location = showNotification ? vscode.ProgressLocation.Notification : vscode.ProgressLocation.SourceControl;
    return vscode.window.withProgress({ location, title, cancellable: true }, async (progress, token) => {
      const previousGenerationId = this.activeGenerationId;
      const pending = work(message => progress.report({ message }));
      // 開始直後の ID を固定し、この進捗から別の生成を中止しない。
      const generationId = this.activeGenerationId !== previousGenerationId ? this.activeGenerationId : undefined;
      const cancellation = token.onCancellationRequested(() => {
        if (generationId === undefined || !this.isCurrentGeneration(generationId)) return;
        void this.cancelCurrent(this.strings.msgCancelled);
      });
      try {
        return await pending;
      } finally {
        cancellation.dispose();
      }
    });
  }

  private async cancelCurrent(reason = this.strings.msgCancelled): Promise<void> {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
    this.activeGenerationId += 1;
    this.currentAbortController = undefined;
    this.setStatus('error', { lastError: reason, progressMessage: undefined });
    await vscode.commands.executeCommand('setContext', 'commitMaker.commitGenerating', false);
  }

  private setStatus(
    status: CommitState['status'],
    payload: { result?: string | undefined; lastError?: string | undefined; progressMessage?: string | undefined }
  ): void {
    this.state.status = status;
    if ('result' in payload) this.state.result = payload.result;
    if ('lastError' in payload) this.state.lastError = payload.lastError;
    if ('progressMessage' in payload) this.state.progressMessage = payload.progressMessage;
    this.panel.updateState({ ...withStatus(this.state, status), commitResult: this.state.result });
    void vscode.commands.executeCommand('setContext', 'commitMaker.commitGenerating', status === 'loading');
  }

  private reportGenerationProgress(generationId: number, message: string, progress?: (message: string) => void): void {
    if (!this.isCurrentGeneration(generationId)) return;
    progress?.(message);
    if (this.state.status !== 'loading') return;
    this.state.progressMessage = message;
    this.panel.updateState({ commitProgress: message });
  }

  private async generateLocalCommitMessage(
    diff: string, state: CommitState, abortSignal: AbortSignal, progress?: (message: string) => void
  ): Promise<string> {
    const config = vscode.workspace.getConfiguration('commitMaker');
    const maxOutputTokens = this.getConfiguredMaxOutputTokens(config, DEFAULT_LOCAL_MAX_OUTPUT_TOKENS);
    const promptLimit = getLocalPromptCharLimit(
      config.get<number>('localContextSize', DEFAULT_LOCAL_CONTEXT_SIZE),
      maxOutputTokens
    );
    const prompt = buildCommitPrompt(diff, state);
    const fastPromptLimit = Math.min(promptLimit, 12000);
    if (prompt.length <= fastPromptLimit) {
      return this.callLlm(prompt, state, abortSignal);
    }

    const promptOverhead = buildCommitPrompt('', state).length + 1000;
    const digestLimit = Math.max(8000, Math.min(16000, promptLimit - promptOverhead));
    progress?.(`Local digest · ${this.strings.msgCommitGenerateCallingLlm}`);
    const digest = buildLocalDiffDigest(diff, digestLimit);
    return this.callLlm(buildCommitPrompt(digest, state), state, abortSignal);
  }

  private showPromptToast(message: string): void {
    if (this.disposed) return;
    if (this.promptToastTimer) clearTimeout(this.promptToastTimer);
    this.state.promptToast = message;
    this.panel.updateState({ promptToast: message });
    this.promptToastTimer = setTimeout(() => {
      this.promptToastTimer = undefined;
      if (this.state.promptToast === message) {
        this.state.promptToast = undefined;
        this.panel.updateState({ promptToast: undefined });
      }
    }, 2600);
  }

  private formatTimestamp(): string {
    const locale = this.state.language || DEFAULT_LANGUAGE;
    return new Date().toLocaleString(locale, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private async callLlm(prompt: string, state: CommitState, abortSignal: AbortSignal): Promise<string> {
    const provider = state.provider;
    const config = vscode.workspace.getConfiguration('commitMaker');
    const { endpoint, model, apiKey, timeout, maxOutputTokens } = await this.getProviderRuntimeConfig(provider, state.model);
    const log = this.createLlmLogger(config);

    const cloudParams = { prompt, model, apiKey, endpoint, abortSignal, timeoutMs: timeout, logger: log };
    switch (provider) {
      case 'openai':
        return callOpenAi({
          ...cloudParams,
          maxOutputTokens,
          reasoning: state.reasoning || DEFAULT_REASONING_EFFORT,
          verbosity: state.verbosity || DEFAULT_VERBOSITY
        });
      case 'claude':
        return callClaude(cloudParams);
      case 'gemini':
        return callGemini(cloudParams);
      case 'codex':
        return callCodex({
          prompt,
          model,
          codexCommand: getCodexCommand(config),
          codexHome: await ensureCodexHome(this.context),
          reasoning: state.codexReasoning || DEFAULT_CODEX_REASONING_EFFORT,
          abortSignal,
          timeoutMs: timeout,
          logger: log
        });
      case 'local':
        return this.callLocalPrompt(prompt, maxOutputTokens, log, abortSignal, state.localModel);
    }
  }

  private async callLocalPrompt(
    prompt: string,
    maxOutputTokens: number,
    logger?: (message: string) => void,
    abortSignal = this.currentAbortController?.signal,
    modelSnapshot = this.state.localModel
  ): Promise<string> {
    const runtime = await this.getLocalRuntimeConfig(abortSignal, modelSnapshot);
    return callLocalLlm({
      ...runtime,
      prompt,
      abortSignal,
      maxOutputTokens,
      logger: logger ?? runtime.logger
    });
  }

  private async getProviderRuntimeConfig(
    provider: ProviderId,
    selectedModel: string
  ): Promise<{ endpoint: string; model: string; apiKey: string; timeout: number; maxOutputTokens: number }> {
    const config = vscode.workspace.getConfiguration('commitMaker');
    const endpoint = getEndpoint(config, provider);
    const model = selectedModel.trim() || getDefaultModelForProvider(provider);
    if (provider === 'local' || provider === 'codex') {
      const timeout = config.get<number>('requestTimeoutMs', 300000);
      const maxOutputTokens = this.getConfiguredMaxOutputTokens(config, DEFAULT_LOCAL_MAX_OUTPUT_TOKENS);
      return { endpoint, model, apiKey: '', timeout, maxOutputTokens };
    }
    const apiKeyName = getApiKeySecretName(config, provider);
    const envKey = getApiKeyEnvironmentNames(provider);
    const apiKey =
      (apiKeyName ? await this.context.secrets.get(apiKeyName) : undefined) ||
      envKey.map(name => process.env[name]).find(Boolean);
    if (!apiKey) {
      throw new Error(this.strings.msgApiKeyMissing.replace('{provider}', this.providerLabels[provider] || provider));
    }
    const timeout = config.get<number>('requestTimeoutMs', 300000);
    const maxOutputTokens = config.get<number>('maxOutputTokens', DEFAULT_MAX_OUTPUT_TOKENS);
    return { endpoint, model, apiKey, timeout, maxOutputTokens };
  }

  private getConfiguredMaxOutputTokens(config: vscode.WorkspaceConfiguration, fallback: number): number {
    const configured = getExplicitConfigurationValue<number>(config, 'maxOutputTokens');
    return typeof configured === 'number' && configured > 0 ? configured : fallback;
  }

  private async getLocalRuntimeConfig(
    abortSignal = this.currentAbortController?.signal,
    modelSnapshot = this.state.localModel
  ): Promise<Omit<LocalLlmCallParams, 'prompt' | 'abortSignal' | 'maxOutputTokens'>> {
    const config = vscode.workspace.getConfiguration('commitMaker');
    let localModel = modelSnapshot;
    if (!localModel || localModel.status !== 'ready' || !localModel.path) {
      localModel = await inspectLocalModel(this.context, config, modelSnapshot?.id || this.state.localModelId);
      abortSignal?.throwIfAborted();
      this.state.localModel = localModel;
      this.panel.updateState({ localModel });
    }
    if (!localModel.path || localModel.status !== 'ready') {
      throw new Error(this.strings.msgLocalModelMissing);
    }
    const localModelDefinition = getLocalModelDefinition(config, localModel.id);
    const logger = this.createLlmLogger(config);
    const runtimePath = await ensureLocalRuntime(this.context, this.context.extensionUri, config, {
      runtimeVersion: resolveLocalRuntimeVersion(localModelDefinition),
      abortSignal,
      logger
    });
    return {
      modelPath: localModel.path,
      extensionUri: this.context.extensionUri,
      runtimePath,
      timeoutMs: config.get<number>('requestTimeoutMs', 300000),
      contextSize: config.get<number>('localContextSize', DEFAULT_LOCAL_CONTEXT_SIZE),
      threads: config.get<number>('localThreads', 0),
      gpuLayers: config.get<number>('localGpuLayers', DEFAULT_LOCAL_GPU_LAYERS),
      keepAliveMs: config.get<number>('localKeepAliveMs', DEFAULT_LOCAL_KEEP_ALIVE_MS),
      generation: resolveLocalGenerationSettings(localModelDefinition),
      runtimeArgs: resolveLocalRuntimeArgs(localModelDefinition),
      logger
    };
  }

  private createLlmLogger(config: vscode.WorkspaceConfiguration): ((message: string) => void) | undefined {
    const logEnabled = config.get<boolean>('logLlm', false);
    return logEnabled ? (message: string): void => this.output.appendLine(message) : undefined;
  }

  private async syncPromptPresets(
    presets: PromptPreset[],
    activeId: string,
    prompt: string,
    options?: { toast?: string }
  ): Promise<void> {
    this.state.promptPresets = presets;
    this.state.activePromptPresetId = activeId;
    this.state.prompt = prompt;
    await this.context.globalState.update(COMMIT_PROMPT_STORAGE_KEY, prompt);
    await persistPromptPresets(this.context, presets, activeId);
    if (this.disposed) return;
    this.panel.updateState(toPanelState(this.state));
    if (options?.toast) {
      this.showPromptToast(options.toast);
    }
  }

  private async getRepositoryOrThrow(rootUri?: vscode.Uri): Promise<GitRepository> {
    const repo = await this.getRepository(rootUri);
    if (!repo) {
      throw new Error(this.strings.msgRepoNotFound);
    }
    return repo;
  }

  private async getRepository(rootUri?: vscode.Uri): Promise<GitRepository | undefined> {
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    if (!gitExtension) {
      return undefined;
    }
    const git = (gitExtension.isActive ? gitExtension.exports : await gitExtension.activate()) as
      | { getAPI?(version: number): GitApi }
      | undefined;
    const api = git?.getAPI?.(1) as GitApi | undefined;
    const repos = api?.repositories;
    if (!repos?.length) {
      return undefined;
    }

    if (rootUri?.fsPath) {
      const match = repos.find(repo => sameFsPath(repo.rootUri?.fsPath, rootUri.fsPath));
      return match;
    }

    const activeUri = vscode.window.activeTextEditor?.document.uri;
    if (activeUri?.fsPath) {
      const match = repos.find(repo => {
        const rel = path.relative(repo.rootUri.fsPath, activeUri.fsPath);
        return rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel);
      });
      if (match) {
        return match;
      }
    }

    return repos[0];
  }

  private async getRepositoryFromScmArg(scmArg?: unknown): Promise<GitRepository | undefined> {
    const rootUri = getRootUriFromScmArg(scmArg);
    return this.getRepository(rootUri);
  }

}

function getRootUriFromScmArg(arg: unknown): vscode.Uri | undefined {
  return findRootUri(arg, 0, new Set<object>());
}

function findRootUri(value: unknown, depth: number, seen: Set<object>): vscode.Uri | undefined {
  if (!value || typeof value !== 'object' || depth > 3) return undefined;
  if (isUriLike(value)) return value as vscode.Uri;
  if (seen.has(value)) return undefined;
  seen.add(value);

  const maybe = value as Record<string, unknown>;
  return (
    findRootUri(maybe.rootUri, depth + 1, seen) ??
    findRootUri(maybe.sourceControl, depth + 1, seen) ??
    findRootUri(maybe.provider, depth + 1, seen) ??
    findRootUri(maybe.repository, depth + 1, seen) ??
    findRootUri(maybe.resourceGroup, depth + 1, seen)
  );
}

function isUriLike(value: object): boolean {
  const maybe = value as { fsPath?: unknown; scheme?: unknown };
  return typeof maybe.fsPath === 'string' && typeof maybe.scheme === 'string';
}

function sameFsPath(left?: string, right?: string): boolean {
  if (!left || !right) return false;
  const normalizedLeft = path.resolve(left);
  const normalizedRight = path.resolve(right);
  return process.platform === 'win32'
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
}
