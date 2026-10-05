function onInput(el: HTMLElement | null, handler: (ev: Event) => void): void {
  if (el) {
    el.addEventListener('input', handler);
  }
}

function onChange(el: HTMLElement | null, handler: (ev: Event) => void): void {
  if (el) {
    el.addEventListener('change', handler);
  }
}

function bindCheckbox(el: HTMLInputElement | null, messageType: string, send: (msg: { type: string; value: boolean }) => void): void {
  onChange(el, ev => send({ type: messageType, value: (ev.target as HTMLInputElement).checked }));
}

function bindSelectValue(el: HTMLSelectElement | null, messageType: string, send: (msg: { type: string; value: string }) => void): void {
  onChange(el, ev => send({ type: messageType, value: (ev.target as HTMLSelectElement).value }));
}

// classic script の入口を公開し、イベント登録を panel.js に集約する。
window.CommitMakerEvents = {
  onInput,
  onChange,
  bindCheckbox,
  bindSelectValue
};
