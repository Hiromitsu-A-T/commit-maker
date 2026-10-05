const Dom = window.CommitMakerDom;

function renderStatus(els: PanelElements, state: PanelStateSnapshot, strings: Record<string, string>): void {
  if (!els.statusRow) return;
  const t = strings || {};
  const badges: { text: string; className?: string; title?: string }[] = [];
  const statusClass = state.commitStatus === 'ready' ? 'success' : state.commitStatus === 'error' ? 'danger' : '';
  const statusText =
    state.commitStatus === 'loading'
      ? t.statusLoading
      : state.commitStatus === 'ready'
        ? t.statusReady
        : state.commitStatus === 'error'
          ? t.statusError
          : t.statusIdle;
  const progressText = state.commitStatus === 'loading' && state.commitProgress
    ? ` · ${state.commitProgress}`
    : '';
  const primaryStatusText = statusText + progressText;
  badges.push({
    text: primaryStatusText,
    className: ['status-primary', statusClass].filter(Boolean).join(' '),
    title: primaryStatusText
  });
  badges.push({ text: state.commitIncludeUnstaged ? t.badgeUnstagedOn : t.badgeUnstagedOff });
  badges.push({ text: (state.commitProvider || '-') + ' · ' + (state.commitModel || state.commitCustomModel || '-') });
  Dom.updateBadges(els.statusRow, badges);
}

function renderApiKeyBadges(els: PanelElements, providerOptions: { id: string; badge: string; setupMode?: string; requiresApiKey: boolean }[], state: PanelStateSnapshot, strings: Record<string, string>): void {
  if (!els.apiKeyStatusRow) return;
  const t = strings || {};
  const activeProvider = state.apiKeyProvider || state.commitProvider;
  const badges = providerOptions.map(opt => {
    const setupMode = opt.setupMode || (opt.id === 'local' ? 'localModel' : opt.requiresApiKey === false ? 'codexAuth' : 'apiKey');
    if (setupMode === 'localModel') {
      const model = state.localModel;
      const status = getLocalModelStatus(model, t);
      const text = opt.badge + ': ' + status.text;
      return {
        text,
        title: text,
        className: getProviderBadgeClass(opt.id, activeProvider, status.className)
      };
    }
    if (setupMode === 'codexAuth') {
      const ready = Boolean(state.apiKeys?.[opt.id]?.ready);
      const text = opt.badge + ': ' + getCodexBadgeText(ready, t);
      return {
        text,
        title: text,
        className: getProviderBadgeClass(opt.id, activeProvider, ready ? 'success' : 'warn')
      };
    }
    const ready = Boolean(state.apiKeys?.[opt.id]?.ready);
    const text = opt.badge + ': ' + (ready ? t.apiKeySaved : t.apiKeyNotSaved);
    return {
      text,
      title: text,
      className: getProviderBadgeClass(opt.id, activeProvider, ready ? 'success' : 'warn')
    };
  });
  Dom.updateBadges(els.apiKeyStatusRow, badges);
}

function getProviderBadgeClass(
  providerId: string,
  activeProvider: string | undefined,
  statusClass: string | undefined
): string | undefined {
  if (statusClass === 'success' || statusClass === 'danger') {
    return statusClass;
  }
  return providerId === activeProvider ? statusClass : undefined;
}

function getCodexBadgeText(ready: boolean, strings: Record<string, string>): string {
  if (ready) {
    return strings.codexAuthReadyShort || strings.codexAuthReady || 'Codex signed in';
  }
  return strings.codexAuthMissingShort || strings.codexAuthMissing || 'Codex not signed in';
}

function getLocalModelStatus(model: PanelStateSnapshot['localModel'], strings: Record<string, string>): { text: string; className?: string } {
  const status = model?.status;
  if (status === 'ready') {
    return { text: strings.localModelStatusReady || 'Ready', className: 'success' };
  }
  if (status === 'downloading') {
    const downloaded = Number(model?.downloadedBytes || 0);
    const total = Number(model?.totalBytes || 0);
    const percent = downloaded > 0 && total > 0 ? ` ${Math.floor((downloaded / total) * 100)}%` : '';
    return { text: (strings.localModelStatusDownloading || 'Downloading') + percent, className: 'warn' };
  }
  if (status === 'loading') {
    return { text: strings.localModelStatusLoading || 'Loading', className: 'warn' };
  }
  if (status === 'error') {
    return { text: strings.localModelStatusError || 'Error', className: 'danger' };
  }
  return { text: strings.localModelStatusNotDownloaded || 'Not downloaded', className: 'warn' };
}

// panel.js から、読み込み後に描画処理を呼び出す。
window.CommitMakerRender = { renderStatus, renderApiKeyBadges };
