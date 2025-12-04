function bindPresetEvents(els, send) {
    if (els.prompt) {
        els.prompt.addEventListener('input', ev => {
            send({ type: 'commitPromptChanged', value: ev.target.value });
            updateButtons();
        });
    }
    if (els.presetName) {
        els.presetName.addEventListener('input', () => updateButtons());
    }
    if (els.promptPreset) {
        els.promptPreset.addEventListener('change', ev => {
            const value = ev.target.value;
            const preset = getPresets().find(p => p.id === value);
            if (!preset)
                return;
            setPromptFromPreset(preset);
            send({ type: 'applyPromptPreset', id: preset.id });
            updateButtons();
        });
    }
    if (els.presetAdd) {
        els.presetAdd.addEventListener('click', () => {
            const promptText = els.prompt?.value || '';
            const label = (els.presetName?.value || '').trim();
            if (!promptText.trim() || !label)
                return;
            send({ type: 'savePromptPreset', title: label, body: promptText });
            if (els.presetName)
                els.presetName.value = '';
        });
    }
    if (els.presetDelete) {
        els.presetDelete.addEventListener('click', () => {
            const value = els.promptPreset?.value;
            const bootstrap = window.CommitMakerBootstrap;
            const firstPresetId = bootstrap?.promptPresets?.[0]?.id;
            if (!value || value === firstPresetId)
                return;
            send({ type: 'deletePromptPreset', id: value });
        });
    }
    function updateButtons() {
        // no-op placeholder; panel.js keeps actual logic
    }
    function getPresets() {
        return window.CommitMakerPresets?.() || [];
    }
    function setPromptFromPreset(preset) {
        if (!preset)
            return;
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
}
// expose
// @ts-ignore
window.CommitMakerPresetEvents = { bindPresetEvents };
