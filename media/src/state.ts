function cloneState<T>(state: T): T {
  return state ? JSON.parse(JSON.stringify(state)) : state;
}

function mergeState<T extends object>(base: T, partial: Partial<T>): T {
  return { ...base, ...partial };
}

// bootstrap の JSON を複製し、以降の部分更新を panel.js で扱う。
window.CommitMakerState = { cloneState, mergeState };
