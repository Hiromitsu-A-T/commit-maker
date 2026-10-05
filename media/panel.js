(function () {
  const bootstrap = window.CommitMakerBootstrap;
  if (!bootstrap) return;

  const { renderSelect, show, setDisabled } = window.CommitMakerDom;
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
  const codexReasoningOptions = Array.isArray(bootstrap.codexReasoningOptions) ? bootstrap.codexReasoningOptions : ['low', 'medium', 'high', 'xhigh'];
  const localModelOptions = Array.isArray(bootstrap.localModelOptions) ? bootstrap.localModelOptions : [];
  const basePresets = Array.isArray(bootstrap.promptPresets) ? bootstrap.promptPresets : [];
  const defaultPreset = basePresets[0];
  const allowedStateKeys = Array.isArray(bootstrap.allowedStateKeys) ? bootstrap.allowedStateKeys : [];
  let state = StateUtil.cloneState(bootstrap.defaultState);

  let apiKeyInputProvider;
  let apiKeyInputDirty = false;
  let promptDraft;
  let presetNameDirty = false;
  let renderedPresetId;
  let customModelProvider;
  let customModelDraft;
  let promptToastTimer;
  let renderedPromptToast;
  const els = window.CommitMakerElements.queryElements();
  const send = msg => vscode.postMessage(msg);

  window.addEventListener('message', handleMessage);
  bindEvents();
  ready();

  function getStrings() {
    return state.strings || bootstrap.strings || {};
  }

  function ready() {
    render();
    document.body.classList.remove('app-pending');
    document.body.setAttribute('aria-busy', 'false');
    send({ type: 'ready' });
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

  function providerAllowsVerbosity(provider) {
    return Boolean(providerSupportsVerbosity?.[provider]);
  }

  function providerRequiresApiKey(provider) {
    return providerSetupMode(provider) === 'apiKey';
  }

  function providerSetupMode(provider) {
    const opt = providerOptions.find(item => item.id === provider);
    if (!opt) return 'apiKey';
    if (opt.setupMode) return opt.setupMode;
    if (opt.id === 'local') return 'localModel';
    return opt.requiresApiKey === false ? 'codexAuth' : 'apiKey';
  }

  function isLocalProvider(provider) {
    return providerSetupMode(provider) === 'localModel';
  }

  function isCodexProvider(provider) {
    return providerSetupMode(provider) === 'codexAuth';
  }

  function isLocalModelReady() {
    return state.localModel?.status === 'ready';
  }

  function isLocalModelBusy() {
    const status = state.localModel?.status;
    return status === 'downloading' || status === 'loading' ||
      (isLocalProvider(state.commitProvider) && state.commitStatus === 'loading');
  }

  function isProviderConfigured(provider) {
    if (isLocalProvider(provider)) return true;
    if (isCodexProvider(provider)) return Boolean(state.apiKeys?.[provider]?.ready);
    return !providerRequiresApiKey(provider) || Boolean(state.apiKeys?.[provider]?.ready);
  }

  function handleMessage(event) {
    const msg = event.data;
    if (!msg || msg.type !== 'state' || !msg.state || typeof msg.state !== 'object' || Array.isArray(msg.state)) return;
    const next = sanitizeState(msg.state);
    if (next.commitProvider && next.commitProvider !== state.commitProvider) {
      customModelProvider = undefined;
      customModelDraft = undefined;
    }
    // 非同期の host 更新が追い付くまで、入力途中の値を描画に使う。
    if (customModelDraft !== undefined) {
      if (next.commitCustomModel === customModelDraft) customModelDraft = undefined;
      else next.commitCustomModel = customModelDraft;
    }
    if (promptDraft !== undefined) {
      if (next.commitPrompt === promptDraft) promptDraft = undefined;
      else next.commitPrompt = promptDraft;
    }
    state = StateUtil.mergeState(state, next);
    render();
  }

  function sanitizeState(next) {
    // 許可するキーは host が一元管理する。渡されなければ更新を受け付けない。
    const sanitized = {};
    for (const key of allowedStateKeys) {
      if (Object.prototype.hasOwnProperty.call(next, key)) {
        sanitized[key] = next[key];
      }
    }
    return sanitized;
  }

  function bindEvents() {
    bindPromptEvents();
    bindApiKeyEvents();
    bindGenerationEvents();
    bindModelEvents();
    bindLocalModelEvents();
    bindCodexAuthEvents();
    bindReasoningEvents();
  }

  function bindPromptEvents() {
    if (els.language) {
      Events.onChange(els.language, ev => {
        const value = String(ev.target.value || 'ja');
        send({ type: 'languageChanged', value });
      });
    }
    Events.onInput(els.prompt, ev => {
      promptDraft = ev.target.value;
      send({ type: 'commitPromptChanged', value: promptDraft });
      updatePresetButtons();
    });
    Events.onInput(els.presetName, () => {
      presetNameDirty = true;
      updatePresetButtons();
    });
    if (els.promptPreset) {
      els.promptPreset.addEventListener('change', ev => {
        const value = ev.target.value;
        const preset = getPresets().find(p => p.id === value);
        if (!preset) return;
        promptDraft = undefined;
        presetNameDirty = false;
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
        presetNameDirty = false;
        send({ type: 'savePromptPreset', title: label, body: promptText });
        if (els.presetName) els.presetName.value = '';
      });
    }
    if (els.presetDelete) {
      els.presetDelete.addEventListener('click', () => {
        const value = els.promptPreset?.value;
        if (!value || value === defaultPreset?.id) return;
        promptDraft = undefined;
        presetNameDirty = false;
        send({ type: 'deletePromptPreset', id: value });
      });
    }
  }

  function bindApiKeyEvents() {
    Events.bindSelectValue(els.apiKeyProvider, 'apiKeyProviderChanged', send);
    Events.onInput(els.apiKeyInput, () => {
      apiKeyInputDirty = true;
      setDisabled(els.apiKeySave, !els.apiKeyInput.value);
    });
    if (els.apiKeySave) {
      els.apiKeySave.addEventListener('click', () => {
        const value = els.apiKeyInput ? (els.apiKeyInput.value || '') : '';
        const provider = els.apiKeyProvider ? (els.apiKeyProvider.value || state.apiKeyProvider) : state.apiKeyProvider;
        if (apiKeyInputDirty && value) {
          apiKeyInputDirty = false;
          setDisabled(els.apiKeySave, true);
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
        apiKeyInputDirty = false;
        send({ type: 'submitApiKey', value: '', provider });
      });
    }
  }

  function bindGenerationEvents() {
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
  }

  function bindModelEvents() {
    Events.bindSelectValue(els.provider, 'commitProviderChanged', send);
    if (els.model) {
      els.model.addEventListener('change', ev => {
        const value = String(ev.target.value || '').trim();
        if (value === '__custom__') {
          const custom = (state.commitCustomModel || state.commitModel || '').trim();
          customModelProvider = state.commitProvider;
          customModelDraft = custom;
          renderModels();
          send({ type: 'commitCustomModelChanged', value: custom });
        } else if (value) {
          customModelProvider = undefined;
          customModelDraft = undefined;
          send({ type: 'commitModelChanged', value });
        }
      });
    }
    if (els.customModel) {
      els.customModel.addEventListener('input', ev => {
        const value = String(ev.target.value || '').trim();
        customModelDraft = value.slice(0, 128);
        if (!value) return;
        if (value.length > 128) els.customModel.value = customModelDraft;
        send({ type: 'commitCustomModelChanged', value: customModelDraft });
      });
    }
  }

  function bindLocalModelEvents() {
    if (els.localModelDownload) {
      els.localModelDownload.addEventListener('click', () => send({ type: 'localModelDownload' }));
    }
    if (els.localModelName) {
      els.localModelName.addEventListener('change', ev => {
        const value = String(ev.target.value || '').trim();
        if (value) {
          renderLocalModelGuidance(value, getStrings());
          send({ type: 'localModelChanged', value });
        }
      });
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
  }

  function bindCodexAuthEvents() {
    if (els.codexAuthLogin) {
      els.codexAuthLogin.addEventListener('click', () => send({ type: 'codexLogin' }));
    }
    if (els.codexAuthRefresh) {
      els.codexAuthRefresh.addEventListener('click', () => send({ type: 'codexRefresh' }));
    }
    if (els.codexAuthLogout) {
      els.codexAuthLogout.addEventListener('click', () => send({ type: 'codexLogout' }));
    }
  }

  function bindReasoningEvents() {
    Events.onChange(els.reasoning, ev => {
      const value = String(ev.target.value);
      const codexProvider = isCodexProvider(state.commitProvider);
      const allowed = codexProvider ? codexReasoningOptions : getAllowedReasoningOptions(getCurrentModelId());
      if (allowed.includes(value)) {
        send({ type: codexProvider ? 'commitCodexReasoningChanged' : 'commitReasoningChanged', value });
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
    const codexBlocked = isCodexProvider(state.commitProvider) && !isProviderConfigured(state.commitProvider);
    const cloudBlocked = providerRequiresApiKey(state.commitProvider) && !isProviderConfigured(state.commitProvider);
    if (els.generate) {
      els.generate.disabled = state.commitStatus === 'loading' || localBlocked || codexBlocked || cloudBlocked;
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
      if (!presetNameDirty || renderedPresetId !== target?.id) {
        els.presetName.value = target?.isDefault ? '' : (target?.label || '');
        presetNameDirty = false;
      }
      renderedPresetId = target?.id;
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
    } else if (!dirty) {
      els.presetAdd.textContent = t.presetButtonSaved || '';
      els.presetAdd.title = t.presetTitleNoChange || '';
      els.presetAdd.disabled = true;
    } else {
      els.presetAdd.textContent = t.presetButtonOverwrite || '';
      els.presetAdd.title = t.presetTitleOverwrite || '';
      els.presetAdd.disabled = false;
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
    const isCodex = isCodexProvider(active);
    show(els.apiKeyCloudPanel, providerRequiresApiKey(active), 'block');
    show(els.localModelPanel, isLocal, 'block');
    show(els.codexAuthPanel, isCodex, 'block');
    show(els.apiKeyIssue, providerRequiresApiKey(active), 'inline-flex');
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
    // 伏せ字は表示専用。別の状態更新で入力途中のキーを消さない。
    if (apiKeyInputProvider !== active) {
      apiKeyInputProvider = active;
      apiKeyInputDirty = false;
    }
    setDisabled(els.apiKeySave, !apiKeyInputDirty || !els.apiKeyInput?.value);
    if (els.apiKeyInput && !apiKeyInputDirty) {
      if (selectedState?.ready) {
        const len = selectedState.length && selectedState.length > 0 ? selectedState.length : 8;
        els.apiKeyInput.value = '*'.repeat(len);
      } else {
        els.apiKeyInput.value = '';
      }
    }
    renderCodexAuth(selectedState, t);
  }

  function renderCodexAuth(selectedState, t) {
    if (els.codexAuthStatus) {
      els.codexAuthStatus.textContent = selectedState?.ready
        ? (t.codexAuthReady || 'Codex signed in')
        : (t.codexAuthMissing || 'Codex not signed in or not installed');
      els.codexAuthStatus.style.color = selectedState?.ready ? '#b4f5c1' : '#ffd1d1';
    }
    if (els.codexAuthHint) {
      const suffix = selectedState?.preview ? ' (' + selectedState.preview + ')' : '';
      els.codexAuthHint.textContent = (t.codexAuthHint || 'Uses Commit Maker dedicated Codex authentication.') + suffix;
    }
    if (els.codexAuthLogin) {
      els.codexAuthLogin.disabled = Boolean(selectedState?.ready);
    }
    if (els.codexAuthRefresh) {
      els.codexAuthRefresh.disabled = false;
    }
    if (els.codexAuthLogout) {
      els.codexAuthLogout.disabled = !selectedState?.ready;
    }
  }

  function renderApiKeyBadges() {
    Render.renderApiKeyBadges(els, providerOptions, state, getStrings());
  }

  function renderProviders() {
    if (!els.provider) return;
    const t = getStrings();
    els.provider.innerHTML = '';
    const selectableProviders = providerOptions;
    const hasProvider = (providerOptions.length > 0);

    if (!hasProvider) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = t.providerNeedKey || '';
      placeholder.selected = true;
      placeholder.disabled = true;
      els.provider.appendChild(placeholder);
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
  }

  function renderModels() {
    if (!els.model) return;
    const t = getStrings();
    els.model.innerHTML = '';
    const suggestions = state.commitModelSuggestions ?? [];
    const providerId = state.commitProvider || providerOptions[0]?.id;
    const hasProvider = Boolean(providerId) && providerOptions.some(opt => opt.id === providerId);
    const providerConfigured = isProviderConfigured(providerId);
    const localProvider = isLocalProvider(providerId);
    const codexProvider = isCodexProvider(providerId);

    setDisabled(els.model, localProvider && isLocalModelBusy());

    if (!hasProvider || !providerConfigured) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = localProvider
        ? (t.localModelNeedDownload || '')
        : codexProvider
          ? (t.codexAuthMissing || 'Codex not signed in or not installed')
        : (t.providerNeedKey || '');
      placeholder.selected = true;
      placeholder.disabled = true;
      els.model.appendChild(placeholder);
      show(els.customModelRow, false);
      return;
    }

    show(els.modelGroup, true, 'block');
    for (const model of suggestions) {
      const opt = document.createElement('option');
      opt.value = model;
      opt.textContent = localProvider ? getLocalModelLabel(model, t) : model;
      opt.selected = model === state.commitModel;
      els.model.appendChild(opt);
    }
    let isCustom = false;
    if (!localProvider) {
      const customOpt = document.createElement('option');
      customOpt.value = '__custom__';
      customOpt.textContent = t.customModelOption || 'Custom…';
      customOpt.selected = customModelProvider === providerId || !suggestions.includes(state.commitModel ?? '');
      els.model.appendChild(customOpt);
      isCustom = customOpt.selected;
    }
    show(els.customModelRow, isCustom, 'block');
    if (isCustom && els.customModel) {
      els.customModel.value = customModelDraft ?? (state.commitCustomModel || state.commitModel || '');
    }
  }

  function renderLocalModel() {
    const visible = isLocalProvider(state.apiKeyProvider);
    show(els.localModelPanel, visible, 'block');
    if (!visible) return;
    const t = getStrings();
    const model = state.localModel || {};
    const statusLabel = getLocalModelStatusLabel(model.status, t);
    const downloading = model.status === 'downloading';
    const busy = isLocalModelBusy();
    const selected = model.id || state.commitModel || localModelOptions[0]?.id || '';
    if (els.localModelName) {
      els.localModelName.innerHTML = '';
      for (const opt of localModelOptions) {
        const node = document.createElement('option');
        node.value = opt.id;
        node.textContent = getLocalModelOptionLabel(opt, t);
        node.selected = opt.id === selected;
        els.localModelName.appendChild(node);
      }
      els.localModelName.value = selected;
      els.localModelName.disabled = busy;
    }
    renderLocalModelGuidance(els.localModelName?.value || selected, t);
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
      } else if (model.status === 'notDownloaded' && model.hasPartialDownload && downloaded > 0) {
        els.localModelHint.textContent = (t.localModelSizePrefix || '') + formatBytes(downloaded) + ' / ' + (total ? formatBytes(total) : sizeText) + ' · ' + (t.localModelNeedDownload || '');
      } else if (model.status === 'notDownloaded') {
        els.localModelHint.textContent = (t.localModelSizePrefix || '') + sizeText + ' · ' + (t.localModelNeedDownload || '');
      } else if (model.error) {
        els.localModelHint.textContent = model.error;
      } else {
        els.localModelHint.textContent = (t.localModelSizePrefix || '') + sizeText;
      }
    }
    if (els.localModelDownload) {
      const downloadLabel = getLocalModelDownloadButtonLabel(model, t);
      els.localModelDownload.textContent = downloadLabel;
      els.localModelDownload.title = downloadLabel;
      els.localModelDownload.disabled = busy || model.status === 'ready';
    }
    if (els.localModelCancel) els.localModelCancel.disabled = !downloading;
    if (els.localModelDelete) els.localModelDelete.disabled = busy || (model.status !== 'ready' && !model.hasPartialDownload);
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

  function getLocalModelLabel(modelId, t) {
    const option = localModelOptions.find(item => item.id === modelId);
    return option ? getLocalModelOptionLabel(option, t) : modelId;
  }

  function getLocalModelOptionLabel(option, t) {
    const label = option?.label || option?.id || '';
    if (option?.uiProfile === 'recommended') {
      return label + ' — ' + (t.localModelRecommendedBadge || 'Recommended');
    }
    if (option?.uiProfile === 'lowMemory') {
      return label + ' — ' + (t.localModelLowMemoryBadge || 'Low memory');
    }
    return label;
  }

  function renderLocalModelGuidance(modelId, t) {
    const option = localModelOptions.find(item => item.id === modelId);
    const recommended = option?.uiProfile === 'recommended';
    const lowMemory = option?.uiProfile === 'lowMemory';
    const badgeText = recommended
      ? (t.localModelRecommendedBadge || 'Recommended')
      : lowMemory
        ? (t.localModelLowMemoryBadge || 'Low memory')
        : (option?.uiBadge || option?.label || modelId || '-');
    const description = recommended
      ? (t.localModelRecommendedHint || 'Recommended for the best balance of quality and local performance.')
      : lowMemory
        ? (t.localModelLowMemoryHint || 'Uses less memory, but accuracy may drop on long or complex diffs.')
        : (option?.label || modelId || '-');
    const sizeText = option?.sizeLabel || '-';
    const detailsText = option?.uiDetails || option?.label || modelId || '-';
    show(els.localModelGuidance, true, 'grid');
    if (els.localModelGuidanceBadge) {
      els.localModelGuidanceBadge.textContent = badgeText;
      els.localModelGuidanceBadge.title = badgeText;
      els.localModelGuidanceBadge.className = 'pill' + (recommended ? ' success' : lowMemory ? ' warn' : '');
    }
    if (els.localModelGuidanceSize) {
      els.localModelGuidanceSize.textContent = sizeText;
      els.localModelGuidanceSize.title = sizeText;
    }
    if (els.localModelGuidanceText) {
      els.localModelGuidanceText.textContent = description;
      els.localModelGuidanceText.title = description;
    }
    if (els.localModelGuidanceDetails) {
      els.localModelGuidanceDetails.textContent = detailsText;
      els.localModelGuidanceDetails.title = detailsText;
    }
    if (els.localModelGuidance) {
      els.localModelGuidance.setAttribute('aria-label', [badgeText, sizeText, description, detailsText].join(' · '));
    }
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
    const codexProvider = isCodexProvider(state.commitProvider);
    const allowed = codexProvider ? codexReasoningOptions : getAllowedReasoningOptions(getCurrentModelId());
    const enabled = isProviderConfigured(state.commitProvider) && providerAllowsReasoning(state.commitProvider) && allowed.length > 0;
    const current = codexProvider ? state.commitCodexReasoning : state.commitReasoning;
    const value = enabled && allowed.includes(current) ? current : allowed[0];
    renderSelect(els.reasoning, enabled ? allowed : ['-'], enabled ? value : '-');
    if (els.reasoningLabel) {
      const t = getStrings();
      els.reasoningLabel.textContent = codexProvider
        ? (t.codexReasoningLabel || 'Codex Reasoning Effort')
        : (t.reasoningLabel || 'Reasoning Effort');
    }
    show(els.reasoningRow, true, 'block');
    setDisabled(els.reasoning, !enabled);
  }

  function renderVerbosity() {
    if (!els.verbosity) return;
    const allowed = getAllowedVerbosityOptions(getCurrentModelId());
    const enabled = isProviderConfigured(state.commitProvider) && providerAllowsVerbosity(state.commitProvider) && allowed.length > 0;
    const value = enabled && allowed.includes(state.commitVerbosity) ? state.commitVerbosity : allowed[0];
    renderSelect(els.verbosity, enabled ? allowed : ['-'], enabled ? value : '-');
    show(els.verbosityRow, true, 'block');
    setDisabled(els.verbosity, !enabled);
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
    if (!els.promptSaved || renderedPromptToast === state.promptToast) return;
    renderedPromptToast = state.promptToast;
    if (promptToastTimer) clearTimeout(promptToastTimer);
    promptToastTimer = undefined;
    els.promptSaved.textContent = state.promptToast || '';
    els.promptSaved.style.visibility = state.promptToast ? 'visible' : 'hidden';
    if (!state.promptToast) return;
    // 再描画ごとにタイマーを増やさず、同じ通知は最初の表示から 2.5 秒で隠す。
    promptToastTimer = setTimeout(() => {
      promptToastTimer = undefined;
      els.promptSaved.style.visibility = 'hidden';
      els.promptSaved.textContent = '';
    }, 2500);
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
