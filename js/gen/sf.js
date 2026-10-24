/* Schlauchfiguren: 3D-Kabel in einem durchsichtigen Würfel, perspektivisch gerendert */
(function (T) {
  'use strict';
  const RNG = T.RNG;

  const D = 3.6;            // Kameraabstand (Würfel von -1 bis 1)
  const SIZE = 200;
  const SCALE = 63;
  const RADIUS = 0.088;

  // Ansichten als Rotationen: Koordinaten im Bildraum (x rechts, y oben, z zum Betrachter)
  const VIEWS = {
    v: p => [p[0], p[1], p[2]],
    r: p => [-p[2], p[1], p[0]],
    l: p => [p[2], p[1], -p[0]],
    u: p => [p[0], p[2], -p[1]],
    o: p => [p[0], -p[2], p[1]],
    h: p => [-p[0], p[1], -p[2]]
  };
  const ANSWER_KEYS = ['r', 'l', 'u', 'o', 'h'];
  const ANSWER_LABELS = ['r (rechts)', 'l (links)', 'u (unten)', 'o (oben)', 'h (hinten)'];
  const VIEW_NAMES = { v: 'vorne', r: 'rechts', l: 'links', u: 'unten', o: 'oben', h: 'hinten' };

  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

  function catmullRom(pts, steps) {
    const out = [];
    const P = [pts[0]].concat(pts, [pts[pts.length - 1]]);
    for (let i = 1; i < P.length - 2; i++) {
      const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([0, 1, 2].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }

  function randPoint(rng, lim) { return [rng.float(-lim, lim), rng.float(-lim, lim), rng.float(-lim, lim)]; }

  function genCable(rng, nCtrl, others) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const ctrl = [randPoint(rng, 0.78)];
      let tries = 0;
      while (ctrl.length < nCtrl && tries++ < 400) {
        const q = randPoint(rng, 0.8);
        const last = ctrl[ctrl.length - 1];
        const d = dist(q, last);
        if (d < 0.55 || d > 1.35) continue;
        if (ctrl.slice(0, -1).some(c => dist(c, q) < 0.45)) continue;
        ctrl.push(q);
      }
      if (ctrl.length < nCtrl) continue;
      const pts = catmullRom(ctrl, 12);
      if (pts.some(p => p.some(c => Math.abs(c) > 0.9))) continue;
      // keine Selbstberührung und kein Kontakt zu anderen Kabeln
      let ok = true;
      for (let i = 0; i < pts.length && ok; i++) {
        for (let j = i + 10; j < pts.length; j++) if (dist(pts[i], pts[j]) < 0.2) { ok = false; break; }
        for (const o of others) { for (const q of o) if (dist(pts[i], q) < 0.22) { ok = false; break; } if (!ok) break; }
      }
      if (!ok) continue;
      // ausreichende Ausdehnung in allen Richtungen, damit jede Ansicht interpretierbar ist
      const ext = [0, 1, 2].map(k => Math.max(...pts.map(p => p[k])) - Math.min(...pts.map(p => p[k])));
      if (ext.some(e => e < 0.6)) continue;
      return pts;
    }
    return null;
  }

  function project(p) {
    const f = D / (D - p[2]);
    return { x: SIZE / 2 + SCALE * f * p[0], y: SIZE / 2 - SCALE * f * p[1], f, z: p[2] };
  }

  const r1 = v => Math.round(v * 10) / 10;

  function cableColors(ci, depth) {
    const t = (depth + 1) / 2; // 1 = nah
    const hue = ci === 0 ? 215 : 22, sat = ci === 0 ? 16 : 42;
    return {
      fill: `hsl(${hue},${sat}%,${Math.round(74 - 36 * t)}%)`,
      line: `hsl(${hue},${sat + 6}%,${Math.round(46 - 32 * t)}%)`,
      hi: `hsl(${hue},${sat}%,${Math.round(88 - 30 * t)}%)`
    };
  }

  function renderView(cables, key, size) {
    const tf = VIEWS[key];
    const segs = [];
    cables.forEach((pts, ci) => {
      const P = pts.map(p => project(tf(p)));
      const n = P.length;
      const W = P.map(p => 2 * RADIUS * SCALE * p.f);
      let lastN = [0, 1];
      const N = P.map((p, i) => {
        const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
        let dx = b.x - a.x, dy = b.y - a.y; const len = Math.hypot(dx, dy);
        if (len < 0.4) return lastN;
        lastN = [-dy / len, dx / len];
        return lastN;
      });
      const L = P.map((p, i) => [p.x + N[i][0] * W[i] / 2, p.y + N[i][1] * W[i] / 2]);
      const R = P.map((p, i) => [p.x - N[i][0] * W[i] / 2, p.y - N[i][1] * W[i] / 2]);
      for (let i = 0; i < n - 1; i++) {
        const z = (P[i].z + P[i + 1].z) / 2;
        const c = cableColors(ci, z);
        const w = (W[i] + W[i + 1]) / 2;
        const hx1 = P[i].x + N[i][0] * W[i] * 0.2, hy1 = P[i].y + N[i][1] * W[i] * 0.2;
        const hx2 = P[i + 1].x + N[i + 1][0] * W[i + 1] * 0.2, hy2 = P[i + 1].y + N[i + 1][1] * W[i + 1] * 0.2;
        let s = `<circle cx="${r1(P[i].x)}" cy="${r1(P[i].y)}" r="${r1(Math.max(0.5, W[i] / 2 - 0.7))}" fill="${c.fill}"/>`;
        s += `<path d="M${r1(L[i][0])} ${r1(L[i][1])}L${r1(L[i + 1][0])} ${r1(L[i + 1][1])}L${r1(R[i + 1][0])} ${r1(R[i + 1][1])}L${r1(R[i][0])} ${r1(R[i][1])}Z" fill="${c.fill}" stroke="${c.fill}" stroke-width="0.8" stroke-linejoin="round"/>`;
        s += `<path d="M${r1(L[i][0])} ${r1(L[i][1])}L${r1(L[i + 1][0])} ${r1(L[i + 1][1])}M${r1(R[i][0])} ${r1(R[i][1])}L${r1(R[i + 1][0])} ${r1(R[i + 1][1])}" stroke="${c.line}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
        s += `<path d="M${r1(hx1)} ${r1(hy1)}L${r1(hx2)} ${r1(hy2)}" stroke="${c.hi}" stroke-width="${r1(w * 0.18)}" stroke-linecap="round"/>`;
        if (i === 0 || i === n - 2) {
          const e = i === 0 ? 0 : n - 1;
          const ce = cableColors(ci, P[e].z);
          s += `<circle cx="${r1(P[e].x)}" cy="${r1(P[e].y)}" r="${r1(W[e] / 2)}" fill="${ce.line}" stroke="${ce.line}" stroke-width="1"/>`;
          s += `<circle cx="${r1(P[e].x)}" cy="${r1(P[e].y)}" r="${r1(W[e] * 0.22)}" fill="${ce.fill}"/>`;
        }
        segs.push({ z, s });
      }
    });
    segs.sort((a, b) => a.z - b.z);

    // Würfelkanten
    const corners = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) corners.push([x, y, z]);
    const back = [], front = [];
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
      const a = corners[i], b = corners[j];
      const diff = [0, 1, 2].filter(k => a[k] !== b[k]).length;
      if (diff !== 1) continue;
      const A = project(tf(a)), B = project(tf(b));
      const zAvg = (A.z + B.z) / 2;
      const line = `<line x1="${r1(A.x)}" y1="${r1(A.y)}" x2="${r1(B.x)}" y2="${r1(B.y)}"`;
      if (zAvg > 0.99) front.push(line + ' stroke="#7b8794" stroke-width="1.5"/>');
      else back.push(line + ` stroke="${zAvg < -0.99 ? '#c3cad3' : '#a9b3be'}" stroke-width="1"/>`);
    }
    const sz = size || SIZE;
    return `<svg class="sf-svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${sz}" height="${sz}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="#fff"/>` +
      back.join('') + segs.map(s => s.s).join('') + front.join('') + '</svg>';
  }

  function makeItem(rng, idx, answerKey) {
    const difficulty = idx / 23;
    const twoCables = rng.chance(0.12 + 0.25 * difficulty);
    const cables = [];
    const n1 = rng.int(5, 6 + Math.round(difficulty * 2));
    let c = genCable(rng, n1, []);
    let guard = 0;
    while (!c && guard++ < 10) c = genCable(rng, n1, []);
    cables.push(c);
    if (twoCables) {
      const c2 = genCable(rng, rng.int(4, 5), cables);
      if (c2) cables.push(c2);
    }
    const ai = ANSWER_KEYS.indexOf(answerKey);
    const stem = `<div class="sf-pair">
      <figure class="paper"><div class="sf-img">${renderView(cables, 'v')}</div><figcaption>Hier sehen Sie den Würfel von vorne!</figcaption></figure>
      <figure class="paper"><div class="sf-img">${renderView(cables, answerKey)}</div><figcaption>Hier sehen Sie den Würfel von ______?</figcaption></figure>
    </div>`;
    return {
      stem,
      options: ANSWER_LABELS.slice(),
      correct: ai,
      layout: 'inline',
      explanation: () => `<p>Richtig ist <b>${VIEW_NAMES[answerKey]}</b>. Zum Vergleich alle sechs Ansichten dieses Würfels:</p>
        <div class="sf-all">${['v', 'r', 'l', 'u', 'o', 'h'].map(k =>
          `<figure class="paper ${k === answerKey ? 'is-answer' : ''}">${renderView(cables, k, 120)}<figcaption>${k === 'v' ? 'vorne' : VIEW_NAMES[k] + ' (' + k + ')'}</figcaption></figure>`).join('')}</div>`
    };
  }

  T.gen.sf = function (seed) {
    const rng = new RNG(seed);
    const keys = [];
    for (let i = 0; i < 24; i++) keys.push(ANSWER_KEYS[i % 5]);
    const order = rng.shuffle(keys);
    const items = order.map((k, i) => makeItem(rng.fork('sf' + i), i, k));
    return { items };
  };
  T.gen.sf.renderView = renderView;
})(window.TMS);
