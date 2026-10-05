interface BadgeSpec {
  text: string;
  className?: string;
  title?: string;
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

function setDisabled(el: HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null, disabled: boolean): void {
  if (el) el.disabled = disabled;
}

function updateBadges(container: HTMLElement | null, badges: BadgeSpec[]): void {
  if (!container) return;
  badges.forEach((badge, index) => {
    let span = container.children.item(index);
    if (!(span instanceof HTMLSpanElement)) {
      span = document.createElement('span');
      container.appendChild(span);
    }
    const className = 'badge' + (badge.className ? ' ' + badge.className : '');
    if (span.className !== className) span.className = className;
    if (span.textContent !== badge.text) span.textContent = badge.text;
    const title = badge.title || badge.text;
    if (span.getAttribute('title') !== title) span.setAttribute('title', title);
  });
  while (container.children.length > badges.length) {
    container.lastElementChild?.remove();
  }
}

// classic script として読み込み、panel.js から同じ DOM 処理を使用する。
window.CommitMakerDom = { renderSelect, show, setDisabled, updateBadges };
