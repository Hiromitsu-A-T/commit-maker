"use strict";
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
// classic script の入口を公開し、イベント登録を panel.js に集約する。
window.CommitMakerEvents = {
    onInput,
    onChange,
    bindCheckbox,
    bindSelectValue
};
