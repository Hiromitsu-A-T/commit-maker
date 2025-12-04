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
  badges.push({ text: state.commitIncludeUnstaged ? t.badgeUnstagedOn : t.badgeUnstagedOff });
  badges.push({ text: (state.commitProvider || '-') + ' · ' + (state.commitModel || state.commitCustomModel || '-') });
  Dom.updateBadges(els.statusRow, badges);
}

function renderApiKeyBadges(els: any, providerOptions: any[], state: any, strings: any): void {
  if (!els.apiKeyStatusRow) return;
  const t = strings || {};
  const badges = providerOptions.map(opt => {
    const ready = Boolean(state.apiKeys?.[opt.id]?.ready);
    return {
      text: opt.badge + ': ' + (ready ? t.apiKeySaved : t.apiKeyNotSaved),
      className: ready ? '' : 'danger'
    };
  });
  Dom.updateBadges(els.apiKeyStatusRow, badges);
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
