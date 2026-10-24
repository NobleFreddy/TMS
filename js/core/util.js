/* Grundfunktionen: deterministischer Zufall, Formatierung, Antwortoptionen */
window.TMS = window.TMS || {};

(function (T) {
  'use strict';

  // ---------- Seed-basierter Zufallsgenerator ----------
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class RNG {
    constructor(seed) { this.r = mulberry32(xmur3(String(seed))()); }
    next() { return this.r(); }
    float(a, b) { return a + (b - a) * this.r(); }
    int(a, b) { return a + Math.floor(this.r() * (b - a + 1)); }
    chance(p) { return this.r() < p; }
    sign() { return this.r() < 0.5 ? -1 : 1; }
    pick(arr) { return arr[Math.floor(this.r() * arr.length)]; }
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(this.r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    sample(arr, k) { return this.shuffle(arr).slice(0, k); }
    weighted(items, weights) {
      const sum = weights.reduce((s, w) => s + w, 0);
      let x = this.r() * sum;
      for (let i = 0; i < items.length; i++) { x -= weights[i]; if (x <= 0) return items[i]; }
      return items[items.length - 1];
    }
    fork(label) { return new RNG(String(this.int(0, 1e9)) + '|' + label); }
  }
  T.RNG = RNG;

  // ---------- Formatierung ----------
  function fmt(x, maxDec) {
    if (maxDec === undefined) maxDec = 2;
    if (!isFinite(x)) return String(x);
    const p = Math.pow(10, maxDec);
    const v = Math.round(x * p) / p;
    return v.toLocaleString('de-DE', { maximumFractionDigits: maxDec, useGrouping: Math.abs(v) >= 10000 });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const mm = String(m).padStart(h ? 2 : 1, '0'), ss = String(s).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  function fmtDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  const LETTERS = ['A', 'B', 'C', 'D', 'E'];
  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

  // Mathematische Hilfen für HTML-Formeln
  const M = {
    frac: (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`,
    sqrt: (a, n) => `<span class="root">${n ? `<sup class="root-n">${n}</sup>` : ''}√<span class="radicand">${a}</span></span>`,
    sup: (a) => `<sup>${a}</sup>`,
    sub: (a) => `<sub>${a}</sub>`,
    cdot: ' · '
  };

  // ---------- Antwortoptionen ----------
  /**
   * Erzeugt 5 Optionen aus richtiger Antwort + Distraktoren (Strings).
   * Doppelte werden entfernt; fehlen Distraktoren, wird `filler` aufgerufen.
   */
  function buildOptions(rng, correct, distractors, opts) {
    opts = opts || {};
    const seen = new Set([correct]);
    const list = [];
    for (const d of distractors) {
      if (d === undefined || d === null) continue;
      const s = String(d);
      if (!seen.has(s)) { seen.add(s); list.push(s); }
      if (list.length >= 4) break;
    }
    let guard = 0;
    while (list.length < 4 && opts.filler && guard++ < 200) {
      const s = String(opts.filler(guard));
      if (!seen.has(s)) { seen.add(s); list.push(s); }
    }
    if (list.length < 4) throw new Error('Zu wenige Distraktoren für: ' + correct);
    let all = [correct].concat(list.slice(0, 4));
    if (opts.sortBy) all.sort((a, b) => opts.sortBy(a) - opts.sortBy(b));
    else if (!opts.keepOrder) all = rng.shuffle(all);
    return { options: all, correct: all.indexOf(correct) };
  }

  /** Numerische Optionen, aufsteigend sortiert wie im TMS üblich. */
  function numericOptions(rng, correct, distractors, format, unit) {
    unit = unit ? ' ' + unit : '';
    const f = v => format(v) + unit;
    const cs = f(correct);
    const cands = [];
    const seen = new Set([cs]);
    for (const d of distractors) {
      if (!isFinite(d) || d <= 0) continue;
      const s = f(d);
      if (!seen.has(s)) { seen.add(s); cands.push(d); }
    }
    const factors = [2, 0.5, 10, 0.1, 3, 1 / 3, 4, 0.25, 1.5, 2 / 3, 5, 0.2, 1.2, 0.8, 6, 8];
    let i = 0;
    while (cands.length < 4 && i < factors.length) {
      const d = correct * factors[i++];
      const s = f(d);
      if (!seen.has(s)) { seen.add(s); cands.push(d); }
    }
    const chosen = rng.shuffle(cands).slice(0, 4).concat([correct]);
    chosen.sort((a, b) => a - b);
    const options = chosen.map(f);
    return { options, correct: options.indexOf(cs) };
  }

  // Kombinationsoptionen I/II/III im TMS-Stil
  const SUBSETS = [[0], [1], [2], [0, 1], [0, 2], [1, 2], [0, 1, 2], []];
  function subsetKey(s) { return s.join(','); }

  function subsetText(s, v) {
    const R = ROMAN;
    if (s.length === 0) return v.none || `Keine der drei ${v.pl} ${v.one}.`;
    if (s.length === 3) return v.all || `Alle drei ${v.pl} ${v.many}.`;
    if (s.length === 1) return `Nur ${v.sg} ${R[s[0]]} ${v.one}.`;
    return `Nur die ${v.pl} ${R[s[0]]} und ${R[s[1]]} ${v.many}.`;
  }

  const VERB = {
    ableiten: { sg: 'Aussage', pl: 'Aussagen', one: 'lässt sich ableiten', many: 'lassen sich ableiten' },
    zutreffend: { sg: 'Aussage', pl: 'Aussagen', one: 'ist zutreffend', many: 'sind zutreffend' },
    richtig: { sg: 'Aussage', pl: 'Aussagen', one: 'ist richtig', many: 'sind richtig' },
    ausfall: { sg: 'Ausfall', pl: 'Ausfälle', one: 'ist zu erwarten', many: 'sind zu erwarten', none: 'Keiner der drei Ausfälle ist zu erwarten.' },
    beitragen: { sg: 'der Sachverhalt', pl: 'Sachverhalte', one: 'trägt dazu bei', many: 'tragen dazu bei', none: 'Keiner dieser Sachverhalte trägt dazu bei.' },
    symptom: { sg: 'Symptom', pl: 'Symptome', one: 'kann auftreten', many: 'können auftreten', none: 'Keines der drei Symptome kann auftreten.' },
    massnahme: { sg: 'Maßnahme', pl: 'Maßnahmen', one: 'ist geeignet', many: 'sind geeignet', none: 'Keine der drei Maßnahmen ist geeignet.' }
  };

  /** truth: Array von 3 Booleans. Gibt TMS-typische Kombinationsoptionen zurück. */
  function subsetOptions(rng, truth, verb) {
    const v = typeof verb === 'string' ? VERB[verb] : verb;
    const correctSet = [0, 1, 2].filter(i => truth[i]);
    const ck = subsetKey(correctSet);
    const others = SUBSETS.filter(s => subsetKey(s) !== ck);
    // bevorzugt "nahe" Distraktoren (unterscheiden sich in einem Element)
    const near = others.filter(s => {
      const a = new Set(s), b = new Set(correctSet);
      let diff = 0; for (let i = 0; i < 3; i++) if (a.has(i) !== b.has(i)) diff++;
      return diff === 1;
    });
    const far = others.filter(s => !near.includes(s));
    const nNear = Math.min(near.length, rng.int(2, 3));
    const chosen = rng.sample(near, nNear).concat(rng.sample(far, 4 - nNear));
    chosen.push(correctSet);
    chosen.sort((a, b) => SUBSETS.findIndex(s => subsetKey(s) === subsetKey(a)) - SUBSETS.findIndex(s => subsetKey(s) === subsetKey(b)));
    const options = chosen.map(s => subsetText(s, v));
    return { options, correct: chosen.findIndex(s => subsetKey(s) === ck) };
  }

  function statementsHtml(stmts) {
    return '<ol class="roman">' + stmts.map((s, i) => `<li><span class="rn">${ROMAN[i]}.</span> ${s}</li>`).join('') + '</ol>';
  }

  function explainStatements(stmts, truth, reasons) {
    return '<ul class="expl-list">' + stmts.map((s, i) =>
      `<li><b>${ROMAN[i]}</b> ist <b class="${truth[i] ? 'ok' : 'no'}">${truth[i] ? 'richtig' : 'falsch'}</b>${reasons && reasons[i] ? ': ' + reasons[i] : '.'}</li>`
    ).join('') + '</ul>';
  }

  // Normalverteilung
  function erf(x) {
    const s = Math.sign(x); x = Math.abs(x);
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return s * y;
  }
  function phi(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function range(n) { return Array.from({ length: n }, (_, i) => i); }
  function round(x, d) { const p = Math.pow(10, d || 0); return Math.round(x * p) / p; }

  let uidCounter = 0;
  function uid(prefix) { return (prefix || 'u') + (++uidCounter).toString(36); }

  T.util = {
    fmt, esc, fmtTime, fmtDate, LETTERS, ROMAN, M,
    buildOptions, numericOptions, subsetOptions, subsetText, VERB,
    statementsHtml, explainStatements, phi, clamp, range, round, uid
  };
})(window.TMS);
