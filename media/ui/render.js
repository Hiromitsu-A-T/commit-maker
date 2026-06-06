const Dom = window.CommitMakerDom;
function renderStatus(els, state, strings) {
    if (!els.statusRow)
        return;
    const t = strings || {};
    const badges = [];
    const statusClass = state.commitStatus === 'ready' ? 'success' : state.commitStatus === 'error' ? 'danger' : '';
    const statusText = state.commitStatus === 'loading'
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
function renderApiKeyBadges(els, providerOptions, state, strings) {
    if (!els.apiKeyStatusRow)
        return;
    const t = strings || {};
    const activeProvider = state.apiKeyProvider || state.commitProvider;
    const badges = providerOptions.map(opt => {
        const setupMode = opt.setupMode || (opt.id === 'local' ? 'localModel' : opt.requiresApiKey === false ? 'codexAuth' : 'apiKey');
        if (setupMode === 'localModel') {
            const model = state.localModel || {};
            const status = getLocalModelStatus(model, t);
            return {
                text: opt.badge + ': ' + status.text,
                className: getProviderBadgeClass(opt.id, activeProvider, status.className)
            };
        }
        if (setupMode === 'codexAuth') {
            const ready = Boolean(state.apiKeys?.[opt.id]?.ready);
            return {
                text: opt.badge + ': ' + getCodexBadgeText(ready, t),
                className: getProviderBadgeClass(opt.id, activeProvider, ready ? 'success' : 'warn')
            };
        }
        const ready = Boolean(state.apiKeys?.[opt.id]?.ready);
        return {
            text: opt.badge + ': ' + (ready ? t.apiKeySaved : t.apiKeyNotSaved),
            className: getProviderBadgeClass(opt.id, activeProvider, ready ? 'success' : 'warn')
        };
    });
    Dom.updateBadges(els.apiKeyStatusRow, badges);
}
function getProviderBadgeClass(providerId, activeProvider, statusClass) {
    if (statusClass === 'success' || statusClass === 'danger') {
        return statusClass;
    }
    return providerId === activeProvider ? statusClass : undefined;
}
function getCodexBadgeText(ready, strings) {
    if (ready) {
        return strings.codexAuthReadyShort || strings.codexAuthReady || 'Codex signed in';
    }
    return strings.codexAuthMissingShort || strings.codexAuthMissing || 'Codex not signed in';
}
function getLocalModelStatus(model, strings) {
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
    return { text: strings.localModelStatusNotDownloaded || 'Not downloaded', className: 'warn' };
}
function renderReasoning(els, options, state, allow) {
    Dom.renderSelect(els.reasoning, options, state.commitReasoning);
    Dom.show(els.reasoningRow, allow, 'block');
    Dom.setDisabled(els.reasoning, !allow);
}
function renderVerbosity(els, options, state, allow) {
    Dom.renderSelect(els.verbosity, options, state.commitVerbosity);
    Dom.show(els.verbosityRow, allow, 'block');
    Dom.setDisabled(els.verbosity, !allow);
}
// expose for panel.js (no bundler)
// @ts-ignore
window.CommitMakerRender = { renderStatus, renderApiKeyBadges, renderReasoning, renderVerbosity };
