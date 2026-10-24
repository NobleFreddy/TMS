/* Diagramme und Tabellen: generierte Datensätze + berechnete Aussagen (ableitbar / nicht ableitbar) */
(function (T) {
  'use strict';
  const RNG = T.RNG, U = T.util;
  const N = (x, d) => U.fmt(x, d === undefined ? 1 : d);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const GRAYS = ['#1f1f1f', '#8a8a8a', '#d4d4d4', '#5a5a5a', '#f2f2f2'];

  function niceMax(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
      const max = m * p;
      if (max >= v) {
        const steps = [p / 5, p / 4, p / 2, p, 2 * p].map(s => s);
        const step = steps.find(s => max / s <= 6 && Math.abs(max / s - Math.round(max / s)) < 1e-9) || max / 5;
        return { max, step };
      }
    }
    return { max: v, step: v / 5 };
  }

  // ---------- SVG-Diagramme ----------
  function axisFrame(W, H, L, B, Tp, R, ymax, step, yLabel) {
    const ph = H - Tp - B;
    let s = '';
    for (let v = 0; v <= ymax + 1e-9; v += step) {
      const y = Tp + ph - v / ymax * ph;
      s += `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" stroke="#e3e3e3" stroke-width="1"/>`;
      s += `<text x="${L - 6}" y="${y + 4}" text-anchor="end" font-size="11">${N(v, 2)}</text>`;
    }
    s += `<line x1="${L}" y1="${Tp}" x2="${L}" y2="${Tp + ph}" stroke="#111"/><line x1="${L}" y1="${Tp + ph}" x2="${W - R}" y2="${Tp + ph}" stroke="#111"/>`;
    s += `<text transform="translate(14 ${Tp + ph / 2}) rotate(-90)" text-anchor="middle" font-size="11">${yLabel}</text>`;
    return s;
  }

  function legend(names, style) {
    return `<div class="dt-legend">${names.map((n, i) => style(i) + `<span>${n}</span>`).join('')}</div>`;
  }

  function barChart(d) {
    const W = 560, H = 300, L = 58, B = 46, Tp = 14, R = 12;
    const { max, step } = niceMax(Math.max(...d.series.flatMap(s => s.values)) * 1.05);
    const pw = W - L - R, ph = H - Tp - B, nC = d.cats.length, nS = d.series.length;
    const gw = pw / nC, bw = gw * 0.72 / nS;
    let s = axisFrame(W, H, L, B, Tp, R, max, step, d.yLabel);
    d.cats.forEach((c, ci) => {
      d.series.forEach((se, si) => {
        const v = se.values[ci], h = v / max * ph;
        const x = L + ci * gw + gw * 0.14 + si * bw;
        s += `<rect x="${x.toFixed(1)}" y="${(Tp + ph - h).toFixed(1)}" width="${(bw - 1).toFixed(1)}" height="${h.toFixed(1)}" fill="${GRAYS[si]}" stroke="#111" stroke-width="0.8"/>`;
      });
      s += `<text x="${(L + ci * gw + gw / 2).toFixed(1)}" y="${Tp + ph + 16}" text-anchor="middle" font-size="11">${c}</text>`;
    });
    if (d.xLabel) s += `<text x="${L + pw / 2}" y="${H - 6}" text-anchor="middle" font-size="11">${d.xLabel}</text>`;
    return `<div class="dt-chart paper"><svg viewBox="0 0 ${W} ${H}" class="dt-svg" font-family="Arial, sans-serif">${s}</svg>` +
      legend(d.series.map(x => x.name), i => `<i class="sw" style="background:${GRAYS[i]}"></i>`) + '</div>';
  }

  const MARKERS = [
    (x, y) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#111"/>`,
    (x, y) => `<rect x="${x - 3.4}" y="${y - 3.4}" width="6.8" height="6.8" fill="#fff" stroke="#111" stroke-width="1.4"/>`,
    (x, y) => `<path d="M${x} ${y - 4.4}L${x + 4} ${y + 3}L${x - 4} ${y + 3}Z" fill="#777" stroke="#111" stroke-width="1"/>`
  ];
  const DASH = ['', '6 4', '2 3'];

  function lineChart(d) {
    const W = 560, H = 300, L = 58, B = 46, Tp = 14, R = 14;
    const { max, step } = niceMax(Math.max(...d.series.flatMap(s => s.values)) * 1.05);
    const pw = W - L - R, ph = H - Tp - B;
    const xmax = d.x[d.x.length - 1], xmin = d.x[0];
    const X = v => L + (v - xmin) / (xmax - xmin) * pw, Y = v => Tp + ph - v / max * ph;
    let s = axisFrame(W, H, L, B, Tp, R, max, step, d.yLabel);
    d.x.forEach((xv, i) => {
      if (i % (d.xTickEvery || 1)) return;
      s += `<line x1="${X(xv)}" y1="${Tp}" x2="${X(xv)}" y2="${Tp + ph}" stroke="#f0f0f0"/>`;
      s += `<text x="${X(xv)}" y="${Tp + ph + 16}" text-anchor="middle" font-size="11">${N(xv, 1)}</text>`;
    });
    s += `<text x="${L + pw / 2}" y="${H - 6}" text-anchor="middle" font-size="11">${d.xLabel}</text>`;
    d.series.forEach((se, si) => {
      const pts = se.values.map((v, i) => [X(d.x[i]).toFixed(1), Y(v).toFixed(1)]);
      s += `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="#111" stroke-width="1.6" ${DASH[si] ? `stroke-dasharray="${DASH[si]}"` : ''}/>`;
      pts.forEach(p => { s += MARKERS[si](Number(p[0]), Number(p[1])); });
    });
    return `<div class="dt-chart paper"><svg viewBox="0 0 ${W} ${H}" class="dt-svg" font-family="Arial, sans-serif">${s}</svg>` +
      legend(d.series.map(x => x.name), i => `<svg class="sw-line" viewBox="0 0 30 12"><line x1="0" y1="6" x2="30" y2="6" stroke="#111" stroke-width="1.6" ${DASH[i] ? `stroke-dasharray="${DASH[i]}"` : ''}/>${MARKERS[i](15, 6)}</svg>`) + '</div>';
  }

  function stackedChart(d) {
    const W = 560, rowH = 34, L = 92, R = 26, Tp = 10;
    const H = Tp + d.cats.length * (rowH + 12) + 26;
    const pw = W - L - R;
    let s = '';
    for (let v = 0; v <= 100; v += 20) {
      const x = L + v / 100 * pw;
      s += `<line x1="${x}" y1="${Tp - 2}" x2="${x}" y2="${H - 22}" stroke="#e3e3e3"/><text x="${x}" y="${H - 8}" text-anchor="middle" font-size="11">${v} %</text>`;
    }
    d.cats.forEach((c, ci) => {
      const y = Tp + ci * (rowH + 12);
      let acc = 0;
      s += `<text x="${L - 8}" y="${y + rowH / 2 + 4}" text-anchor="end" font-size="11">${c}</text>`;
      d.parts.forEach((p, pi) => {
        const v = p.values[ci], x = L + acc / 100 * pw, w = v / 100 * pw;
        s += `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${rowH}" fill="${GRAYS[pi]}" stroke="#111" stroke-width="0.8"/>`;
        if (w > 24) s += `<text x="${(x + w / 2).toFixed(1)}" y="${y + rowH / 2 + 4}" text-anchor="middle" font-size="11" fill="${pi === 0 || pi === 3 ? '#fff' : '#111'}">${v}</text>`;
        acc += v;
      });
    });
    return `<div class="dt-chart paper"><svg viewBox="0 0 ${W} ${H}" class="dt-svg" font-family="Arial, sans-serif">${s}</svg>` +
      legend(d.parts.map(x => x.name), i => `<i class="sw" style="background:${GRAYS[i]}"></i>`) + '</div>';
  }

  function tableHtml(d) {
    return `<div class="dt-chart paper"><table class="dt-table"><thead><tr><th>${d.corner || ''}</th>${d.cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>` +
      d.rows.map((r, i) => `<tr><th>${r}</th>${d.vals[i].map(v => `<td>${typeof v === 'number' ? N(v, d.dec === undefined ? 1 : d.dec) : v}</td>`).join('')}</tr>`).join('') + '</tbody></table></div>';
  }

  // ---------- Aussagen-Helfer ----------
  function St(text, truth, key, why) { return { text, truth, key, why }; }
  const argmax = a => a.indexOf(Math.max(...a));
  const argmin = a => a.indexOf(Math.min(...a));
  const sorted = a => a.slice().sort((x, y) => y - x);

  // ---------- 1) Gruppierte Balken ----------
  const BAR_CTX = [
    rng => {
      const dis = rng.pick(['Magengeschwür', 'Lungenentzündung', 'Gallensteinen', 'Herzinsuffizienz', 'Hüftfraktur', 'Diabetes mellitus']);
      const cats = rng.pick([['20–39', '40–54', '55–64', '65–74', '≥ 75'], ['18–34', '35–49', '50–64', '≥ 65']]);
      const menMore = rng.chance(0.5);
      const series = ['Männer', 'Frauen'].map((n, si) => {
        let v = rng.float(20, 90), g = rng.float(1.15, 1.8);
        if ((si === 0) === menMore) v *= rng.float(1.2, 1.9);
        return { name: n, values: cats.map((c, i) => { const x = v * Math.pow(g, i) * rng.float(0.8, 1.2); if (rng.chance(0.15) && i > 0) return Math.round(x * 0.55 / 5) * 5; return Math.round(x / 5) * 5; }) };
      });
      return {
        intro: `Das Diagramm zeigt, wie viele Personen pro 100 000 Einwohner der jeweiligen Altersgruppe im Jahr 2023 wegen ${dis} stationär behandelt wurden – getrennt nach Geschlecht.`,
        data: { cats, series, yLabel: 'Fälle je 100 000', xLabel: 'Altersgruppe (Jahre)' },
        rate: true, catOrdinal: true, seriesOrdinal: false,
        val: 'die Zahl der stationär Behandelten je 100 000 Einwohner',
        cP: c => `in der Altersgruppe ${c}`, cAll: 'in allen Altersgruppen', sP: s => `bei ${s === 'Männer' ? 'Männern' : 'Frauen'}`,
        pair: () => 'Männern und Frauen', trendWord: 'mit zunehmendem Alter',
        unknown: [
          `Der Unterschied zwischen Männern und Frauen ist vor allem auf Unterschiede im Lebensstil zurückzuführen.`,
          `Das Risiko, wegen ${dis} stationär behandelt zu werden, ist für Frauen über 65 Jahre geringer als das Risiko, an einer anderen Krankheit zu erkranken.`
        ],
        absolute: (c) => `In der Altersgruppe ${c} wurden absolut mehr Männer als Frauen wegen ${dis} stationär behandelt.`
      };
    },
    rng => {
      const cats = ['Nord', 'Ost', 'Süd', 'West', 'Mitte'];
      const years = ['2010', '2015', '2020'];
      const base = cats.map(() => rng.float(68, 88));
      const series = years.map((y, yi) => ({ name: y, values: cats.map((c, i) => Math.min(99, Math.round(base[i] + yi * rng.float(-2, 7)))) }));
      return {
        intro: 'Das Diagramm zeigt den Anteil der Schulanfänger (in Prozent), die in fünf Regionen eines Landes vollständig gegen Masern geimpft waren, für drei Untersuchungsjahre.',
        data: { cats, series, yLabel: 'Impfquote (%)', xLabel: 'Region' },
        rate: true, catOrdinal: false, seriesOrdinal: true,
        val: 'die Impfquote', cP: c => `in der Region ${c}`, cAll: 'in allen Regionen', sP: s => `im Jahr ${s}`,
        pair: (a, b) => `den Jahren ${a} und ${b}`, trendWord: 'von Untersuchungsjahr zu Untersuchungsjahr',
        unknown: [
          'Der Anstieg der Impfquote ist auf eine landesweite Aufklärungskampagne zurückzuführen.',
          'In Regionen mit hoher Impfquote erkranken weniger Kinder an Masern.'
        ],
        absolute: (c) => `In der Region ${c} wurden im Jahr 2020 mehr Kinder gegen Masern geimpft als in jeder anderen Region.`
      };
    },
    rng => {
      const cats = ['20–34', '35–49', '50–64', '≥ 65'];
      const names = ['Mischkost', 'vegetarisch', 'vegan'];
      const series = names.map((n, si) => {
        const b = rng.float(160, 200) - si * rng.float(5, 22);
        return { name: n, values: cats.map((c, i) => Math.round(b + i * rng.float(4, 18) + rng.float(-8, 8))) };
      });
      return {
        intro: 'In einer Querschnittsstudie wurde die mittlere Gesamtcholesterin-Konzentration im Blut (in mg/dl) von Erwachsenen mit drei verschiedenen Ernährungsformen in vier Altersgruppen bestimmt.',
        data: { cats, series, yLabel: 'Cholesterin (mg/dl)', xLabel: 'Altersgruppe (Jahre)' },
        rate: false, catOrdinal: true, seriesOrdinal: false,
        val: 'die mittlere Cholesterinkonzentration', cP: c => `in der Altersgruppe ${c}`, cAll: 'in allen Altersgruppen', sP: s => s === 'Mischkost' ? 'bei Mischkost' : `bei ${s}er Ernährung`,
        pair: (a, b) => `${a === 'Mischkost' ? 'Mischkost' : a + 'er Ernährung'} und ${b === 'Mischkost' ? 'Mischkost' : b + 'er Ernährung'}`, trendWord: 'mit zunehmendem Alter',
        unknown: [
          'Eine vegane Ernährung senkt die Cholesterinkonzentration im Blut.',
          'Menschen, die sich vegetarisch ernähren, erkranken seltener an Herz-Kreislauf-Erkrankungen.'
        ],
        absolute: null
      };
    },
    rng => {
      const cats = rng.sample(['Fußball', 'Skifahren', 'Reiten', 'Radfahren', 'Handball', 'Turnen', 'Basketball'], 5);
      const series = ['Männer', 'Frauen'].map(n => ({ name: n, values: cats.map(() => Math.round(rng.float(4, 60))) }));
      return {
        intro: 'Das Diagramm zeigt die Zahl der Krankenhausaufenthalte (in Tausend) aufgrund von Sportverletzungen in einem Jahr, aufgeschlüsselt nach Sportart und Geschlecht.',
        data: { cats, series, yLabel: 'Aufenthalte (in Tausend)', xLabel: 'Sportart' },
        rate: false, catOrdinal: false, seriesOrdinal: false,
        val: 'die Zahl der Krankenhausaufenthalte', cP: c => `beim ${c}`, cAll: 'bei allen Sportarten', sP: s => `bei ${s === 'Männer' ? 'Männern' : 'Frauen'}`,
        pair: () => 'Männern und Frauen', trendWord: null,
        unknown: [
          `${cats[0]} ist die Sportart mit dem höchsten Verletzungsrisiko pro aktiver Person.`,
          'Frauen verletzen sich beim Sport seltener, weil sie vorsichtiger sind.'
        ],
        absolute: null
      };
    }
  ];

  function barStatements(rng, c) {
    const { cats, series } = c.data;
    const all = series.flatMap(s => s.values);
    const m = Math.max(...all) * 0.07;
    const out = [];
    series.forEach((s, si) => {
      const v = s.values, mx = argmax(v), srt = sorted(v);
      if (srt[0] - srt[1] >= m) out.push(St(`${cap(c.val)} ist ${c.sP(s.name)} ${c.cP(cats[mx])} am höchsten.`, true, 'max' + si, `Höchster Wert ${c.sP(s.name)}: ${cats[mx]} (≈ ${N(v[mx], 0)}).`));
      v.forEach((x, ci) => { if (srt[0] - x >= m * 1.5) out.push(St(`${cap(c.val)} ist ${c.sP(s.name)} ${c.cP(cats[ci])} am höchsten.`, false, 'max' + si, `Der höchste Wert ${c.sP(s.name)} liegt ${c.cP(cats[mx])} (≈ ${N(v[mx], 0)}), nicht ${c.cP(cats[ci])} (≈ ${N(x, 0)}).`)); });
      if (c.catOrdinal) {
        const diffs = v.slice(1).map((x, i) => x - v[i]);
        if (diffs.every(dd => dd >= m * 0.6)) out.push(St(`${cap(c.val)} steigt ${c.sP(s.name)} ${c.trendWord} kontinuierlich an.`, true, 'trend' + si, 'Jeder Wert ist höher als der vorherige.'));
        else if (diffs.some(dd => dd <= -m * 0.6)) out.push(St(`${cap(c.val)} steigt ${c.sP(s.name)} ${c.trendWord} kontinuierlich an.`, false, 'trend' + si, 'Zwischen zwei benachbarten Gruppen nimmt der Wert ab.'));
      }
    });
    for (let a = 0; a < series.length; a++) for (let b = 0; b < series.length; b++) {
      if (a === b) continue;
      const A = series[a], B = series[b];
      cats.forEach((cat, ci) => {
        const x = A.values[ci], y = B.values[ci];
        if (a < b) {
          if (x - y >= m) out.push(St(`${cap(c.cP(cat))} ist ${c.val} ${c.sP(A.name)} höher als ${c.sP(B.name)}.`, true, 'cmp' + ci, `${N(x, 0)} gegenüber ${N(y, 0)}.`));
          else if (y - x >= m) out.push(St(`${cap(c.cP(cat))} ist ${c.val} ${c.sP(A.name)} höher als ${c.sP(B.name)}.`, false, 'cmp' + ci, `${N(x, 0)} gegenüber ${N(y, 0)} – es ist umgekehrt.`));
        }
        if (y > 0) {
          const r = x / y;
          if (r >= 2.3) out.push(St(`${cap(c.cP(cat))} ist ${c.val} ${c.sP(A.name)} mehr als doppelt so hoch wie ${c.sP(B.name)}.`, true, 'ratio' + ci, `${N(x, 0)} : ${N(y, 0)} ≈ ${N(r, 1)}.`));
          else if (r >= 1.15 && r <= 1.7) out.push(St(`${cap(c.cP(cat))} ist ${c.val} ${c.sP(A.name)} mehr als doppelt so hoch wie ${c.sP(B.name)}.`, false, 'ratio' + ci, `${N(x, 0)} : ${N(y, 0)} ≈ ${N(r, 1)} – also weniger als das Doppelte.`));
        }
      });
      const ds = A.values.map((x, i) => x - B.values[i]);
      if (ds.every(d => d >= m * 0.5)) out.push(St(`${cap(c.val)} ist ${c.cAll} ${c.sP(A.name)} höher als ${c.sP(B.name)}.`, true, 'all' + a + b, 'In jeder Gruppe liegt der Wert höher.'));
      else if (ds.some(d => d <= -m) && ds.filter(d => d > 0).length >= cats.length / 2) out.push(St(`${cap(c.val)} ist ${c.cAll} ${c.sP(A.name)} höher als ${c.sP(B.name)}.`, false, 'all' + a + b, 'In mindestens einer Gruppe ist es umgekehrt.'));
      if (a < b) {
        const ad = ds.map(Math.abs), mx = argmax(ad), s2 = sorted(ad);
        if (s2[0] - s2[1] >= m) out.push(St(`Der Unterschied zwischen ${c.pair(A.name, B.name)} ist ${c.cP(cats[mx])} am größten.`, true, 'diff' + a + b, `Differenz dort ≈ ${N(ad[mx], 0)}.`));
        const small = ad.findIndex(d => s2[0] - d >= m * 1.5);
        if (small >= 0) out.push(St(`Der Unterschied zwischen ${c.pair(A.name, B.name)} ist ${c.cP(cats[small])} am größten.`, false, 'diff' + a + b, `Dort beträgt er nur ≈ ${N(ad[small], 0)}, ${c.cP(cats[mx])} dagegen ≈ ${N(ad[mx], 0)}.`));
      }
    }
    if (c.seriesOrdinal && series.length >= 3) {
      const inc = cats.map((cat, ci) => series.slice(1).every((s, k) => s.values[ci] - series[k].values[ci] >= m * 0.3));
      const dec = cats.map((cat, ci) => series.slice(1).some((s, k) => s.values[ci] - series[k].values[ci] <= -m * 0.3));
      if (inc.every(Boolean)) out.push(St(`${cap(c.val)} ist ${c.cAll} ${c.trendWord} gestiegen.`, true, 'strend', 'In jeder Region nimmt der Wert über die Jahre zu.'));
      else if (dec.some(Boolean)) out.push(St(`${cap(c.val)} ist ${c.cAll} ${c.trendWord} gestiegen.`, false, 'strend', `${cap(c.cP(cats[dec.indexOf(true)]))} sinkt der Wert zwischen zwei Untersuchungsjahren.`));
    }
    c.unknown.forEach((t, i) => out.push(St(t, null, 'unk' + i, 'Darüber enthält das Diagramm keine Information (nicht ableitbar).')));
    if (c.absolute && c.rate) out.push(St(c.absolute(rng.pick(cats)), null, 'abs', 'Das Diagramm zeigt nur Raten bzw. Anteile – absolute Zahlen lassen sich ohne Angabe der Gruppengrößen nicht ableiten.'));
    return out;
  }

  // ---------- 2) Linien ----------
  function bump(t, ka, ke) { return Math.exp(-ke * t) - Math.exp(-ka * t); }

  const LINE_CTX = [
    rng => {
      const x = U.range(13);
      const names = ['Präparat A', 'Präparat B', 'Präparat C'].slice(0, rng.chance(0.7) ? 3 : 2);
      const series = names.map(n => {
        const ka = rng.float(0.5, 2.6), ke = rng.float(0.08, Math.min(0.45, ka * 0.6)), cmax = rng.float(2.5, 9);
        const raw = x.map(t => bump(t, ka, ke)), pk = Math.max(...raw);
        return { name: n, values: raw.map(v => Math.round(v / pk * cmax * 10) / 10) };
      });
      const S = s => s;
      return {
        type: 'pk', thrStep: 0.5, x, series, xLabel: 'Zeit nach Einnahme (Stunden)', yLabel: 'Plasmakonzentration (mg/l)', unitX: 'Stunden', unitY: 'mg/l',
        intro: 'Das Diagramm zeigt den Verlauf der Plasmakonzentration verschiedener Präparate nach einmaliger oraler Einnahme derselben Wirkstoffmenge.',
        peakEarlier: (a, b) => `${S(a)} erreicht seine maximale Plasmakonzentration früher als ${S(b)}.`,
        peakHigher: (a, b) => `Die maximale Plasmakonzentration von ${S(a)} ist höher als die von ${S(b)}.`,
        higherAt: (a, b, t) => `${t} Stunden nach der Einnahme ist die Plasmakonzentration von ${S(a)} höher als die von ${S(b)}.`,
        cross: (a, b) => `Die Kurven von ${S(a)} und ${S(b)} schneiden sich nach der ersten Stunde im dargestellten Zeitraum.`,
        above: (a, t1, t2, thr) => `Die Plasmakonzentration von ${S(a)} liegt zwischen der ${t1}. und der ${t2}. Stunde durchgehend über ${N(thr)} mg/l.`,
        half: (a, t) => `${t} Stunden nach der Einnahme ist die Plasmakonzentration von ${S(a)} auf weniger als die Hälfte ihres Maximalwerts gesunken.`,
        unknown: ['Bei doppelter Dosis würde jedes Präparat eine doppelt so hohe maximale Plasmakonzentration erreichen.', `${names[0]} ist das am besten wirksame Präparat.`, `${names[1]} wird langsamer abgebaut, weil es stärker an Plasmaproteine gebunden wird.`]
      };
    },
    rng => {
      const x = U.range(13).map(i => i * 15);
      const names = rng.sample(['Weißbrot', 'Vollkornbrot', 'Linsen', 'Banane', 'Haferflocken', 'Apfelsaft'], 3);
      const series = names.map(n => {
        const ka = rng.float(0.03, 0.09), ke = rng.float(0.008, 0.025), amp = rng.float(25, 85);
        const raw = x.map(t => bump(t, ka, ke)), pk = Math.max(...raw);
        return { name: n, values: raw.map(v => Math.round(85 + v / pk * amp)) };
      });
      const S = s => `dem Verzehr von ${s}`;
      return {
        type: 'bz', thrStep: 5, x, series, xLabel: 'Zeit nach Verzehr (Minuten)', yLabel: 'Blutzucker (mg/dl)', unitX: 'Minuten', unitY: 'mg/dl', xTickEvery: 2,
        intro: 'Gesunde Versuchspersonen verzehrten jeweils eine Portion eines Lebensmittels, die 50 g Kohlenhydrate enthielt. Das Diagramm zeigt den mittleren Verlauf der Blutzuckerkonzentration.',
        peakEarlier: (a, b) => `Nach ${S(a)} wird das Blutzuckermaximum früher erreicht als nach ${S(b)}.`,
        peakHigher: (a, b) => `Nach ${S(a)} steigt der Blutzucker auf einen höheren Maximalwert als nach ${S(b)}.`,
        higherAt: (a, b, t) => `${t} Minuten nach ${S(a)} ist der Blutzucker höher als ${t} Minuten nach ${S(b)}.`,
        cross: (a, b) => `Die Kurven für ${a} und ${b} schneiden sich im dargestellten Zeitraum.`,
        above: (a, t1, t2, thr) => `Nach ${S(a)} liegt der Blutzucker zwischen Minute ${t1} und Minute ${t2} durchgehend über ${N(thr, 0)} mg/dl.`,
        half: null, minLevel: 85,
        unknown: [`${names[0]} sättigt länger als ${names[1]}.`, `Für Menschen mit Diabetes ist ${names[2]} am besten geeignet.`, 'Bei Verzehr der doppelten Menge würde der Blutzucker doppelt so stark ansteigen.']
      };
    },
    rng => {
      const x = U.range(13);
      const names = ['25 °C', '30 °C', '37 °C'];
      const series = names.map(n => {
        const K = rng.float(50, 100), r = rng.float(0.45, 1.4), n0 = rng.float(0.8, 2.5);
        return { name: n, values: x.map(t => Math.round(K / (1 + (K / n0 - 1) * Math.exp(-r * t)) * 10) / 10) };
      });
      const S = s => `bei ${s}`;
      return {
        type: 'bac', thrStep: 5, x, series, xLabel: 'Zeit (Stunden)', yLabel: 'Bakterien (Mio. pro ml)', unitX: 'Stunden', unitY: 'Mio./ml',
        intro: 'Drei Kulturen desselben Bakterienstamms wurden in gleichem Nährmedium, aber bei unterschiedlichen Temperaturen gehalten. Das Diagramm zeigt die Bakterienzahl im Verlauf von 12 Stunden.',
        peakEarlier: null,
        peakHigher: (a, b) => `Am Ende des Beobachtungszeitraums ist die Bakterienzahl ${S(a)} höher als ${S(b)}.`,
        higherAt: (a, b, t) => `Nach ${t} Stunden ist die Bakterienzahl ${S(a)} höher als ${S(b)}.`,
        cross: (a, b) => `Die Kurven für die Kulturen ${S(a)} und ${S(b)} schneiden sich im dargestellten Zeitraum.`,
        above: (a, t1, t2, thr) => `Die Bakterienzahl ${S(a)} liegt zwischen der ${t1}. und der ${t2}. Stunde durchgehend über ${N(thr, 0)} Mio. pro ml.`,
        half: null, final: true,
        unknown: ['Bei 42 °C würden sich die Bakterien noch schneller vermehren.', 'Die Bakterien sterben nach 12 Stunden ab, weil die Nährstoffe verbraucht sind.']
      };
    }
  ];

  function lineStatements(rng, c) {
    const S = c.series, x = c.x;
    const all = S.flatMap(s => s.values);
    const m = Math.max(...all) * 0.07;
    const out = [];
    const peakIdx = s => argmax(s.values);
    const lastIdx = x.length - 1;
    for (let a = 0; a < S.length; a++) for (let b = 0; b < S.length; b++) {
      if (a === b) continue;
      const A = S[a], B = S[b];
      if (c.peakEarlier) {
        const pa = peakIdx(A), pb = peakIdx(B);
        if (pb - pa >= 2) out.push(St(c.peakEarlier(A.name, B.name), true, 'pe' + a + b, `Maximum ${A.name} bei ${x[pa]}, ${B.name} bei ${x[pb]} ${c.unitX}.`));
        else if (pa - pb >= 2) out.push(St(c.peakEarlier(A.name, B.name), false, 'pe' + a + b, `Maximum ${A.name} erst bei ${x[pa]}, ${B.name} schon bei ${x[pb]} ${c.unitX}.`));
      }
      const va = c.final ? A.values[lastIdx] : Math.max(...A.values), vb = c.final ? B.values[lastIdx] : Math.max(...B.values);
      if (a < b || rng.chance(0.3)) {
        if (va - vb >= m) out.push(St(c.peakHigher(A.name, B.name), true, 'ph' + a + b, `≈ ${N(va)} gegenüber ≈ ${N(vb)} ${c.unitY}.`));
        else if (vb - va >= m) out.push(St(c.peakHigher(A.name, B.name), false, 'ph' + a + b, `≈ ${N(va)} gegenüber ≈ ${N(vb)} ${c.unitY} – umgekehrt.`));
      }
      if (a < b) {
        const idxs = rng.sample(U.range(x.length).slice(1), 4);
        for (const i of idxs) {
          const d = A.values[i] - B.values[i];
          if (d >= m) { out.push(St(c.higherAt(A.name, B.name, x[i]), true, 'ha' + i, `Bei ${x[i]} ${c.unitX}: ≈ ${N(A.values[i])} gegenüber ≈ ${N(B.values[i])}.`)); break; }
          if (d <= -m) { out.push(St(c.higherAt(A.name, B.name, x[i]), false, 'ha' + i, `Bei ${x[i]} ${c.unitX}: ≈ ${N(A.values[i])} gegenüber ≈ ${N(B.values[i])} – umgekehrt.`)); break; }
        }
        const d = A.values.map((v, i) => v - B.values[i]).slice(c.type === 'pk' ? 1 : 0);
        const pos = d.some(v => v >= m * 0.8), neg = d.some(v => v <= -m * 0.8);
        if (pos && neg) out.push(St(c.cross(A.name, B.name), true, 'cr' + a + b, 'Mal liegt die eine, mal die andere Kurve deutlich höher.'));
        else if (d.every(v => v >= m * 0.5) || d.every(v => v <= -m * 0.5)) out.push(St(c.cross(A.name, B.name), false, 'cr' + a + b, 'Eine Kurve liegt durchgehend über der anderen.'));
      }
    }
    S.forEach((A, a) => {
      const t1 = rng.int(1, Math.floor(lastIdx / 2)), t2 = t1 + rng.int(2, 4);
      if (t2 <= lastIdx) {
        const seg = A.values.slice(t1, t2 + 1), mn = Math.min(...seg);
        const base = c.minLevel || 0;
        const st = c.thrStep, thrT = Math.floor((mn - m) / st) * st, thrF = Math.ceil((mn + m) / st) * st;
        if (thrT > base + m) out.push(St(c.above(A.name, x[t1], x[t2], thrT), true, 'ab' + a, `Minimum im Intervall ≈ ${N(mn)} ${c.unitY}.`));
        if (thrF < Math.max(...seg)) out.push(St(c.above(A.name, x[t1], x[t2], thrF), false, 'ab' + a, `Im Intervall fällt der Wert auf ≈ ${N(mn)} ${c.unitY}.`));
      }
      if (c.half) {
        const p = peakIdx(A), mx = A.values[p];
        for (const i of rng.shuffle(U.range(x.length).filter(i => i > p + 1))) {
          if (A.values[i] <= mx / 2 - m * 0.6) { out.push(St(c.half(A.name, x[i]), true, 'hf' + a, `Maximum ≈ ${N(mx)}, nach ${x[i]} ${c.unitX} ≈ ${N(A.values[i])}.`)); break; }
          if (A.values[i] >= mx / 2 + m * 0.6) { out.push(St(c.half(A.name, x[i]), false, 'hf' + a, `Maximum ≈ ${N(mx)}, nach ${x[i]} ${c.unitX} noch ≈ ${N(A.values[i])}.`)); break; }
        }
      }
    });
    c.unknown.forEach((t, i) => out.push(St(t, null, 'unk' + i, 'Diese Information lässt sich dem Diagramm nicht entnehmen (nicht ableitbar).')));
    return out;
  }

  // ---------- 3) Tabellen ----------
  const FOODS = [
    ['Vollmilch', [3, 3.6], [3.3, 3.9], [4.6, 5]], ['Magerquark', [11, 14], [0.2, 0.5], [3.5, 4.2]], ['Hühnerei', [12, 13.5], [9, 11.5], [0.5, 1.2]],
    ['Haferflocken', [12, 14], [6, 7.5], [56, 62]], ['Linsen (getrocknet)', [22, 26], [1.2, 2], [40, 50]], ['Erdnüsse', [24, 28], [46, 50], [8, 12]],
    ['Vollkornbrot', [6.5, 8.5], [1, 2], [38, 45]], ['Kartoffeln', [1.8, 2.2], [0.1, 0.2], [14, 17]], ['Lachs', [19, 21], [11, 15], [0, 0.2]],
    ['Banane', [1, 1.3], [0.1, 0.3], [19, 22]], ['Emmentaler', [27, 29], [29, 31], [0, 0.5]], ['Reis (roh)', [6.5, 7.5], [0.5, 0.8], [76, 79]],
    ['Rindfleisch (mager)', [21, 23], [3, 6], [0, 0.3]], ['Apfel', [0.2, 0.4], [0.1, 0.4], [11, 14]], ['Schokolade', [5, 8], [29, 33], [52, 58]]
  ];
  const SALTS = ['Lithiumchlorid', 'Magnesiumchlorid', 'Kaliumcarbonat', 'Magnesiumnitrat', 'Natriumchlorid', 'Kaliumchlorid', 'Kaliumnitrat', 'Kaliumsulfat', 'Natriumbromid', 'Kaliumiodid'];

  function tableNutrients(rng) {
    const foods = rng.sample(FOODS, rng.int(5, 6));
    const vals = foods.map(f => {
      const p = rng.float(f[1][0], f[1][1]), fat = rng.float(f[2][0], f[2][1]), carb = rng.float(f[3][0], f[3][1]);
      const r1 = v => Math.round(v * 10) / 10;
      const e = Math.round((17 * r1(p) + 37 * r1(fat) + 17 * r1(carb)) / 5) * 5;
      return [r1(p), r1(fat), r1(carb), e];
    });
    const rows = foods.map(f => f[0]);
    const cols = ['Eiweiß (g)', 'Fett (g)', 'Kohlenhydrate (g)', 'Energie (kJ)'];
    const nm = ['Eiweiß', 'Fett', 'Kohlenhydrate'], nmG = ['Eiweißgehalt', 'Fettgehalt', 'Kohlenhydratgehalt'];
    const out = [];
    for (let k = 0; k < 3; k++) {
      const col = vals.map(v => v[k]), mx = argmax(col), s = sorted(col);
      if (s[0] - s[1] >= Math.max(1.5, s[0] * 0.12)) out.push(St(`Von allen aufgeführten Lebensmitteln weist „${rows[mx]}“ den höchsten ${nmG[k]} auf.`, true, 'tmax' + k, `${N(col[mx])} g pro 100 g.`));
      const other = col.findIndex((v, i) => i !== mx && s[0] - v >= Math.max(2, s[0] * 0.2));
      if (other >= 0) out.push(St(`Von allen aufgeführten Lebensmitteln weist „${rows[other]}“ den höchsten ${nmG[k]} auf.`, false, 'tmax' + k, `Den höchsten ${nmG[k]} hat „${rows[mx]}“ (${N(col[mx])} g).`));
    }
    for (let t = 0; t < 12; t++) {
      const [i, j] = rng.sample(U.range(rows.length), 2), k = rng.int(0, 2);
      const a = vals[i][k], b = vals[j][k];
      if (b < 0.5) continue;
      const r = a / b;
      if (r >= 2.3) out.push(St(`„${rows[i]}“ enthält mehr als doppelt so viel ${nm[k]} wie „${rows[j]}“.`, true, 'tr' + i + j + k, `${N(a)} g gegenüber ${N(b)} g.`));
      else if (r > 1.1 && r <= 1.75) out.push(St(`„${rows[i]}“ enthält mehr als doppelt so viel ${nm[k]} wie „${rows[j]}“.`, false, 'tr' + i + j + k, `${N(a)} g gegenüber ${N(b)} g – weniger als das Doppelte.`));
    }
    for (let t = 0; t < 6; t++) {
      const [i, j] = rng.sample(U.range(rows.length), 2);
      const r = vals[i][3] / vals[j][3];
      if (r >= 2.25) out.push(St(`Um die gleiche Energiemenge aufzunehmen, die 100 g ${rows[i]} liefern, muss man mehr als 200 g ${rows[j]} verzehren.`, true, 'te' + i + j, `${vals[i][3]} kJ gegenüber ${vals[j][3]} kJ pro 100 g.`));
      else if (r > 1.05 && r <= 1.8) out.push(St(`Um die gleiche Energiemenge aufzunehmen, die 100 g ${rows[i]} liefern, muss man mehr als 200 g ${rows[j]} verzehren.`, false, 'te' + i + j, `${vals[i][3]} kJ gegenüber ${vals[j][3]} kJ – weniger als das Doppelte.`));
    }
    const allCarb = vals.every(v => v[2] - v[0] >= 1), notAll = vals.some(v => v[0] - v[2] >= 1);
    if (allCarb) out.push(St('Bei allen aufgeführten Lebensmitteln ist der Kohlenhydratgehalt höher als der Eiweißgehalt.', true, 'tall', 'In jeder Zeile gilt Kohlenhydrate > Eiweiß.'));
    else if (notAll) out.push(St('Bei allen aufgeführten Lebensmitteln ist der Kohlenhydratgehalt höher als der Eiweißgehalt.', false, 'tall', `Bei „${rows[vals.findIndex(v => v[0] - v[2] >= 1)]}“ ist es umgekehrt.`));
    out.push(St('Der Eiweißgehalt eines Lebensmittels ist für seinen Energiegehalt von entscheidender Bedeutung.', null, 'tunk1', 'Ein solcher Zusammenhang lässt sich aus der Tabelle nicht ableiten.'));
    out.push(St(`„${rows[0]}“ ist das gesündeste der aufgeführten Lebensmittel.`, null, 'tunk2', 'Eine Bewertung der Gesundheit ist mit diesen Daten nicht möglich.'));
    return {
      intro: 'Die Tabelle beschreibt die Zusammensetzung und den Energiegehalt verschiedener Lebensmittel, jeweils bezogen auf 100 g. Unter Energiegehalt versteht man die Energiemenge, die 100 g des Lebensmittels dem Organismus liefern können.',
      html: tableHtml({ corner: 'pro 100 g', cols, rows, vals: vals.map(v => [v[0], v[1], v[2], String(v[3])]) }), statements: out
    };
  }

  function tableSalts(rng) {
    const salts = rng.sample(SALTS, rng.int(6, 7));
    const temps = [0, 10, 20, 30, 40, 50];
    const flatIdx = rng.int(0, salts.length - 1);
    const breakMono = rng.chance(0.4);
    const vals = salts.map((s, i) => {
      const base = rng.int(12, 97), slope = i === flatIdx ? rng.float(0, 0.04) : rng.float(0.08, 0.5);
      let row = temps.map(t => Math.min(99, Math.max(5, Math.round(base - slope * t + rng.float(-0.6, 0.6)))));
      for (let k = 1; k < row.length; k++) if (row[k] > row[k - 1]) row[k] = row[k - 1];
      if (i === flatIdx) row = row.map((v, k) => k === 0 ? v : Math.max(v, row[0] - 1));
      return row;
    });
    if (breakMono) { const i = (flatIdx + 1) % salts.length; vals[i][3] = vals[i][2] + 2; vals[i][4] = Math.min(vals[i][4], vals[i][3]); }
    const out = [];
    const ranges = vals.map(r => r[0] - r[r.length - 1]);
    const mnR = argmin(ranges), sR = ranges.slice().sort((a, b) => a - b);
    if (sR[1] - sR[0] >= 3) out.push(St(`Die Luftfeuchtigkeit über der ${salts[mnR]}lösung ist am wenigsten temperaturabhängig.`, true, 'sflat', ranges[mnR] === 0 ? 'Sie ändert sich überhaupt nicht.' : `Sie ändert sich nur um ${ranges[mnR]} Prozentpunkte.`));
    const big = ranges.findIndex(r => r >= sR[0] + 6);
    if (big >= 0) out.push(St(`Die Luftfeuchtigkeit über der ${salts[big]}lösung ist am wenigsten temperaturabhängig.`, false, 'sflat', `Sie ändert sich um ${ranges[big]} Prozentpunkte, über ${salts[mnR]} nur um ${ranges[mnR]}.`));
    const mxR = argmax(ranges), sD = sorted(ranges);
    if (sD[0] - sD[1] >= 3) out.push(St(`Im Vergleich zu den anderen Salzlösungen fällt die Luftfeuchtigkeit über der ${salts[mxR]}lösung bei einem Temperaturanstieg von 0 °C auf 50 °C am stärksten ab.`, true, 'sdrop', `Abfall um ${ranges[mxR]} Prozentpunkte.`));
    const smallD = ranges.findIndex(r => r <= sD[0] - 6);
    if (smallD >= 0) out.push(St(`Im Vergleich zu den anderen Salzlösungen fällt die Luftfeuchtigkeit über der ${salts[smallD]}lösung bei einem Temperaturanstieg von 0 °C auf 50 °C am stärksten ab.`, false, 'sdrop', `Abfall nur um ${ranges[smallD]}, über ${salts[mxR]} um ${ranges[mxR]} Prozentpunkte.`));
    const lowAll = U.range(temps.length).every(k => { const col = vals.map(r => r[k]); const i = argmin(col); return i === argmin(vals.map(r => r[0])) && sorted(col).reverse()[1] - col[i] >= 2; });
    const lo = argmin(vals.map(r => r[0]));
    if (lowAll) out.push(St(`Im Vergleich zu den anderen Salzlösungen stellt sich über ${salts[lo]} bei jeder Temperatur die geringste Luftfeuchtigkeit ein.`, true, 'slow', 'In jeder Spalte ist dies der kleinste Wert.'));
    const notLow = vals.findIndex((r, i) => i !== lo && r[0] - vals[lo][0] >= 8);
    if (notLow >= 0) out.push(St(`Im Vergleich zu den anderen Salzlösungen stellt sich über ${salts[notLow]} bei jeder Temperatur die geringste Luftfeuchtigkeit ein.`, false, 'slow', `Über ${salts[lo]} sind die Werte niedriger.`));
    // gleiche Werte bei verschiedenen Temperaturen
    let eqDone = false;
    for (let i = 0; i < salts.length && !eqDone; i++) for (let j = 0; j < salts.length && !eqDone; j++) {
      if (i === j) continue;
      for (let a = 0; a < temps.length && !eqDone; a++) for (let b = 0; b < temps.length && !eqDone; b++) {
        if (a !== b && vals[i][a] === vals[j][b]) { out.push(St(`Bei ${temps[a]} °C stellt sich über ${salts[i]} dieselbe Luftfeuchtigkeit ein wie bei ${temps[b]} °C über ${salts[j]}.`, true, 'seq', `Beide Male ${vals[i][a]} %.`)); eqDone = true; }
      }
    }
    for (let t = 0; t < 10; t++) {
      const [i, j] = rng.sample(U.range(salts.length), 2), a = rng.int(0, 5), b = rng.int(0, 5);
      if (Math.abs(vals[i][a] - vals[j][b]) >= 4 && a !== b) { out.push(St(`Bei ${temps[a]} °C stellt sich über ${salts[i]} dieselbe Luftfeuchtigkeit ein wie bei ${temps[b]} °C über ${salts[j]}.`, false, 'seq', `${vals[i][a]} % gegenüber ${vals[j][b]} %.`)); break; }
    }
    const mono = vals.every(r => r.slice(1).every((v, k) => v < r[k]));
    const anyUp = vals.some(r => r.slice(1).some((v, k) => v > r[k]));
    if (mono) out.push(St('Mit steigender Temperatur fällt die Luftfeuchtigkeit über jeder der angegebenen Salzlösungen ab.', true, 'smono', 'In jeder Zeile nehmen die Werte von links nach rechts ab.'));
    else if (anyUp) out.push(St('Mit steigender Temperatur fällt die Luftfeuchtigkeit über jeder der angegebenen Salzlösungen ab.', false, 'smono', 'Bei mindestens einer Lösung steigt der Wert zwischen zwei Temperaturen an.'));
    out.push(St('Je besser ein Salz in Wasser löslich ist, desto geringer ist die Luftfeuchtigkeit über seiner gesättigten Lösung.', null, 'sunk', 'Über die Löslichkeit enthält die Tabelle keine Angaben.'));
    return {
      intro: `Im Luftraum über gesättigten Salzlösungen stellt sich in Abhängigkeit von der Temperatur eine bestimmte Luftfeuchtigkeit ein. Die Tabelle zeigt die über ${salts.length} verschiedenen Salzlösungen bei unterschiedlichen Temperaturen gemessenen Werte (relative Luftfeuchtigkeit in Prozent).`,
      html: tableHtml({ corner: 'Salz \\ Temperatur', cols: temps.map(t => t + ' °C'), rows: salts, vals: vals.map(r => r.map(String)) }), statements: out
    };
  }

  function tableStudy(rng) {
    const groups = ['Placebo', '10 mg', '20 mg', '40 mg'];
    const before = groups.map(() => rng.int(152, 162));
    const drop = [rng.int(1, 5), rng.int(5, 12), rng.int(9, 18), rng.int(10, 24)];
    if (rng.chance(0.35)) drop[3] = drop[2] - rng.int(1, 3);
    const after = before.map((b, i) => b - drop[i]);
    const side = [rng.int(3, 8), rng.int(5, 12), rng.int(8, 18), rng.int(14, 30)];
    const quit = side.map(s => Math.max(1, Math.round(s * rng.float(0.3, 0.7))));
    const n = groups.map(() => rng.pick([100, 120, 150, 200]));
    const vals = groups.map((g, i) => [String(n[i]), String(before[i]), String(after[i]), side[i] + ' %', quit[i] + ' %']);
    const out = [];
    const red = drop;
    const mx = argmax(red), sr = sorted(red);
    if (sr[0] - sr[1] >= 2) out.push(St(`Die stärkste mittlere Blutdrucksenkung zeigt sich in der Gruppe „${groups[mx]}“.`, true, 'smax', `Senkung um ${red[mx]} mmHg.`));
    const nm = red.findIndex(r => sr[0] - r >= 3);
    if (nm >= 0) out.push(St(`Die stärkste mittlere Blutdrucksenkung zeigt sich in der Gruppe „${groups[nm]}“.`, false, 'smax', `Dort nur ${red[nm]} mmHg, in „${groups[mx]}“ ${red[mx]} mmHg.`));
    const monoRed = red.slice(2).every((r, i) => r > red[i + 1]);
    out.push(St('Je höher die Dosis des Wirkstoffs (10, 20, 40 mg), desto stärker sinkt im Mittel der Blutdruck.', monoRed, 'smono', monoRed ? 'Die Senkung nimmt mit jeder Dosisstufe zu.' : 'Zwischen zwei Dosisstufen nimmt die Senkung nicht zu.'));
    const monoSide = side.slice(2).every((r, i) => r > side[i + 1]);
    out.push(St('Der Anteil der Teilnehmenden mit Nebenwirkungen nimmt mit steigender Dosis des Wirkstoffs (10, 20, 40 mg) zu.', monoSide, 'sside', monoSide ? 'Die Werte steigen mit jeder Dosisstufe.' : 'Die Werte steigen nicht durchgehend.'));
    const halfQuit = quit.every((q, i) => q < side[i] / 2);
    const someMore = quit.some((q, i) => q > side[i] / 2 + 1);
    if (halfQuit) out.push(St('In jeder Gruppe ist der Anteil der Studienabbrecher kleiner als die Hälfte des Anteils der Teilnehmenden mit Nebenwirkungen.', true, 'squit', 'In jeder Zeile ist die Abbruchquote kleiner als die halbe Nebenwirkungsquote.'));
    else if (someMore) out.push(St('In jeder Gruppe ist der Anteil der Studienabbrecher kleiner als die Hälfte des Anteils der Teilnehmenden mit Nebenwirkungen.', false, 'squit', 'In mindestens einer Gruppe ist der Anteil größer.'));
    const [i, j] = rng.sample([1, 2, 3], 2);
    const absI = side[i] * n[i] / 100, absJ = side[j] * n[j] / 100;
    if (Math.abs(absI - absJ) >= 3) out.push(St(`In der Gruppe „${groups[i]}“ traten bei mehr Personen Nebenwirkungen auf als in der Gruppe „${groups[j]}“.`, absI > absJ, 'sabs', `${side[i]} % von ${n[i]} ≈ ${N(absI, 0)} gegenüber ${side[j]} % von ${n[j]} ≈ ${N(absJ, 0)} Personen.`));
    out.push(St('Die Nebenwirkungen in der Placebogruppe sind auf die Erwartungshaltung der Teilnehmenden zurückzuführen.', null, 'sunk', 'Über Ursachen gibt die Tabelle keine Auskunft.'));
    out.push(St('Bei einer Dosis von 80 mg würde der Blutdruck noch stärker sinken.', null, 'sunk2', 'Eine Dosis von 80 mg wurde nicht untersucht.'));
    return {
      intro: 'In einer Studie wurde ein blutdrucksenkender Wirkstoff in drei Dosierungen mit einem Placebo verglichen. Die Tabelle zeigt die Zahl der Teilnehmenden (n), den mittleren systolischen Blutdruck vor und nach acht Wochen Behandlung sowie den Anteil der Teilnehmenden mit Nebenwirkungen und der Studienabbrecher.',
      html: tableHtml({ corner: 'Gruppe', cols: ['n', 'Blutdruck vorher (mmHg)', 'Blutdruck nachher (mmHg)', 'Nebenwirkungen', 'Studienabbruch'], rows: groups, vals }), statements: out
    };
  }

  // ---------- 4) Gestapelte Anteile ----------
  function genShares(rng, k, prof) {
    let v = prof.map(p => Math.max(2, p + rng.float(-6, 6)));
    const s = v.reduce((a, b) => a + b, 0);
    v = v.map(x => Math.round(x / s * 100));
    v[k - 1] += 100 - v.reduce((a, b) => a + b, 0);
    return v;
  }
  const STACK_CTX = [
    rng => {
      const cats = ['15–34', '35–54', '55–74', '≥ 75'];
      const parts = ['Herz-Kreislauf', 'Krebs', 'Unfälle', 'Sonstige'];
      const prof = [[10, 15, 45, 30], [22, 33, 15, 30], [35, 40, 4, 21], [48, 25, 3, 24]];
      const shares = cats.map((c, i) => genShares(rng, 4, prof[i]));
      return { cats, parts, shares, ordinal: true, intro: 'Die Grafik zeigt, wie sich die Todesfälle innerhalb verschiedener Altersgruppen auf Todesursachen verteilen (Anteile in Prozent der Todesfälle der jeweiligen Altersgruppe).',
        catP: c => `in der Altersgruppe ${c}`, partN: p => ({ 'Herz-Kreislauf': 'Herz-Kreislauf-Erkrankungen', Krebs: 'Krebserkrankungen', 'Unfälle': 'Unfälle', Sonstige: 'sonstige Ursachen' })[p],
        partD: p => ({ 'Herz-Kreislauf': 'Herz-Kreislauf-Erkrankungen', Krebs: 'Krebserkrankungen', 'Unfälle': 'Unfällen', Sonstige: 'sonstigen Ursachen' })[p],
        trend: 'mit zunehmendem Alter', absolute: (p, c1, c2) => `In der Altersgruppe ${c1} sterben mehr Menschen an ${p} als in der Altersgruppe ${c2}.` };
    },
    rng => {
      const cats = ['Land 1', 'Land 2', 'Land 3', 'Land 4'];
      const parts = ['0', 'A', 'B', 'AB'];
      const shares = cats.map(() => genShares(rng, 4, [rng.float(25, 50), rng.float(20, 45), rng.float(8, 25), rng.float(3, 10)]));
      return { cats, parts, shares, ordinal: false, intro: 'Die Grafik zeigt die Verteilung der Blutgruppen des AB0-Systems in der Bevölkerung von vier Ländern (Angaben in Prozent).',
        catP: c => `in ${c}`, partN: p => `Blutgruppe ${p}`, partD: p => `Blutgruppe ${p}`, trend: null,
        absolute: (p, c1, c2) => `In ${c1} gibt es mehr Menschen mit ${p} als in ${c2}.` };
    },
    rng => {
      const cats = ['Therapie A', 'Therapie B', 'Therapie C', 'Therapie D'];
      const parts = ['geheilt', 'gebessert', 'unverändert', 'verschlechtert'];
      const shares = cats.map(() => genShares(rng, 4, [rng.float(15, 50), rng.float(20, 40), rng.float(10, 30), rng.float(3, 15)]));
      return { cats, parts, shares, ordinal: false, intro: 'In einer Studie wurden Patienten mit derselben Erkrankung mit einer von vier Therapien behandelt. Die Grafik zeigt den Anteil der Patienten (in Prozent) nach dem Behandlungsergebnis.',
        catP: c => `bei ${c}`, partN: p => `„${p}“`, partD: p => `„${p}“`, trend: null,
        absolute: (p, c1, c2) => `Mit ${c1} wurden mehr Patienten geheilt als mit ${c2}.`,
        extraUnknown: ['Therapie A ist für alle Patienten die beste Wahl.', 'Die Unterschiede zwischen den Therapien beruhen auf unterschiedlichen Nebenwirkungen.'] };
    }
  ];

  function stackStatements(rng, c) {
    const out = [];
    const { cats, parts, shares } = c;
    cats.forEach((cat, ci) => {
      const v = shares[ci], mx = argmax(v), s = sorted(v);
      if (s[0] - s[1] >= 4) out.push(St(`${cap(c.catP(cat))} entfällt der größte Anteil auf ${c.partN(parts[mx])}.`, true, 'pmax' + ci, `${parts[mx]}: ${v[mx]} %.`));
      const wrong = v.findIndex((x, i) => i !== mx && s[0] - x >= 6);
      if (wrong >= 0) out.push(St(`${cap(c.catP(cat))} entfällt der größte Anteil auf ${c.partN(parts[wrong])}.`, false, 'pmax' + ci, `Am häufigsten ist ${parts[mx]} (${v[mx]} %), ${parts[wrong]} nur ${v[wrong]} %.`));
    });
    parts.forEach((p, pi) => {
      const col = shares.map(r => r[pi]);
      if (c.ordinal) {
        const d = col.slice(1).map((x, i) => x - col[i]);
        if (d.every(x => x >= 3)) out.push(St(`Der Anteil von ${c.partD(p)} nimmt ${c.trend} zu.`, true, 'ptr' + pi, `${col.join(' → ')} %.`));
        else if (d.some(x => x <= -3) && d.some(x => x > 0)) out.push(St(`Der Anteil von ${c.partD(p)} nimmt ${c.trend} zu.`, false, 'ptr' + pi, `${col.join(' → ')} % – nicht durchgehend steigend.`));
        else if (d.every(x => x <= -3)) out.push(St(`Der Anteil von ${c.partD(p)} nimmt ${c.trend} ab.`, true, 'ptr' + pi, `${col.join(' → ')} %.`));
      }
      for (let t = 0; t < 3; t++) {
        const [a, b] = rng.sample(U.range(cats.length), 2);
        if (col[a] - col[b] >= 4) { out.push(St(`Der Anteil von ${c.partD(p)} ist ${c.catP(cats[a])} größer als ${c.catP(cats[b])}.`, true, 'pcmp' + pi, `${col[a]} % gegenüber ${col[b]} %.`)); break; }
        if (col[b] - col[a] >= 4) { out.push(St(`Der Anteil von ${c.partD(p)} ist ${c.catP(cats[a])} größer als ${c.catP(cats[b])}.`, false, 'pcmp' + pi, `${col[a]} % gegenüber ${col[b]} % – umgekehrt.`)); break; }
      }
    });
    for (let t = 0; t < 8; t++) {
      const ci = rng.int(0, cats.length - 1), [a, b] = rng.sample(U.range(parts.length), 2);
      const x = shares[ci][a], y = shares[ci][b];
      if (x >= 2.3 * y) out.push(St(`${cap(c.catP(cats[ci]))} ist der Anteil von ${c.partD(parts[a])} mehr als doppelt so groß wie der von ${c.partD(parts[b])}.`, true, 'prat' + ci, `${x} % gegenüber ${y} %.`));
      else if (x > 1.1 * y && x <= 1.75 * y) out.push(St(`${cap(c.catP(cats[ci]))} ist der Anteil von ${c.partD(parts[a])} mehr als doppelt so groß wie der von ${c.partD(parts[b])}.`, false, 'prat' + ci, `${x} % gegenüber ${y} % – weniger als das Doppelte.`));
    }
    for (let t = 0; t < 6; t++) {
      const ci = rng.int(0, cats.length - 1), [a, b] = rng.sample(U.range(parts.length), 2);
      const s = shares[ci][a] + shares[ci][b];
      if (s >= 54) { out.push(St(`${cap(c.catP(cats[ci]))} machen ${c.partN(parts[a])} und ${c.partN(parts[b])} zusammen mehr als die Hälfte aus.`, true, 'phalf' + ci, `${shares[ci][a]} % + ${shares[ci][b]} % = ${s} %.`)); break; }
      if (s <= 46) { out.push(St(`${cap(c.catP(cats[ci]))} machen ${c.partN(parts[a])} und ${c.partN(parts[b])} zusammen mehr als die Hälfte aus.`, false, 'phalf' + ci, `${shares[ci][a]} % + ${shares[ci][b]} % = ${s} %.`)); break; }
    }
    const [c1, c2] = rng.sample(cats, 2), pp = rng.pick(parts);
    out.push(St(c.absolute(c.partD(pp), c1, c2), null, 'pabs', 'Die Grafik zeigt nur Anteile. Ohne die Gesamtzahlen der Gruppen lassen sich keine absoluten Zahlen vergleichen.'));
    (c.extraUnknown || []).forEach((t, i) => out.push(St(t, null, 'punk' + i, 'Darüber enthält die Grafik keine Information.')));
    return out;
  }

  // ---------- Aufgaben zusammensetzen ----------
  function compose(rng, statements, neg) {
    const T_ = statements.filter(s => s.truth === true);
    const F_ = statements.filter(s => s.truth === false);
    const X_ = statements.filter(s => s.truth === null);
    const pickDistinct = (pool, k, used) => {
      const out = [];
      for (const s of rng.shuffle(pool)) {
        if (out.length >= k) break;
        if (used.has(s.key) || used.has('text:' + s.text)) continue;
        used.add(s.key); used.add('text:' + s.text); out.push(s);
      }
      return out.length === k ? out : null;
    };
    const used = new Set();
    let correct, dis;
    if (!neg) {
      const c = pickDistinct(T_, 1, used); if (!c) return null;
      correct = c[0];
      const x = rng.chance(0.45) ? pickDistinct(X_, 1, used) || [] : [];
      const f = pickDistinct(F_, 4 - x.length, used); if (!f) return null;
      dis = x.concat(f);
    } else {
      const useX = X_.length && rng.chance(0.4);
      const c = pickDistinct(useX ? X_ : F_, 1, used) || pickDistinct(useX ? F_ : X_, 1, used); if (!c) return null;
      correct = c[0];
      dis = pickDistinct(T_, 4, used); if (!dis) return null;
    }
    const all = rng.shuffle(dis.concat([correct]));
    return { all, correct: all.indexOf(correct) };
  }

  function makeItem(rng, kind, neg) {
    for (let attempt = 0; attempt < 40; attempt++) {
      let intro, html, statements;
      if (kind === 'bar') {
        const c = rng.pick(BAR_CTX)(rng);
        intro = c.intro; html = barChart(c.data); statements = barStatements(rng, c);
      } else if (kind === 'line') {
        const c = rng.pick(LINE_CTX)(rng);
        intro = c.intro; html = lineChart({ x: c.x, series: c.series, xLabel: c.xLabel, yLabel: c.yLabel, xTickEvery: c.xTickEvery }); statements = lineStatements(rng, c);
      } else if (kind === 'table') {
        const t = rng.pick([tableNutrients, tableSalts, tableStudy])(rng);
        intro = t.intro; html = t.html; statements = t.statements;
      } else {
        const c = rng.pick(STACK_CTX)(rng);
        intro = c.intro; html = stackedChart({ cats: c.cats, parts: c.parts.map((p, pi) => ({ name: c.partN(p).replace(/[„“]/g, ''), values: c.shares.map(r => r[pi]) })) }); statements = stackStatements(rng, c);
      }
      const comp = compose(rng, statements, neg);
      if (!comp) continue;
      const tag = s => s.truth === true ? '<b class="ok">ableitbar</b>' : s.truth === false ? '<b class="no">falsch</b>' : '<b class="no">nicht ableitbar</b>';
      return {
        stem: `<p>${intro}</p>${html}<p class="q">Welche Aussage lässt sich aus den gegebenen Informationen <b>${neg ? 'nicht ' : ''}</b>ableiten?</p>`.replace('<b></b>', ''),
        options: comp.all.map(s => s.text), correct: comp.correct, layout: 'list', kind,
        explanation: '<ul class="expl-list">' + comp.all.map((s, i) => `<li><b>(${U.LETTERS[i]})</b> ${tag(s)} – ${s.why}</li>`).join('') + '</ul>'
      };
    }
    throw new Error('DT: keine Aufgabe erzeugbar (' + kind + ')');
  }

  T.gen.dt = function (seed) {
    const rng = new RNG(seed);
    const kinds = rng.shuffle([].concat(Array(7).fill('bar'), Array(6).fill('line'), Array(6).fill('table'), Array(5).fill('stack')));
    const negs = rng.shuffle(U.range(24).map(i => i % 2 === 0));
    return { items: kinds.map((k, i) => makeItem(rng.fork('dt' + i), k, negs[i])) };
  };
})(window.TMS);
