/* Muster zuordnen: zufällig erzeugte Strichzeichnung + 5 Ausschnitte, davon 4 verändert */
(function (T) {
  'use strict';
  const RNG = T.RNG, U = T.util;

  const W = 240, H = 240, WIN = 80, INNER = 12;
  const FILLS = ['none', 'solid', 'gray', 'h45', 'h135', 'hor', 'ver', 'cross', 'dots', 'ring'];
  const FILL_NAMES = {
    none: 'leer', solid: 'schwarz', gray: 'grau', h45: 'schräg schraffiert (/)', h135: 'schräg schraffiert (\\)',
    hor: 'waagerecht schraffiert', ver: 'senkrecht schraffiert', cross: 'kreuzschraffiert', dots: 'gepunktet', ring: 'mit Innenring'
  };

  const r1 = v => Math.round(v * 10) / 10;

  // ---------- Szene erzeugen ----------
  function genScene(rng) {
    const els = [];
    const edgePt = () => {
      const s = rng.int(0, 3), t = rng.float(10, 230);
      return [[t, -5], [245, t], [t, 245], [-5, t]][s];
    };
    const nCurves = rng.int(4, 5);
    for (let i = 0; i < nCurves; i++) {
      const a = edgePt(); let b = edgePt();
      let g = 0; while (Math.hypot(a[0] - b[0], a[1] - b[1]) < 150 && g++ < 20) b = edgePt();
      els.push({ t: 'curve', p: [a, [rng.float(20, 220), rng.float(20, 220)], [rng.float(20, 220), rng.float(20, 220)], b], w: rng.float(1.4, 2.8), dash: rng.chance(0.15) });
    }
    const nPoly = rng.int(3, 5);
    for (let i = 0; i < nPoly; i++) {
      const cx = rng.float(25, 215), cy = rng.float(25, 215), R = rng.float(14, 24), n = rng.int(3, 5);
      const a0 = rng.float(0, Math.PI * 2);
      const pts = U.range(n).map(k => {
        const a = a0 + k * 2 * Math.PI / n + rng.float(-0.35, 0.35), rr = R * rng.float(0.75, 1.15);
        return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
      });
      els.push({ t: 'poly', pts, cx, cy, R, fill: rng.pick(['h45', 'h135', 'gray', 'none', 'cross', 'hor', 'dots']), w: 1.4 });
    }
    const ells = [];
    const nEll = rng.int(14, 18);
    let guard = 0;
    while (ells.length < nEll && guard++ < 500) {
      const rx = rng.float(7, 24), ry = rx * rng.float(0.55, 1.0);
      const cx = rng.float(rx, W - rx), cy = rng.float(ry, H - ry);
      if (ells.some(e => Math.hypot(e.cx - cx, e.cy - cy) < 0.75 * (Math.max(e.rx, e.ry) + rx))) continue;
      ells.push({ t: 'ell', cx, cy, rx, ry, rot: rng.int(0, 179), fill: rng.pick(FILLS), w: rng.float(1.1, 2) });
    }
    ells.sort((a, b) => b.rx - a.rx);
    els.push(...ells);
    const nZig = rng.int(5, 7);
    for (let i = 0; i < nZig; i++) {
      let x = rng.float(15, 225), y = rng.float(15, 225);
      const pts = [[x, y]];
      const n = rng.int(3, 5), ang = rng.float(0, Math.PI * 2);
      for (let k = 0; k < n; k++) {
        const a = ang + (k % 2 ? 0.9 : -0.9) + rng.float(-0.3, 0.3);
        x += 9 * Math.cos(a); y += 9 * Math.sin(a);
        pts.push([x, y]);
      }
      els.push({ t: 'zig', pts, w: rng.float(1.2, 2) });
    }
    const nSmall = rng.int(6, 8);
    for (let i = 0; i < nSmall; i++) els.push({ t: 'dot', cx: rng.float(8, 232), cy: rng.float(8, 232), r: rng.float(2.8, 4.6) });
    const nClusters = rng.int(7, 9);
    for (let i = 0; i < nClusters; i++) {
      const cx = rng.float(15, 225), cy = rng.float(15, 225), n = rng.int(4, 7);
      els.push({ t: 'dots', cx, cy, pts: U.range(n).map(() => [cx + rng.float(-10, 10), cy + rng.float(-10, 10)]), r: rng.float(1.3, 2.1) });
    }
    return els;
  }

  // ---------- Geometrie ----------
  function bezier(p, t) {
    const u = 1 - t;
    return [0, 1].map(k => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]);
  }
  function center(el) {
    if (el.t === 'ell' || el.t === 'dot' || el.t === 'dots' || el.t === 'poly') return [el.cx, el.cy];
    if (el.t === 'zig') { const n = el.pts.length; return [el.pts.reduce((s, p) => s + p[0], 0) / n, el.pts.reduce((s, p) => s + p[1], 0) / n]; }
    return null;
  }
  function radius(el) {
    if (el.t === 'ell') return Math.max(el.rx, el.ry);
    if (el.t === 'poly') return el.R * 1.1;
    if (el.t === 'dot') return el.r;
    if (el.t === 'dots') return 11;
    if (el.t === 'zig') return 18;
    return 0;
  }
  const inRect = (p, r) => p[0] >= r[0] && p[0] <= r[2] && p[1] >= r[1] && p[1] <= r[3];

  // Ist der Mittelpunkt eines Elements durch später gezeichnete gefüllte Flächen verdeckt?
  function occluded(els, idx) {
    const c = center(els[idx]); if (!c) return false;
    for (let j = idx + 1; j < els.length; j++) {
      const e = els[j];
      if (e.t === 'ell' && Math.hypot(e.cx - c[0], e.cy - c[1]) < Math.max(e.rx, e.ry) + 2) return true;
      if (e.t === 'poly' && Math.hypot(e.cx - c[0], e.cy - c[1]) < e.R) return true;
    }
    return false;
  }

  // ---------- Rendering ----------
  function hatchLines(cx, cy, R, type) {
    const lines = [];
    const sp = 4.2;
    const dirs = type === 'cross' ? [45, 135] : [{ h45: 45, h135: 135, hor: 0, ver: 90 }[type]];
    for (const deg of dirs) {
      const a = deg * Math.PI / 180, dx = Math.cos(a), dy = -Math.sin(a), nx = -dy, ny = dx;
      for (let o = -R; o <= R; o += sp) {
        const px = cx + nx * o, py = cy + ny * o;
        lines.push(`M${r1(px - dx * R)} ${r1(py - dy * R)}L${r1(px + dx * R)} ${r1(py + dy * R)}`);
      }
    }
    return `<path d="${lines.join('')}" stroke="#111" stroke-width="0.9" fill="none"/>`;
  }
  function dotGrid(cx, cy, R) {
    let s = '';
    for (let x = cx - R; x <= cx + R; x += 4.5) for (let y = cy - R; y <= cy + R; y += 4.5) s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="0.95" fill="#111"/>`;
    return s;
  }
  function shapeTag(el, extra) {
    if (el.t === 'ell') return `<ellipse cx="${r1(el.cx)}" cy="${r1(el.cy)}" rx="${r1(el.rx)}" ry="${r1(el.ry)}" transform="rotate(${el.rot} ${r1(el.cx)} ${r1(el.cy)})" ${extra}/>`;
    return `<polygon points="${el.pts.map(p => r1(p[0]) + ',' + r1(p[1])).join(' ')}" ${extra}/>`;
  }
  function renderFilled(el) {
    const R = radius(el) + 2;
    const stroke = `stroke="#111" stroke-width="${r1(el.w)}"`;
    switch (el.fill) {
      case 'none': return shapeTag(el, `fill="#fff" ${stroke}`);
      case 'solid': return shapeTag(el, `fill="#111" ${stroke}`);
      case 'gray': return shapeTag(el, `fill="#a3a3a3" ${stroke}`);
      case 'ring': {
        const inner = Object.assign({}, el, { rx: el.rx * 0.5, ry: el.ry * 0.5, pts: el.pts && el.pts.map(p => [el.cx + (p[0] - el.cx) * 0.5, el.cy + (p[1] - el.cy) * 0.5]) });
        return shapeTag(el, `fill="#fff" ${stroke}`) + shapeTag(inner, `fill="#111" stroke="#111" stroke-width="1"`);
      }
      default: {
        const id = U.uid('mzc');
        const inner = el.fill === 'dots' ? dotGrid(el.cx, el.cy, R) : hatchLines(el.cx, el.cy, R, el.fill);
        return `<clipPath id="${id}">${shapeTag(el, '')}</clipPath>` + shapeTag(el, 'fill="#fff"') +
          `<g clip-path="url(#${id})">${inner}</g>` + shapeTag(el, `fill="none" ${stroke}`);
      }
    }
  }
  function renderEl(el) {
    switch (el.t) {
      case 'curve': {
        const p = el.p;
        return `<path d="M${r1(p[0][0])} ${r1(p[0][1])}C${r1(p[1][0])} ${r1(p[1][1])} ${r1(p[2][0])} ${r1(p[2][1])} ${r1(p[3][0])} ${r1(p[3][1])}" fill="none" stroke="#111" stroke-width="${r1(el.w)}"${el.dash ? ' stroke-dasharray="6 4"' : ''} stroke-linecap="round"/>`;
      }
      case 'ell': case 'poly': return renderFilled(el);
      case 'zig': return `<polyline points="${el.pts.map(p => r1(p[0]) + ',' + r1(p[1])).join(' ')}" fill="none" stroke="#111" stroke-width="${r1(el.w)}" stroke-linejoin="round" stroke-linecap="round"/>`;
      case 'dot': return `<circle cx="${r1(el.cx)}" cy="${r1(el.cy)}" r="${r1(el.r)}" fill="#111"/>`;
      case 'dots': return el.pts.map(p => `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r1(el.r)}" fill="#111"/>`).join('');
    }
    return '';
  }
  function renderSvg(els, vb, cls, overlay) {
    return `<svg class="${cls}" viewBox="${vb.join(' ')}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">` +
      `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="#fff"/>` +
      els.map(renderEl).join('') + (overlay || '') + '</svg>';
  }

  // ---------- Veränderungen für Distraktoren ----------
  function clone(els) { return els.map(e => JSON.parse(JSON.stringify(e))); }

  function differentFill(rng, f) {
    const groups = { none: ['solid', 'h45', 'cross', 'dots', 'gray'], solid: ['none', 'h45', 'ring', 'gray'], gray: ['none', 'solid', 'hor', 'dots'],
      h45: ['h135', 'none', 'cross', 'hor'], h135: ['h45', 'none', 'ver', 'cross'], hor: ['ver', 'none', 'h45', 'dots'], ver: ['hor', 'gray', 'h135'],
      cross: ['h45', 'none', 'dots', 'solid'], dots: ['none', 'gray', 'cross', 'hor'], ring: ['none', 'solid', 'dots'] };
    return rng.pick(groups[f] || ['none']);
  }

  function tryMutation(rng, els, win, difficulty) {
    const inner = [win[0] + INNER, win[1] + INNER, win[0] + WIN - INNER, win[1] + WIN - INNER];
    const cands = [];
    els.forEach((el, i) => {
      if (el.t === 'curve') {
        let hits = 0;
        for (let t = 0; t <= 1; t += 0.02) if (inRect(bezier(el.p, t), inner)) hits++;
        if (hits >= 6) cands.push({ i, type: 'thick' });
        return;
      }
      const c = center(el);
      if (!c || !inRect(c, inner) || occluded(els, i)) return;
      const R = radius(el);
      if (el.t === 'ell') {
        if (R < 26) cands.push({ i, type: 'fill' });
        if (R < 22) cands.push({ i, type: 'remove' });
        if (R < 20) cands.push({ i, type: 'resize' });
        if (R < 16) cands.push({ i, type: 'shift' });
      } else if (el.t === 'poly') {
        cands.push({ i, type: 'fill' }, { i, type: 'rotate' });
      } else if (el.t === 'zig') {
        cands.push({ i, type: 'remove' }, { i, type: 'mirror' });
      } else if (el.t === 'dot') {
        cands.push({ i, type: 'remove' }, { i, type: 'shift' });
      } else if (el.t === 'dots' && el.pts.length >= 4) {
        cands.push({ i, type: 'remove' });
      }
    });
    cands.push({ i: -1, type: 'add' });
    const weight = c => {
      const easy = { fill: 3, remove: 3, add: 2, mirror: 2, rotate: 2, resize: 1.5, thick: 1, shift: 1 };
      const hard = { fill: 1.5, remove: 1.5, add: 1.5, mirror: 2, rotate: 2, resize: 2.5, thick: 2, shift: 3 };
      return easy[c.type] * (1 - difficulty) + hard[c.type] * difficulty;
    };
    for (let attempt = 0; attempt < 8; attempt++) {
      const c = rng.weighted(cands, cands.map(weight));
      const out = clone(els);
      const el = c.i >= 0 ? out[c.i] : null;
      let desc = '';
      switch (c.type) {
        case 'fill': { const nf = differentFill(rng, el.fill); desc = `Eine Fläche ist ${FILL_NAMES[nf]} statt ${FILL_NAMES[el.fill]}.`; el.fill = nf; break; }
        case 'remove': out.splice(c.i, 1); desc = { ell: 'Eine Ellipse/ein Kreis fehlt.', zig: 'Eine Zickzacklinie fehlt.', dot: 'Ein schwarzer Punkt fehlt.', dots: 'Eine Gruppe kleiner Punkte fehlt.' }[el.t]; break;
        case 'resize': { const f = rng.chance(0.5) ? 0.62 : 1.38; el.rx *= f; el.ry *= f; desc = `Eine Ellipse ist ${f < 1 ? 'kleiner' : 'größer'} gezeichnet.`; break; }
        case 'shift': {
          const a = rng.float(0, Math.PI * 2), d = 7 + 3 * (1 - difficulty);
          el.cx += d * Math.cos(a); el.cy += d * Math.sin(a);
          if (!inRect([el.cx, el.cy], inner)) continue;
          desc = 'Ein Element ist verschoben.'; break;
        }
        case 'rotate': {
          const a = rng.sign() * rng.float(0.5, 0.8), co = Math.cos(a), si = Math.sin(a);
          el.pts = el.pts.map(p => [el.cx + (p[0] - el.cx) * co - (p[1] - el.cy) * si, el.cy + (p[0] - el.cx) * si + (p[1] - el.cy) * co]);
          desc = 'Ein Vieleck ist gedreht.'; break;
        }
        case 'mirror': {
          const cc = center(el);
          el.pts = el.pts.map(p => [2 * cc[0] - p[0], p[1]]);
          desc = 'Eine Zickzacklinie ist gespiegelt.'; break;
        }
        case 'thick': {
          if (el.w > 2.2) { el.w = 0.8; desc = 'Eine Linie ist deutlich dünner.'; } else { el.w = el.w * 2.4; desc = 'Eine Linie ist deutlich dicker.'; }
          break;
        }
        case 'add': {
          let pos = null;
          for (let k = 0; k < 30 && !pos; k++) {
            const p = [rng.float(inner[0], inner[2]), rng.float(inner[1], inner[3])];
            if (out.every(e => { const ce = center(e); return !ce || Math.hypot(ce[0] - p[0], ce[1] - p[1]) > radius(e) + 7; })) pos = p;
          }
          if (!pos) continue;
          const kind = rng.pick(['dot', 'ring', 'dots']);
          if (kind === 'dot') out.push({ t: 'dot', cx: pos[0], cy: pos[1], r: 4.2 });
          else if (kind === 'ring') out.push({ t: 'ell', cx: pos[0], cy: pos[1], rx: 7, ry: 5.5, rot: rng.int(0, 179), fill: 'ring', w: 1.3 });
          else out.push({ t: 'dots', cx: pos[0], cy: pos[1], pts: U.range(5).map(() => [pos[0] + rng.float(-6, 6), pos[1] + rng.float(-6, 6)]), r: 1.8 });
          desc = 'Ein zusätzliches Element ist eingefügt.'; break;
        }
      }
      return { els: out, desc };
    }
    return null;
  }

  function randWin(rng) { return [Math.round(rng.float(0, W - WIN)), Math.round(rng.float(0, H - WIN))]; }

  function makeItem(rng, idx) {
    const difficulty = idx / 23;
    const els = genScene(rng);
    const correctWin = randWin(rng);
    const variants = [{ els, win: correctWin, desc: null }];
    let guard = 0;
    while (variants.length < 5 && guard++ < 200) {
      const win = randWin(rng);
      const m = tryMutation(rng, els, [win[0], win[1]], difficulty);
      if (m) variants.push({ els: m.els, win, desc: m.desc });
    }
    const order = rng.shuffle(U.range(5));
    const opts = order.map(k => variants[k]);
    const correct = order.indexOf(0);
    const exSvg = v => `<div class="paper mz-ex">${renderSvg(v.els, [v.win[0], v.win[1], WIN, WIN], 'mz-ex-svg')}</div>`;
    return {
      stem: `<div class="mz-pattern paper">${renderSvg(els, [0, 0, W, H], 'mz-pat-svg')}</div>`,
      options: opts.map(exSvg),
      correct,
      layout: 'grid',
      explanation: () => {
        const c = opts[correct];
        const overlay = `<rect x="${c.win[0]}" y="${c.win[1]}" width="${WIN}" height="${WIN}" fill="none" stroke="#e11d48" stroke-width="2.5"/>`;
        return `<p>Ausschnitt <b>(${U.LETTERS[correct]})</b> passt an der rot markierten Stelle deckungsgleich auf das Muster.</p>
          <div class="mz-pattern paper small">${renderSvg(els, [0, 0, W, H], 'mz-pat-svg', overlay)}</div>
          <ul class="expl-list">${opts.map((o, i) => i === correct ? '' : `<li><b>(${U.LETTERS[i]})</b>: ${o.desc}</li>`).join('')}</ul>`;
      }
    };
  }

  T.gen.mz = function (seed) {
    const rng = new RNG(seed);
    return { items: U.range(24).map(i => makeItem(rng.fork('mz' + i), i)) };
  };
})(window.TMS);
