import * as vscode from 'vscode';
import * as path from 'path';
import {
  COMMIT_INCLUDE_UNSTAGED_STORAGE_KEY,
  COMMIT_INCLUDE_UNTRACKED_STORAGE_KEY,
  COMMIT_INCLUDE_BINARY_STORAGE_KEY,
  COMMIT_MODEL_STORAGE_KEY,
  COMMIT_LOCAL_MODEL_STORAGE_KEY,
  COMMIT_MAX_PROMPT_CHARS_STORAGE_KEY,
  COMMIT_PROMPT_STORAGE_KEY,
  COMMIT_PROVIDER_STORAGE_KEY,
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_LOCAL_CONTEXT_SIZE,
  DEFAULT_LOCAL_GPU_LAYERS,
  DEFAULT_LOCAL_KEEP_ALIVE_MS,
  DEFAULT_LOCAL_MAX_OUTPUT_TOKENS,
  DEFAULT_LOCAL_MODEL_ID,
  DEFAULT_PROVIDER,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_VERBOSITY,
  MODEL_SUGGESTIONS_BY_PROVIDER,
  COMMIT_REASONING_STORAGE_KEY,
  COMMIT_VERBOSITY_STORAGE_KEY,
  getDefaultCommitPrompt,
  getDefaultPromptPresets,
  PROMPT_PRESETS_STORAGE_KEY,
  ACTIVE_PROMPT_PRESET_STORAGE_KEY,
  COMMIT_LANGUAGE_STORAGE_KEY
} from './constants';
import { CommitPanelProvider } from './panel';
import {
  ProviderId,
  ReasoningEffort,
  VerbositySetting,
  isProviderId,
  isReasoningEffort,
  isVerbositySetting,
  PromptPreset,
  isLanguageCode
} from './types';
import { collectDiff } from './services/diffCollector';
import { applyPromptLimit, buildLocalDiffDigest, getLocalPromptCharLimit } from './promptLimit';
import { callOpenAi } from './services/llm/openai';
import { callClaude } from './services/llm/claude';
import { callGemini } from './services/llm/gemini';
import { callLocalLlm, stopLocalLlmRuntime } from './services/llm/local';
import {
  deleteLocalModel,
  downloadLocalModel,
  createDefaultLocalModelState,
  inspectLocalModel,
  resolveLocalModelId
} from './services/localModel';
import { ensureLocalRuntime } from './services/localRuntime';
import {
  applyPresetById,
  deletePresetById,
  normalizePresets,
  resolveActivePresetId,
  upsertPreset
} from './promptPresets';
import { getApiKeySecretName, getEndpoint } from './providerSettings';
import { DEFAULT_INCLUDE_FLAGS, DEFAULT_PROMPT_LIMIT, getDefaultModelForProvider } from './defaults';
import { loadPromptPresetsFromStorage, persistPromptPresets } from './promptPresetStorage';
import { toPanelState, withStatus } from './panelSync';
import { CommitState } from './commitState';
import { DEFAULT_LANGUAGE, getStrings } from './i18n/strings';
import {
  getAllowedReasoningOptions,
  getDefaultReasoningForModel,
  getAllowedVerbosityOptions,
  getDefaultVerbosityForModel
} from './modelCapabilities';
import { buildProviderCapabilities } from './constants';

interface GitRepository {
  rootUri: vscode.Uri;
  inputBox: { value: string };
  diffWithHEAD?(uri?: vscode.Uri): Promise<string>;
  diffIndexWithHEAD?(uri?: vscode.Uri): Promise<string>;
}

interface GitApi {
  repositories: GitRepository[];
}

