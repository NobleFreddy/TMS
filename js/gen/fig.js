/* Figuren lernen: unregelmäßige Figuren aus fünf Feldern, eines geschwärzt */
(function (T) {
  'use strict';
  const RNG = T.RNG, U = T.util;

  const COLS = 5, ROWS = 5, CELL = 30, JIT = 8;
  const key = (c, r) => c + ',' + r;
  const NB = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // oben, rechts, unten, links

  function growShape(rng, size) {
    const set = new Set([key(2, 2)]);
    const cells = [[2, 2]];
    let guard = 0;
    while (cells.length < size && guard++ < 1000) {
      const [c, r] = rng.pick(cells);
      const [dc, dr] = rng.pick(NB);
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS || set.has(key(nc, nr))) continue;
      // Kompaktheit leicht bevorzugen: Zellen mit mehr Nachbarn öfter akzeptieren
      const nbs = NB.filter(([a, b]) => set.has(key(nc + a, nr + b))).length;
      if (nbs === 1 && rng.chance(0.35)) continue;
      set.add(key(nc, nr)); cells.push([nc, nr]);
    }
    // Löcher schließen
    const outside = new Set();
    const stack = [];
    for (let c = -1; c <= COLS; c++) for (let r = -1; r <= ROWS; r++) if (c < 0 || r < 0 || c === COLS || r === ROWS) { outside.add(key(c, r)); stack.push([c, r]); }
    while (stack.length) {
      const [c, r] = stack.pop();
      for (const [dc, dr] of NB) {
        const nc = c + dc, nr = r + dr, k = key(nc, nr);
        if (nc < -1 || nr < -1 || nc > COLS || nr > ROWS || outside.has(k) || set.has(k)) continue;
        outside.add(k); stack.push([nc, nr]);
      }
    }
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
      const k = key(c, r);
      if (!set.has(k) && !outside.has(k)) { set.add(k); cells.push([c, r]); }
    }
    return { set, cells };
  }

  function partition(rng, shape, n) {
    const { set, cells } = shape;
    const region = new Map();
    // Startzellen per "farthest point"
    const seeds = [rng.pick(cells)];
    while (seeds.length < n) {
      let best = null, bestD = -1;
      for (const c of rng.shuffle(cells)) {
        if (seeds.some(s => s[0] === c[0] && s[1] === c[1])) continue;
        const d = Math.min(...seeds.map(s => Math.abs(s[0] - c[0]) + Math.abs(s[1] - c[1])));
        if (d > bestD) { bestD = d; best = c; }
      }
      seeds.push(best);
    }
    seeds.forEach((s, i) => region.set(key(s[0], s[1]), i));
    const sizes = U.range(n).map(() => 1);
    let guard = 0;
    while (region.size < cells.length && guard++ < 2000) {
      const order = U.range(n).sort((a, b) => sizes[a] - sizes[b] || (rng.next() - 0.5));
      let grown = false;
      for (const ri of order) {
        const frontier = [];
        for (const [k, v] of region) {
          if (v !== ri) continue;
          const [c, r] = k.split(',').map(Number);
          for (const [dc, dr] of NB) { const kk = key(c + dc, r + dr); if (set.has(kk) && !region.has(kk)) frontier.push(kk); }
        }
        if (frontier.length) { region.set(rng.pick(frontier), ri); sizes[ri]++; grown = true; break; }
      }
      if (!grown) break;
    }
    return region;
  }

  function makeFigure(rng) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const shape = growShape(rng, rng.int(10, 14));
      if (shape.cells.length < 9) continue;
      const region = partition(rng, shape, 5);
      if (region.size !== shape.cells.length) continue;
      // Gitterpunkte verwackeln
      const V = {};
      for (let c = 0; c <= COLS; c++) for (let r = 0; r <= ROWS; r++) V[key(c, r)] = [c * CELL + rng.float(-JIT, JIT), r * CELL + rng.float(-JIT, JIT)];
      const polys = [];
      for (const [c, r] of shape.cells) {
        const ri = region.get(key(c, r));
        const TL = key(c, r), TR = key(c + 1, r), BR = key(c + 1, r + 1), BL = key(c, r + 1);
        const exposed = NB.map(([dc, dr]) => !shape.set.has(key(c + dc, r + dr)));
        // Seiten: [Punkt A, Punkt B, Nachbar]
        let sides = [[TL, TR, key(c, r - 1)], [TR, BR, key(c + 1, r)], [BR, BL, key(c, r + 1)], [BL, TL, key(c - 1, r)]];
        let pts = [TL, TR, BR, BL];
        // gelegentlich äußere Ecken abschrägen
        const cut = [[0, 3, TL], [0, 1, TR], [1, 2, BR], [2, 3, BL]].filter(([a, b]) => exposed[a] && exposed[b] && exposed.filter(Boolean).length === 2);
        if (cut.length && rng.chance(0.45)) {
          const [a, b, corner] = cut[0];
          pts = pts.filter(p => p !== corner);
          const others = pts.filter(p => p !== corner);
          sides = sides.filter((s, si) => si !== a && si !== b);
          // neue Außenkante (Hypotenuse)
          const ends = [sides[0][0], sides[0][1], sides[1][0], sides[1][1]].filter(p => p !== undefined);
          const hyp = others.filter(p => ends.filter(e => e === p).length === 1);
          sides.push([hyp[0], hyp[1], null]);
        }
        polys.push({ ri, pts, sides, cell: [c, r] });
      }
      return { polys, V, region, set: shape.set, black: rng.int(0, 4) };
    }
    return null;
  }

  function bbox(fig) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of fig.polys) for (const k of p.pts) { const [x, y] = fig.V[k]; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return [x0, y0, x1, y1];
  }

  function renderFigure(fig, mode, letters) {
    const [x0, y0, x1, y1] = bbox(fig);
    const pad = 6, w = x1 - x0 + 2 * pad, h = y1 - y0 + 2 * pad;
    const side = Math.max(w, h);
    const vb = [x0 - pad - (side - w) / 2, y0 - pad - (side - h) / 2, side, side].map(v => Math.round(v * 10) / 10);
    const P = k => fig.V[k].map(v => Math.round(v * 10) / 10).join(',');
    let fills = '', edges = '';
    for (const p of fig.polys) {
      const black = mode === 'learn' && p.ri === fig.black;
      fills += `<polygon points="${p.pts.map(P).join(' ')}" fill="${black ? '#111' : '#fff'}" stroke="${black ? '#111' : '#fff'}" stroke-width="${black ? 1.6 : 0.6}" stroke-linejoin="round"/>`;
      for (const [a, b, nb] of p.sides) {
        const other = nb === null ? undefined : fig.region.get(nb);
        if (other === undefined || other !== p.ri) {
          // jede Innenkante nur einmal zeichnen
          if (other !== undefined && other < p.ri) continue;
          edges += `M${P(a)}L${P(b)}`;
        }
      }
    }
    let labels = '';
    if (mode === 'recall') {
      for (let ri = 0; ri < 5; ri++) {
        const ps = fig.polys.filter(p => p.ri === ri);
        const cent = p => { const pts = p.pts.map(k => fig.V[k]); return [pts.reduce((s, q) => s + q[0], 0) / pts.length, pts.reduce((s, q) => s + q[1], 0) / pts.length]; };
        const all = ps.map(cent);
        const mean = [all.reduce((s, q) => s + q[0], 0) / all.length, all.reduce((s, q) => s + q[1], 0) / all.length];
        const best = all.slice().sort((a, b) => Math.hypot(a[0] - mean[0], a[1] - mean[1]) - Math.hypot(b[0] - mean[0], b[1] - mean[1]))[0];
        labels += `<text x="${Math.round(best[0])}" y="${Math.round(best[1]) + 5}" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#111">${letters[ri]}</text>`;
      }
    }
    return `<svg class="fig-svg" viewBox="${vb.join(' ')}" xmlns="http://www.w3.org/2000/svg">${fills}<path d="${edges}" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${labels}</svg>`;
  }

  T.gen.fig = function (seed) {
    const rng = new RNG(seed);
    const figs = [];
    while (figs.length < 20) { const f = makeFigure(rng); if (f) figs.push(f); }
    const learnHtml = `<div class="fig-grid">${figs.map((f, i) => `<figure class="paper fig-cell"><span class="fig-no">${i + 1}</span>${renderFigure(f, 'learn')}</figure>`).join('')}</div>`;
    const order = rng.shuffle(U.range(20));
    const items = order.map(fi => {
      const f = figs[fi];
      const letterPerm = rng.shuffle(U.LETTERS.slice());
      const correct = U.LETTERS.indexOf(letterPerm[f.black]);
      return {
        stem: `<div class="fig-recall paper">${renderFigure(f, 'recall', letterPerm)}</div><p class="muted center">Welches Feld war geschwärzt?</p>`,
        options: U.LETTERS.slice(),
        correct,
        layout: 'inline',
        explanation: () => `<p>Im Lernheft (Figur ${fi + 1}) war Feld <b>${U.LETTERS[correct]}</b> geschwärzt:</p><div class="fig-pair"><div class="paper fig-cell">${renderFigure(f, 'learn')}</div><div class="paper fig-cell">${renderFigure(f, 'recall', letterPerm)}</div></div>`
      };
    });
    return { learnHtml, items };
  };
})(window.TMS);
