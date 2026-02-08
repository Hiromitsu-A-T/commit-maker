interface BadgeSpec {
  text: string;
  className?: string;
}

function renderSelect(selectEl: HTMLSelectElement | null, options: string[], selected?: string): void {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  for (const value of options) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    opt.selected = value === selected;
    selectEl.appendChild(opt);
  }
}

function show(el: HTMLElement | null, visible: boolean, display: string = 'block'): void {
  if (el) {
    el.style.display = visible ? display : 'none';
  }
}

function setDisabled(el: HTMLElement | null, disabled: boolean): void {
  if (el) {
    (el as HTMLInputElement | HTMLSelectElement).disabled = disabled;
  }
}

function updateBadges(container: HTMLElement | null, badges: BadgeSpec[]): void {
  if (!container) return;
  container.innerHTML = '';
  for (const badge of badges) {
    const span = document.createElement('span');
    span.className = 'badge ' + (badge.className || '');
    span.textContent = badge.text;
    container.appendChild(span);
  }
}

// expose for panel.js (no bundler)
// @ts-ignore
window.CommitMakerDom = { renderSelect, show, setDisabled, updateBadges };
