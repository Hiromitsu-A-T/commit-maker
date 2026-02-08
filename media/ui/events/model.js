function bindModelEvents(els, send) {
    if (els.provider) {
        els.provider.addEventListener('change', ev => send({ type: 'commitProviderChanged', value: ev.target.value }));
    }
    if (els.model) {
        els.model.addEventListener('change', ev => {
            const value = String(ev.target.value || '').trim();
            if (value === '__custom__') {
                const custom = (els.customModel?.value || '').trim();
                send({ type: 'commitCustomModelChanged', value: custom });
            }
            else if (value) {
                send({ type: 'commitModelChanged', value });
            }
        });
    }
    if (els.customModel) {
        els.customModel.addEventListener('input', ev => {
            const value = String(ev.target.value || '').trim();
            if (!value)
                return;
            if (value.length > 128) {
                const trimmed = value.slice(0, 128);
                els.customModel.value = trimmed;
                send({ type: 'commitCustomModelChanged', value: trimmed });
            }
            else {
                send({ type: 'commitCustomModelChanged', value });
            }
        });
    }
}
// @ts-ignore
window.CommitMakerModelEvents = { bindModelEvents };
