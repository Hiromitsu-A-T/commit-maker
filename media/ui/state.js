"use strict";
function cloneState(state) {
    return state ? JSON.parse(JSON.stringify(state)) : state;
}
function mergeState(base, partial) {
    return { ...base, ...partial };
}
// bootstrap の JSON を複製し、以降の部分更新を panel.js で扱う。
window.CommitMakerState = { cloneState, mergeState };
