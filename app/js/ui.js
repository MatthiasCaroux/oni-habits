// Petits morceaux d'interface réutilisés par les écrans.

export function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export const fr = (n) => Number(n).toLocaleString('fr-FR');
export const frDec = (n, digits = 1) => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: digits });

export function num(v) {
  if (v === '' || v == null) return null;
  const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const svg = (body, size = 22, sw = 2) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icon = {
  check: (s = 16) => svg('<path d="M5 12.5l4.5 4.5L19 7"/>', s, 3),
  back: () => svg('<path d="M15 5l-7 7 7 7"/>', 20, 2.2),
  prev: () => svg('<path d="M15 5l-7 7 7 7"/>', 18, 2.4),
  next: () => svg('<path d="M9 5l7 7-7 7"/>', 18, 2.4),
  close: () => svg('<path d="M6 6l12 12M18 6L6 18"/>', 16, 2.2),
  flame: () => svg('<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>', 14, 2.4),
  day: () => svg('<rect x="3.5" y="5" width="17" height="15.5" rx="1"/><path d="M3.5 9.5h17M8 3v4M16 3v4M9 15l2 2 4-4"/>'),
  week: () => svg('<rect x="3.5" y="5" width="17" height="15.5" rx="1"/><path d="M3.5 9.5h17M9.2 9.5v11M14.8 9.5v11M8 3v4M16 3v4"/>'),
  month: () => svg('<rect x="3.5" y="5" width="17" height="15.5" rx="1"/><path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01M16 17h.01"/>'),
  people: () => svg('<circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9.5" r="2.5"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M15.5 14.7c2.9-.4 5.5 1.4 5.5 4.3"/>'),
  user: () => svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>'),
  upload: () => svg('<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>', 16),
  download: () => svg('<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>', 16),
  share: () => svg('<path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/>', 16)
};

export function logo(size = 26) {
  return `<span class="logo" style="font-size:${size}px">ONI<b>.</b></span>`;
}

export function nav(active) {
  const tabs = [
    { id: 'jour', label: 'Jour', ic: icon.day() },
    { id: 'semaine', label: 'Semaine', ic: icon.week() },
    { id: 'mois', label: 'Mois', ic: icon.month() },
    { id: 'communaute', label: 'Social', ic: icon.people() },
    { id: 'profil', label: 'Profil', ic: icon.user() }
  ];
  return `<nav class="nav" aria-label="Navigation principale">${tabs.map((t) =>
    `<a href="#/${t.id}"${t.id === active ? ' aria-current="page"' : ''}>${t.ic}<span>${t.label}</span></a>`).join('')}</nav>`;
}

// Une ligne cochable : case + libellé + XP.
export function checkRow({ act, arg = '', checked, partial = false, label, sub = '', xp = '', extra = '', highlight = false }) {
  const xpTxt = xp === '' ? '' : `<span class="xp${checked ? ' on' : ''}">${esc(xp)}</span>`;
  return `<button type="button" class="item${highlight ? ' hl' : ''}" role="checkbox" aria-checked="${checked ? 'true' : 'false'}" data-act="${act}" data-arg="${esc(arg)}">
    <span class="box${checked ? ' on' : partial ? ' part' : ''}">${checked ? icon.check() : ''}</span>
    <span class="lbl"><span class="t">${esc(label)}</span>${extra}</span>
    ${xpTxt}
  </button>`;
}

export function segs(count, filled) {
  let out = '<span class="segs" aria-hidden="true">';
  for (let i = 1; i <= count; i++) out += `<i class="${i <= filled ? 'on' : ''}"></i>`;
  return out + '</span>';
}

export function segmented(name, options, value, act) {
  return `<div class="seg" role="group" aria-label="${esc(name)}">${options.map((o) => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    const on = String(v) === String(value);
    return `<button type="button" class="${on ? 'on' : ''}" aria-pressed="${on}" data-act="${act}" data-arg="${esc(v)}">${esc(l)}</button>`;
  }).join('')}</div>`;
}

export function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}