export class CommitController implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private state: CommitState;
  private currentAbortController: AbortController | undefined;
  private currentModelDownloadAbortController: AbortController | undefined;
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
    this.currentModelDownloadAbortController?.abort();
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
        if (isLanguageCode(value)) {
          const prevLang = this.state.language || DEFAULT_LANGUAGE;
          const prevDefaultPrompt = getDefaultCommitPrompt(prevLang);
          const keepPrompt = this.state.prompt && this.state.prompt !== prevDefaultPrompt;

          this.state.language = value;
          const defaults = getDefaultPromptPresets(value);
          this.state.promptPresets = normalizePresets(this.state.promptPresets, defaults);
          this.state.activePromptPresetId = resolveActivePresetId(
            this.state.promptPresets,
            this.state.activePromptPresetId,
            defaults
          );
          if (!keepPrompt) {
            this.state.prompt = getDefaultCommitPrompt(value);
          }
          void this.context.globalState.update(COMMIT_LANGUAGE_STORAGE_KEY, value);
          this.panel.updateState(toPanelState(this.state));
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
    const provider = this.context.workspaceState.get<ProviderId>(COMMIT_PROVIDER_STORAGE_KEY, DEFAULT_PROVIDER);
    const storedModel = this.context.workspaceState.get<string>(COMMIT_MODEL_STORAGE_KEY);
    const storedLocalModelId = this.context.workspaceState.get<string>(COMMIT_LOCAL_MODEL_STORAGE_KEY);
    const localModelId = resolveLocalModelId(storedLocalModelId || (provider === 'local' ? storedModel : undefined));
    const model = provider === 'local'
      ? resolveLocalModelId(storedModel || localModelId)
      : storedModel || getDefaultModelForProvider(provider);
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
    const reasoning = this.context.workspaceState.get<ReasoningEffort>(COMMIT_REASONING_STORAGE_KEY, DEFAULT_REASONING_EFFORT);
    const verbosity = this.context.workspaceState.get<VerbositySetting>(COMMIT_VERBOSITY_STORAGE_KEY, DEFAULT_VERBOSITY);
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
      verbosity,
      promptPresets: presets,
      activePromptPresetId: activeId,
      language,
      localModelId,
      localModel: createDefaultLocalModelState(localModelId)
    };
  }

  private getDefaultPresets(): PromptPreset[] {
    return getDefaultPromptPresets(this.state.language || DEFAULT_LANGUAGE);
  }

  private getDefaultPrompt(): string {
    return getDefaultCommitPrompt(this.state.language || DEFAULT_LANGUAGE);
  }

  private setProvider(provider: ProviderId): void {
    this.state.provider = provider;
    const fallbackModel = provider === 'local'
      ? resolveLocalModelId(this.state.localModelId || DEFAULT_LOCAL_MODEL_ID)
      : getDefaultModelForProvider(provider);
    // プロバイダーを切り替えたら常にそのプロバイダーのデフォルトモデルへリセットする
    this.setModel(fallbackModel, true);

    void this.context.workspaceState.update(COMMIT_PROVIDER_STORAGE_KEY, provider);
    this.panel.updateState(toPanelState(this.state));
  }

  private setModel(model: string, isCustom = false): void {
    const nextModel = this.state.provider === 'local' ? resolveLocalModelId(model) : model;
    this.state.model = nextModel;
    if (this.state.provider === 'local') {
      this.state.localModelId = nextModel;
      this.state.customModel = nextModel;
      this.state.localModel = createDefaultLocalModelState(nextModel);
      void this.context.workspaceState.update(COMMIT_LOCAL_MODEL_STORAGE_KEY, nextModel);
      void this.refreshLocalModelState();
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

  /** 現在のプロバイダーに存在しないモデルが保存されていた場合はデフォルトに戻す */
  private normalizeModelForProvider(): void {
    const provider = this.state.provider || DEFAULT_PROVIDER;
    const suggestions = MODEL_SUGGESTIONS_BY_PROVIDER[provider] || [];
    const currentModel = this.state.model;
    if (provider === 'local') {
      const localModelId = resolveLocalModelId(currentModel || this.state.localModelId);
      this.state.localModelId = localModelId;
      this.state.model = localModelId;
      this.state.customModel = localModelId;
      void this.context.workspaceState.update(COMMIT_LOCAL_MODEL_STORAGE_KEY, localModelId);
      return;
    }
    const currentCustom = this.state.customModel;
    const isUnknown = currentModel && !suggestions.includes(currentModel);
    const isCustom = currentModel && currentModel === currentCustom && !suggestions.includes(currentModel);
    if (!currentModel || isUnknown || isCustom) {
      const fallback = getDefaultModelForProvider(provider);
      this.state.model = fallback;
      this.state.customModel = fallback;
    }
  }

  private async refreshLocalModelState(): Promise<void> {
    const config = vscode.workspace.getConfiguration('commitMaker');
    const localModel = await inspectLocalModel(this.context, config, this.state.localModelId);
    this.state.localModel = localModel;
    this.panel.updateState({ localModel });
  }

  private async setLocalModel(modelId: string): Promise<void> {
    if (this.currentModelDownloadAbortController || this.state.localModel?.status === 'loading') {
      return;
    }
    const next = resolveLocalModelId(modelId);
    this.state.localModelId = next;
    void this.context.workspaceState.update(COMMIT_LOCAL_MODEL_STORAGE_KEY, next);
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
    if (this.currentModelDownloadAbortController) {
      return;
    }
    const config = vscode.workspace.getConfiguration('commitMaker');
    const controller = new AbortController();
    this.currentModelDownloadAbortController = controller;
    let lastPanelUpdate = 0;
    try {
      const pending = await inspectLocalModel(this.context, config, this.state.localModelId);
      this.state.localModel = { ...pending, status: 'downloading', downloadedBytes: 0, error: undefined };
      this.panel.updateState({ localModel: this.state.localModel });

      const localModel = await downloadLocalModel(this.context, config, this.state.localModelId, controller.signal, progress => {
        const now = Date.now();
        const totalBytes = progress.totalBytes ?? this.state.localModel?.totalBytes;
        const isComplete = Boolean(totalBytes && progress.downloadedBytes >= totalBytes);
        if (!isComplete && now - lastPanelUpdate < 500) return;
        lastPanelUpdate = now;
        this.state.localModel = {
          ...this.state.localModel!,
          status: 'downloading',
          downloadedBytes: progress.downloadedBytes,
          totalBytes
        };
        this.panel.updateState({ localModel: this.state.localModel });
      });
      this.state.localModel = { ...localModel, status: 'loading', error: undefined };
      this.panel.updateState({ localModel: this.state.localModel });
      await ensureLocalRuntime(
        this.context,
        this.context.extensionUri,
        config,
        controller.signal,
        undefined,
        this.createLocalLogger(config)
      );
      this.state.localModel = localModel;
      this.panel.updateState({ localModel });
      void vscode.window.showInformationMessage(this.strings.msgLocalModelDownloadComplete);
    } catch (error) {
      const aborted = controller.signal.aborted;
      const detail = error instanceof Error ? error.message : String(error);
      const localModel = await inspectLocalModel(this.context, config, this.state.localModelId);
      this.state.localModel = {
        ...localModel,
        status: aborted ? 'notDownloaded' : 'error',
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
    this.cancelLocalModelDownload();
    const config = vscode.workspace.getConfiguration('commitMaker');
    stopLocalLlmRuntime();
    try {
      const localModel = await deleteLocalModel(this.context, config, this.state.localModelId);
      this.state.localModel = localModel;
      this.panel.updateState({ localModel });
      void vscode.window.showInformationMessage(this.strings.msgLocalModelDeleted);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const localModel = await inspectLocalModel(this.context, config, this.state.localModelId);
      this.state.localModel = { ...localModel, status: 'error', error: detail };
      this.panel.updateState({ localModel: this.state.localModel });
      void vscode.window.showErrorMessage(detail);
    }
  }

  private async testLocalModel(): Promise<void> {
    const prev = this.state.localModel;
    if (!prev || prev.status !== 'ready') {
      void vscode.window.showErrorMessage(this.strings.msgLocalModelMissing);
      return;
    }
    this.state.localModel = { ...prev, status: 'loading' };
    this.panel.updateState({ localModel: this.state.localModel });
    try {
      const runtime = await this.getLocalRuntimeConfig();
      await callLocalLlm({
        prompt: 'Return exactly: local model ready',
        modelPath: runtime.modelPath,
        extensionUri: this.context.extensionUri,
        runtimePath: runtime.runtimePath,
        timeoutMs: runtime.timeout,
        maxOutputTokens: 64,
        contextSize: runtime.contextSize,
        threads: runtime.threads,
        gpuLayers: runtime.gpuLayers,
        keepAliveMs: runtime.keepAliveMs,
        logger: runtime.logger
      });
      this.state.localModel = { ...prev, status: 'ready', error: undefined };
      this.panel.updateState({ localModel: this.state.localModel });
      void vscode.window.showInformationMessage(this.strings.localModelStatusReady);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.state.localModel = { ...prev, status: 'error', error: detail };
      this.panel.updateState({ localModel: this.state.localModel });
      void vscode.window.showErrorMessage(this.strings.msgLocalServerStartFailed.replace('{detail}', detail));
    }
  }

  private async generateCommitMessage(
    includeUnstaged: boolean,
    includeUntracked: boolean,
    includeBinary: boolean,
    progress?: (message: string) => void,
    repo?: GitRepository
  ): Promise<void> {
    this.startGeneration();
    const report = (message: string): void => this.reportGenerationProgress(message, progress);
    try {
      const targetRepo = repo ?? (await this.getRepositoryOrThrow());
      report(this.strings.msgCommitGenerateFetchingDiff);
      const diff = await this.prepareDiff(targetRepo, includeUnstaged, includeUntracked, includeBinary);
      report(this.strings.msgCommitGenerateCallingLlm);
      const result = this.state.provider === 'local'
        ? await this.generateLocalCommitMessage(diff, report)
        : await this.callLlm(this.buildPrompt(diff));
      this.handleGenerationSuccess(result);
    } catch (error) {
      this.handleGenerationError(error);
    } finally {
      await this.finishGeneration();
    }
  }

  private startGeneration(): void {
    this.currentAbortController = new AbortController();
    this.setStatus('loading', { result: undefined, lastError: undefined, progressMessage: undefined });
  }

  private async finishGeneration(): Promise<void> {
    this.currentAbortController = undefined;
    await vscode.commands.executeCommand('setContext', 'commitMaker.commitGenerating', false);
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
    includeBinary: boolean
  ): Promise<string> {
    let diff = await collectDiff(repo, {
      includeUnstaged,
      includeUntracked,
      includeBinary,
      logger: this.output
    });
    diff = applyPromptLimit(diff, this.state.maxPromptMode ?? 'unlimited', this.state.maxPromptChars);
    if (!diff.trim()) {
      throw new Error(this.strings.msgDiffEmpty);
    }
    return diff;
  }

  private async applyCommitMessage(repo?: GitRepository): Promise<void> {
    if (!this.state.result) {
      void vscode.window.showInformationMessage(this.strings.msgCommitNotGenerated);
      return;
    }
    const targetRepo = repo ?? (await this.getRepository());
    if (!targetRepo) {
      void vscode.window.showErrorMessage(this.strings.msgRepoNotFound);
      return;
    }
    targetRepo.inputBox.value = this.state.result;
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
      await this.generateCommitMessage(
        this.state.includeUnstaged,
        this.state.includeUntracked,
        this.state.includeBinary,
        report,
        repo
      );
      if (this.state.status === 'error') {
        // エラー時は apply を試さない（generate 側でメッセージ済み）
        return;
      }
      report(this.strings.msgCommitApplyProgress);
      await this.applyCommitMessage(repo);
    }).catch(error => {
      this.handleUnexpectedCommandError(error);
    });
  }

  private async runWithScmProgress<T>(
    title: string,
    showNotification: boolean,
    work: (report: (message: string) => void) => Promise<T>
  ): Promise<T> {
    const location = showNotification ? vscode.ProgressLocation.Notification : vscode.ProgressLocation.SourceControl;
    return vscode.window.withProgress({ location, title, cancellable: true }, async (progress, token) => {
      token.onCancellationRequested(() => {
        void this.cancelCurrent(this.strings.msgCancelled);
      });
      return await work(message => progress.report({ message }));
    });
  }

  private handleUnexpectedCommandError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.setStatus('error', { lastError: message, progressMessage: undefined });
    void vscode.window.showErrorMessage(`${this.strings.msgCommitGenerateFailedPrefix}${message}`);
  }

  private async cancelCurrent(reason = this.strings.msgCancelled): Promise<void> {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
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

  private reportGenerationProgress(message: string, progress?: (message: string) => void): void {
    progress?.(message);
    if (this.state.status !== 'loading') return;
    this.state.progressMessage = message;
    this.panel.updateState({ commitProgress: message });
  }

  private buildPrompt(diff: string): string {
    const guard = this.strings.promptGuard;
    const userInstructionLabel = this.strings.userInstructionLabel;
    const instruction = this.state.prompt || this.getDefaultPrompt();
    return `${guard}\n\n${userInstructionLabel}\n${instruction}\n\n${this.strings.diffHeading}\n${diff}`;
  }

  private async generateLocalCommitMessage(diff: string, progress?: (message: string) => void): Promise<string> {
    const config = vscode.workspace.getConfiguration('commitMaker');
    const maxOutputTokens = this.getConfiguredMaxOutputTokens(config, DEFAULT_LOCAL_MAX_OUTPUT_TOKENS);
    const promptLimit = getLocalPromptCharLimit(
      config.get<number>('localContextSize', DEFAULT_LOCAL_CONTEXT_SIZE),
      maxOutputTokens
    );
    const prompt = this.buildPrompt(diff);
    const fastPromptLimit = Math.min(promptLimit, 12000);
    if (prompt.length <= fastPromptLimit) {
      return this.callLlm(prompt);
    }

    const promptOverhead = this.buildPrompt('').length + 1000;
    const digestLimit = Math.max(8000, Math.min(16000, promptLimit - promptOverhead));
    progress?.(`Local digest · ${this.strings.msgCommitGenerateCallingLlm}`);
    const digest = buildLocalDiffDigest(diff, digestLimit);
    return this.callLlm(this.buildPrompt(digest));
  }

  private showPromptToast(message: string): void {
    this.state.promptToast = message;
    this.panel.updateState({ promptToast: message });
    setTimeout(() => {
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

  private async callLlm(prompt: string): Promise<string> {
    const provider = this.state.provider;
    const { endpoint, model, apiKey, timeout, maxOutputTokens } = await this.getProviderRuntimeConfig(provider);
    const abortSignal = this.currentAbortController?.signal;
    const logEnabled = vscode.workspace.getConfiguration('commitMaker').get<boolean>('logLlm', false);
    const log = logEnabled ? (message: string): void => this.output.appendLine(message) : undefined;

    const dispatcher: Record<ProviderId, () => Promise<string>> = {
      openai: () => {
        const reasoningEffort = this.state.reasoning || DEFAULT_REASONING_EFFORT;
        const verbosity = this.state.verbosity || DEFAULT_VERBOSITY;
        return callOpenAi({
          prompt,
          model,
          apiKey,
          endpoint,
          maxOutputTokens,
          reasoning: reasoningEffort,
          verbosity,
          abortSignal,
          timeoutMs: timeout,
          logger: log
        });
      },
      claude: () =>
        callClaude({
          prompt,
          model,
          apiKey,
          endpoint,
          abortSignal,
          timeoutMs: timeout,
          logger: log
        }),
      gemini: () =>
        callGemini({
          prompt,
          model,
          apiKey,
          endpoint,
          abortSignal,
          timeoutMs: timeout,
          logger: log
        }),
      local: async () => {
        return this.callLocalPrompt(prompt, maxOutputTokens, log);
      }
    };

    const fn = dispatcher[provider];
    if (!fn) {
      throw new Error(this.strings.msgUnsupportedProvider.replace('{provider}', this.providerLabels[provider] || provider));
    }
    return fn();
  }

  private async callLocalPrompt(
    prompt: string,
    maxOutputTokens: number,
    logger?: (message: string) => void
  ): Promise<string> {
    const runtime = await this.getLocalRuntimeConfig();
    return callLocalLlm({
      prompt,
      modelPath: runtime.modelPath,
      extensionUri: this.context.extensionUri,
      runtimePath: runtime.runtimePath,
      abortSignal: this.currentAbortController?.signal,
      timeoutMs: runtime.timeout,
      maxOutputTokens,
      contextSize: runtime.contextSize,
      threads: runtime.threads,
      gpuLayers: runtime.gpuLayers,
      keepAliveMs: runtime.keepAliveMs,
      logger: logger ?? runtime.logger
    });
  }

  private async getProviderRuntimeConfig(
    provider: ProviderId
  ): Promise<{ endpoint: string; model: string; apiKey: string; timeout: number; maxOutputTokens: number }> {
    const config = vscode.workspace.getConfiguration('commitMaker');
    const endpoint = getEndpoint(config, provider);
    const model = this.state.model?.trim() || getDefaultModelForProvider(provider);
    if (provider === 'local') {
      const timeout = config.get<number>('requestTimeoutMs', 300000);
      const maxOutputTokens = this.getConfiguredMaxOutputTokens(config, DEFAULT_LOCAL_MAX_OUTPUT_TOKENS);
      return { endpoint, model, apiKey: '', timeout, maxOutputTokens };
    }
    const apiKeyName = getApiKeySecretName(config, provider);
    const envKey = getEnvVarName(provider);
    const apiKey =
      (apiKeyName ? await this.context.secrets.get(apiKeyName) : undefined) ||
      (envKey ? envKey.map(name => process.env[name]).find(Boolean) : undefined);
    if (!apiKey) {
      throw new Error(this.strings.msgApiKeyMissing.replace('{provider}', this.providerLabels[provider] || provider));
    }
    const timeout = config.get<number>('requestTimeoutMs', 300000);
    const maxOutputTokens = config.get<number>('maxOutputTokens', DEFAULT_MAX_OUTPUT_TOKENS);
    return { endpoint, model, apiKey, timeout, maxOutputTokens };
  }

  private getConfiguredMaxOutputTokens(config: vscode.WorkspaceConfiguration, fallback: number): number {
    const inspected = config.inspect<number>('maxOutputTokens') as any;
    const configured = (
      inspected?.workspaceFolderLanguageValue ??
      inspected?.workspaceLanguageValue ??
      inspected?.globalLanguageValue ??
      inspected?.workspaceFolderValue ??
      inspected?.workspaceValue ??
      inspected?.globalValue
    );
    return typeof configured === 'number' && configured > 0 ? configured : fallback;
  }

  private async getLocalRuntimeConfig(): Promise<{
    modelPath: string;
    runtimePath: string;
    timeout: number;
    contextSize: number;
    threads: number;
    gpuLayers: number;
    keepAliveMs: number;
    logger?: (message: string) => void;
  }> {
    const config = vscode.workspace.getConfiguration('commitMaker');
    let localModel = this.state.localModel;
    if (!localModel || localModel.status !== 'ready' || !localModel.path) {
      localModel = await inspectLocalModel(this.context, config, this.state.localModelId);
      this.state.localModel = localModel;
      this.panel.updateState({ localModel });
    }
    if (!localModel.path || localModel.status !== 'ready') {
      throw new Error(this.strings.msgLocalModelMissing);
    }
    const logger = this.createLocalLogger(config);
    const runtimePath = await ensureLocalRuntime(
      this.context,
      this.context.extensionUri,
      config,
      this.currentAbortController?.signal,
      undefined,
      logger
    );
    return {
      modelPath: localModel.path,
      runtimePath,
      timeout: config.get<number>('requestTimeoutMs', 300000),
      contextSize: config.get<number>('localContextSize', DEFAULT_LOCAL_CONTEXT_SIZE),
      threads: config.get<number>('localThreads', 0),
      gpuLayers: config.get<number>('localGpuLayers', DEFAULT_LOCAL_GPU_LAYERS),
      keepAliveMs: config.get<number>('localKeepAliveMs', DEFAULT_LOCAL_KEEP_ALIVE_MS),
      logger
    };
  }

  private createLocalLogger(config: vscode.WorkspaceConfiguration): ((message: string) => void) | undefined {
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
        return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
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

function getEnvVarName(provider: ProviderId): string[] {
  if (provider === 'openai') return ['COMMIT_MAKER_OPENAI_API_KEY', 'OPENAI_API_KEY', 'openai_api_key'];
  if (provider === 'gemini') return ['COMMIT_MAKER_GEMINI_API_KEY', 'GOOGLE_API_KEY', 'google_api_key'];
  if (provider === 'claude') return ['COMMIT_MAKER_CLAUDE_API_KEY', 'ANTHROPIC_API_KEY', 'anthropic_api_key'];
  return [];
}
