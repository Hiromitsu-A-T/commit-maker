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
    badges.forEach((badge, index) => {
        let span = container.children.item(index);
        if (!(span instanceof HTMLSpanElement)) {
            span = document.createElement('span');
            container.appendChild(span);
        }
        const className = 'badge' + (badge.className ? ' ' + badge.className : '');
        if (span.className !== className)
            span.className = className;
        if (span.textContent !== badge.text)
            span.textContent = badge.text;
        const title = badge.title || badge.text;
        if (span.getAttribute('title') !== title)
            span.setAttribute('title', title);
    });
    while (container.children.length > badges.length) {
        container.lastElementChild?.remove();
    }
}
// expose for panel.js (no bundler)
// @ts-ignore
window.CommitMakerDom = { renderSelect, show, setDisabled, updateBadges };
