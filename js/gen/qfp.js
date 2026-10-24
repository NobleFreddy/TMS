/* Quantitative und formale Probleme: parametrisierte Sachaufgaben (Mittelstufen-Mathematik) */
(function (T) {
  'use strict';
  const RNG = T.RNG, U = T.util, M = U.M;
  const N = (x, d) => U.fmt(x, d === undefined ? 2 : d);
  const isNice = (x, d) => Math.abs(x * Math.pow(10, d) - Math.round(x * Math.pow(10, d))) < 1e-9;
  const P = s => `<p>${s}</p>`;
  const Q = s => `<p class="q">${s}</p>`;

  function sci(x) {
    if (x < 100000) return N(x, 3);
    const k = Math.floor(Math.log10(x) + 1e-9);
    const m = x / Math.pow(10, k);
    return (Math.abs(m - 1) < 1e-9 ? '' : N(m, 3) + ' · ') + `10<sup>${k}</sup>`;
  }

  // Sucht Parameter, bis eine Bedingung erfüllt ist
  function find(rng, gen, ok) {
    for (let i = 0; i < 500; i++) { const p = gen(); if (ok(p)) return p; }
    throw new Error('QFP: keine Parameter gefunden');
  }

  const TEMPLATES = [];
  const def = (id, level, fn) => TEMPLATES.push({ id, level, fn });

  // 1 Halbwertszeit – Ausgangsmenge
  def('hwz-start', 1, rng => {
    const h = rng.pick([2, 3, 4, 6, 8, 12]), n = rng.int(2, 5), t = n * h;
    const R = rng.pick([5, 10, 12, 15, 20, 25, 30, 40]);
    const D0 = R * Math.pow(2, n);
    const o = U.numericOptions(rng, D0, [R * Math.pow(2, n - 1), R * Math.pow(2, n + 1), R * n * 2, R * (n + 1), R * n], v => N(v), 'mg');
    return Object.assign({
      stem: P(`Unter der „Plasma-Halbwertszeit“ eines Arzneistoffes versteht man die Zeitspanne, in der sich die im Blutplasma befindliche Menge des Stoffes jeweils auf die Hälfte reduziert. Einem Patienten wird zum Zeitpunkt t<sub>0</sub> ein Arzneistoff mit einer Plasma-Halbwertszeit von ${h} Stunden intravenös injiziert. Nach ${t} Stunden befinden sich noch ${R} mg des Arzneistoffes im Blutplasma.`) + Q('Wie viel mg wurden dem Patienten injiziert?'),
      explanation: `${t} Stunden entsprechen ${n} Halbwertszeiten. Rückwärts gerechnet verdoppelt sich die Menge ${n}-mal: ${R} mg · 2<sup>${n}</sup> = <b>${N(D0)} mg</b>.`
    }, o);
  });

  // 2 Halbwertszeit – Zeitpunkt
  def('hwz-zeit', 1, rng => {
    const iso = rng.pick([['Technetium-99m', 6, 'Stunden'], ['Iod-131', 8, 'Tagen'], ['Fluor-18', 110, 'Minuten'], ['Iod-123', 13, 'Stunden'], ['Thallium-201', 73, 'Stunden']]);
    const n = rng.int(2, 5), p = 100 / Math.pow(2, n), h = iso[1];
    const unitShort = iso[2];
    const o = U.numericOptions(rng, n * h, [(n - 1) * h, (n + 1) * h, h * (100 - p) / 50, 2 * n * h, (n * h) / 2], v => N(v), unitShort.replace('Tagen', 'Tage'));
    return Object.assign({
      stem: P(`Das radioaktive Nuklid ${iso[0]} wird in der Diagnostik eingesetzt. Seine Halbwertszeit beträgt ${h} ${unitShort}; nach Ablauf dieser Zeit ist jeweils die Hälfte der noch vorhandenen Atomkerne zerfallen.`) +
        Q(`Nach welcher Zeit ist nur noch ${N(p, 3)} % der ursprünglichen Menge vorhanden?`),
      explanation: `${N(p, 3)} % = 1/${Math.pow(2, n)} = (1/2)<sup>${n}</sup>, also ${n} Halbwertszeiten: ${n} · ${h} = <b>${N(n * h)} ${unitShort.replace('Tagen', 'Tage')}</b>.`
    }, o);
  });

  // 3 Infusion – Tropfen pro Minute
  def('infusion', 1, rng => {
    const p = find(rng, () => ({ r: rng.int(8, 50), t: rng.pick([2, 3, 4, 5, 6, 8]) }), p => [150, 200, 240, 250, 300, 360, 400, 450, 480, 500, 540, 600, 720, 750, 900, 960, 1000].includes(3 * p.r * p.t));
    const V = 3 * p.r * p.t;
    const o = U.numericOptions(rng, p.r, [p.r * 3, p.r * 60 / 20 * 2, Math.round(V / p.t / 20 * 10) / 10, p.r * 60, p.r / 3, p.r * 2], v => N(v, 1), 'Tropfen/min');
    return Object.assign({
      stem: P(`Einem Patienten sollen ${V} ml einer Infusionslösung gleichmäßig über einen Zeitraum von ${p.t} Stunden verabreicht werden. Das verwendete Infusionsbesteck liefert 20 Tropfen pro Milliliter.`) + Q('Auf wie viele Tropfen pro Minute muss die Infusion eingestellt werden?'),
      explanation: `${V} ml · 20 Tropfen/ml = ${V * 20} Tropfen; ${p.t} h = ${p.t * 60} min. ${V * 20} : ${p.t * 60} = <b>${p.r} Tropfen/min</b>.`
    }, o);
  });

  // 4 Dosierung nach Körpergewicht
  def('dosierung', 1, rng => {
    const amp = [[10, 1], [20, 2], [50, 5], [40, 2], [100, 5], [250, 5], [5, 1], [25, 1], [200, 10], [125, 5]];
    const p = find(rng, () => ({ d: rng.pick([2, 2.5, 3, 4, 5, 6, 7.5, 8, 10, 12, 15, 20]), w: rng.pick([8, 10, 12, 15, 16, 18, 20, 24, 25, 30, 32, 40, 50, 60, 64, 70, 75, 80]), a: rng.pick(amp) }),
      p => { const ml = p.d * p.w * p.a[1] / p.a[0]; return isNice(ml, 2) && ml >= 0.4 && ml <= 30 && p.a[1] > 1 || (isNice(ml, 2) && ml >= 0.4 && ml <= 30 && rng.chance(0.3)); });
    const mg = p.d * p.w, ml = mg * p.a[1] / p.a[0];
    const child = p.w <= 32;
    const o = U.numericOptions(rng, ml, [mg / p.a[0], ml * 10, ml / 10, ml * p.a[1], mg / (p.a[0] * p.a[1]), ml * 2], v => N(v, 2), 'ml');
    return Object.assign({
      stem: P(`${child ? 'Ein Kind' : 'Ein Patient'} mit einem Körpergewicht von ${p.w} kg soll ein Medikament in einer Dosierung von ${N(p.d)} mg pro kg Körpergewicht erhalten. Eine Ampulle enthält ${p.a[0]} mg des Wirkstoffs in ${p.a[1]} ml Lösung.`) + Q('Wie viel ml der Lösung müssen injiziert werden?'),
      explanation: `Benötigte Wirkstoffmenge: ${N(p.d)} mg/kg · ${p.w} kg = ${N(mg)} mg. Konzentration: ${p.a[0]} mg / ${p.a[1]} ml = ${N(p.a[0] / p.a[1])} mg/ml. Volumen: ${N(mg)} : ${N(p.a[0] / p.a[1])} = <b>${N(ml)} ml</b>.`
    }, o);
  });

  // 5 Verdünnung
  def('verduennung', 2, rng => {
    const p = find(rng, () => ({ c1: rng.pick([10, 20, 25, 40, 50, 70, 80]), c2: rng.pick([0.5, 1, 2, 2.5, 4, 5, 10]), v2: rng.pick([100, 200, 250, 400, 500, 1000]) }),
      p => p.c2 < p.c1 / 2 && isNice(p.c2 * p.v2 / p.c1, 1));
    const v1 = p.c2 * p.v2 / p.c1, water = p.v2 - v1;
    const askWater = rng.chance(0.5);
    const ans = askWater ? water : v1;
    const o = U.numericOptions(rng, ans, askWater ? [v1, p.v2 - p.c2 * p.v2 / 100, p.c1 * p.v2 / p.c2, p.v2, water / 2, p.v2 + v1] : [water, p.c1 * p.v2 / p.c2 / 10, p.c2 * p.v2 / 100, v1 * 10, v1 * 2],
      v => N(v, 1), 'ml');
    return Object.assign({
      stem: P(`Aus einer ${N(p.c1)}%igen Stammlösung eines Desinfektionsmittels sollen ${p.v2} ml einer ${N(p.c2)}%igen Gebrauchslösung hergestellt werden. Verdünnt wird ausschließlich mit Wasser (Prozentangaben beziehen sich auf das Volumen).`) +
        Q(askWater ? 'Wie viel ml Wasser werden benötigt?' : 'Wie viel ml der Stammlösung werden benötigt?'),
      explanation: `Die Wirkstoffmenge bleibt gleich: c<sub>1</sub> · V<sub>1</sub> = c<sub>2</sub> · V<sub>2</sub> → V<sub>1</sub> = ${N(p.c2)} · ${p.v2} / ${N(p.c1)} = ${N(v1, 1)} ml Stammlösung` + (askWater ? `; Wasser: ${p.v2} − ${N(v1, 1)} = <b>${N(water, 1)} ml</b>.` : ' → <b>' + N(v1, 1) + ' ml</b>.')
    }, o);
  });

  // 6 Doppelte Proportionalität
  def('proportional', 2, rng => {
    const ctx = rng.pick([
      { intro: 'Fließt ein Gleichstrom durch eine verdünnte Kupfersulfatlösung, so scheidet sich am negativen Pol metallisches Kupfer ab. Die abgeschiedene Kupfermenge ist sowohl zur Dauer des Stromflusses als auch zur Stromstärke direkt proportional.', A: 'Stromstärke', au: 'Ampere', m: 'g Kupfer', verb: 'abgeschieden', mfmt: 2 },
      { intro: 'Die von einem Gewebe aufgenommene Strahlendosis ist bei einer Bestrahlung sowohl zur Bestrahlungsdauer als auch zur Intensität der Strahlenquelle direkt proportional.', A: 'Intensität', au: 'Einheiten', m: 'Gray', verb: 'vom Gewebe aufgenommen', mfmt: 2 },
      { intro: 'Ein Wirkstoffpflaster gibt seinen Wirkstoff gleichmäßig an die Haut ab. Die abgegebene Wirkstoffmenge ist sowohl zur Tragedauer als auch zur Pflasterfläche direkt proportional.', A: 'Pflasterfläche', au: 'cm²', m: 'mg Wirkstoff', verb: 'abgegeben', mfmt: 2 }
    ]);
    const p = find(rng, () => ({ a1: rng.pick([0.2, 0.4, 0.5, 0.8, 1, 1.5, 2, 2.5, 4, 5, 10, 20]), a2: rng.pick([0.2, 0.4, 0.5, 0.8, 1, 1.5, 2, 2.5, 4, 5, 10, 20]), t1: rng.pick([10, 12, 15, 20, 30, 40, 45, 60]), m1: rng.pick([0.06, 0.12, 0.2, 0.3, 0.5, 1, 1.5, 2, 3, 4, 6]), k: rng.pick([0.5, 1.5, 2, 3, 4]) }),
      p => p.a1 !== p.a2 && isNice(p.t1 * p.k * p.a1 / p.a2, 1) && p.t1 * p.k * p.a1 / p.a2 >= 3 && p.t1 * p.k * p.a1 / p.a2 <= 300 && isNice(p.m1 * p.k, 3));
    const m2 = p.m1 * p.k, t2 = p.t1 * p.k * p.a1 / p.a2;
    const o = U.numericOptions(rng, t2, [p.t1 * p.k * p.a2 / p.a1, p.t1 * p.k, p.t1 * p.a1 / p.a2, t2 * 2, t2 / 2, p.t1 / p.k * p.a1 / p.a2], v => N(v, 1), 'Minuten');
    return Object.assign({
      stem: P(`${ctx.intro} Bei einer ${ctx.A} von ${N(p.a1)} ${ctx.au} werden in ${p.t1} Minuten ${N(p.m1, 3)} ${ctx.m} ${ctx.verb}.`) +
        Q(`Wie lange dauert es, bis bei einer ${ctx.A} von ${N(p.a2)} ${ctx.au} ${N(m2, 3)} ${ctx.m} ${ctx.verb} sind?`),
      explanation: `Menge ∝ ${ctx.A} · Zeit → t<sub>2</sub> = t<sub>1</sub> · (m<sub>2</sub>/m<sub>1</sub>) · (${ctx.A}<sub>1</sub>/${ctx.A}<sub>2</sub>) = ${p.t1} · ${N(p.k)} · ${N(p.a1)}/${N(p.a2)} = <b>${N(t2, 1)} Minuten</b>.`
    }, o);
  });

  // 7 Mengen und Überschneidungen
  def('ueberlappung', 2, rng => {
    const p = find(rng, () => ({ a: rng.int(11, 19) * 5, b: rng.int(11, 19) * 5 }), p => p.a !== p.b && p.a + p.b > 110);
    const v = rng.int(0, 2);
    const hi = Math.max(p.a, p.b), lo = Math.min(p.a, p.b);
    let q, ans, dis, why;
    if (v === 0) {
      q = 'Wie viel Prozent der tatsächlichen Erkrankungen werden höchstens mit keiner der beiden Methoden erkannt?';
      ans = 100 - hi; dis = [100 - lo, 200 - p.a - p.b, Math.abs(p.a - p.b), Math.round((100 - p.a) * (100 - p.b) / 100), 0];
      why = `Am meisten bleiben unerkannt, wenn alle mit der schwächeren Methode erkannten Fälle auch von der stärkeren erkannt werden. Dann bleiben 100 − ${hi} = <b>${ans} Prozent</b> unerkannt.`;
    } else if (v === 1) {
      q = 'Wie viel Prozent der tatsächlichen Erkrankungen werden mindestens mit beiden Methoden erkannt?';
      ans = p.a + p.b - 100; dis = [lo, Math.round(p.a * p.b / 100), 100 - hi, Math.abs(p.a - p.b), 200 - p.a - p.b];
      why = `Die Überschneidung ist am kleinsten, wenn sich die nicht erkannten Fälle nicht überlappen: ${p.a} + ${p.b} − 100 = <b>${ans} Prozent</b>.`;
    } else {
      q = 'Wie viel Prozent der tatsächlichen Erkrankungen werden höchstens mit beiden Methoden erkannt?';
      ans = lo; dis = [p.a + p.b - 100, Math.round(p.a * p.b / 100), hi, 100 - Math.abs(p.a - p.b), 100];
      why = `Höchstens alle mit der schwächeren Methode erkannten Fälle können auch von der anderen erkannt werden: <b>${ans} Prozent</b>.`;
    }
    const word = v === 1 ? 'mindestens' : 'höchstens';
    const o = U.numericOptions(rng, ans + 0.001, dis.map(d => d + 0.001), x => { const r = Math.round(x); return r === 0 ? '0 Prozent' : `${word} ${r} Prozent`; });
    return Object.assign({
      stem: P(`Eine bestimmte Krankheit kann durch zwei verschiedene Untersuchungsmethoden diagnostiziert werden. Mit Methode X werden ${p.a} Prozent der tatsächlichen Erkrankungen erkannt, mit Methode Y ${p.b} Prozent.`) + Q(q),
      explanation: why
    }, o);
  });

  // 8 Prozentuale Veränderungen
  def('prozent', 2, rng => {
    const p = find(rng, () => ({ up: rng.pick([10, 20, 25, 40, 50, 60, 80, 100]), down: rng.pick([10, 20, 25, 30, 40, 50, 60]) }),
      p => { const n = ((1 + p.up / 100) * (1 - p.down / 100) - 1) * 100; return isNice(n, 1) && p.up !== p.down; });
    const net = Math.round(((1 + p.up / 100) * (1 - p.down / 100) - 1) * 1000) / 10;
    const ctx = rng.pick([
      (a, b) => `Die Zahl der Thrombozyten im Blut eines Patienten steigt innerhalb einer Woche um ${a} % und fällt in der darauffolgenden Woche um ${b} %.`,
      (a, b) => `Die Zahl der Bakterien in einer Kultur nimmt in der ersten Stunde um ${a} % zu. Nach Zugabe eines Antibiotikums nimmt sie in der zweiten Stunde um ${b} % ab.`,
      (a, b) => `Der Preis eines Medikaments wird zunächst um ${a} % erhöht und anschließend um ${b} % gesenkt.`,
      (a, b) => `Das Gewicht eines Säuglings nimmt in den ersten Lebensmonaten um ${a} % zu. Während einer schweren Erkrankung verliert er anschließend ${b} % seines Gewichts.`
    ]);
    const label = x => x === 0 ? 'keine Veränderung gegenüber dem Ausgangswert' : x > 0 ? `Zunahme um insgesamt ${N(x, 1)} %` : `Abnahme um insgesamt ${N(-x, 1)} %`;
    const cands = [p.up - p.down, net + 5, net - 5, -(p.up * p.down / 100), net + 10, 0, p.down - p.up, net - 10, net + 15, p.up];
    const seen = new Set([label(net)]);
    const ds = [];
    for (const c of rng.shuffle(cands)) { const l = label(Math.round(c * 10) / 10); if (!seen.has(l)) { seen.add(l); ds.push(c); } }
    const vals = ds.slice(0, 4).concat([net]).sort((a, b) => a - b);
    const options = vals.map(v => label(Math.round(v * 10) / 10));
    return {
      stem: P(ctx(p.up, p.down)) +
        Q('Wie hat sich der Wert insgesamt gegenüber dem Ausgangswert verändert?'),
      options, correct: options.indexOf(label(net)),
      explanation: `Faktoren multiplizieren: ${N(1 + p.up / 100)} · ${N(1 - p.down / 100)} = ${N((1 + p.up / 100) * (1 - p.down / 100), 3)} → <b>${label(net)}</b>. Prozentsätze dürfen nicht einfach addiert werden, weil sich der zweite Prozentsatz auf den bereits veränderten Wert bezieht.`
    };
  });

  // 9 Herzzeitvolumen
  def('hzv', 1, rng => {
    const v = rng.int(0, 2);
    if (v === 0) {
      const hf = rng.pick([60, 64, 70, 72, 75, 80]), sv = rng.pick([60, 65, 70, 75, 80]);
      const perH = hf * sv * 60 / 1000;
      const o = U.numericOptions(rng, perH, [hf * sv / 1000, perH * 24, perH / 10, hf * sv * 60 / 100, perH * 2], x => N(x, 1), 'Liter');
      return Object.assign({
        stem: P(`Das Herzzeitvolumen ist das Blutvolumen, das das Herz pro Minute in den Kreislauf pumpt. Es ergibt sich als Produkt aus Herzfrequenz (Schläge pro Minute) und Schlagvolumen (pro Herzschlag ausgeworfenes Blutvolumen). Ein Erwachsener hat in Ruhe eine Herzfrequenz von ${hf} Schlägen pro Minute und ein Schlagvolumen von ${sv} ml.`) + Q('Wie viel Liter Blut pumpt das Herz in einer Stunde?'),
        explanation: `${hf} · ${sv} ml = ${hf * sv} ml/min = ${N(hf * sv / 1000, 2)} l/min; · 60 = <b>${N(perH, 1)} Liter pro Stunde</b>.`
      }, o);
    }
    if (v === 1) {
      const p = find(rng, () => ({ hzv: rng.pick([4.2, 4.5, 4.8, 5, 5.4, 5.6, 6, 6.3, 7.2]), hf: rng.pick([60, 63, 70, 72, 75, 80, 84, 90]) }), p => isNice(p.hzv * 1000 / p.hf, 0));
      const sv = p.hzv * 1000 / p.hf;
      const o = U.numericOptions(rng, sv, [p.hzv / p.hf, sv * 60, p.hzv * p.hf, sv / 10, sv * 1.5], x => N(x, 2), 'ml');
      return Object.assign({
        stem: P(`Das Herzzeitvolumen (HZV) ist das Produkt aus Herzfrequenz und Schlagvolumen. Bei einem Patienten wird ein HZV von ${N(p.hzv)} Litern pro Minute bei einer Herzfrequenz von ${p.hf} Schlägen pro Minute gemessen.`) + Q('Wie groß ist sein Schlagvolumen?'),
        explanation: `SV = HZV / HF = ${N(p.hzv * 1000)} ml/min : ${p.hf} /min = <b>${N(sv)} ml</b>.`
      }, o);
    }
    const p = find(rng, () => ({ a: rng.pick([20, 25, 40, 50, 60, 80, 100, 150]), b: rng.pick([10, 20, 25, 30, 40, 50]) }), p => isNice(((1 + p.a / 100) * (1 + p.b / 100) - 1) * 100, 1));
    const inc = ((1 + p.a / 100) * (1 + p.b / 100) - 1) * 100;
    const o = U.numericOptions(rng, inc, [p.a + p.b, p.a * p.b / 100, inc / 2, p.a, inc + 25], x => N(x, 1), '%');
    return Object.assign({
      stem: P(`Das Herzzeitvolumen ist das Produkt aus Herzfrequenz und Schlagvolumen. Bei körperlicher Belastung steigt bei einer Sportlerin die Herzfrequenz um ${p.a} % und das Schlagvolumen um ${p.b} %.`) + Q('Um wie viel Prozent steigt dadurch das Herzzeitvolumen?'),
      explanation: `${N(1 + p.a / 100)} · ${N(1 + p.b / 100)} = ${N(1 + inc / 100, 3)} → Anstieg um <b>${N(inc, 1)} %</b>.`
    }, o);
  });

  // 10 Clearance
  def('clearance', 2, rng => {
    const p = find(rng, () => ({ u: rng.pick([30, 40, 50, 60, 75, 90, 100, 120, 150]), pl: rng.pick([0.5, 0.8, 1, 1.2, 1.5, 2, 2.5]), vd: rng.pick([[1.44, 1], [2.16, 1.5], [2.88, 2], [1.8, 1.25], [0.72, 0.5]]) }),
      p => isNice(p.u * p.vd[1] / p.pl, 1));
    const c = p.u * p.vd[1] / p.pl;
    const o = U.numericOptions(rng, c, [p.u * p.vd[0] / p.pl, c * 60, c / 60, p.pl * p.vd[1] / p.u * 1000, c * 1.44, p.u / p.pl], x => N(x, 1), 'ml/min');
    return Object.assign({
      stem: P(`Die Clearance C einer Substanz gibt an, welches Plasmavolumen pro Zeiteinheit von dieser Substanz befreit wird. Sie berechnet sich nach C = ${M.frac('U · V̇', 'P')} (U: Konzentration im Urin, V̇: Urinvolumen pro Zeit, P: Konzentration im Plasma). Bei einem Patienten werden eine Urinkonzentration von ${p.u} mg/dl, eine Plasmakonzentration von ${N(p.pl)} mg/dl und eine Urinmenge von ${N(p.vd[0])} Litern pro Tag gemessen.`) +
        Q('Wie groß ist die Clearance in ml pro Minute?'),
      explanation: `${N(p.vd[0])} l/Tag = ${N(p.vd[0] * 1000)} ml : 1440 min = ${N(p.vd[1])} ml/min. C = ${p.u} · ${N(p.vd[1])} / ${N(p.pl)} = <b>${N(c, 1)} ml/min</b>.`
    }, o);
  });

  // 11 Einheitenanalyse
  const VARS = {
    m: { name: 'Masse', sym: 'm', unit: '1 kg', v: [1, 0, 0] },
    v: { name: 'Geschwindigkeit', sym: 'v', unit: '1 m/s', v: [0, 1, -1] },
    r: { name: 'Radius', sym: 'r', unit: '1 m', v: [0, 1, 0] },
    t: { name: 'Zeit', sym: 't', unit: '1 s', v: [0, 0, 1] },
    a: { name: 'Beschleunigung', sym: 'a', unit: '1 m/s²', v: [0, 1, -2] },
    rho: { name: 'Dichte', sym: 'ρ', unit: '1 kg/m³', v: [1, -3, 0] },
    V: { name: 'Volumen', sym: 'V', unit: '1 m³', v: [0, 3, 0] }
  };
  function unitHtml(vec) {
    const base = ['kg', 'm', 's'];
    const num = [], den = [];
    vec.forEach((e, i) => { if (e > 0) num.push(base[i] + (e > 1 ? `<sup>${e}</sup>` : '')); if (e < 0) den.push(base[i] + (e < -1 ? `<sup>${-e}</sup>` : '')); });
    const n = num.length ? num.join(' · ') : '1';
    return den.length ? M.frac(n, den.join(' · ')) : n;
  }
  function monoHtml(mono) {
    const num = [], den = [];
    mono.forEach(([k, e]) => { const s = VARS[k].sym + (Math.abs(e) > 1 ? `<sup>${Math.abs(e)}</sup>` : ''); (e > 0 ? num : den).push(s); });
    const n = num.length ? num.join(' · ') : '1';
    return 'F = ' + (den.length ? M.frac(n, den.join(' · ')) : n);
  }
  const monoUnit = mono => mono.reduce((acc, [k, e]) => acc.map((x, i) => x + e * VARS[k].v[i]), [0, 0, 0]);
  def('einheiten', 2, rng => {
    const set = rng.pick([['m', 'v', 'r'], ['m', 'a', 't'], ['m', 'v', 't'], ['rho', 'V', 'v'], ['m', 'r', 't']]);
    const exps = [-2, -1, 1, 2];
    const all = [];
    for (const e1 of [0].concat(exps)) for (const e2 of [0].concat(exps)) for (const e3 of [0].concat(exps)) {
      const mono = [[set[0], e1], [set[1], e2], [set[2], e3]].filter(x => x[1] !== 0);
      if (mono.length >= 2 && mono.some(x => x[1] > 0)) all.push(mono);
    }
    const target = rng.pick(all.filter(m => m.length === 3 || rng.chance(0.4)));
    const tu = monoUnit(target).join(',');
    const others = rng.shuffle(all.filter(m => monoUnit(m).join(',') !== tu));
    const picked = [];
    const seenU = new Set([tu]);
    for (const m of others) { const k = monoUnit(m).join(','); if (!seenU.has(k)) { seenU.add(k); picked.push(m); } if (picked.length === 4) break; }
    const opts = rng.shuffle(picked.concat([target]));
    return {
      stem: P(`Ein physikalisches Gesetz ermöglicht die Bestimmung einer Größe F aus den Größen</p><table class="mini"><tbody>${set.map(k => `<tr><td>${VARS[k].name}</td><td><i>${VARS[k].sym}</i></td><td>(Einheit: ${VARS[k].unit})</td></tr>`).join('')}</tbody></table><p>`) +
        Q(`Bei Anwendung welcher der folgenden Formeln ergibt sich für F die Einheit ${unitHtml(monoUnit(target))}?`),
      options: opts.map(monoHtml), correct: opts.indexOf(target), layout: 'list',
      explanation: `Einheiten einsetzen: ${monoHtml(target)} ergibt ${unitHtml(monoUnit(target))}. Die übrigen Formeln führen zu anderen Einheiten, z. B. ${opts.filter(o => o !== target).slice(0, 2).map(o => monoHtml(o) + ' → ' + unitHtml(monoUnit(o))).join('; ')}.`
    };
  });

  // 12 Formeln umstellen
  const F = M.frac, S = M.sqrt;
  const FORMULAS = [
    { text: `Die Dichte ρ eines Stoffes ist der Quotient aus Masse m und Volumen V. Für eine Kugel mit dem Radius r gilt V = ${F('4', '3')} · π · r<sup>3</sup>. Von einer Kugel sind die Dichte ρ und die Masse m bekannt.`, ask: 'Nach welcher Formel lässt sich ihr Radius r bestimmen?',
      ok: 'r = ' + S(F('3 · m', '4 · π · ρ'), 3), bad: ['r = ' + S(F('4 · π · ρ', '3 · m'), 3), 'r = ' + S(F('3 · m · ρ', '4 · π'), 3), 'r = ' + S(F('3 · m', '4 · π · ρ')), 'r = ' + S(F('4 · m', '3 · π · ρ'), 3)] },
    { text: 'Die Bewegungsenergie eines Körpers der Masse m mit der Geschwindigkeit v beträgt E = ½ · m · v<sup>2</sup>.', ask: 'Wie lässt sich die Geschwindigkeit v aus E und m berechnen?',
      ok: 'v = ' + S(F('2 · E', 'm')), bad: ['v = ' + S(F('E', '2 · m')), 'v = ' + F('2 · E', 'm'), 'v = ' + S(F('2 · m', 'E')), 'v = ' + S(F('E · m', '2'))] },
    { text: `Zwei Massen m<sub>1</sub> und m<sub>2</sub> ziehen sich im Abstand r mit der Kraft F = G · ${F('m<sub>1</sub> · m<sub>2</sub>', 'r<sup>2</sup>')} an (G: Konstante).`, ask: 'Nach welcher Formel lässt sich der Abstand r berechnen?',
      ok: 'r = ' + S(F('G · m<sub>1</sub> · m<sub>2</sub>', 'F')), bad: ['r = ' + F('G · m<sub>1</sub> · m<sub>2</sub>', 'F'), 'r = ' + S(F('F', 'G · m<sub>1</sub> · m<sub>2</sub>')), 'r = ' + S(F('G · m<sub>1</sub>', 'F · m<sub>2</sub>')), 'r = ' + S(F('F · m<sub>1</sub> · m<sub>2</sub>', 'G'))] },
    { text: 'Für ein ideales Gas gilt p · V = n · R · T (p: Druck, V: Volumen, n: Stoffmenge, R: Gaskonstante, T: Temperatur).', ask: 'Wie lässt sich die Temperatur T berechnen?',
      ok: 'T = ' + F('p · V', 'n · R'), bad: ['T = ' + F('n · R', 'p · V'), 'T = p · V · n · R', 'T = ' + F('p · n', 'V · R'), 'T = ' + F('V', 'p · n · R')] },
    { text: `Für eine dünne Linse mit der Brennweite f gilt: ${F('1', 'f')} = ${F('1', 'g')} + ${F('1', 'b')} (g: Gegenstandsweite, b: Bildweite).`, ask: 'Wie lässt sich die Bildweite b berechnen?',
      ok: 'b = ' + F('f · g', 'g − f'), bad: ['b = ' + F('f · g', 'f − g'), 'b = g − f', 'b = ' + F('f · g', 'f + g'), 'b = ' + F('g − f', 'f · g')] },
    { text: `Nach dem Gesetz von Hagen-Poiseuille gilt für die Stromstärke einer Flüssigkeit durch ein Rohr: I = ${F('π · r<sup>4</sup> · Δp', '8 · η · l')} (r: Radius, Δp: Druckdifferenz, η: Viskosität, l: Länge).`, ask: 'Wie lässt sich der Radius r berechnen?',
      ok: 'r = ' + S(F('8 · η · l · I', 'π · Δp'), 4), bad: ['r = ' + S(F('π · Δp', '8 · η · l · I'), 4), 'r = ' + F('8 · η · l · I', 'π · Δp'), 'r = ' + S(F('8 · η · l · I', 'π · Δp')), 'r = ' + S(F('8 · η · I', 'π · Δp · l'), 4)] },
    { text: `Die Schwingungsdauer eines Fadenpendels der Länge l beträgt T = 2 · π · ${S(F('l', 'g'))} (g: Fallbeschleunigung).`, ask: 'Wie lässt sich die Pendellänge l berechnen?',
      ok: 'l = ' + F('g · T<sup>2</sup>', '4 · π<sup>2</sup>'), bad: ['l = ' + F('g · T<sup>2</sup>', '2 · π'), 'l = ' + F('T<sup>2</sup>', '4 · π<sup>2</sup> · g'), 'l = ' + F('4 · π<sup>2</sup> · g', 'T<sup>2</sup>'), 'l = ' + F('g · T', '2 · π')] },
    { text: `Die Geschwindigkeit v einer enzymatischen Reaktion hängt von der Substratkonzentration S ab: v = ${F('V<sub>max</sub> · S', 'K<sub>M</sub> + S')} (V<sub>max</sub>: Maximalgeschwindigkeit, K<sub>M</sub>: Konstante).`, ask: 'Wie lässt sich S berechnen?',
      ok: 'S = ' + F('v · K<sub>M</sub>', 'V<sub>max</sub> − v'), bad: ['S = ' + F('v · K<sub>M</sub>', 'v − V<sub>max</sub>'), 'S = ' + F('K<sub>M</sub> · (V<sub>max</sub> − v)', 'v'), 'S = ' + F('V<sub>max</sub> · K<sub>M</sub>', 'v'), 'S = ' + F('v · (K<sub>M</sub> + 1)', 'V<sub>max</sub>')] },
    { text: 'Ein aus dem Stand gleichmäßig beschleunigter Körper legt in der Zeit t die Strecke s = ½ · a · t<sup>2</sup> zurück (a: Beschleunigung).', ask: 'Nach welcher Zeit t hat er die Strecke s zurückgelegt?',
      ok: 't = ' + S(F('2 · s', 'a')), bad: ['t = ' + F('2 · s', 'a'), 't = ' + S(F('s', '2 · a')), 't = ' + S(F('2 · a', 's')), 't = ' + S('2 · s · a')] },
    { text: `Die elektrische Leistung an einem Widerstand R beträgt P = ${F('U<sup>2</sup>', 'R')} (U: Spannung).`, ask: 'Wie lässt sich die Spannung U berechnen?',
      ok: 'U = ' + S('P · R'), bad: ['U = P · R', 'U = ' + S(F('P', 'R')), 'U = ' + S(F('R', 'P')), 'U = ' + F('P · R', '2')] },
    { text: `Der osmotische Druck einer Lösung beträgt π = ${F('n', 'V')} · R · T (n: Stoffmenge, V: Volumen, R: Konstante, T: Temperatur).`, ask: 'Wie lässt sich das Volumen V berechnen?',
      ok: 'V = ' + F('n · R · T', 'π'), bad: ['V = ' + F('π', 'n · R · T'), 'V = π · n · R · T', 'V = ' + F('π · n', 'R · T'), 'V = ' + F('n · R', 'π · T')] }
  ];
  def('umstellen', 3, rng => {
    const f = rng.pick(FORMULAS);
    const o = U.buildOptions(rng, f.ok, f.bad);
    return Object.assign({ stem: P(f.text) + Q(f.ask), layout: 'list', explanation: `Schrittweise nach der gesuchten Größe auflösen: <b>${f.ok}</b>. Tipp: Setzen Sie zur Kontrolle einfache Zahlen ein.` }, o);
  });

  // 13 Proportionalität aus Tabelle
  def('tabelle', 3, rng => {
    const rels = [
      { key: 'x ~ t', f: x => x },
      { key: 'x ~ ' + F('1', 't'), f: x => 1 / x },
      { key: 'x<sup>2</sup> ~ t', f: x => x * x },
      { key: 'x<sup>2</sup> ~ ' + F('1', 't'), f: x => 1 / (x * x) },
      { key: 'x<sup>3</sup> ~ t', f: x => x * x * x },
      { key: 'x ~ t<sup>2</sup>', f: x => Math.sqrt(x) }
    ];
    const rel = rng.pick(rels);
    let xs = [1, 2, 3, 4, 5, 6];
    if (rel.key === 'x ~ t<sup>2</sup>') xs = [1, 4, 9, 16, 25, 36];
    if (rel.key.includes(F('1', 't'))) xs = [1, 2, 3, 4, 6, 12];
    let c = rng.pick([0.5, 1, 2, 3, 4]);
    if (rel.key === 'x<sup>2</sup> ~ ' + F('1', 't')) c = rng.pick([36, 72, 144]);
    if (rel.key === 'x ~ ' + F('1', 't')) c = rng.pick([12, 24, 36]);
    const ts = xs.map(x => c * rel.f(x));
    const ctx = rng.pick(['Im Wasser gelöste Farbstoffteilchen verteilen sich durch Diffusion. In der folgenden Tabelle ist die Strecke x eingetragen, die ein Teilchen unter bestimmten Bedingungen in der Zeit t zurücklegt.',
      'In einem Experiment wurden für zwei physikalische Größen x und t die folgenden Wertepaare gemessen.']);
    const o = U.buildOptions(rng, rel.key, rng.shuffle(rels.filter(r => r !== rel).map(r => r.key)));
    return Object.assign({
      stem: P(ctx) + `<table class="mini grid"><tbody><tr><th>t</th>${ts.map(t => `<td>${N(t, 3)}</td>`).join('')}</tr><tr><th>x</th>${xs.map(x => `<td>${x}</td>`).join('')}</tr></tbody></table>` +
        Q('Welche der folgenden Beziehungen zwischen x und t gilt für diese Werte?'),
      layout: 'list',
      explanation: `Prüfen Sie Wertepaare: Verdoppelt sich x von ${xs[0]} auf ${xs[1]}, ändert sich t von ${N(ts[0], 3)} auf ${N(ts[1], 3)}. Daraus folgt <b>${rel.key}</b>.`
    }, o);
  });

  // 14 Broteinheiten
  def('broteinheiten', 2, rng => {
    const be = rng.pick([4, 5, 6, 8, 10, 12, 15]), k = rng.pick([2, 3, 4, 5]);
    const e = be * 12 * 16 * k;
    const kname = { 2: 'die Hälfte', 3: 'ein Drittel', 4: 'ein Viertel', 5: 'ein Fünftel' }[k];
    const o = U.numericOptions(rng, be, [be * k, e / k / 16, be * 2, be / 2, e / (k * 12)], x => N(x, 1), 'BE');
    return Object.assign({
      stem: P(`Eine Broteinheit (BE) ist definiert als diejenige Nahrungsmenge, die 12 g Kohlenhydrate enthält. Bei der Verbrennung von 1 g Kohlenhydraten im Organismus werden 16 Kilojoule (kJ) Energie frei. Ein Patient soll pro Tag ${e} kJ zu sich nehmen, ${kname} davon in Form von Kohlenhydraten.`) + Q('Wie viele BE sind dies täglich?'),
      explanation: `${e} kJ : ${k} = ${e / k} kJ aus Kohlenhydraten → ${e / k} : 16 = ${e / k / 16} g → ${e / k / 16} : 12 = <b>${be} BE</b>.`
    }, o);
  });

  // 15 Bakterienwachstum
  def('bakterien', 2, rng => {
    const d = rng.pick([15, 20, 30, 40]), n = rng.int(3, 10), n0 = rng.pick([100, 500, 1000, 2000, 5000]);
    const n1 = n0 * Math.pow(2, n);
    const inHours = n * d % 60 === 0 && rng.chance(0.5);
    const val = inHours ? n * d / 60 : n * d;
    const unit = inHours ? 'Stunden' : 'Minuten';
    const f = x => inHours ? x / 60 : x;
    const o = U.numericOptions(rng, val, [f((n - 1) * d), f((n + 1) * d), f(Math.pow(2, n) * d / 2), f(n * d / 2), f(Math.pow(2, n) * d / n)], x => N(x, 2), unit);
    return Object.assign({
      stem: P(`Unter optimalen Bedingungen verdoppelt sich die Zahl der Bakterien in einer Kultur alle ${d} Minuten. Zu Beginn eines Versuchs enthält die Kultur ${sci(n0)} Bakterien.`) + Q(`Nach wie vielen ${unit} enthält sie ${sci(n1)} Bakterien?`),
      explanation: `${sci(n1)} : ${sci(n0)} = ${Math.pow(2, n)} = 2<sup>${n}</sup> → ${n} Verdopplungen · ${d} min = ${n * d} min${inHours ? ` = <b>${N(val)} Stunden</b>` : ' → <b>' + val + ' Minuten</b>'}.`
    }, o);
  });

  // 16 Nervenleitgeschwindigkeit
  def('nervenleitung', 2, rng => {
    const p = find(rng, () => ({ d: rng.pick([18, 20, 24, 25, 30, 36, 40]), dt: rng.pick([3, 4, 5, 6, 8]), t1: rng.pick([2.5, 3, 3.2, 3.5, 4]) }), p => isNice(10 * p.d / p.dt, 1));
    const v = 10 * p.d / p.dt, t2 = p.t1 + p.dt;
    const o = U.numericOptions(rng, v, [10 * p.d / t2, 10 * p.d / p.t1, p.d / p.dt, 100 * p.d / p.dt, v / 10], x => N(x, 1), 'm/s');
    return Object.assign({
      stem: P(`Zur Bestimmung der Nervenleitgeschwindigkeit wird ein Nerv an zwei Stellen elektrisch gereizt, die ${p.d} cm voneinander entfernt liegen. Die Muskelantwort wird jeweils am selben Muskel abgeleitet. Bei Reizung an der muskelnahen Stelle tritt die Antwort nach ${N(p.t1)} ms auf, bei Reizung an der muskelfernen Stelle nach ${N(t2)} ms.`) + Q('Wie groß ist die Nervenleitgeschwindigkeit?'),
      explanation: `Entscheidend ist die Zeitdifferenz: ${N(t2)} − ${N(p.t1)} = ${p.dt} ms für ${p.d} cm. v = ${N(p.d / 100)} m : ${N(p.dt / 1000, 3)} s = <b>${N(v, 1)} m/s</b>.`
    }, o);
  });

  // 17 Mittelwerte
  def('mittelwert', 1, rng => {
    if (rng.chance(0.5)) {
      const n = rng.pick([5, 6]);
      const vals = U.range(n - 1).map(() => rng.int(80, 130));
      const mean = rng.int(95, 115);
      const x = n * mean - vals.reduce((s, v) => s + v, 0);
      if (x < 50 || x > 200) return TEMPLATES.find(t => t.id === 'mittelwert').fn(rng.fork('mw'));
      const sum = vals.reduce((s, v) => s + v, 0);
      const o = U.numericOptions(rng, x, [mean, Math.round(sum / (n - 1)), 2 * mean - Math.round(sum / (n - 1)), x + n, x - n, (n - 1) * mean - sum + mean], v => N(v, 0), 'mg/dl');
      return Object.assign({
        stem: P(`Bei einem Patienten wird an ${n} aufeinanderfolgenden Tagen morgens der Blutzucker gemessen. Die ersten ${n - 1} Messungen ergeben ${vals.join(', ')} mg/dl. Der Mittelwert aller ${n} Messungen beträgt ${mean} mg/dl.`) + Q(`Wie hoch war der Blutzucker bei der ${n}. Messung?`),
        explanation: `Summe aller Werte = ${n} · ${mean} = ${n * mean}. Summe der ersten ${n - 1} Werte = ${sum}. Gesuchter Wert: ${n * mean} − ${sum} = <b>${x} mg/dl</b>.`
      }, o);
    }
    const p = find(rng, () => ({ n1: rng.pick([10, 20, 30, 40, 60]), n2: rng.pick([10, 20, 30, 40, 60]), m1: rng.int(60, 90), m2: rng.int(60, 90) }), p => p.n1 !== p.n2 && Math.abs(p.m1 - p.m2) >= 6 && isNice((p.n1 * p.m1 + p.n2 * p.m2) / (p.n1 + p.n2), 1));
    const m = (p.n1 * p.m1 + p.n2 * p.m2) / (p.n1 + p.n2);
    const o = U.numericOptions(rng, m, [(p.m1 + p.m2) / 2, (p.n1 * p.m2 + p.n2 * p.m1) / (p.n1 + p.n2), m + 2, m - 2, Math.max(p.m1, p.m2)], v => N(v, 1), 'kg');
    return Object.assign({
      stem: P(`In einer Studie haben die ${p.n1} Teilnehmenden der Gruppe A ein durchschnittliches Körpergewicht von ${p.m1} kg, die ${p.n2} Teilnehmenden der Gruppe B von ${p.m2} kg.`) + Q('Wie groß ist das durchschnittliche Körpergewicht aller Teilnehmenden?'),
      explanation: `Gewichteter Mittelwert: (${p.n1} · ${p.m1} + ${p.n2} · ${p.m2}) / ${p.n1 + p.n2} = ${p.n1 * p.m1 + p.n2 * p.m2} / ${p.n1 + p.n2} = <b>${N(m, 1)} kg</b>.`
    }, o);
  });

  // 18 Vererbung
  def('vererbung', 2, rng => {
    const cases = [
      { cross: 'zwei gesunde Eltern, die beide Träger (heterozygot) sind', q: 'Wie groß ist die Wahrscheinlichkeit, dass ihr erstes Kind erkrankt ist?', p: [1, 4], why: 'Aa × Aa → AA, Aa, aA, aa; nur aa ist erkrankt: 1/4.' },
      { cross: 'zwei gesunde Eltern, die beide Träger (heterozygot) sind', q: 'Wie groß ist die Wahrscheinlichkeit, dass ihre beiden ersten Kinder erkrankt sind?', p: [1, 16], why: 'Je Kind 1/4, unabhängig: 1/4 · 1/4 = 1/16.' },
      { cross: 'zwei gesunde Eltern, die beide Träger (heterozygot) sind', q: 'Ihr erstes Kind ist gesund. Wie groß ist die Wahrscheinlichkeit, dass es Träger ist?', p: [2, 3], why: 'Gesund sind AA, Aa, aA – davon zwei von drei Träger: 2/3.' },
      { cross: 'zwei gesunde Eltern, die beide Träger (heterozygot) sind', q: 'Wie groß ist die Wahrscheinlichkeit, dass von ihren zwei ersten Kindern genau eines erkrankt ist?', p: [3, 8], why: '2 · (1/4 · 3/4) = 6/16 = 3/8.' },
      { cross: 'zwei gesunde Eltern, die beide Träger (heterozygot) sind', q: 'Wie groß ist die Wahrscheinlichkeit, dass mindestens eines ihrer zwei ersten Kinder erkrankt ist?', p: [7, 16], why: '1 − (3/4)² = 1 − 9/16 = 7/16.' },
      { cross: 'ein erkrankter Vater und eine gesunde Mutter, die Trägerin ist', q: 'Wie groß ist die Wahrscheinlichkeit, dass ihr erstes Kind erkrankt ist?', p: [1, 2], why: 'aa × Aa → Aa, Aa, aa, aa: 1/2.' },
      { cross: 'ein erkrankter Vater und eine gesunde Mutter, die Trägerin ist', q: 'Wie groß ist die Wahrscheinlichkeit, dass ihre beiden ersten Kinder gesund sind?', p: [1, 4], why: 'Je Kind 1/2 gesund: 1/2 · 1/2 = 1/4.' },
      { cross: 'ein erkrankter Vater und eine gesunde Mutter, die keine Trägerin ist', q: 'Wie groß ist die Wahrscheinlichkeit, dass ihr erstes Kind Träger ist?', p: [1, 1], why: 'aa × AA → alle Kinder Aa: Wahrscheinlichkeit 1.' }
    ];
    const c = rng.pick(cases);
    const fr = [[1, 16], [1, 8], [3, 16], [1, 4], [1, 3], [3, 8], [7, 16], [1, 2], [9, 16], [2, 3], [3, 4], [1, 1]];
    const label = f => f[1] === 1 ? (f[0] === 1 ? '1 (sicher)' : '0') : M.frac(f[0], f[1]);
    const val = f => f[0] / f[1];
    const others = fr.filter(f => val(f) !== val(c.p)).sort((a, b) => Math.abs(val(a) - val(c.p)) - Math.abs(val(b) - val(c.p))).slice(0, 7);
    const chosen = rng.sample(others, 4).concat([c.p]).sort((a, b) => val(a) - val(b));
    return {
      stem: P(`Eine Stoffwechselkrankheit wird autosomal-rezessiv vererbt: Jeder Mensch besitzt für das betreffende Gen zwei Allele, von denen er je eines von Mutter und Vater erhält. Erkrankt ist nur, wer zwei veränderte Allele (aa) besitzt; Menschen mit einem veränderten Allel (Aa) sind gesund, aber Träger. Jeder Elternteil gibt mit gleicher Wahrscheinlichkeit eines seiner beiden Allele weiter. Betrachtet werden ${c.cross}.`) + Q(c.q),
      options: chosen.map(label), correct: chosen.indexOf(c.p), layout: 'inline',
      explanation: c.why
    };
  });

  // 19 Gasgesetz (Boyle-Mariotte)
  def('gasgesetz', 1, rng => {
    const depth = rng.pick([10, 20, 30, 40]), v1 = rng.pick([1.5, 2, 2.5, 3, 4]);
    const p1 = 1 + depth / 10, v2 = v1 * p1;
    const o = U.numericOptions(rng, v2, [v1 * depth / 10, v1 / p1, v1 * (p1 + 1), v1 * p1 / 2, v1 + p1], x => N(x, 2), 'Liter');
    return Object.assign({
      stem: P(`Bei konstanter Temperatur ist das Produkt aus Druck und Volumen einer Gasmenge konstant (p · V = konstant). An der Wasseroberfläche herrscht ein Druck von 1 bar; je 10 m Wassertiefe kommt 1 bar hinzu. Ein Taucher füllt in ${depth} m Tiefe einen flexiblen Beutel mit ${N(v1)} Litern Luft und verschließt ihn.`) + Q('Welches Volumen nimmt die Luft im Beutel an der Wasseroberfläche ein?'),
      explanation: `In ${depth} m Tiefe: p = 1 + ${depth / 10} = ${p1} bar. V<sub>2</sub> = V<sub>1</sub> · p<sub>1</sub>/p<sub>2</sub> = ${N(v1)} · ${p1} / 1 = <b>${N(v2)} Liter</b>.`
    }, o);
  });

  // 20 Stoffmengenkonzentration
  def('molar', 2, rng => {
    const sub = rng.pick([['Glukose', 180], ['Harnstoff', 60], ['Natriumhydroxid', 40], ['Saccharose', 342], ['Ethanol', 46]]);
    const p = find(rng, () => ({ n: rng.pick([20, 50, 100, 150, 200, 250, 500]), v: rng.pick([200, 250, 500, 1000, 2000]) }), p => isNice(p.n * sub[1] / 1000, 2) && isNice(p.n * 1000 / p.v, 1));
    const m = p.n * sub[1] / 1000, c = p.n * 1000 / p.v;
    const o = U.numericOptions(rng, c, [p.n * p.v / 1000, c * 1000, c / 1000, m * 1000 / p.v, c * 2, p.n], x => N(x, 2), 'mmol/l');
    return Object.assign({
      stem: P(`Die molare Masse von ${sub[0]} beträgt ${sub[1]} g/mol, d. h. 1 mol ${sub[0]} wiegt ${sub[1]} g. ${N(m)} g ${sub[0]} werden in Wasser gelöst und auf ein Gesamtvolumen von ${p.v} ml aufgefüllt.`) + Q('Wie groß ist die Konzentration der Lösung in mmol/l?'),
      explanation: `n = ${N(m)} g : ${sub[1]} g/mol = ${N(p.n / 1000, 3)} mol = ${p.n} mmol. c = ${p.n} mmol : ${N(p.v / 1000)} l = <b>${N(c)} mmol/l</b>.`
    }, o);
  });

  // 21 Kontinuitätsgleichung
  def('kontinuitaet', 2, rng => {
    const k = rng.pick([2, 3, 2, 4]), v1 = rng.pick([10, 15, 20, 25, 30]);
    const v2 = v1 * k * k;
    const o = U.numericOptions(rng, v2, [v1 * k, v1 * k * k * k, v1 / (k * k), v1 * 2 * k, v1 * Math.pow(k, 4)], x => N(x, 2), 'cm/s');
    const frac = { 2: 'die Hälfte', 3: 'ein Drittel', 4: 'ein Viertel' }[k];
    return Object.assign({
      stem: P(`In einem Blutgefäß ist die Stromstärke I (Volumen pro Zeit) an jeder Stelle gleich groß. Es gilt I = A · v, wobei A die Querschnittsfläche und v die mittlere Strömungsgeschwindigkeit ist; für die Querschnittsfläche eines Gefäßes mit dem Durchmesser d gilt A = π · d<sup>2</sup> / 4. In einer Arterie fließt das Blut mit ${v1} cm/s. An einer Engstelle (Stenose) beträgt der Durchmesser nur noch ${frac} des normalen Durchmessers.`) + Q('Mit welcher Geschwindigkeit fließt das Blut durch die Engstelle?'),
      explanation: `Durchmesser · 1/${k} → Fläche · 1/${k * k} → Geschwindigkeit · ${k * k}: ${v1} · ${k * k} = <b>${v2} cm/s</b>.`
    }, o);
  });

  // 22 Faktorbetrachtung in Formeln
  const LAWS = [
    { text: `Für die Stromstärke einer Flüssigkeit durch ein Rohr gilt I = ${F('π · r<sup>4</sup> · Δp', '8 · η · l')} (r: Radius, Δp: Druckdifferenz, η: Viskosität, l: Länge).`, res: 'die Stromstärke I', vars: { r: ['der Radius', 4], 'Δp': ['die Druckdifferenz', 1], 'η': ['die Viskosität', -1], l: ['die Länge', -1] } },
    { text: `Für die Anziehungskraft zweier Massen gilt F = G · ${F('m<sub>1</sub> · m<sub>2</sub>', 'r<sup>2</sup>')}.`, res: 'die Kraft F', vars: { m1: ['die Masse m<sub>1</sub>', 1], m2: ['die Masse m<sub>2</sub>', 1], r: ['der Abstand r', -2] } },
    { text: 'Die Bewegungsenergie eines Körpers beträgt E = ½ · m · v<sup>2</sup>.', res: 'die Energie E', vars: { m: ['die Masse m', 1], v: ['die Geschwindigkeit v', 2] } },
    { text: `Der elektrische Widerstand eines Drahtes beträgt R = ${F('4 · ρ · l', 'π · d<sup>2</sup>')} (ρ: Materialkonstante, l: Länge, d: Durchmesser).`, res: 'der Widerstand R', pron: 'Er', vars: { l: ['die Länge l', 1], d: ['der Durchmesser d', -2] } },
    { text: 'Die Reibungskraft auf eine Kugel in einer Flüssigkeit beträgt F = 6 · π · η · r · v (η: Viskosität, r: Radius, v: Geschwindigkeit).', res: 'die Kraft F', vars: { 'η': ['die Viskosität', 1], r: ['der Radius', 1], v: ['die Geschwindigkeit', 1] } },
    { text: `Die Leistung an einem Widerstand beträgt P = ${F('U<sup>2</sup>', 'R')}.`, res: 'die Leistung P', vars: { U: ['die Spannung U', 2], R: ['der Widerstand R', -1] } }
  ];
  function ratioLabel(f, pron) {
    pron = pron || 'Sie';
    if (Math.abs(f - 1) < 1e-9) return `${pron} bleibt gleich.`;
    const fracOf = x => { for (let d = 1; d <= 1296; d++) { const n = x * d; if (Math.abs(n - Math.round(n)) < 1e-6) return [Math.round(n), d]; } return [x, 1]; };
    const [n, d] = fracOf(f);
    if (f > 1) return d === 1 ? `${pron} steigt auf das ${n}-Fache.` : `${pron} steigt auf das ${n}/${d}-Fache.`;
    return `${pron} sinkt auf ${n}/${d}.`;
  }
  def('faktor', 3, rng => {
    const law = rng.pick(LAWS);
    const RL = f => ratioLabel(f, law.pron);
    const keys = Object.keys(law.vars);
    const chg = rng.sample(keys, Math.min(keys.length, rng.int(1, 2)));
    if (chg.length === 1 && Math.abs(law.vars[chg[0]][1]) === 1 && keys.length > 1) chg.push(rng.pick(keys.filter(k => k !== chg[0])));
    const facs = chg.map(() => rng.pick([2, 3, 0.5]));
    const real = chg.reduce((acc, k, i) => acc * Math.pow(facs[i], law.vars[k][1]), 1);
    const naive = chg.reduce((acc, k, i) => acc * Math.pow(facs[i], Math.sign(law.vars[k][1])), 1);
    const flip = chg.reduce((acc, k, i) => acc * Math.pow(facs[i], i === 0 ? -law.vars[k][1] : law.vars[k][1]), 1);
    const sq = chg.reduce((acc, k, i) => acc * Math.pow(facs[i], law.vars[k][1] * 2), 1);
    const only = Math.pow(facs[0], law.vars[chg[0]][1]);
    const half = chg.reduce((acc, k, i) => acc * Math.pow(facs[i], law.vars[k][1] / 2), 1);
    const desc = chg.map((k, i) => `${law.vars[k][0]} ${facs[i] === 0.5 ? 'halbiert' : facs[i] === 2 ? 'verdoppelt' : 'verdreifacht'}`);
    const labels = [real, naive, flip, sq, only, half, real * 2, real / 2].map(RL);
    const o = U.buildOptions(rng, labels[0], labels.slice(1), { filler: i => RL(real * Math.pow(2, i % 2 ? i : -i)) });
    return Object.assign({
      stem: P(law.text) + Q(`Wie verändert sich ${law.res}, wenn ${desc.join(' und ')} wird und alle übrigen Größen konstant bleiben?`),
      layout: 'list',
      explanation: `Exponenten beachten: ${chg.map((k, i) => `(${N(facs[i])})<sup>${law.vars[k][1]}</sup>`).join(' · ')} = ${N(real, 4)} → <b>${RL(real)}</b>`
    }, o);
  });

  // 23 Kombinatorik
  def('kombinatorik', 2, rng => {
    if (rng.chance(0.5)) {
      const k = rng.pick([2, 3, 4, 5]), n = rng.pick([2, 3, 4]);
      if (Math.pow(k, n) > 700) return TEMPLATES.find(t => t.id === 'kombinatorik').fn(rng.fork('k'));
      const ans = Math.pow(k, n);
      const o = U.numericOptions(rng, ans, [k * n, Math.pow(n, k), Math.pow(k, n - 1), ans - 1, ans * 2, k + n], x => N(x, 0));
      return Object.assign({
        stem: P(`Ein fiktiver Organismus speichert Erbinformation mit ${k} verschiedenen Bausteinen. Jeweils ${n} aufeinanderfolgende Bausteine bilden ein „Codewort“; jede Position kann mit jedem der ${k} Bausteine besetzt sein.`) + Q('Wie viele verschiedene Codewörter sind möglich?'),
        explanation: `${n} Positionen mit je ${k} Möglichkeiten: ${k}<sup>${n}</sup> = <b>${ans}</b>.`
      }, o);
    }
    const k = rng.pick([2, 3, 4]), need = rng.pick([20, 30, 50, 60, 100, 200]);
    let n = 1; while (Math.pow(k, n) < need) n++;
    const o = U.numericOptions(rng, n, [n - 1, n + 1, n + 2, Math.ceil(need / k), Math.max(1, n - 2)], x => N(x, 0), 'Bausteine');
    return Object.assign({
      stem: P(`Ein Signalsystem verwendet Ketten aus ${k} verschiedenen Signalbausteinen; jede Position der Kette kann mit jedem Baustein besetzt sein. Es sollen mindestens ${need} verschiedene Botschaften eindeutig codiert werden; alle Ketten haben dieselbe Länge.`) + Q('Wie lang müssen die Ketten mindestens sein?'),
      explanation: `${k}<sup>${n - 1}</sup> = ${Math.pow(k, n - 1)} reicht nicht, ${k}<sup>${n}</sup> = ${Math.pow(k, n)} ≥ ${need}: <b>${n} Bausteine</b>.`
    }, o);
  });

  // 24 Hämatokrit / Blutvolumen
  def('haematokrit', 2, rng => {
    const w = rng.pick([50, 60, 70, 80, 90, 100]), f = rng.pick([7, 8]), hk = rng.pick([40, 42, 44, 45, 50]);
    const blood = w * f / 100, plasma = blood * (100 - hk) / 100;
    const askCells = rng.chance(0.35);
    const ans = askCells ? blood * hk / 100 : plasma;
    const o = U.numericOptions(rng, ans, [askCells ? plasma : blood * hk / 100, blood, w * (100 - hk) / 100, ans * 10, blood - hk / 10], x => N(x, 2), 'Liter');
    return Object.assign({
      stem: P(`Das Blutvolumen eines Erwachsenen beträgt etwa ${f} % seines Körpergewichts (1 kg Blut entspricht hier 1 Liter). Der Hämatokrit gibt den Volumenanteil der Blutzellen am gesamten Blutvolumen an; der Rest ist Blutplasma. Ein Patient wiegt ${w} kg, sein Hämatokrit beträgt ${hk} %.`) + Q(askCells ? 'Wie groß ist das Volumen seiner Blutzellen?' : 'Wie groß ist sein Plasmavolumen?'),
      explanation: `Blutvolumen = ${w} · 0,0${f} = ${N(blood)} l. ${askCells ? `Zellen: ${N(blood)} · ${hk} % = <b>${N(ans)} l</b>.` : `Plasma: ${N(blood)} · ${100 - hk} % = <b>${N(ans)} l</b>.`}`
    }, o);
  });

  // 25 Mischungsrechnung
  def('mischung', 2, rng => {
    const p = find(rng, () => ({ a: rng.pick([5, 10, 15, 20]), b: rng.pick([30, 40, 50, 60]), c: rng.pick([15, 20, 25, 30, 35]), va: rng.pick([100, 150, 200, 300, 400]) }),
      p => p.c > p.a && p.c < p.b && isNice(p.va * (p.c - p.a) / (p.b - p.c), 0));
    const vb = p.va * (p.c - p.a) / (p.b - p.c);
    const o = U.numericOptions(rng, vb, [p.va * (p.b - p.c) / (p.c - p.a), p.va * p.c / p.b, p.va, vb * 2, p.va * (p.c - p.a) / p.b], x => N(x, 1), 'ml');
    return Object.assign({
      stem: P(`Zu ${p.va} ml einer ${p.a}%igen Glukoselösung soll so viel einer ${p.b}%igen Glukoselösung gegeben werden, dass eine ${p.c}%ige Lösung entsteht (Prozentangaben: Gramm Glukose pro 100 ml).`) + Q(`Wie viel ml der ${p.b}%igen Lösung werden benötigt?`),
      explanation: `Glukosebilanz: ${p.va} · ${p.a} + x · ${p.b} = (${p.va} + x) · ${p.c} → x · (${p.b} − ${p.c}) = ${p.va} · (${p.c} − ${p.a}) → x = <b>${N(vb, 1)} ml</b>.`
    }, o);
  });

  T.gen.qfp = function (seed) {
    const rng = new RNG(seed);
    // 24 verschiedene Aufgabentypen, grob nach Schwierigkeit geordnet
    const chosen = rng.sample(TEMPLATES, 24).map(t => ({ t, k: t.level + rng.float(-0.8, 0.8) })).sort((a, b) => a.k - b.k).map(x => x.t);
    const items = chosen.map((t, i) => {
      const it = t.fn(rng.fork('qfp' + i + t.id));
      it.layout = it.layout || 'list';
      it.kind = t.id;
      return it;
    });
    return { items };
  };
  T.gen.qfp.TEMPLATES = TEMPLATES;
})(window.TMS);
