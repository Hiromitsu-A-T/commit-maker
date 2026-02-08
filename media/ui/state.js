function cloneState(state) {
    return state ? JSON.parse(JSON.stringify(state)) : state;
}
function mergeState(base, partial) {
    return { ...base, ...partial };
}
// expose for panel.js
// @ts-ignore
window.CommitMakerState = { cloneState, mergeState };
