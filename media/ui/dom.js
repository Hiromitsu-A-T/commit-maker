function renderSelect(selectEl, options, selected) {
    if (!selectEl)
        return;
    selectEl.innerHTML = '';
    for (const value of options) {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = value;
        opt.selected = value === selected;
        selectEl.appendChild(opt);
    }
}
function show(el, visible, display = 'block') {
    if (el) {
        el.style.display = visible ? display : 'none';
    }
}
function setDisabled(el, disabled) {
    if (el) {
        el.disabled = disabled;
    }
}
function updateBadges(container, badges) {
    if (!container)
        return;
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
