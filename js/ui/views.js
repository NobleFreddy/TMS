/* Wiederverwendbare UI-Bausteine: Dialoge, Hinweise, Glockenkurve, Ergebnisdarstellung */
(function (T) {
  'use strict';
  const U = T.util;
  const V = {};

  V.$ = (sel, root) => (root || document).querySelector(sel);
  V.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  V.modal = function (o) {
    return new Promise(resolve => {
      const back = document.createElement('div');
      back.className = 'modal-back';
      back.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h3>${o.title}</h3><div>${o.body || ''}</div><div class="row">${(o.buttons || [{ label: 'OK', value: true, cls: 'primary' }]).map((b, i) => `<button class="btn ${b.cls || ''}" data-i="${i}">${b.label}</button>`).join('')}</div></div>`;
      const close = v => { back.remove(); document.removeEventListener('keydown', onKey, true); resolve(v); };
      const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(o.escValue === undefined ? null : o.escValue); } };
      back.addEventListener('click', e => {
        const b = e.target.closest('button[data-i]');
        if (b) close(o.buttons[Number(b.dataset.i)].value);
        else if (e.target === back && o.dismissable !== false) close(o.escValue === undefined ? null : o.escValue);
      });
      document.addEventListener('keydown', onKey, true);
      document.body.appendChild(back);
      const primary = back.querySelector('.btn.primary') || back.querySelector('.btn');
      if (primary) primary.focus();
    });
  };

  let toastTimer = null;
  V.toast = function (msg, ms) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), ms || 2600);
  };

  V.clsBadge = cls => `<span class="badge ${cls.key}">${cls.label}</span>`;

  /** Glockenkurve der Testwert-Verteilung mit Markierung des eigenen Ergebnisses */
  V.bell = function (z, pr) {
    const W = 420, H = 140, L = 20, R = 20, base = 104;
    const X = zz => L + (zz + 3) / 6 * (W - L - R);
    const pdf = zz => Math.exp(-zz * zz / 2);
    const zc = U.clamp(z, -3, 3);
    let curve = '', area = `M${X(-3)} ${base}`;
    for (let zz = -3; zz <= 3.0001; zz += 0.05) {
      const p = `${X(zz).toFixed(1)} ${(base - pdf(zz) * 86).toFixed(1)}`;
      curve += (curve ? 'L' : 'M') + p;
      if (zz <= zc) area += 'L' + p;
    }
    area += `L${X(zc).toFixed(1)} ${(base - pdf(zc) * 86).toFixed(1)}L${X(zc).toFixed(1)} ${base}Z`;
    let ticks = '';
    for (let k = -3; k <= 3; k++) ticks += `<line class="axis" x1="${X(k)}" y1="${base}" x2="${X(k)}" y2="${base + 4}"/><text x="${X(k)}" y="${base + 17}" text-anchor="middle">${100 + 10 * k}</text>`;
    const mx = X(zc);
    return `<svg class="bell" viewBox="0 0 ${W} ${H}" role="img" aria-label="Einordnung: Prozentrang ${pr}">
      <path class="area" d="${area}"/><path class="curve" d="${curve}"/>
      <line class="axis" x1="${L}" y1="${base}" x2="${W - R}" y2="${base}"/>${ticks}
      <line class="marker" x1="${mx}" y1="${base}" x2="${mx}" y2="12"/>
      <text class="mlabel" x="${U.clamp(mx, 40, W - 40)}" y="10" text-anchor="middle">PR ${pr}</text>
      <text x="${W / 2}" y="${H - 2}" text-anchor="middle">Testwert (Mittelwert 100, Standardabweichung 10)</text>
    </svg>`;
  };

  V.prBar = pr => `<div class="bar-pr" title="Prozentrang ${pr}"><span class="zone"></span><i style="width:${U.clamp(pr, 1, 100)}%"></i></div>`;

  V.miniChart = function (vals) {
    if (!vals.length) return '';
    const W = 300, H = 70, P = 8;
    const X = i => vals.length === 1 ? W / 2 : P + i / (vals.length - 1) * (W - 2 * P);
    const Y = v => H - P - v / 100 * (H - 2 * P);
    const pts = vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    return `<svg class="chart-mini" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><rect class="band" x="0" y="${Y(70)}" width="${W}" height="${Y(30) - Y(70)}"/>` +
      `<polyline points="${pts}"/>${vals.map((v, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3"/>`).join('')}</svg>`;
  };

  V.timeLabel = sec => sec === null || sec === undefined ? 'ohne Zeitlimit' : (sec % 60 === 0 ? `${sec / 60} Min.` : U.fmtTime(sec) + ' Min.');

  // ---------- Farbschema (System / Hell / Dunkel) ----------
  const ICONS = {
    system: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 20h8M12 16v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    sheet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };
  V.icon = name => ICONS[name] || '';
  const THEME_LABEL = { system: 'Farbschema: wie System', light: 'Farbschema: hell', dark: 'Farbschema: dunkel' };
  const THEME_NEXT = { system: 'light', light: 'dark', dark: 'system' };

  V.currentTheme = () => (T.store.getSettings().theme || 'system');
  V.isDark = () => {
    const t = V.currentTheme();
    return t === 'dark' || (t === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  };
  V.applyTheme = function () {
    const t = V.currentTheme();
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || (V.isDark() ? '#11151d' : '#f4f6f9');
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.setAttribute('content', bg); m.removeAttribute('media'); });
    document.querySelectorAll('[data-theme-btn]').forEach(b => { b.innerHTML = ICONS[t]; b.title = THEME_LABEL[t] + ' (tippen zum Wechseln)'; b.setAttribute('aria-label', THEME_LABEL[t]); });
  };
  V.themeButton = () => `<button class="icon-btn" data-theme-btn type="button" title="${THEME_LABEL[V.currentTheme()]}" aria-label="${THEME_LABEL[V.currentTheme()]}">${ICONS[V.currentTheme()]}</button>`;
  V.cycleTheme = function () {
    const next = THEME_NEXT[V.currentTheme()];
    T.store.saveSettings(Object.assign({}, T.store.getSettings(), { theme: next }));
    V.applyTheme();
    V.toast(THEME_LABEL[next]);
    document.querySelectorAll('[data-theme-seg] button').forEach(x => x.classList.toggle('on', x.dataset.v === next));
  };
  document.addEventListener('click', e => { if (e.target.closest('[data-theme-btn]')) V.cycleTheme(); });
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if (V.currentTheme() === 'system') V.applyTheme(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
  }

  T.views = V;
})(window.TMS);
