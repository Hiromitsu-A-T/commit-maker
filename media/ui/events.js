function onInput(el, handler) {
    if (el) {
        el.addEventListener('input', handler);
    }
}
function onChange(el, handler) {
    if (el) {
        el.addEventListener('change', handler);
    }
}
function bindCheckbox(el, messageType, send) {
    onChange(el, ev => send({ type: messageType, value: ev.target.checked }));
}
function bindSelectValue(el, messageType, send) {
    onChange(el, ev => send({ type: messageType, value: ev.target.value }));
}
// expose for panel.js (no bundler)
// @ts-ignore
window.CommitMakerEvents = {
    onInput,
    onChange,
    bindCheckbox,
    bindSelectValue
};
