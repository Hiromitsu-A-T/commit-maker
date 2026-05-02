(function () {
  const bootstrap = window.CommitMakerBootstrap;
  if (!bootstrap) return;

  const Dom = window.CommitMakerDom;
  const Elements = window.CommitMakerElements;
  const Render = window.CommitMakerRender;
  const Events = window.CommitMakerEvents;
  const StateUtil = window.CommitMakerState;

  const vscode = acquireVsCodeApi();
  const providerOptions = bootstrap.providerOptions || [];
  const reasoningOptions = bootstrap.reasoningOptions || [];
  const reasoningOptionsByModel = bootstrap.reasoningOptionsByModel || {};
  const verbosityOptions = bootstrap.verbosityOptions || [];
  const verbosityOptionsByModel = bootstrap.verbosityOptionsByModel || {};
  const providerIssueUrls = bootstrap.providerIssueUrls || {};
  const providerSupportsReasoning = bootstrap.providerSupportsReasoning || {};
  const providerSupportsVerbosity = bootstrap.providerSupportsVerbosity || {};
  const verbosityBlocklistPatterns = bootstrap.verbosityBlocklistPatterns || [];
  const basePresets = Array.isArray(bootstrap.promptPresets) ? bootstrap.promptPresets : [];
  const defaultPreset = basePresets[0];
  let state = StateUtil.cloneState(bootstrap.defaultState);

  /** @type {Elements} */
  const els = queryElements();
  const send = msg => vscode.postMessage(msg);

  window.addEventListener('message', handleMessage);
  bindEvents();
  ready();

  function getStrings() {
    return state.strings || bootstrap.strings || {};
  }

  function ready() {
    send({ type: 'ready' });
    render();
  }

  function queryElements() {
    const get = id => document.getElementById(id);
    return {
      language: get('language'),
      apiKeySection: get('apiKeySection'),
      apiKeyCloudPanel: get('apiKeyCloudPanel'),
      apiKeyProvider: get('apiKeyProvider'),
      apiKeyInput: get('apiKeyInput'),
      apiKeyPreview: get('apiKeyPreview'),
      apiKeySave: get('apiKeySave'),
      apiKeyClear: get('apiKeyClear'),
      apiKeyIssue: get('apiKeyIssue'),
      apiKeyStatusRow: get('apiKeyStatusRow'),
      generate: get('generate'),
      apply: get('apply'),
      includeUnstaged: get('includeUnstaged'),
      includeUntracked: get('includeUntracked'),
      includeBinary: get('includeBinary'),
      maxPromptMode: get('maxPromptMode'),
      maxPromptValue: get('maxPromptValue'),
      prompt: get('prompt'),
      promptSaved: get('promptSaved'),
      promptPreset: get('promptPreset'),
      presetName: get('presetName'),
      presetAdd: get('presetAdd'),
      presetDelete: get('presetDelete'),
      provider: get('provider'),
      providerRow: get('providerRow'),
      providerHelp: get('providerHelp'),
      model: get('model'),
      modelGroup: get('modelGroup'),
      modelHelp: get('modelHelp'),
      customModelRow: get('customModelRow'),
      customModel: get('customModel'),
      localModelPanel: get('localModelPanel'),
      localModelName: get('localModelName'),
      localModelStatus: get('localModelStatus'),
      localModelDownload: get('localModelDownload'),
      localModelCancel: get('localModelCancel'),
      localModelDelete: get('localModelDelete'),
      localModelTest: get('localModelTest'),
      localModelHint: get('localModelHint'),
      reasoning: get('reasoning'),
      verbosity: get('verbosity'),
      reasoningRow: get('reasoningRow'),
      verbosityRow: get('verbosityRow'),
      statusRow: get('statusRow'),
      result: get('result'),
      errorSection: get('errorSection'),
      errorBox: get('errorBox')
    };
  }

  function renderSelect(selectEl, options, selected) {
    Dom.renderSelect(selectEl, options, selected);
  }

  function show(el, visible, display = 'block') {
    Dom.show(el, visible, display);
  }

  function setDisabled(el, disabled) {
    Dom.setDisabled(el, disabled);
  }

  function providerAllowsReasoning(provider) {
    return Boolean(providerSupportsReasoning?.[provider]);
  }

  function getAllowedReasoningOptions(modelId) {
    if (!modelId) return reasoningOptions;
    const key = modelId.toString().trim().toLowerCase();
    return reasoningOptionsByModel[key] || reasoningOptions;
  }

  function getCurrentModelId() {
    return state.commitModel || state.commitCustomModel || '';
  }

  function getAllowedVerbosityOptions(modelId) {
    if (!modelId) return verbosityOptions;
    const key = modelId.toString().trim().toLowerCase();
    return verbosityOptionsByModel[key] || verbosityOptions;
  }

  function isVerbosityBlocked(modelId) {
    const normalized = (modelId || '').toString().trim().toLowerCase();
    if (!normalized) return false;
    return verbosityBlocklistPatterns.some(pattern => {
      try {
        return new RegExp(pattern, 'i').test(normalized);
      } catch (e) {
        return false;
      }
    });
  }

  function providerAllowsVerbosity(provider, modelId) {
    return Boolean(providerSupportsVerbosity?.[provider]) && !isVerbosityBlocked(modelId);
  }

  function providerRequiresApiKey(provider) {
    const opt = providerOptions.find(item => item.id === provider);
    return opt ? opt.requiresApiKey !== false : true;
  }

  function getSelectableProviders() {
    return providerOptions;
  }

  function hasAnyProvider() {
    return getSelectableProviders().length > 0;
  }

  function isLocalProvider(provider) {
    return !providerRequiresApiKey(provider);
  }

  function isLocalModelReady() {
    return state.localModel?.status === 'ready';
  }

  function isProviderConfigured(provider) {
    return !providerRequiresApiKey(provider) || Boolean(state.apiKeys?.[provider]?.ready);
  }

  function handleMessage(event) {
    const msg = event.data;
    if (!msg || msg.type !== 'state' || typeof msg.state !== 'object') return;
    state = StateUtil.mergeState(state, sanitizeState(msg.state));
    render();
  }

  function sanitizeState(next) {
    const allowed = Array.isArray(bootstrap.allowedStateKeys) && bootstrap.allowedStateKeys.length
      ? bootstrap.allowedStateKeys
      : [
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
          'commitVerbosity',
          'localModel',
          'strings',
          'promptToast'
        ];
    const sanitized = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(next, key)) {
        sanitized[key] = next[key];
      }
    }
    return sanitized;
  }

  function bindEvents() {
    if (els.language) {
      Events.onChange(els.language, ev => {
        const value = String(ev.target.value || 'ja');
        send({ type: 'languageChanged', value });
        // 言語変更は静的文言を再レンダリングするためにリロード
        setTimeout(() => {
          window.location.reload();
        }, 10);
      });
    }
    Events.onInput(els.prompt, ev => {
      send({ type: 'commitPromptChanged', value: ev.target.value });
      updatePresetButtons();
    });
    Events.onInput(els.presetName, () => updatePresetButtons());
    if (els.promptPreset) {
      els.promptPreset.addEventListener('change', ev => {
        const value = ev.target.value;
        const preset = getPresets().find(p => p.id === value);
        if (!preset) return;
        setPromptFromPreset(preset);
        send({ type: 'applyPromptPreset', id: preset.id });
        updatePresetButtons();
      });
    }
    if (els.presetAdd) {
      els.presetAdd.addEventListener('click', () => {
        const promptText = els.prompt?.value || '';
        const label = (els.presetName?.value || '').trim();
        if (!promptText.trim() || !label) return;
        send({ type: 'savePromptPreset', title: label, body: promptText });
        if (els.presetName) els.presetName.value = '';
      });
    }
    if (els.presetDelete) {
      els.presetDelete.addEventListener('click', () => {
        const value = els.promptPreset?.value;
        if (!value || value === defaultPreset?.id) return;
        send({ type: 'deletePromptPreset', id: value });
      });
    }
    Events.bindSelectValue(els.apiKeyProvider, 'apiKeyProviderChanged', send);
    if (els.apiKeySave) {
      els.apiKeySave.addEventListener('click', () => {
        const value = els.apiKeyInput ? (els.apiKeyInput.value || '') : '';
        const provider = els.apiKeyProvider ? (els.apiKeyProvider.value || state.apiKeyProvider) : state.apiKeyProvider;
        if (value) {
          send({ type: 'submitApiKey', value, provider });
        }
      });
    }
    if (els.apiKeyIssue) {
      els.apiKeyIssue.addEventListener('click', () => {
        const provider = (els.apiKeyProvider?.value || state.apiKeyProvider || 'openai');
        const url = providerIssueUrls[provider] || providerIssueUrls.openai;
        send({ type: 'openExternal', url });
      });
    }
    if (els.apiKeyClear) {
      els.apiKeyClear.addEventListener('click', () => {
        const provider = els.apiKeyProvider ? (els.apiKeyProvider.value || state.apiKeyProvider) : state.apiKeyProvider;
        send({ type: 'submitApiKey', value: '', provider });
      });
    }
    Events.bindCheckbox(els.includeUnstaged, 'commitIncludeUnstagedChanged', send);
    Events.bindCheckbox(els.includeUntracked, 'commitIncludeUntrackedChanged', send);
    Events.bindCheckbox(els.includeBinary, 'commitIncludeBinaryChanged', send);
    if (els.maxPromptMode && els.maxPromptValue) {
      const handler = () => {
        const mode = els.maxPromptMode?.value === 'limited' ? 'limited' : 'unlimited';
        const raw = (els.maxPromptValue?.value || '').trim();
        const value = raw ? Number(raw) : null;
        if (els.maxPromptValue) {
          els.maxPromptValue.disabled = mode !== 'limited';
        }
        send({ type: 'commitMaxPromptChanged', value: { mode, value } });
      };
      els.maxPromptMode.addEventListener('change', handler);
      els.maxPromptValue.addEventListener('input', handler);
    }
    if (els.generate) {
      els.generate.addEventListener('click', () => {
        const includeUnstaged = Boolean(els.includeUnstaged?.checked ?? true);
        const includeUntracked = Boolean(els.includeUntracked?.checked ?? false);
        const includeBinary = Boolean(els.includeBinary?.checked ?? false);
        send({ type: 'commitGenerate', value: { includeUnstaged, includeUntracked, includeBinary } });
      });
    }
    if (els.apply) {
      els.apply.addEventListener('click', () => send({ type: 'commitApply' }));
    }
    Events.bindSelectValue(els.provider, 'commitProviderChanged', send);
    if (els.model) {
      els.model.addEventListener('change', ev => {
        const value = String(ev.target.value || '').trim();
        if (value === '__custom__') {
          const custom = (els.customModel?.value || state.commitCustomModel || state.commitModel || '').trim();
          send({ type: 'commitCustomModelChanged', value: custom });
        } else if (value) {
          send({ type: 'commitModelChanged', value });
        }
      });
    }
    if (els.customModel) {
      els.customModel.addEventListener('input', ev => {
        const value = String(ev.target.value || '').trim();
        if (!value) return;
        if (value.length > 128) {
          const trimmed = value.slice(0, 128);
          els.customModel.value = trimmed;
          send({ type: 'commitCustomModelChanged', value: trimmed });
        } else {
          send({ type: 'commitCustomModelChanged', value });
        }
      });
    }
    if (els.localModelDownload) {
      els.localModelDownload.addEventListener('click', () => send({ type: 'localModelDownload' }));
    }
    if (els.localModelCancel) {
      els.localModelCancel.addEventListener('click', () => send({ type: 'localModelCancelDownload' }));
    }
    if (els.localModelDelete) {
      els.localModelDelete.addEventListener('click', () => send({ type: 'localModelDelete' }));
    }
    if (els.localModelTest) {
      els.localModelTest.addEventListener('click', () => send({ type: 'localModelTest' }));
    }
    Events.onChange(els.reasoning, ev => {
      const value = String(ev.target.value);
      const allowed = getAllowedReasoningOptions(getCurrentModelId());
      if (allowed.includes(value)) {
        send({ type: 'commitReasoningChanged', value });
      }
    });
    Events.onChange(els.verbosity, ev => {
      const value = String(ev.target.value);
      const allowed = getAllowedVerbosityOptions(getCurrentModelId());
      if (allowed.includes(value)) {
        send({ type: 'commitVerbosityChanged', value });
      }
    });
  }

  function render() {
    renderLanguage();
    renderPromptText();
    renderApiKeySection();
    renderApiKeyBadges();
    renderPromptPresets();
    renderPromptSaved();
    renderIncludeFlags();
    renderPromptLimit();
    renderProviders();
    renderModels();
    renderLocalModel();
    renderReasoning();
    renderVerbosity();
    renderResult();
    renderError();
    renderBadges();
    renderButtonsState();
    updatePresetButtons();
  }

  function renderLanguage() {
    if (!els.language) return;
    const t = getStrings();
    const options =
      (Array.isArray(bootstrap.languageOptions) && bootstrap.languageOptions.length
        ? bootstrap.languageOptions
        : [{ code: 'ja', label: t.languageName || 'ja' }]);
    const value = state.language || bootstrap.defaultState?.language || options[0]?.code || 'ja';
    els.language.innerHTML = '';
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.code;
      option.textContent = opt.label || opt.code;
      option.selected = opt.code === value;
      els.language.appendChild(option);
    });
    els.language.value = value;
  }

  function renderPromptText() {
    if (!els.prompt) return;
    els.prompt.value = state.commitPrompt || '';
  }

  function renderIncludeFlags() {
    if (els.includeUnstaged) {
      els.includeUnstaged.checked = Boolean(state.commitIncludeUnstaged);
    }
    if (els.includeUntracked) {
      els.includeUntracked.checked = Boolean(state.commitIncludeUntracked);
    }
    if (els.includeBinary) {
      els.includeBinary.checked = Boolean(state.commitIncludeBinary);
    }
  }

  function renderPromptLimit() {
    if (els.maxPromptMode) {
      els.maxPromptMode.value = state.commitMaxPromptMode || 'unlimited';
    }
    if (els.maxPromptValue) {
      els.maxPromptValue.value = state.commitMaxPromptChars ? String(state.commitMaxPromptChars) : '';
      els.maxPromptValue.disabled = (state.commitMaxPromptMode || 'unlimited') !== 'limited';
    }
  }

  function renderButtonsState() {
    const localBlocked = isLocalProvider(state.commitProvider) && !isLocalModelReady();
    const cloudBlocked = providerRequiresApiKey(state.commitProvider) && !isProviderConfigured(state.commitProvider);
    if (els.generate) {
      els.generate.disabled = state.commitStatus === 'loading' || localBlocked || cloudBlocked;
    }
    if (els.apply) {
      els.apply.disabled = state.commitStatus === 'loading' || !state.commitResult;
    }
  }

  function getPresets() {
    return Array.isArray(state.promptPresets) && state.promptPresets.length ? state.promptPresets : basePresets;
  }

  function renderPromptPresets() {
    if (!els.promptPreset) return;
    const current = state.commitPrompt?.trim() || '';
    const prevSelection = els.promptPreset.value;
    const selectedId = state.activePromptPresetId || prevSelection;
    els.promptPreset.innerHTML = '';
    const allPresets = getPresets();
    let activePreset = allPresets.find(p => p.id === (state.activePromptPresetId || selectedId));
    for (const preset of allPresets) {
      const opt = document.createElement('option');
      opt.value = preset.id;
      opt.textContent = preset.label;
      opt.selected =
        (!!selectedId && opt.value === selectedId) ||
        (!selectedId && current === preset.prompt.trim()) ||
        (!selectedId && !current && preset.id === defaultPreset?.id);
      els.promptPreset.appendChild(opt);
      if (!activePreset && opt.selected) {
        activePreset = preset;
      }
    }
    if (els.presetName) {
      const target = activePreset || defaultPreset;
      els.presetName.value = target?.isDefault ? '' : (target?.label || '');
    }
    updatePresetButtons();
  }

  function getActivePreset() {
    const presets = getPresets();
    const selectedId = els.promptPreset?.value || state.activePromptPresetId;
    return presets.find(p => p.id === selectedId) || presets[0];
  }

  function updatePresetButtons() {
    if (!els.promptPreset || !els.presetDelete || !els.presetAdd) return;
    const t = getStrings();
    const preset = getActivePreset();
    const isDefault = preset?.isDefault;
    const body = (els.prompt?.value ?? '').trim();
    const nameInput = (els.presetName?.value ?? '').trim();
    const presetName = preset?.label ?? '';
    const bodyDirty = preset ? body !== (preset.prompt ?? '').trim() : Boolean(body);
    const nameDirty = isDefault ? Boolean(nameInput) : Boolean(nameInput && nameInput !== presetName);
    const dirty = bodyDirty || nameDirty;

    els.presetDelete.disabled = !preset || isDefault;

    if (isDefault || !preset) {
      els.presetAdd.textContent = t.presetButtonNew || '';
      els.presetAdd.title = t.presetTitleNew || '';
      els.presetAdd.disabled = !(nameInput && body);
    } else {
      if (!dirty) {
        els.presetAdd.textContent = t.presetButtonSaved || '';
        els.presetAdd.title = t.presetTitleNoChange || '';
        els.presetAdd.disabled = true;
      } else {
        els.presetAdd.textContent = t.presetButtonOverwrite || '';
        els.presetAdd.title = t.presetTitleOverwrite || '';
        els.presetAdd.disabled = false;
      }
    }
  }

  function renderApiKeySection() {
    show(els.apiKeySection, true, 'block');
    if (!els.apiKeyProvider) return;
    const t = getStrings();
    els.apiKeyProvider.innerHTML = '';
    const active = providerOptions.some(opt => opt.id === state.apiKeyProvider)
      ? state.apiKeyProvider
      : providerOptions[0]?.id;
    const isLocal = isLocalProvider(active);
    show(els.apiKeyCloudPanel, !isLocal, 'block');
    show(els.localModelPanel, isLocal, 'block');
    show(els.apiKeyIssue, !isLocal, 'inline-flex');
    for (const opt of providerOptions) {
      const node = document.createElement('option');
      node.value = opt.id;
      node.textContent = opt.badge + ' — ' + opt.label;
      node.selected = opt.id === active;
      els.apiKeyProvider.appendChild(node);
    }
    const selectedState = state.apiKeys?.[active];
    if (els.apiKeyPreview) {
      if (selectedState?.ready && selectedState.preview) {
        els.apiKeyPreview.textContent = (t.apiKeySavedPreviewPrefix || '') + selectedState.preview;
        els.apiKeyPreview.style.color = '#b4f5c1';
      } else {
        els.apiKeyPreview.textContent = t.apiKeyNotSaved || '';
        els.apiKeyPreview.style.color = '#b4b4b4';
      }
    }
    if (els.apiKeyInput) {
      if (selectedState?.ready) {
        const len = selectedState.length && selectedState.length > 0 ? selectedState.length : 8;
        els.apiKeyInput.value = '*'.repeat(len);
      } else {
        els.apiKeyInput.value = '';
      }
    }
  }

  function renderApiKeyBadges() {
    Render.renderApiKeyBadges(els, providerOptions, state, getStrings());
  }

  function renderProviders() {
    if (!els.provider) return;
    const t = getStrings();
    els.provider.innerHTML = '';
    const selectableProviders = getSelectableProviders();
    const hasProvider = hasAnyProvider();

    if (!hasProvider) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = t.providerNeedKey || '';
      placeholder.selected = true;
      placeholder.disabled = true;
      els.provider.appendChild(placeholder);
      if (els.providerHelp) {
        els.providerHelp.textContent = '';
      }
      return;
    }

    const active = selectableProviders.some(p => p.id === state.commitProvider)
      ? state.commitProvider
      : selectableProviders[0]?.id;
    if (active && state.commitProvider !== active) {
      state.commitProvider = active;
      send({ type: 'commitProviderChanged', value: active });
    }

    for (const opt of selectableProviders) {
      const node = document.createElement('option');
      node.value = opt.id;
      node.textContent = opt.badge + ' — ' + opt.label;
      node.selected = opt.id === active;
      els.provider.appendChild(node);
    }
    if (els.providerHelp) {
      els.providerHelp.textContent = '';
    }
  }

  function renderModels() {
    if (!els.model) return;
    const t = getStrings();
    els.model.innerHTML = '';
    const suggestions = state.commitModelSuggestions ?? [];
    const providerId = state.commitProvider || providerOptions[0]?.id;
    const hasProvider = Boolean(providerId) && getSelectableProviders().some(opt => opt.id === providerId);
    const providerConfigured = isProviderConfigured(providerId);
    const localProvider = isLocalProvider(providerId);

    if (!hasProvider || !providerConfigured) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = localProvider
        ? (t.localModelNeedDownload || '')
        : (t.providerNeedKey || '');
      placeholder.selected = true;
      placeholder.disabled = true;
      els.model.appendChild(placeholder);
      if (els.modelHelp) {
        els.modelHelp.textContent = localProvider
          ? (t.localModelNeedDownload || '')
          : (t.modelNeedKey || '');
      }
      show(els.customModelRow, false);
      show(els.reasoningRow, false);
      show(els.verbosityRow, false);
      return;
    }

    show(els.modelGroup, true, 'block');
    for (const model of suggestions) {
      const opt = document.createElement('option');
      opt.value = model;
      opt.textContent = model;
      opt.selected = model === state.commitModel;
      els.model.appendChild(opt);
    }
    let isCustom = false;
    if (!localProvider) {
      const customOpt = document.createElement('option');
      customOpt.value = '__custom__';
      customOpt.textContent = t.customModelOption || 'Custom…';
      customOpt.selected = !suggestions.includes(state.commitModel ?? '');
      els.model.appendChild(customOpt);
      isCustom = customOpt.selected;
    }
    show(els.customModelRow, isCustom, 'block');
    if (isCustom && els.customModel) {
      els.customModel.value = state.commitCustomModel || state.commitModel || '';
    }
    if (els.modelHelp) {
      els.modelHelp.textContent = '';
    }
  }

  function renderLocalModel() {
    const visible = isLocalProvider(state.apiKeyProvider);
    show(els.localModelPanel, visible, 'block');
    if (!visible) return;
    const t = getStrings();
    const model = state.localModel || {};
    const statusLabel = getLocalModelStatusLabel(model.status, t);
    if (els.localModelName) {
      els.localModelName.value = model.label || state.commitModel || '';
    }
    if (els.localModelStatus) {
      els.localModelStatus.textContent = statusLabel;
      els.localModelStatus.className = 'pill hint';
      if (model.status === 'ready') {
        els.localModelStatus.style.color = '#b4f5c1';
      } else if (model.status === 'error') {
        els.localModelStatus.style.color = '#ffd1d1';
      } else {
        els.localModelStatus.style.color = '#b4b4b4';
      }
    }
    if (els.localModelHint) {
      const downloaded = model.downloadedBytes || 0;
      const total = model.totalBytes || 0;
      const sizeText = model.sizeLabel || '-';
      if (model.status === 'downloading' && downloaded > 0) {
        const percent = total > 0 ? ' · ' + getDownloadPercent(downloaded, total) + '%' : '';
        els.localModelHint.textContent = (t.localModelSizePrefix || '') + formatBytes(downloaded) + ' / ' + (total ? formatBytes(total) : sizeText) + percent;
      } else if (model.status === 'notDownloaded') {
        els.localModelHint.textContent = (t.localModelSizePrefix || '') + sizeText + ' · ' + (t.localModelNeedDownload || '');
      } else if (model.error) {
        els.localModelHint.textContent = model.error;
      } else {
        els.localModelHint.textContent = (t.localModelSizePrefix || '') + sizeText;
      }
    }
    const downloading = model.status === 'downloading';
    const busy = downloading || model.status === 'loading';
    if (els.localModelDownload) {
      els.localModelDownload.textContent = getLocalModelDownloadButtonLabel(model, t);
      els.localModelDownload.disabled = busy || model.status === 'ready';
    }
    if (els.localModelCancel) els.localModelCancel.disabled = !downloading;
    if (els.localModelDelete) els.localModelDelete.disabled = busy || model.status !== 'ready';
    if (els.localModelTest) els.localModelTest.disabled = busy || model.status !== 'ready';
  }

  function getLocalModelDownloadButtonLabel(model, t) {
    if (model.status === 'loading') {
      return t.localModelStatusLoading || 'Loading';
    }
    if (model.status !== 'downloading') {
      return t.localModelDownloadButton || 'Download model';
    }
    const downloaded = model.downloadedBytes || 0;
    const total = model.totalBytes || 0;
    if (downloaded > 0 && total > 0) {
      return (t.localModelStatusDownloading || 'Downloading') + ' ' + getDownloadPercent(downloaded, total) + '%';
    }
    return (t.localModelStatusDownloading || 'Downloading') + '...';
  }

  function getDownloadPercent(downloaded, total) {
    if (!downloaded || !total || total <= 0) return 0;
    return Math.max(0, Math.min(100, Math.floor((downloaded / total) * 100)));
  }

  function getLocalModelStatusLabel(status, t) {
    if (status === 'downloading') return t.localModelStatusDownloading || 'Downloading';
    if (status === 'ready') return t.localModelStatusReady || 'Ready';
    if (status === 'loading') return t.localModelStatusLoading || 'Loading';
    if (status === 'error') return t.localModelStatusError || 'Error';
    return t.localModelStatusNotDownloaded || 'Not downloaded';
  }

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }
    return value.toFixed(index >= 3 ? 1 : 0) + ' ' + units[index];
  }

  function renderReasoning() {
    if (!els.reasoning) return;
    const allowed = getAllowedReasoningOptions(getCurrentModelId());
    const value = allowed.includes(state.commitReasoning) ? state.commitReasoning : allowed[0];
    renderSelect(els.reasoning, allowed, value);
    const visible = isProviderConfigured(state.commitProvider) && providerAllowsReasoning(state.commitProvider) && allowed.length > 0;
    show(els.reasoningRow, visible, 'block');
    setDisabled(els.reasoning, !visible);
  }

  function renderVerbosity() {
    if (!els.verbosity) return;
    const allowed = getAllowedVerbosityOptions(getCurrentModelId());
    const value = allowed.includes(state.commitVerbosity) ? state.commitVerbosity : allowed[0];
    renderSelect(els.verbosity, allowed, value);
    const visible = isProviderConfigured(state.commitProvider) && providerAllowsVerbosity(state.commitProvider, state.commitModel) && allowed.length > 0;
    show(els.verbosityRow, visible, 'block');
    setDisabled(els.verbosity, !visible);
  }

  function renderResult() {
    if (!els.result) return;
    const t = getStrings();
    els.result.textContent = state.commitResult || t.resultPlaceholder || '';
  }

  function renderError() {
    if (!els.errorSection || !els.errorBox) return;
    if (state.commitLastError) {
      els.errorSection.style.display = 'block';
      els.errorBox.textContent = state.commitLastError;
    } else {
      els.errorSection.style.display = 'none';
      els.errorBox.textContent = getStrings().errorPlaceholder || '-';
    }
  }

  function renderPromptSaved() {
    if (!els.promptSaved) return;
    if (state.promptToast) {
      const text = state.promptToast;
      els.promptSaved.textContent = text;
      els.promptSaved.style.visibility = 'visible';
      setTimeout(() => {
        if (els.promptSaved && els.promptSaved.textContent === text) {
          els.promptSaved.style.visibility = 'hidden';
          els.promptSaved.textContent = '';
        }
      }, 2500);
    } else {
      els.promptSaved.textContent = '';
      els.promptSaved.style.visibility = 'hidden';
    }
  }

  function renderBadges() {
    Render.renderStatus(els, state, getStrings());
  }

  function setPromptFromPreset(preset) {
    if (!preset) return;
    if (els.prompt) {
      els.prompt.value = preset.prompt;
    }
    send({ type: 'commitPromptChanged', value: preset.prompt });
    if (els.promptPreset) {
      els.promptPreset.value = preset.id;
    }
    if (els.presetName) {
      els.presetName.value = preset.isDefault ? '' : (preset.label || '');
    }
  }
})();
