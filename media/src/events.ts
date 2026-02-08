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

function bindCheckbox(el: HTMLInputElement | null, messageType: string, send: (msg: any) => void): void {
  onChange(el, ev => send({ type: messageType, value: (ev.target as HTMLInputElement).checked }));
}

function bindSelectValue(el: HTMLSelectElement | null, messageType: string, send: (msg: any) => void): void {
  onChange(el, ev => send({ type: messageType, value: (ev.target as HTMLSelectElement).value }));
}

// expose for panel.js (no bundler)
// @ts-ignore
window.CommitMakerEvents = {
  onInput,
  onChange,
  bindCheckbox,
  bindSelectValue
};
