type DomApi = {
  renderSelect: (el: HTMLSelectElement | null, options: string[], selected?: string) => void;
  show: (el: HTMLElement | null, visible: boolean, display?: string) => void;
  setDisabled: (el: HTMLElement | null, disabled: boolean) => void;
  updateBadges: (container: HTMLElement | null, badges: { text: string; className?: string }[]) => void;
};

const Dom = (window as any).CommitMakerDom as DomApi;

function renderStatus(els: any, state: any, strings: any): void {
  if (!els.statusRow) return;
  const t = strings || {};
  const badges = [] as { text: string; className?: string }[];
  const statusClass = state.commitStatus === 'ready' ? 'success' : state.commitStatus === 'error' ? 'danger' : '';
  const statusText =
    state.commitStatus === 'loading'
      ? t.statusLoading
      : state.commitStatus === 'ready'
        ? t.statusReady
        : state.commitStatus === 'error'
          ? t.statusError
          : t.statusIdle;
  badges.push({ text: statusText, className: statusClass });
  if (state.commitStatus === 'loading' && state.commitProgress) {
    badges.push({ text: state.commitProgress });
  }
  badges.push({ text: state.commitIncludeUnstaged ? t.badgeUnstagedOn : t.badgeUnstagedOff });
  badges.push({ text: (state.commitProvider || '-') + ' · ' + (state.commitModel || state.commitCustomModel || '-') });
  Dom.updateBadges(els.statusRow, badges);
}

function renderApiKeyBadges(els: any, providerOptions: any[], state: any, strings: any): void {
  if (!els.apiKeyStatusRow) return;
  const t = strings || {};
  const badges = providerOptions.map(opt => {
    if (opt.requiresApiKey === false) {
      const model = state.localModel || {};
      const status = getLocalModelStatus(model, t);
      return {
        text: opt.badge + ': ' + status.text,
        className: status.className
      };
    }
    const ready = Boolean(state.apiKeys?.[opt.id]?.ready);
    return {
      text: opt.badge + ': ' + (ready ? t.apiKeySaved : t.apiKeyNotSaved),
      className: ready ? 'success' : 'danger'
    };
  });
  Dom.updateBadges(els.apiKeyStatusRow, badges);
}

function getLocalModelStatus(model: any, strings: any): { text: string; className?: string } {
  const status = model?.status;
  if (status === 'ready') {
    return { text: strings.localModelStatusReady || 'Ready', className: 'success' };
  }
  if (status === 'downloading') {
    const downloaded = Number(model.downloadedBytes || 0);
    const total = Number(model.totalBytes || 0);
    const percent = downloaded > 0 && total > 0 ? ` ${Math.floor((downloaded / total) * 100)}%` : '';
    return { text: (strings.localModelStatusDownloading || 'Downloading') + percent, className: 'warn' };
  }
  if (status === 'loading') {
    return { text: strings.localModelStatusLoading || 'Loading', className: 'warn' };
  }
  if (status === 'error') {
    return { text: strings.localModelStatusError || 'Error', className: 'danger' };
  }
  return { text: strings.localModelStatusNotDownloaded || 'Not downloaded', className: 'danger' };
}

function renderReasoning(els: any, options: string[], state: any, allow: boolean): void {
  Dom.renderSelect(els.reasoning, options, state.commitReasoning);
  Dom.show(els.reasoningRow, allow, 'block');
  Dom.setDisabled(els.reasoning, !allow);
}

function renderVerbosity(els: any, options: string[], state: any, allow: boolean): void {
  Dom.renderSelect(els.verbosity, options, state.commitVerbosity);
  Dom.show(els.verbosityRow, allow, 'block');
  Dom.setDisabled(els.verbosity, !allow);
}

// expose for panel.js (no bundler)
// @ts-ignore
window.CommitMakerRender = { renderStatus, renderApiKeyBadges, renderReasoning, renderVerbosity };
