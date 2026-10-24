/* Medizinisch-naturwissenschaftliches Grundverständnis: Aufgabenfamilien mit berechneter Lösung */
(function (T) {
  'use strict';
  const RNG = T.RNG, U = T.util;
  const P = s => `<p>${s}</p>`;
  const Q = s => `<p class="q">${s}</p>`;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const S = (text, truth, why) => ({ text, truth, why });

  /**
   * Baut eine Aufgabe aus einem Pool beurteilbarer Aussagen.
   * mode: 'subset' (I/II/III), 'single' (genau eine richtig), 'singleNot' (genau eine falsch)
   */
  function fromPool(rng, intro, pool, o) {
    o = o || {};
    const T_ = pool.filter(s => s.truth), F_ = pool.filter(s => !s.truth);
    let mode = o.mode || rng.weighted(['subset', 'single', 'singleNot'], [6.5, 2.5, 1]);
    if (mode === 'single' && (T_.length < 1 || F_.length < 4)) mode = 'subset';
    if (mode === 'singleNot' && (T_.length < 4 || F_.length < 1)) mode = 'subset';
    if (mode === 'subset') {
      let chosen;
      for (let t = 0; t < 30; t++) {
        chosen = rng.sample(pool, 3);
        const nt = chosen.filter(s => s.truth).length;
        if ((nt > 0 && nt < 3) || rng.chance(0.15)) break;
      }
      const truth = chosen.map(s => s.truth);
      const opt = U.subsetOptions(rng, truth, o.verb || 'zutreffend');
      return {
        stem: intro + Q(o.qSubset || 'Welche der folgenden Aussagen trifft bzw. treffen zu?') + (o.lead ? P(o.lead) : '') + U.statementsHtml(chosen.map(s => s.text)),
        options: opt.options, correct: opt.correct, layout: 'list',
        explanation: U.explainStatements(chosen.map(s => s.text), truth, chosen.map(s => s.why))
      };
    }
    const correct = mode === 'single' ? rng.pick(T_) : rng.pick(F_);
    const others = mode === 'single' ? rng.sample(F_, 4) : rng.sample(T_, 4);
    const all = rng.shuffle(others.concat([correct]));
    const lead = o.lead ? o.lead + ' … ' : '';
    return {
      stem: intro + Q(mode === 'single' ? (o.qSingle || 'Welche der folgenden Aussagen trifft zu?') : (o.qNot || 'Welche der folgenden Aussagen trifft <b>nicht</b> zu?')) + (o.lead ? P(o.lead + ' …') : ''),
      options: all.map(s => s.text), correct: all.indexOf(correct), layout: 'list',
      explanation: '<ul class="expl-list">' + all.map((s, i) => `<li><b>(${U.LETTERS[i]})</b> <b class="${s.truth ? 'ok' : 'no'}">${s.truth ? 'zutreffend' : 'nicht zutreffend'}</b>${s.why ? ' – ' + s.why : ''}</li>`).join('') + '</ul>'
    };
  }

  const F = [];
  const fam = (id, fn) => F.push({ id, fn });

  // 1 Sensible und motorische Bahnen
  fam('bahnen', rng => {
    const mods = rng.shuffle(['Schmerz und Temperatur', 'Berührung und Druck', 'Vibration und Lagesinn']);
    const early = mods[0], late = mods[1];
    const withMotor = rng.chance(0.6);
    const sides = ['linke', 'rechte'];
    const scen = rng.pick(['rm', 'rm', 'cortex', 'stamm']);
    const side = rng.int(0, 1), other = 1 - side;
    let intro = `Die Empfindungen für ${early} werden in anderen Nervenbahnen zum Gehirn geleitet als die Empfindungen für ${late}. Die Fasern für ${early} kreuzen unmittelbar nach ihrem Eintritt in das Rückenmark auf die Gegenseite und ziehen dort im Rückenmark aufwärts zum Gehirn. Die Fasern für ${late} ziehen dagegen zunächst auf der Eintrittsseite im Rückenmark aufwärts und kreuzen erst im Hirnstamm auf die Gegenseite. Beide Bahnen enden in der Großhirnrinde, wo die Empfindungen bewusst werden.`;
    if (withMotor) intro += ' Die Fasern für die willkürliche Bewegung der Muskulatur ziehen von der Großhirnrinde abwärts, kreuzen im Hirnstamm auf die Gegenseite und verlaufen dann auf dieser Seite im Rückenmark bis zur Höhe der jeweiligen Muskeln.';
    let lesion, region;
    const lost = { early: null, late: null, motor: null };
    if (scen === 'rm') {
      lesion = `Bei einem Patienten ist die ${sides[side]} Hälfte des Rückenmarks in Höhe der Brustwirbelsäule vollständig durchtrennt; die ${sides[other]} Hälfte ist unverletzt.`;
      region = 'unterhalb der Verletzung';
      lost.early = other; lost.late = side; lost.motor = side;
    } else if (scen === 'cortex') {
      lesion = `Bei einem Patienten ist die Großhirnrinde der ${sides[side]}n Hirnhälfte in dem Bereich zerstört, in dem die genannten Bahnen enden${withMotor ? ' bzw. beginnen' : ''}.`;
      region = '';
      lost.early = other; lost.late = other; lost.motor = other;
    } else {
      lesion = `Bei einem Patienten sind im Hirnstamm alle Bahnen der ${sides[side]}n Seite unterhalb der Kreuzungsstellen im Hirnstamm unterbrochen.`;
      region = '';
      lost.early = other; lost.late = side; lost.motor = side;
    }
    const where = (s) => `an der ${sides[s]}n Körperhälfte${region ? ' ' + region : ''}`;
    const pool = [];
    for (const s of [0, 1]) {
      pool.push(S(`Die Empfindung für ${early} ist ${where(s)} ausgefallen.`, lost.early === s, `Diese Fasern kreuzen schon im Rückenmark; betroffen ist die ${sides[lost.early]} Körperhälfte.`));
      pool.push(S(`Die Empfindung für ${late} ist ${where(s)} ausgefallen.`, lost.late === s, `Diese Fasern kreuzen erst im Hirnstamm; betroffen ist die ${sides[lost.late]} Körperhälfte.`));
      if (withMotor) pool.push(S(`Die Muskulatur ${where(s).replace('an der', 'der')} kann nicht mehr willkürlich bewegt werden.`, lost.motor === s, `Die motorischen Fasern kreuzen im Hirnstamm; betroffen ist die ${sides[lost.motor]} Körperhälfte.`));
    }
    if (scen === 'rm') pool.push(S(`Die Empfindung für ${early} ist an beiden Armen erhalten.`, true, 'Die Arme liegen oberhalb der Verletzung in Höhe der Brustwirbelsäule.'));
    return fromPool(rng, P(intro) + P(lesion), pool, { qSubset: 'Welche der folgenden Aussagen trifft bzw. treffen diesen Informationen zufolge zu?', verb: 'zutreffend' });
  });

  // 2 Hormonachse mit negativer Rückkopplung
  const STEMS = ['Kalvo', 'Mera', 'Lusa', 'Vexo', 'Sira', 'Tavo', 'Belo', 'Duro', 'Fena', 'Garo', 'Noxa', 'Pelo'];
  const EFFECTS = [
    ['steigert den Grundumsatz des Körpers', 'der Grundumsatz'],
    ['erhöht den Blutzuckerspiegel', 'der Blutzuckerspiegel'],
    ['fördert die Rückresorption von Natrium in der Niere und erhöht so den Blutdruck', 'der Blutdruck'],
    ['fördert die Freisetzung von Kalzium aus den Knochen und erhöht so den Kalziumspiegel im Blut', 'der Kalziumspiegel im Blut']
  ];
  const GLANDS = ['die Nebennierenrinde', 'die Schilddrüse', 'die Nebenschilddrüse', 'eine Drüse im Bauchraum'];
  fam('hormon', rng => {
    const st = rng.pick(STEMS), H1 = st + 'liberin', H2 = st + 'tropin', H3 = st + 'sin';
    const eff = rng.pick(EFFECTS), gl = rng.pick(GLANDS), Pn = eff[1];
    const fbBoth = rng.chance(0.6);
    const intro = `Im Hypothalamus wird das Hormon ${H1} gebildet, das in der Hirnanhangsdrüse die Freisetzung des Hormons ${H2} fördert. ${H2} regt ${gl} zur Bildung und Freisetzung des Hormons ${H3} an. ${H3} ${eff[0]}. Eine hohe Konzentration von ${H3} im Blut hemmt die Freisetzung von ${fbBoth ? `${H1} und ${H2}` : H2} (negative Rückkopplung).`;
    // Ergebnisse: [H1, H2, H3, P], 1 = erhöht, -1 = erniedrigt
    const scenarios = [
      { t: `Bei einem Patienten bildet ein Tumor ${gl.replace('die ', 'der ').replace('eine ', 'einer ')} unkontrolliert große Mengen ${H3}.`, r: [fbBoth ? -1 : 0, -1, 1, 1], extra: [S(`Eine Gabe von ${H2} würde ${Pn} senken.`, false, `${H3} wird unabhängig von ${H2} gebildet.`)] },
      { t: 'Bei einem Patienten ist die Hirnanhangsdrüse vollständig ausgefallen.', r: [fbBoth ? 1 : 0, -1, -1, -1], extra: [S(`Eine Gabe von ${H2} würde ${Pn} erhöhen.`, true, `${H2} kann ${gl} weiterhin anregen.`), S(`Eine Gabe von ${H1} würde ${Pn} erhöhen.`, false, `${H1} wirkt über die Hirnanhangsdrüse, die ausgefallen ist.`)] },
      { t: `Bei einem Patienten wurde ${gl} vollständig entfernt.`, r: [fbBoth ? 1 : 0, 1, -1, -1], extra: [S(`Eine Gabe von ${H2} würde ${Pn} erhöhen.`, false, `Das Zielorgan für ${H2} fehlt.`), S(`Eine Gabe von ${H3} würde ${Pn} erhöhen.`, true, `${H3} wirkt direkt.`)] },
      { t: `Ein Patient nimmt über längere Zeit hohe Dosen ${H3} als Medikament ein.`, r: [fbBoth ? -1 : 0, -1, 1, 1], extra: [S(`Die körpereigene Bildung von ${H3} ist vermindert.`, true, `Wegen der Rückkopplung wird weniger ${H2} freigesetzt, das die Drüse anregt.`)] },
      { t: `Bei einem Patienten bildet ein Tumor der Hirnanhangsdrüse unkontrolliert große Mengen ${H2}.`, r: [fbBoth ? -1 : 0, 1, 1, 1], extra: [] },
      { t: `Bei einem Patienten sind die Bindungsstellen (Rezeptoren) für ${H2} in ${gl.replace('die ', 'der ').replace('eine ', 'einer ')} funktionslos; ${H2} kann dort nicht mehr wirken.`, r: [fbBoth ? 1 : 0, 1, -1, -1], extra: [S(`Eine Gabe von ${H2} würde ${Pn} erhöhen.`, false, `${H2} kann wegen der defekten Rezeptoren nicht wirken.`), S(`Eine Gabe von ${H3} würde ${Pn} erhöhen.`, true, `${H3} wirkt unabhängig von den ${H2}-Rezeptoren.`)] },
      { t: 'Bei einem Patienten ist der Hypothalamus so geschädigt, dass er kein Hormon mehr bildet.', r: [-1, -1, -1, -1], extra: [S(`Eine Gabe von ${H1} würde ${Pn} erhöhen.`, true, `${H1} wirkt auf die intakte Hirnanhangsdrüse.`)] }
    ];
    const sc = rng.pick(scenarios);
    const names = [H1, H2, H3];
    const pool = [];
    sc.r.forEach((d, i) => {
      if (d === 0) return;
      const subj = i < 3 ? `Die Konzentration von ${names[i]} im Blut ist` : `${cap(Pn)} ist`;
      const why = i < 3 ? `${names[i]} ist ${d > 0 ? 'erhöht' : 'erniedrigt'}.` : `${cap(Pn)} ist ${d > 0 ? 'erhöht' : 'erniedrigt'}.`;
      pool.push(S(`${subj} erhöht.`, d > 0, why));
      pool.push(S(`${subj} erniedrigt.`, d < 0, why));
    });
    // nur eine der beiden Richtungen pro Größe in den Pool, sonst wäre die Aufgabe trivial
    const filtered = [];
    for (let i = 0; i < pool.length; i += 2) filtered.push(rng.chance(0.5) ? pool[i] : pool[i + 1]);
    return fromPool(rng, P(intro) + P(sc.t), filtered.concat(sc.extra), { qSubset: 'Welche der folgenden Aussagen lässt bzw. lassen sich aus diesen Informationen ableiten?', verb: 'ableiten' });
  });

  // 3 Erbgänge
  function offspring(mode, mother, father) {
    // Genotypen als Strings: autosomal 'Aa' etc., X: Mutter 'XX', 'Xx', 'xx'; Vater 'XY' / 'xY' (x = verändert)
    const res = [];
    if (mode === 'XR') {
      for (const m of mother.split('')) for (const f of [father[0], 'Y']) res.push({ sex: f === 'Y' ? 'm' : 'f', g: f === 'Y' ? m + 'Y' : [m, f].sort().join('') });
      return res.map(c => Object.assign(c, { affected: c.sex === 'm' ? c.g[0] === 'x' : c.g === 'xx', carrier: c.sex === 'f' && c.g === 'Xx' }));
    }
    for (const m of mother.split('')) for (const f of father.split('')) for (const sex of ['m', 'f']) {
      const g = [m, f].sort().join('');
      const affected = mode === 'AR' ? g === 'aa' : g.includes('A');
      res.push({ sex, g, affected, carrier: mode === 'AR' && g === 'Aa' });
    }
    return res;
  }
  const prob = (list, f) => list.filter(f).length / list.length;
  fam('erbgang', rng => {
    const mode = rng.pick(['XR', 'XR', 'AR', 'AD']);
    let intro, cases;
    if (mode === 'XR') {
      intro = 'Frauen besitzen zwei X-Chromosomen, Männer ein X- und ein Y-Chromosom. Söhne erhalten ihr X-Chromosom stets von der Mutter, Töchter je ein X-Chromosom von Mutter und Vater; welches ihrer beiden X-Chromosomen eine Mutter weitergibt, ist zufällig. Bei einer X-chromosomal-rezessiv vererbten Krankheit erkranken Männer, wenn ihr X-Chromosom das veränderte Gen trägt. Frauen erkranken nur, wenn beide X-Chromosomen das veränderte Gen tragen; Frauen mit nur einem veränderten X-Chromosom sind gesund, können das Gen aber weitergeben (Überträgerinnen).';
      cases = [
        ['eine gesunde Frau, die Überträgerin ist, und ein gesunder Mann', 'Xx', 'XY'],
        ['eine gesunde Frau, die keine Überträgerin ist, und ein erkrankter Mann', 'XX', 'xY'],
        ['eine gesunde Frau, die Überträgerin ist, und ein erkrankter Mann', 'Xx', 'xY'],
        ['eine erkrankte Frau und ein gesunder Mann', 'xx', 'XY']
      ];
    } else if (mode === 'AR') {
      intro = 'Jeder Mensch besitzt für ein bestimmtes Gen zwei Allele, von denen er je eines von Mutter und Vater erhält; welches seiner beiden Allele ein Elternteil weitergibt, ist zufällig. Bei einer autosomal-rezessiv vererbten Krankheit erkrankt nur, wer zwei veränderte Allele besitzt. Menschen mit einem veränderten und einem unveränderten Allel sind gesund, aber Überträger.';
      cases = [['zwei gesunde Überträger', 'Aa', 'Aa'], ['eine erkrankte Frau und ein gesunder Mann, der kein Überträger ist', 'aa', 'AA'], ['eine erkrankte Frau und ein gesunder Überträger', 'aa', 'Aa'], ['eine gesunde Überträgerin und ein gesunder Mann, der kein Überträger ist', 'Aa', 'AA']];
    } else {
      intro = 'Jeder Mensch besitzt für ein bestimmtes Gen zwei Allele, von denen er je eines von Mutter und Vater erhält; welches seiner beiden Allele ein Elternteil weitergibt, ist zufällig. Bei einer autosomal-dominant vererbten Krankheit erkrankt bereits, wer ein einziges verändertes Allel besitzt. Gesunde Menschen besitzen demnach zwei unveränderte Allele.';
      cases = [['ein erkrankter Mann mit einem veränderten Allel und eine gesunde Frau', 'aa', 'Aa'], ['eine erkrankte Frau mit einem veränderten Allel und ein erkrankter Mann mit einem veränderten Allel', 'Aa', 'Aa']];
    }
    const c = rng.pick(cases);
    // AD: 'A' = verändertes Allel; AR: 'a' = verändert
    const kids = offspring(mode, c[1], c[2]);
    const sons = kids.filter(k => k.sex === 'm'), daughters = kids.filter(k => k.sex === 'f');
    const pS = prob(sons, k => k.affected), pD = prob(daughters, k => k.affected), pAll = prob(kids, k => k.affected);
    const pct = p => `${Math.round(p * 100)} %`;
    const pool = [
      S('Alle Söhne dieses Paares sind gesund.', pS === 0, `Wahrscheinlichkeit für einen erkrankten Sohn: ${pct(pS)}.`),
      S('Alle Töchter dieses Paares sind gesund.', pD === 0, `Wahrscheinlichkeit für eine erkrankte Tochter: ${pct(pD)}.`),
      S('Ein Sohn dieses Paares erkrankt mit einer Wahrscheinlichkeit von 50 %.', Math.abs(pS - 0.5) < 1e-9, `Tatsächlich: ${pct(pS)}.`),
      S('Eine Tochter dieses Paares erkrankt mit einer Wahrscheinlichkeit von 50 %.', Math.abs(pD - 0.5) < 1e-9, `Tatsächlich: ${pct(pD)}.`),
      S('Söhne und Töchter dieses Paares erkranken mit derselben Wahrscheinlichkeit.', Math.abs(pS - pD) < 1e-9, `Söhne: ${pct(pS)}, Töchter: ${pct(pD)}.`),
      S('Jedes Kind dieses Paares ist erkrankt.', pAll === 1, `Wahrscheinlichkeit: ${pct(pAll)}.`)
    ];
    if (mode === 'XR') {
      const pCar = prob(daughters, k => k.carrier);
      pool.push(S('Alle gesunden Töchter dieses Paares sind Überträgerinnen.', daughters.filter(k => !k.affected).every(k => k.carrier) && daughters.some(k => !k.affected), `Anteil Überträgerinnen unter den Töchtern: ${pct(pCar)}.`));
      pool.push(S('Ein erkrankter Sohn hat das veränderte Gen von seinem Vater geerbt.', false, 'Söhne erhalten vom Vater das Y-Chromosom, nicht das X-Chromosom.'));
    }
    if (mode === 'AR') {
      const healthy = kids.filter(k => !k.affected);
      pool.push(S('Jedes gesunde Kind dieses Paares ist Überträger.', healthy.length > 0 && healthy.every(k => k.carrier), `Gesunde Kinder: ${healthy.map(k => k.g).filter((v, i, a) => a.indexOf(v) === i).join(', ')}.`));
    }
    if (mode === 'AD') pool.push(S('Gesunde Kinder dieses Paares können das veränderte Allel an ihre eigenen Kinder weitergeben.', false, 'Gesunde besitzen bei dominantem Erbgang zwei unveränderte Allele.'));
    return fromPool(rng, P(intro) + P(`Betrachtet werden ${c[0]}.`), pool, { qSubset: 'Welche der folgenden Aussagen über die Kinder dieses Paares trifft bzw. treffen zu?' });
  });

  // 4 Blutgruppen AB0
  const BG = { A: ['AA', 'A0'], B: ['BB', 'B0'], AB: ['AB'], '0': ['00'] };
  const pheno = g => g.includes('A') && g.includes('B') ? 'AB' : g.includes('A') ? 'A' : g.includes('B') ? 'B' : '0';
  const childPossible = (m, f, c) => BG[m].some(gm => BG[f].some(gf => gm.split('').some(a => gf.split('').some(b => pheno(a + b) === c))));
  fam('blutgruppe', rng => {
    const intro = 'Die Blutgruppe im AB0-System wird durch die Allele A, B und 0 bestimmt. Jeder Mensch besitzt zwei dieser Allele, von denen er je eines von Mutter und Vater erhält. A und B setzen sich gegenüber 0 durch; treffen A und B zusammen, liegt Blutgruppe AB vor. Blutgruppe 0 liegt nur vor, wenn zwei 0-Allele vorhanden sind. Blutgruppe A kann also auf den Allelkombinationen AA oder A0 beruhen, Blutgruppe B auf BB oder B0.';
    const groups = ['A', 'B', 'AB', '0'];
    if (rng.chance(0.55)) {
      let m, c;
      for (let t = 0; t < 50; t++) { m = rng.pick(groups); c = rng.pick(groups); if (groups.some(f => childPossible(m, f, c)) && groups.some(f => !childPossible(m, f, c))) break; }
      const pool = groups.map(f => S(`Ein Mann mit der Blutgruppe ${f} kommt als Vater infrage.`, childPossible(m, f, c), childPossible(m, f, c) ? 'Eine passende Allelkombination ist möglich.' : 'Keine Allelkombination ergibt die Blutgruppe des Kindes.'));
      return fromPool(rng, P(intro) + P(`Ein Kind hat die Blutgruppe ${c}, seine Mutter die Blutgruppe ${m}.`), pool, { qSubset: 'Welche der folgenden Aussagen ist bzw. sind zutreffend?' });
    }
    const [m, f] = [rng.pick(groups), rng.pick(groups)];
    const pool = groups.map(c => S(`Das Kind kann die Blutgruppe ${c} haben.`, childPossible(m, f, c), childPossible(m, f, c) ? 'Möglich.' : 'Mit keiner Allelkombination der Eltern möglich.'));
    return fromPool(rng, P(intro) + P(`Die Mutter eines Kindes hat die Blutgruppe ${m}, der Vater die Blutgruppe ${f}.`), pool, { qSubset: 'Welche der folgenden Aussagen ist bzw. sind zutreffend?', mode: rng.chance(0.8) ? 'subset' : undefined });
  });

  // 5 Bilanzen
  const BILANZ = [
    { stoff: 'Stoffwechselbilanz des Stickstoffs', X: 'Stickstoff', def: 'Der Stickstoff wird mit den Eiweißen der Nahrung aufgenommen und – nach dem Abbau von Eiweißen – vor allem über die Nieren mit dem Harn ausgeschieden.',
      sc: [['Im Hungerzustand wird kein Eiweiß mit der Nahrung aufgenommen; körpereigene Eiweiße werden abgebaut und als Energielieferanten verwendet, der dabei anfallende Stickstoff wird ausgeschieden.', 'neg', 'Wie sieht die Stickstoffbilanz im Hungerzustand aus?'],
        ['Bei Kindern im Wachstum wird ein Teil der mit der Nahrung aufgenommenen Eiweiße zum Aufbau neuen Körpergewebes verwendet und verbleibt im Körper.', 'pos', 'Wie sieht die Stickstoffbilanz eines Kindes im Wachstum aus?'],
        ['Bei einem längere Zeit bettlägerigen Patienten wird trotz normaler Ernährung Muskeleiweiß abgebaut; der freiwerdende Stickstoff wird zusätzlich ausgeschieden.', 'neg', 'Wie sieht die Stickstoffbilanz dieses Patienten aus?'],
        ['Ein gesunder Erwachsener ernährt sich ausgewogen; sein Körpereiweißbestand bleibt über Monate unverändert.', 'eq', 'Wie sieht die Stickstoffbilanz dieses Erwachsenen aus?']] },
    { stoff: 'Wasserbilanz', X: 'Wasser', def: 'Wasser wird mit Getränken und Nahrung aufgenommen und über Harn, Schweiß, Atemluft und Stuhl abgegeben.',
      sc: [['Ein Bauarbeiter schwitzt an einem heißen Tag stark und trinkt dabei nur wenig; sein Körpergewicht nimmt im Lauf des Tages ab.', 'neg', 'Wie sieht seine Wasserbilanz an diesem Tag aus?'],
        ['Bei einer Patientin mit Herzschwäche lagert sich über mehrere Tage zunehmend Wasser im Gewebe ein (Ödeme), ihr Körpergewicht steigt.', 'pos', 'Wie sieht die Wasserbilanz der Patientin in diesem Zeitraum aus?']] },
    { stoff: 'Kalziumbilanz', X: 'Kalzium', def: 'Kalzium wird mit der Nahrung aufgenommen, zum größten Teil in den Knochen gespeichert und über Nieren und Darm ausgeschieden.',
      sc: [['Bei Osteoporose wird über Jahre hinweg Kalzium aus den Knochen herausgelöst und ausgeschieden, ohne dass entsprechend mehr Kalzium mit der Nahrung aufgenommen wird.', 'neg', 'Wie sieht die Kalziumbilanz bei fortschreitender Osteoporose aus?'],
        ['Im Kindesalter wachsen die Knochen; dabei wird Kalzium aus der Nahrung dauerhaft in das Knochengewebe eingebaut.', 'pos', 'Wie sieht die Kalziumbilanz im Kindesalter aus?']] }
  ];
  fam('bilanz', rng => {
    const b = rng.pick(BILANZ), sc = rng.pick(b.sc), X = b.X;
    const intro = `Die ${b.stoff} ist normalerweise ausgeglichen, d. h. die aufgenommene Menge an ${X} entspricht der ausgeschiedenen. ${b.def} Wird mehr ${X} aufgenommen als ausgeschieden, spricht man von einer positiven Bilanz, im umgekehrten Fall von einer negativen Bilanz.`;
    const opts = {
      pos: `Sie ist positiv, da mehr ${X} aufgenommen als ausgeschieden wird.`,
      posW: `Sie ist positiv, da mehr ${X} ausgeschieden als aufgenommen wird.`,
      neg: `Sie ist negativ, da mehr ${X} ausgeschieden als aufgenommen wird.`,
      negW: `Sie ist negativ, da weniger ${X} ausgeschieden wird als normalerweise.`,
      eq: `Sie ist ausgeglichen, da Aufnahme und Ausscheidung gleich groß sind.`,
      eqW: `Sie ist ausgeglichen, da sich der Körper an die veränderte Situation anpasst.`
    };
    const keys = sc[1] === 'eq' ? ['eq', 'pos', 'posW', 'neg', 'negW'] : sc[1] === 'pos' ? ['pos', 'posW', 'neg', 'negW', rng.pick(['eq', 'eqW'])] : ['neg', 'negW', 'pos', 'posW', rng.pick(['eq', 'eqW'])];
    const correctKey = sc[1];
    const order = ['pos', 'posW', 'neg', 'negW', 'eq', 'eqW'].filter(k => keys.includes(k));
    return {
      stem: P(intro) + P(sc[0]) + Q(sc[2]), options: order.map(k => opts[k]), correct: order.indexOf(correctKey), layout: 'list',
      explanation: `${sc[1] === 'eq' ? 'Aufnahme und Abgabe sind gleich groß.' : sc[1] === 'pos' ? `Es verbleibt ${X} im Körper, also wird mehr aufgenommen als ausgeschieden – positiv.` : `Es wird mehr ${X} abgegeben als aufgenommen – negativ.`} Achten Sie auf die Begründung: Nur eine Option kombiniert das richtige Vorzeichen mit der Definition.`
    };
  });

  // 6 Filtration in den Kapillaren
  fam('filtration', rng => {
    const pa = rng.int(30, 37), pv = rng.int(12, 17), pt = rng.int(1, 4), pk = rng.int(21, 26);
    const f0 = pa - pt - pk, r0 = pk - (pv - pt);
    if (f0 < 3 || r0 < 3) return F.find(f => f.id === 'filtration').fn(rng.fork('f'));
    const intro = `Die Kapillaren sind nicht nur Teil des Transportsystems für das Blut; durch ihre Wand findet auch ein Flüssigkeitsaustausch zwischen Blut und Gewebe statt. Am Anfang der Kapillaren beträgt der Blutdruck ${pa} mmHg, am Ende ${pv} mmHg; der Druck in der Gewebsflüssigkeit beträgt ${pt} mmHg. Diesem nach außen gerichteten Druckunterschied wirkt der nach innen gerichtete „kolloidosmotische Druck“ des Blutes entgegen, der durch die Bluteiweiße entsteht und über die ganze Kapillare konstant ${pk} mmHg beträgt. Am Anfang der Kapillaren tritt daher Flüssigkeit mit einem effektiven Filtrationsdruck von ${pa} − ${pt} − ${pk} = ${f0} mmHg ins Gewebe aus; am Ende strömt Flüssigkeit mit einem Reabsorptionsdruck von ${pk} − (${pv} − ${pt}) = ${r0} mmHg ins Blut zurück.`;
    const sc = rng.pick([
      ['Bei Eiweißmangelernährung sinkt der kolloidosmotische Druck im Blut.', 1, -1],
      ['Bei einer Herzschwäche staut sich das Blut in den Venen; der Blutdruck am Ende der Kapillaren steigt.', 0, -1],
      ['Bei einem Bluthochdruck steigt der Blutdruck am Anfang der Kapillaren.', 1, 0],
      ['Durch eine Schwellung steigt der Druck in der Gewebsflüssigkeit.', -1, 1],
      ['Bei starkem Wasserverlust steigt die Konzentration der Bluteiweiße und damit der kolloidosmotische Druck.', -1, 1]
    ]);
    if (rng.chance(0.35)) {
      // numerische Variante
      const d = rng.int(4, 8);
      const which = sc[0].includes('kolloidosmotische Druck im Blut') ? 'pk-' : sc[0].includes('Ende der Kapillaren') ? 'pv+' : sc[0].includes('Anfang der Kapillaren') ? 'pa+' : sc[0].includes('Gewebsflüssigkeit') ? 'pt+' : 'pk+';
      const v = { pa, pv, pt, pk };
      if (which === 'pk-') v.pk -= d; if (which === 'pk+') v.pk += d; if (which === 'pv+') v.pv += d; if (which === 'pa+') v.pa += d; if (which === 'pt+') v.pt = pt + Math.min(d, 4);
      const askEnd = which === 'pv+' || (which !== 'pa+' && rng.chance(0.5));
      const val = askEnd ? v.pk - (v.pv - v.pt) : v.pa - v.pt - v.pk;
      const label = x => x >= 0 ? `${x} mmHg ${askEnd ? 'nach innen (Reabsorption)' : 'nach außen (Filtration)'}` : `${-x} mmHg ${askEnd ? 'nach außen (Filtration)' : 'nach innen (Reabsorption)'}`;
      const cands = [val + d, val - d, askEnd ? r0 : f0, -val, val + 2 * d, val - 2];
      const o = U.buildOptions(rng, label(val), cands.map(label), { filler: i => label(val + i + 3) });
      const desc = { 'pk-': `der kolloidosmotische Druck um ${d} mmHg sinkt`, 'pk+': `der kolloidosmotische Druck um ${d} mmHg steigt`, 'pv+': `der Blutdruck am Ende der Kapillaren um ${d} mmHg steigt`, 'pa+': `der Blutdruck am Anfang der Kapillaren um ${d} mmHg steigt`, 'pt+': `der Druck in der Gewebsflüssigkeit um ${Math.min(d, 4)} mmHg steigt` }[which];
      return Object.assign({ stem: P(intro) + Q(`Welcher resultierende Druck ergibt sich ${askEnd ? 'am Ende' : 'am Anfang'} der Kapillaren, wenn ${desc} und alle übrigen Werte unverändert bleiben?`), layout: 'list',
        explanation: `Neu: ${askEnd ? `${v.pk} − (${v.pv} − ${v.pt}) = ${val}` : `${v.pa} − ${v.pt} − ${v.pk} = ${val}`} mmHg → <b>${label(val)}</b>.` }, o);
    }
    const [df, dr] = sc.slice(1);
    const pool = [
      S('Es tritt vermehrt Flüssigkeit aus den Kapillaren ins Gewebe über, da der effektive Filtrationsdruck größer ist.', df > 0),
      S('Es strömt weniger Flüssigkeit aus den Kapillaren ins Gewebe, da der effektive Filtrationsdruck kleiner ist.', df < 0),
      S('Der Rückstrom von Flüssigkeit ins Blut ist erhöht, da der Reabsorptionsdruck größer ist.', dr > 0),
      S('Der Rückstrom von Flüssigkeit ins Blut ist verringert, da der Reabsorptionsdruck kleiner ist.', dr < 0),
      S('Der Rückstrom von Flüssigkeit ins Blut ist erhöht, da der effektive Filtrationsdruck größer ist.', false),
      S('Es tritt keine Verschiebung des Flüssigkeitsgleichgewichts ein, da der kolloidosmotische Druck entlang der Kapillaren konstant ist.', false)
    ];
    const trues = pool.filter(s => s.truth), falses = pool.filter(s => !s.truth);
    const correct = rng.pick(trues);
    const all = rng.shuffle(rng.sample(falses, 4).concat([correct]));
    return { stem: P(intro) + P(sc[0]) + Q('Welche Konsequenz ergibt sich daraus für den Flüssigkeitsaustausch zwischen Kapillaren und Gewebe?'),
      options: all.map(s => s.text), correct: all.indexOf(correct), layout: 'list',
      explanation: `Filtrationsdruck ${df > 0 ? 'steigt' : df < 0 ? 'sinkt' : 'bleibt gleich'}, Reabsorptionsdruck ${dr > 0 ? 'steigt' : dr < 0 ? 'sinkt' : 'bleibt gleich'}. Richtig ist: „${correct.text}“` };
  });

  // 7 Gefäßversorgung mit Querverbindung
  fam('gefaesse', rng => {
    const L = ['A', 'B', 'C', 'D', 'E', 'F'];
    // Baum: A -> B, C ; B -> D ; C -> E ; zufällige Zusatzäste
    const children = { A: ['B', 'C'], B: ['D'], C: ['E'], D: [], E: [] };
    if (rng.chance(0.5)) { children.D.push('F'); children.F = []; } else { children.C.push('F'); children.F = []; }
    const vessels = Object.keys(children);
    const parent = {}; vessels.forEach(v => children[v].forEach(c => { parent[c] = v; }));
    const regions = rng.shuffle(U.range(5).map(i => i + 1));
    const supply = {}; // Gefäß -> Gebiete
    vessels.forEach(v => { supply[v] = []; });
    const leaves = vessels.filter(v => children[v].length === 0);
    leaves.forEach((v, i) => supply[v].push(regions[i]));
    const rest = regions.slice(leaves.length);
    rest.forEach(r => supply[rng.pick(['B', 'C'])].push(r));
    // Querverbindung zwischen zwei Gefäßen aus verschiedenen Teilbäumen
    const subB = v => { let x = v; while (x && x !== 'B' && x !== 'C') x = parent[x]; return x; };
    const pairs = [];
    for (const a of vessels) for (const b of vessels) if (a < b && a !== 'A' && b !== 'A' && subB(a) !== subB(b) && !['B', 'C'].includes(a + b)) pairs.push([a, b]);
    const anas = rng.pick(pairs.filter(p => !(p[0] === 'B' && p[1] === 'C')));
    const order = ['A', 'B', 'C', 'D', 'E', 'F'].filter(v => children[v]);
    const lines = [];
    lines.push(`Das Gefäß A entspringt aus der Hauptschlagader und teilt sich in die Äste B und C.`);
    for (const v of order) {
      if (v === 'A') continue;
      const parts = [];
      if (supply[v].length) parts.push(`versorgt ${supply[v].length === 1 ? 'das Gebiet' : 'die Gebiete'} ${supply[v].join(' und ')}`);
      if (children[v].length) parts.push(`gibt den Ast ${children[v].join(' und den Ast ')} ab`);
      if (parts.length) lines.push(`Ast ${v} ${parts.join(' und ')}.`);
    }
    lines.push(`Zwischen Ast ${anas[0]} und Ast ${anas[1]} besteht eine Querverbindung (Anastomose), durch die Blut in beide Richtungen fließen kann. Bei einem Gefäßverschluss kann Blut über die Querverbindung auch entgegen der normalen Flussrichtung in andere Äste gelangen. Weitere Verbindungen gibt es nicht; jedes Gebiet wird nur von dem genannten Ast versorgt.`);
    const occl = rng.pick(vessels.filter(v => v !== 'A'));
    // Erreichbarkeit nach Verschluss am Ursprung von occl
    const edges = [];
    vessels.forEach(v => children[v].forEach(c => { if (c !== occl) edges.push([v, c]); }));
    edges.push(anas);
    const reach = new Set(['A']);
    let changed = true;
    while (changed) { changed = false; for (const [a, b] of edges) { if (reach.has(a) && !reach.has(b)) { reach.add(b); changed = true; } if (reach.has(b) && !reach.has(a)) { reach.add(a); changed = true; } } }
    const lost = regions.filter(r => !reach.has(vessels.find(v => supply[v].includes(r))));
    const pool = regions.map(r => S(`Das Gebiet ${r} wird nicht mehr mit Blut versorgt.`, lost.includes(r), lost.includes(r) ? 'Kein Weg von A zu diesem Gebiet.' : 'Erreichbar – ggf. über die Querverbindung.'));
    return fromPool(rng, P(lines.join(' ')) + P(`Bei einem Patienten ist der Ast ${occl} unmittelbar an seinem Ursprung vollständig verschlossen.`), pool, { qSubset: 'Welche der folgenden Aussagen trifft bzw. treffen zu?', mode: 'subset' });
  });

  // 8 Stoffwechselweg mit Enzymdefekt
  fam('stoffwechsel', rng => {
    const nm = rng.shuffle(['K', 'L', 'M', 'R', 'S', 'V', 'W', 'Z']);
    const [S0, A, B, Pp, Nn] = nm;
    const fb = rng.chance(0.65);
    const intro = `In einer Zelle wird der Stoff ${S0} in mehreren Schritten zum Endprodukt ${Pp} umgewandelt: Das Enzym E1 wandelt ${S0} in ${A} um, das Enzym E2 wandelt ${A} in ${B} um, und das Enzym E3 wandelt ${B} in ${Pp} um. Aus ${A} kann außerdem durch das Enzym E4 der Stoff ${Nn} gebildet werden. ${fb ? `${Pp} hemmt die Aktivität von E1 (je mehr ${Pp} vorhanden ist, desto weniger ${A} wird gebildet). ` : ''}Fällt ein Enzym aus, so sammelt sich der Stoff an, den es normalerweise umwandelt; die Stoffe, die ausschließlich über diesen Schritt entstehen, werden nicht mehr gebildet. ${S0} wird der Zelle stets in gleicher Menge zugeführt.`;
    const defect = rng.pick(['E1', 'E2', 'E3', 'E4']);
    // Richtungen: 1 erhöht, -1 erniedrigt/fehlt, 0 unbestimmt
    const r = {
      E1: { [S0]: 1, [A]: -1, [B]: -1, [Pp]: -1, [Nn]: -1 },
      E2: { [A]: 1, [Nn]: 1, [B]: -1, [Pp]: -1 },
      E3: { [B]: 1, [Pp]: -1, [A]: fb ? 1 : 0, [Nn]: fb ? 1 : 0 },
      E4: { [Nn]: -1, [A]: 0 }
    }[defect];
    const pool = [];
    Object.keys(r).forEach(k => {
      if (!r[k]) return;
      const why = r[k] > 0 ? `${k} sammelt sich an bzw. wird vermehrt gebildet.` : `${k} entsteht nur über den ausgefallenen Schritt oder dahinter.`;
      pool.push(k === S0 || rng.chance(0.5) ? S(`Die Konzentration von ${k} in der Zelle ist erhöht.`, r[k] > 0, why) : S(`${k} wird vermindert oder gar nicht mehr gebildet.`, r[k] < 0, why));
    });
    if (fb && (defect === 'E2' || defect === 'E3')) pool.push(S(`Eine Zufuhr von ${Pp} würde die Bildung von ${Nn} verringern.`, true, `${Pp} hemmt E1, dadurch entsteht weniger ${A} und damit weniger ${Nn}.`));
    if (!fb && defect === 'E3') pool.push(S(`Die Konzentration von ${A} ist erhöht.`, false, 'Ohne Rückkopplung bleibt die Bildung von ' + A + ' unverändert; der Text erlaubt keine Aussage über einen Anstieg.'));
    if (defect === 'E4') pool.push(S(`${Pp} wird nicht mehr gebildet.`, false, `Der Weg über E2 und E3 ist intakt.`));
    if (pool.length < 3) pool.push(S(`${S0} wird nicht mehr in ${A} umgewandelt.`, defect === 'E1', defect === 'E1' ? 'E1 ist ausgefallen.' : 'E1 ist intakt.'));
    return fromPool(rng, P(intro) + P(`Bei einem Patienten ist das Enzym ${defect} aufgrund eines Gendefekts funktionslos.`), pool, { qSubset: 'Welche der folgenden Aussagen lässt bzw. lassen sich aus diesen Informationen ableiten?', verb: 'ableiten', mode: 'subset' });
  });

  // 9 Osmose
  fam('osmose', rng => {
    const c0 = rng.pick([0.6, 0.9, 1.2]);
    const fmt = x => U.fmt(x, 2);
    const intro = `Die Zellen eines bestimmten Gewebes sind von einer Membran umgeben, die Wasser ungehindert passieren lässt, Kochsalz dagegen nicht. Das Zellinnere entspricht in seiner Konzentration gelöster Teilchen einer ${fmt(c0)}%igen Kochsalzlösung. Wasser strömt durch eine solche Membran stets auf die Seite mit der höheren Konzentration nicht durchtretender Teilchen (Osmose). Strömt Wasser in die Zellen ein, schwellen sie an und können platzen; strömt Wasser aus, schrumpfen sie. Harnstoff kann die Membran – anders als Kochsalz – ungehindert passieren; gelangen solche Teilchen in die Zelle, strömt ihnen Wasser nach.`;
    const sols = rng.shuffle([
      [`einer ${fmt(c0 / 3)}%igen Kochsalzlösung`, 'swell', 'Außen geringer konzentriert → Wasser strömt ein.'],
      [`einer ${fmt(c0 * 2)}%igen Kochsalzlösung`, 'shrink', 'Außen höher konzentriert → Wasser strömt aus.'],
      [`einer ${fmt(c0)}%igen Kochsalzlösung`, 'same', 'Gleiche Konzentration → kein Netto-Wasserstrom.'],
      ['destilliertem Wasser', 'swell', 'Keine gelösten Teilchen außen → Wasser strömt ein.'],
      ['einer reinen Harnstofflösung', 'swell', 'Harnstoff dringt ein, Wasser strömt nach → die Zellen schwellen an.']
    ]);
    const pool = [];
    sols.forEach(([s, eff, why]) => {
      const claim = rng.pick(['swell', 'shrink', 'same']);
      const txt = { swell: `In ${s} schwellen die Zellen an.`, shrink: `In ${s} schrumpfen die Zellen.`, same: `In ${s} bleibt das Zellvolumen unverändert.` }[claim];
      pool.push(S(txt, claim === eff, why));
    });
    return fromPool(rng, P(intro) + P('Zellen dieses Gewebes werden in verschiedene Lösungen gebracht.'), pool, { qSubset: 'Welche der folgenden Aussagen lässt bzw. lassen sich aus diesen Informationen ableiten?', verb: 'ableiten' });
  });

  // 10 Rezeptoren und Pharmaka
  fam('pharmaka', rng => {
    const effs = rng.shuffle([
      ['am Herzen', 'steigert er die Herzfrequenz', 'die Herzfrequenz', 'erhöht', 'erniedrigt'],
      ['an den Bronchien', 'erweitert er die Atemwege', 'die Weite der Atemwege', 'vergrößert', 'verringert'],
      ['an den Blutgefäßen der Haut', 'verengt er diese Gefäße', 'die Durchblutung der Haut', 'verringert', 'erhöht'],
      ['am Darm', 'hemmt er die Darmbewegungen', 'die Darmbewegung', 'verringert', 'verstärkt']
    ]).slice(0, 2);
    const tr = rng.pick(['Neurotransmin', 'Kardiotonin', 'Vasolin', 'Adrenomin']);
    const intro = `Der körpereigene Botenstoff ${tr} ist ständig in geringer Menge vorhanden und wirkt über zwei Typen von Bindungsstellen (Rezeptoren): Über X-Rezeptoren ${effs[0][0]} ${effs[0][1]}, über Y-Rezeptoren ${effs[1][0]} ${effs[1][1]}. Das Medikament Präparat 1 blockiert ausschließlich X-Rezeptoren, sodass ${tr} dort nicht mehr wirken kann; Präparat 2 aktiviert ausschließlich Y-Rezeptoren und wirkt dort wie ${tr}. Das Enzym E baut ${tr} ab; Präparat 3 hemmt dieses Enzym.`;
    const combos = [['1'], ['3'], ['1', '3'], ['2'], ['1', '2'], ['2', '3']];
    const combo = rng.pick(combos);
    const has = k => combo.includes(k);
    // Wirkung an X: blockiert -> -1 ; mehr Transmitter -> +1
    const x = has('1') ? -1 : has('3') ? 1 : 0;
    const y = (has('2') || has('3')) ? 1 : 0;
    const tc = has('3') ? 1 : 0;
    const desc = combo.length === 1 ? `Ein Patient erhält Präparat ${combo[0]}.` : `Ein Patient erhält gleichzeitig Präparat ${combo[0]} und Präparat ${combo[1]}.`;
    const eff = (e, d) => d > 0 ? e[3] : e[4];
    const pool = [];
    [[effs[0], x], [effs[1], y]].forEach(([e, d]) => {
      const claimD = rng.pick([1, -1, 0]);
      const text = claimD === 0 ? `${cap(e[2])} bleibt gegenüber dem Normalzustand unverändert.` : `${cap(e[2])} ist gegenüber dem Normalzustand ${eff(e, claimD)}.`;
      pool.push(S(text, claimD === d, d === 0 ? 'Keine Änderung an diesem Rezeptortyp.' : `Die Wirkung ${e[0]} ist ${d > 0 ? 'verstärkt' : 'aufgehoben'}.`));
    });
    pool.push(S(`Die Konzentration von ${tr} ist erhöht.`, tc > 0, tc ? 'Der Abbau ist gehemmt.' : 'Der Abbau ist nicht beeinflusst.'));
    if (has('1')) pool.push(S(`Eine zusätzliche Gabe von Präparat 3 würde die Wirkung ${effs[0][0]} wiederherstellen.`, false, 'Die X-Rezeptoren bleiben blockiert, egal wie viel Botenstoff vorhanden ist.'));
    return fromPool(rng, P(intro) + P(desc), pool, { qSubset: 'Welche der folgenden Aussagen trifft bzw. treffen zu?', mode: 'subset' });
  });

  // 11 Reflexbogen
  fam('reflex', rng => {
    const intro = 'Reize, die auf die Haut einwirken, werden in Sinnesorganen der Haut in elektrische Impulse umgewandelt. Diese laufen über zuführende Nervenfasern und die sogenannten Hinterwurzeln ins Rückenmark. Dort werden sie auf andere Nervenzellen umgeschaltet: Über motorische Nervenzellen, deren Fasern das Rückenmark über die Vorderwurzeln verlassen, können sie Reflexbewegungen der Muskulatur auslösen; über aufsteigende Bahnen gelangen sie außerdem zur Großhirnrinde, wo die Reize bewusst wahrgenommen werden. Willkürliche Bewegungen werden von der Großhirnrinde über absteigende Bahnen ausgelöst, die im Rückenmark ebenfalls auf die motorischen Nervenzellen der Vorderwurzeln umgeschaltet werden.';
    const L = rng.pick([
      ['die Hinterwurzeln des Rückenmarks in einem Abschnitt durchtrennt', { impulse: false, reflex: true, percept: true, voluntary: false }],
      ['die Vorderwurzeln des Rückenmarks in einem Abschnitt durchtrennt', { impulse: false, reflex: true, percept: false, voluntary: true }],
      ['die aufsteigenden Bahnen oberhalb des betroffenen Rückenmarkabschnitts durchtrennt', { impulse: false, reflex: false, percept: true, voluntary: false }],
      ['die absteigenden Bahnen oberhalb des betroffenen Rückenmarkabschnitts durchtrennt', { impulse: false, reflex: false, percept: false, voluntary: true }]
    ]);
    const lost = L[1];
    const pool = [
      S('In den Sinnesorganen der Haut werden keine elektrischen Impulse mehr gebildet.', lost.impulse, 'Die Sinnesorgane selbst sind nicht betroffen.'),
      S('Durch Hautreize lassen sich keine Reflexbewegungen mehr auslösen.', lost.reflex, lost.reflex ? 'Der Reflexbogen ist unterbrochen.' : 'Der Reflexbogen (Hinterwurzel – Rückenmark – Vorderwurzel) ist intakt.'),
      S('Hautreize können nicht mehr bewusst wahrgenommen werden.', lost.percept, lost.percept ? 'Der Weg zur Großhirnrinde ist unterbrochen.' : 'Der Weg zur Großhirnrinde ist intakt.'),
      S('Die betroffene Muskulatur kann nicht mehr willkürlich bewegt werden.', lost.voluntary, lost.voluntary ? 'Der Weg von der Großhirnrinde zum Muskel ist unterbrochen.' : 'Der Weg von der Großhirnrinde zum Muskel ist intakt.')
    ];
    return fromPool(rng, P(intro) + P(`Bei einem Patienten sind ${L[0]}.`), pool, { qSubset: 'Welche(r) der folgenden Ausfälle ist bzw. sind diesen Informationen zufolge zu erwarten?', verb: 'ausfall', mode: 'subset' });
  });

  // 12 Bildgebung nach Dichte
  fam('bildgebung', rng => {
    const brightHigh = rng.chance(0.6);
    const dense = ['ein alter, verkalkter Entzündungsherd in der Lunge', 'ein verschluckter Metallgegenstand im Magen', 'ein kalkhaltiger Nierenstein', 'eine größere Eiteransammlung im luftgefüllten Lungengewebe', 'eine Flüssigkeitsansammlung zwischen Lunge und Brustwand'];
    const light = ['ein Tumor, der das Knochengewebe eines Wirbels entkalkt', 'eine Luftansammlung in der Bauchhöhle', 'eine stark verringerte Knochendichte im Oberschenkelknochen', 'eine Gasblase in einem Muskel'];
    const askDark = rng.chance(0.5);
    // dunkler erscheint, was weniger absorbiert, wenn hohe Absorption hell erscheint
    const wantDense = brightHigh ? !askDark : askDark;
    const correct = rng.pick(wantDense ? dense : light);
    const others = rng.sample(wantDense ? light : dense, 4);
    const all = rng.shuffle(others.concat([correct]));
    const intro = `Röntgenstrahlen werden umso stärker absorbiert, je dichter das durchstrahlte Material ist. ${brightHigh ? 'Auf einem Röntgenfilm werden Stellen umso stärker geschwärzt, je mehr Strahlung dort ankommt; Bereiche hinter stark absorbierendem Gewebe bleiben daher hell.' : 'Bei einem bestimmten digitalen Verfahren wird das Bild invertiert dargestellt: Stellen, an denen viel Strahlung ankommt, erscheinen hell, Bereiche hinter stark absorbierendem Gewebe erscheinen dunkel.'} Metalle sind noch dichter als Knochen, Knochen sind wegen ihres Kalkgehalts dichter als Weichteile, luftgefülltes Lungengewebe ist weniger dicht als Weichteile, Flüssigkeiten entsprechen etwa Weichteilen.`;
    return {
      stem: P(intro) + Q(`Welcher der folgenden Befunde würde sich demnach als ${askDark ? 'dunklere' : 'hellere'} Stelle von seiner Umgebung abheben?`),
      options: all.map(cap), correct: all.indexOf(correct), layout: 'list',
      explanation: `${brightHigh ? 'Hohe Dichte → mehr Absorption → hell.' : 'Hohe Dichte → mehr Absorption → hier dunkel (invertiert).'} Gesucht ist also ein Befund, der <b>${wantDense ? 'dichter' : 'weniger dicht'}</b> ist als seine Umgebung: „${cap(correct)}“.`
    };
  });

  // 13 Säure-Basen-Haushalt
  fam('saeurebase', rng => {
    const intro = 'Im Blut reagiert Kohlendioxid (CO₂) mit Wasser zu Kohlensäure, die zum Teil Wasserstoffionen (H⁺) abgibt. Je höher die H⁺-Konzentration, desto niedriger ist der pH-Wert. CO₂ wird über die Lunge abgeatmet; eine gesteigerte Atmung senkt daher den CO₂-Gehalt des Blutes, eine verminderte Atmung erhöht ihn. Hydrogencarbonat im Blut kann H⁺ binden. Sinkt der pH-Wert des Blutes, wird die Atmung über Sensoren im Hirnstamm gesteigert; steigt er, wird die Atmung vermindert.';
    const sc = rng.pick([
      ['Ein Patient atmet während einer Panikattacke über längere Zeit sehr schnell und tief.', { ph: 1, co2: -1 }],
      ['Nach einer Schlafmittelvergiftung ist die Atmung eines Patienten stark vermindert.', { ph: -1, co2: 1 }],
      ['Bei einer Stoffwechselentgleisung entstehen im Körper eines Patienten große Mengen saurer Stoffwechselprodukte, die H⁺ freisetzen.', { ph: -1, breath: 1, co2: -1 }],
      ['Ein Patient verliert durch wiederholtes Erbrechen große Mengen salzsäurehaltigen Magensaft und damit H⁺.', { ph: 1, breath: -1, co2: 1 }],
      ['Ein Patient verliert durch schwere Durchfälle große Mengen Hydrogencarbonat.', { ph: -1, breath: 1, co2: -1 }]
    ]);
    const r = sc[1];
    const pool = [];
    const add = (key, up, down, nm) => { if (r[key] === undefined) return; const claim = rng.chance(0.5) ? 1 : -1; pool.push(S(claim > 0 ? up : down, claim === r[key], `${nm} ${r[key] > 0 ? 'steigt' : 'sinkt'}.`)); };
    add('ph', 'Der pH-Wert des Blutes steigt.', 'Der pH-Wert des Blutes sinkt.', 'Der pH-Wert');
    add('co2', 'Der CO₂-Gehalt des Blutes steigt.', 'Der CO₂-Gehalt des Blutes sinkt.', 'Der CO₂-Gehalt');
    add('breath', 'Die Atmung wird gesteigert.', 'Die Atmung wird vermindert.', 'Die Atemtätigkeit');
    pool.push(S('Die H⁺-Konzentration im Blut ' + (r.ph > 0 ? 'nimmt ab.' : 'nimmt zu.'), true, `Der pH-Wert ${r.ph > 0 ? 'steigt' : 'sinkt'}, also ${r.ph > 0 ? 'sinkt' : 'steigt'} die H⁺-Konzentration.`));
    if (pool.length < 4) pool.push(S('Die H⁺-Konzentration im Blut ' + (r.ph > 0 ? 'nimmt zu.' : 'nimmt ab.'), false, 'Gegenläufig zum pH-Wert.'));
    return fromPool(rng, P(intro) + P(sc[0]), pool, { qSubset: 'Welche der folgenden Aussagen lässt bzw. lassen sich aus diesen Informationen ableiten?', verb: 'ableiten', mode: 'subset' });
  });

  // 14 Aktive und passive Immunisierung
  fam('immun', rng => {
    const intro = 'Bei der aktiven Immunisierung werden abgeschwächte oder abgetötete Krankheitserreger bzw. deren Bestandteile verabreicht. Der Körper bildet daraufhin innerhalb von ein bis zwei Wochen selbst Antikörper sowie Gedächtniszellen, die bei einem späteren Kontakt mit demselben Erreger eine schnelle und verstärkte Antikörperbildung ermöglichen; der Schutz hält meist viele Jahre an. Bei der passiven Immunisierung werden fertige Antikörper verabreicht. Sie wirken sofort, werden aber innerhalb weniger Wochen abgebaut; Gedächtniszellen entstehen dabei nicht.';
    const pool = [
      S('Nach einer passiven Immunisierung besteht sofort ein Schutz.', true, 'Fertige Antikörper wirken sofort.'),
      S('Nach einer passiven Immunisierung ist der Körper bei einem erneuten Erregerkontakt nach drei Jahren noch geschützt.', false, 'Die Antikörper sind nach wenigen Wochen abgebaut, Gedächtniszellen fehlen.'),
      S('Muss ein bereits ansteckungsgefährdeter Patient sofort geschützt werden, ist eine passive Immunisierung geeigneter als eine aktive.', true, 'Die aktive braucht ein bis zwei Wochen.'),
      S('Eine aktive Immunisierung bietet bereits am Tag der Impfung vollen Schutz.', false, 'Die Antikörperbildung dauert ein bis zwei Wochen.'),
      S('Durch eine aktive Immunisierung entstehen Gedächtniszellen.', true, 'Steht so im Text.'),
      S('Bei der passiven Immunisierung bildet der Körper selbst Antikörper.', false, 'Die Antikörper werden fertig verabreicht.'),
      S('Die gleichzeitige aktive und passive Immunisierung kann einen sofortigen und zugleich lang anhaltenden Schutz bewirken.', true, 'Passive wirkt sofort, aktive langfristig.'),
      S('Nach einer passiven Immunisierung werden bei einem späteren Erregerkontakt schneller Antikörper gebildet als ohne Immunisierung.', false, 'Ohne Gedächtniszellen keine beschleunigte Antwort.')
    ];
    return fromPool(rng, P(intro), pool, { qSubset: 'Welche der folgenden Aussagen lässt bzw. lassen sich aus diesen Informationen ableiten?', verb: 'ableiten' });
  });

  // 15 Blutzuckerregulation
  fam('blutzucker', rng => {
    const intro = 'Das Hormon Insulin aus den B-Zellen der Bauchspeicheldrüse senkt den Blutzucker, indem es die Aufnahme von Glukose in Muskel- und Fettzellen fördert und in der Leber die Speicherung von Glukose als Glykogen anregt. Das Hormon Glukagon aus den A-Zellen erhöht den Blutzucker, indem es in der Leber den Abbau von Glykogen zu Glukose fördert. Ein steigender Blutzucker regt die Insulinfreisetzung an und hemmt die Glukagonfreisetzung; ein sinkender Blutzucker bewirkt das Gegenteil. Übersteigt der Blutzucker etwa 180 mg/dl, wird Glukose mit dem Harn ausgeschieden.';
    const sc = rng.pick([
      ['Bei einem Patienten bildet ein Tumor der B-Zellen unkontrolliert große Mengen Insulin.', { bz: -1, glucagon: 1, urine: false, glyco: 1 }],
      ['Bei einem Patienten wurden die B-Zellen durch eine Autoimmunerkrankung vollständig zerstört; sein Blutzucker liegt dauerhaft bei 300 mg/dl.', { bz: 1, urine: true, muscle: -1 }],
      ['Eine gesunde Person hat seit 24 Stunden nichts gegessen; ihr Blutzucker ist leicht gesunken.', { insulin: -1, glucagon: 1, glycoBreak: 1, urine: false }],
      ['Eine gesunde Person hat eine kohlenhydratreiche Mahlzeit gegessen; ihr Blutzucker steigt auf 140 mg/dl.', { insulin: 1, glucagon: -1, glyco: 1, urine: false }]
    ]);
    const r = sc[1], pool = [];
    const dir = (key, up, down, why) => { if (r[key] === undefined) return; const c = rng.chance(0.5) ? 1 : -1; pool.push(S(c > 0 ? up : down, c === r[key], typeof why === 'function' ? why(r[key]) : why)); };
    dir('bz', 'Der Blutzucker ist erhöht.', 'Der Blutzucker ist erniedrigt.', d => d > 0 ? 'Ohne Insulin wird weniger Glukose aufgenommen und gespeichert – der Blutzucker steigt.' : 'Viel Insulin senkt den Blutzucker.');
    dir('insulin', 'Die Insulinfreisetzung ist gesteigert.', 'Die Insulinfreisetzung ist vermindert.', d => d > 0 ? 'Steigender Blutzucker fördert die Insulinfreisetzung.' : 'Sinkender Blutzucker hemmt die Insulinfreisetzung.');
    dir('glucagon', 'Die Glukagonfreisetzung ist gesteigert.', 'Die Glukagonfreisetzung ist vermindert.', d => d > 0 ? 'Sinkender Blutzucker fördert die Glukagonfreisetzung.' : 'Steigender Blutzucker hemmt die Glukagonfreisetzung.');
    if (r.glyco) pool.push(S('In der Leber wird vermehrt Glukose als Glykogen gespeichert.', r.glyco > 0, 'Insulin regt die Speicherung an.'));
    if (r.glycoBreak) pool.push(S('In der Leber wird vermehrt Glykogen zu Glukose abgebaut.', true, 'Glukagon fördert den Glykogenabbau.'));
    if (r.muscle) pool.push(S('Muskelzellen nehmen vermehrt Glukose auf.', false, 'Ohne Insulin ist die Glukoseaufnahme vermindert.'));
    pool.push(S('Mit dem Harn wird Glukose ausgeschieden.', r.urine, r.urine ? 'Der Blutzucker liegt über 180 mg/dl.' : 'Der Blutzucker liegt unter 180 mg/dl.'));
    return fromPool(rng, P(intro) + P(sc[0]), pool, { qSubset: 'Welche der folgenden Aussagen lässt bzw. lassen sich aus diesen Informationen ableiten?', verb: 'ableiten' });
  });

  // 16 Fehlsichtigkeit
  fam('auge', rng => {
    const intro = 'Ein scharfes Bild entsteht, wenn die Lichtstrahlen genau auf der Netzhaut gebündelt werden. Bei Kurzsichtigkeit ist der Augapfel im Verhältnis zur Brechkraft zu lang, sodass das Bild ferner Gegenstände vor der Netzhaut entsteht; Zerstreuungslinsen („Minus-Gläser“) verlagern den Bildpunkt nach hinten. Bei Weitsichtigkeit ist der Augapfel zu kurz, das Bild naher Gegenstände entsteht hinter der Netzhaut; Sammellinsen („Plus-Gläser“) verlagern den Bildpunkt nach vorn. Zum Sehen in der Nähe spannt sich der Ziliarmuskel an, wodurch die elastische Augenlinse sich stärker wölbt und ihre Brechkraft zunimmt. Im Alter nimmt die Elastizität der Linse ab.';
    const pool = [
      S('Ein kurzsichtiger Mensch benötigt zum Sehen in die Ferne Zerstreuungslinsen.', true, 'Der Bildpunkt muss nach hinten verlagert werden.'),
      S('Bei Weitsichtigkeit entsteht das Bild naher Gegenstände vor der Netzhaut.', false, 'Es entsteht hinter der Netzhaut.'),
      S('Eine Verlängerung des Augapfels kann zu Kurzsichtigkeit führen.', true, 'Kurzsichtigkeit: Augapfel zu lang.'),
      S('Sammellinsen verlagern den Bildpunkt nach hinten.', false, 'Sie verlagern ihn nach vorn.'),
      S('Mit abnehmender Elastizität der Linse wird das Sehen in der Nähe schwieriger.', true, 'Die Linse kann sich nicht mehr ausreichend wölben.'),
      S('Zum Sehen in der Nähe entspannt sich der Ziliarmuskel.', false, 'Er spannt sich an.'),
      S('Ein zu kurzer Augapfel kann durch Plus-Gläser ausgeglichen werden.', true, 'Plus-Gläser verlagern den Bildpunkt nach vorn.'),
      S('Ein kurzsichtiger Mensch sieht ferne Gegenstände ohne Brille unscharf, weil das Bild hinter der Netzhaut entsteht.', false, 'Das Bild entsteht vor der Netzhaut.')
    ];
    return fromPool(rng, P(intro), pool, { qSubset: 'Welche der folgenden Aussagen lässt bzw. lassen sich aus diesen Informationen ableiten?', verb: 'ableiten' });
  });

  // 17 Wasserhaushalt und ADH
  fam('adh', rng => {
    const intro = 'Das Hormon ADH (antidiuretisches Hormon) wird im Hypothalamus gebildet und aus der Hirnanhangsdrüse ins Blut freigesetzt, wenn die Konzentration gelöster Teilchen im Blut (Osmolalität) steigt; sinkt sie, wird weniger ADH freigesetzt. ADH bewirkt in der Niere, dass mehr Wasser aus dem entstehenden Harn ins Blut zurückgeholt wird. Der Harn wird dadurch konzentrierter und seine Menge geringer. Alkohol hemmt die Freisetzung von ADH.';
    const sc = rng.pick([
      ['Eine Person trinkt innerhalb kurzer Zeit zwei Liter Wasser.', { adh: -1, menge: 1, konz: -1 }],
      ['Ein Läufer verliert bei einem Wettkampf viel Wasser durch Schweiß und trinkt nichts; die Osmolalität seines Blutes steigt.', { adh: 1, menge: -1, konz: 1 }],
      ['Eine Person trinkt eine größere Menge Alkohol.', { adh: -1, menge: 1, konz: -1 }],
      ['Bei einem Patienten ist die Hirnanhangsdrüse zerstört, sodass kein ADH mehr freigesetzt wird.', { adh: -1, menge: 1, konz: -1 }],
      ['Ein Tumor setzt unabhängig von der Osmolalität ständig große Mengen ADH frei.', { adh: 1, menge: -1, konz: 1, osm: -1 }]
    ]);
    const r = sc[1], pool = [];
    const dir = (key, up, down, why) => { if (r[key] === undefined) return; const c = rng.chance(0.5) ? 1 : -1; pool.push(S(c > 0 ? up : down, c === r[key], typeof why === 'function' ? why(r[key]) : why)); };
    dir('adh', 'Die ADH-Konzentration im Blut ist erhöht.', 'Die ADH-Konzentration im Blut ist erniedrigt.', d => d > 0 ? 'Steigende Osmolalität bzw. der Tumor führt zu mehr ADH.' : 'Es wird weniger bzw. kein ADH freigesetzt.');
    dir('menge', 'Die Harnmenge nimmt zu.', 'Die Harnmenge nimmt ab.', d => d > 0 ? 'Wenig ADH → weniger Wasser wird zurückgeholt → mehr Harn.' : 'Viel ADH → mehr Wasser wird zurückgeholt → weniger Harn.');
    dir('konz', 'Der Harn ist konzentrierter als normal.', 'Der Harn ist verdünnter als normal.', d => d > 0 ? 'Viel ADH → konzentrierter Harn.' : 'Wenig ADH → verdünnter Harn.');
    dir('osm', 'Die Osmolalität des Blutes steigt.', 'Die Osmolalität des Blutes sinkt.', 'Das vermehrt zurückgeholte Wasser verdünnt das Blut.');
    if (pool.length < 4) pool.push(S('Die Niere holt vermehrt Wasser aus dem Harn ins Blut zurück.', r.adh > 0, r.adh > 0 ? 'ADH ist erhöht.' : 'ADH ist erniedrigt.'));
    return fromPool(rng, P(intro) + P(sc[0]), pool, { qSubset: 'Welche der folgenden Aussagen lässt bzw. lassen sich aus diesen Informationen ableiten?', verb: 'ableiten' });
  });

  // 18 Sehbahn
  fam('sehbahn', rng => {
    const intro = 'Die visuellen Informationen werden über die Sehnerven von der Netzhaut zur Sehrinde im Hinterhauptslappen geleitet. Die Fasern der nasenseitigen (nasalen) und der schläfenseitigen (temporalen) Netzhauthälfte des linken Auges verlaufen gemeinsam im linken Sehnerv, die des rechten Auges im rechten Sehnerv zur Sehnervenkreuzung. Dort kreuzen nur die Fasern der beiden nasalen Netzhauthälften auf die jeweils andere Seite. Hinter der Kreuzung ziehen daher die Fasern der temporalen Netzhauthälfte des linken Auges zusammen mit den Fasern der nasalen Netzhauthälfte des rechten Auges als linker Sehstrang zur linken Sehrinde; entsprechend ziehen die Fasern der temporalen Netzhauthälfte des rechten Auges und der nasalen Netzhauthälfte des linken Auges als rechter Sehstrang zur rechten Sehrinde.';
    // Fasergruppen: [Auge, Hälfte, Seite hinter der Kreuzung]
    const fibers = [['links', 'temporal', 'links'], ['links', 'nasal', 'rechts'], ['rechts', 'temporal', 'rechts'], ['rechts', 'nasal', 'links']];
    const les = rng.pick([
      ['der linke Sehnerv vollständig durchtrennt', f => f[0] === 'links'],
      ['der rechte Sehnerv vollständig durchtrennt', f => f[0] === 'rechts'],
      ['die Sehnervenkreuzung in ihrer Mitte durchtrennt, sodass alle kreuzenden Fasern unterbrochen sind', f => f[1] === 'nasal'],
      ['der linke Sehstrang vollständig durchtrennt', f => f[2] === 'links'],
      ['der rechte Sehstrang vollständig durchtrennt', f => f[2] === 'rechts'],
      ['die linke Sehrinde ausgedehnt zerstört', f => f[2] === 'links']
    ]);
    const lost = fibers.filter(les[1]);
    const isLost = (eye, half) => lost.some(f => f[0] === eye && f[1] === half);
    const eyeAdj = e => e === 'links' ? 'linken' : 'rechten';
    const pool = [];
    for (const e of ['links', 'rechts']) {
      const both = isLost(e, 'nasal') && isLost(e, 'temporal');
      pool.push(S(`Das ${e === 'links' ? 'linke' : 'rechte'} Auge ist völlig erblindet.`, both, both ? 'Alle Fasern dieses Auges sind unterbrochen.' : 'Mindestens eine Netzhauthälfte dieses Auges ist noch angeschlossen.'));
      for (const h of ['nasal', 'temporal']) pool.push(S(`Von der ${h}en Netzhauthälfte des ${eyeAdj(e)} Auges gelangen keine Informationen mehr zur Sehrinde.`, isLost(e, h), isLost(e, h) ? 'Diese Fasern verlaufen durch die verletzte Stelle.' : 'Diese Fasern verlaufen nicht durch die verletzte Stelle.'));
    }
    const leftHalves = isLost('links', 'temporal') && isLost('rechts', 'nasal');
    pool.push(S('Von den jeweils linken Netzhauthälften beider Augen gelangen keine Informationen mehr zur Sehrinde.', leftHalves, 'Die linken Netzhauthälften sind die temporale des linken und die nasale des rechten Auges – sie bilden den linken Sehstrang.'));
    return fromPool(rng, P(intro) + P(`Bei einem Patienten ist ${les[0]}.`), pool, { qSubset: 'Welche der folgenden Aussagen ist bzw. sind demnach zutreffend?' });
  });

  // 19 Innervation von Muskeln
  fam('innervation', rng => {
    const moves = ['eine Beugung im Ellenbogengelenk', 'eine Streckung im Ellenbogengelenk', 'eine Beugung im Handgelenk', 'eine Streckung im Handgelenk'];
    const muscles = ['A', 'B', 'C', 'D', 'E'];
    const mv = {}; // Muskel -> Bewegung
    const order = rng.shuffle(U.range(4));
    muscles.slice(0, 4).forEach((m, i) => { mv[m] = order[i]; });
    mv.E = rng.int(0, 3);
    const nerves = ['X', 'Y', 'Z'];
    const nv = {};
    const shuffled = rng.shuffle(muscles);
    shuffled.forEach((m, i) => { nv[m] = nerves[i % 3]; });
    const nervText = nerves.map(n => { const ms = muscles.filter(m => nv[m] === n); return `Nerv ${n} versorgt ${ms.length === 1 ? 'den Muskel ' + ms[0] : 'die Muskeln ' + ms.join(' und ')}`; }).join(', ');
    const intro = `Am Arm bewirken fünf Muskeln folgende Bewegungen: ${muscles.map(m => `Muskel ${m} ${moves[mv[m]]}`).join(', ')}. ${nervText}. Ein Muskel kann sich nur zusammenziehen, wenn der ihn versorgende Nerv intakt ist. Jede Bewegung ist möglich, solange mindestens ein Muskel, der sie bewirkt, funktionsfähig ist.`;
    const cut = rng.chance(0.6) ? [rng.pick(nerves)] : rng.sample(nerves, 2);
    const lame = muscles.filter(m => cut.includes(nv[m]));
    const pool = [];
    moves.forEach((mvt, i) => {
      const ok = muscles.some(m => mv[m] === i && !lame.includes(m));
      pool.push(S(`${cap(mvt)} ist nicht mehr möglich.`, !ok, ok ? 'Mindestens ein beteiligter Muskel ist noch versorgt.' : 'Alle Muskeln für diese Bewegung sind gelähmt.'));
    });
    rng.sample(muscles, 2).forEach(m => pool.push(S(`Muskel ${m} ist gelähmt.`, lame.includes(m), `Muskel ${m} wird vom Nerv ${nv[m]} versorgt.`)));
    return fromPool(rng, P(intro) + P(`Bei einem Patienten ${cut.length === 1 ? `ist der Nerv ${cut[0]}` : `sind die Nerven ${cut[0]} und ${cut[1]}`} vollständig durchtrennt.`), pool, { qSubset: 'Welche der folgenden Aussagen trifft bzw. treffen zu?' });
  });

  // 20 Herzfehler mit Kurzschlussverbindung
  fam('kreislauf', rng => {
    const intro = 'Sauerstoffarmes Blut aus dem Körper gelangt über den rechten Vorhof in die rechte Herzkammer, die es in die Lunge pumpt. Dort wird es mit Sauerstoff angereichert und fließt über den linken Vorhof in die linke Herzkammer, die es über die Hauptschlagader in den Körperkreislauf pumpt. In der linken Herzkammer herrscht normalerweise ein deutlich höherer Druck als in der rechten. Besteht eine Verbindung zwischen linker und rechter Herzseite, fließt Blut stets von der Seite mit dem höheren Druck zur Seite mit dem niedrigeren Druck.';
    const sc = rng.pick([
      ['Ein Kind hat ein Loch in der Scheidewand zwischen den beiden Herzkammern; die Druckverhältnisse sind normal.', { aortaO2: 0, lung: 1, rvO2: 1 }],
      ['Bei einem Patienten mit einem Loch in der Scheidewand zwischen den Herzkammern ist der Druck in den Lungengefäßen und in der rechten Herzkammer so stark angestiegen, dass er den Druck in der linken Kammer übersteigt.', { aortaO2: -1, lung: -1, rvO2: 0 }]
    ]);
    const r = sc[1];
    const pool = [
      S('Das Blut in der Hauptschlagader ist sauerstoffärmer als normal.', r.aortaO2 < 0, r.aortaO2 < 0 ? 'Sauerstoffarmes Blut gelangt von rechts nach links.' : 'In die linke Kammer gelangt kein sauerstoffarmes Blut.'),
      S('Durch die Lunge fließt mehr Blut als normal.', r.lung > 0, r.lung > 0 ? 'Zusätzliches Blut fließt von links nach rechts und wird erneut in die Lunge gepumpt.' : 'Ein Teil des Blutes umgeht die Lunge bzw. die Durchblutung ist nicht erhöht.'),
      S('Durch die Lunge fließt weniger Blut als normal.', r.lung < 0, r.lung < 0 ? 'Ein Teil des Blutes fließt von rechts nach links an der Lunge vorbei.' : 'Die Lungendurchblutung ist nicht vermindert.'),
      S('Das Blut in der rechten Herzkammer ist sauerstoffreicher als normal.', r.rvO2 > 0, r.rvO2 > 0 ? 'Sauerstoffreiches Blut aus der linken Kammer mischt sich bei.' : 'Es fließt kein sauerstoffreiches Blut nach rechts.'),
      S('Die Richtung des Blutflusses durch das Loch hängt von den Druckverhältnissen ab.', true, 'Blut fließt stets zur Seite mit niedrigerem Druck.')
    ];
    return fromPool(rng, P(intro) + P(sc[0]), pool, { qSubset: 'Welche der folgenden Aussagen lässt bzw. lassen sich aus diesen Informationen ableiten?', verb: 'ableiten' });
  });

  T.gen.mng = function (seed) {
    const rng = new RNG(seed);
    // jede Familie mindestens einmal (feste Texte höchstens einmal), Rest zufällig; einfache Typen eher am Anfang
    const easy = ['bilanz', 'reflex', 'bildgebung', 'immun', 'auge', 'adh', 'blutzucker', 'innervation'];
    const fixed = ['auge', 'immun'];
    const pool = F.filter(f => !fixed.includes(f.id));
    let fams = rng.shuffle(F.slice());
    while (fams.length < 24) fams = fams.concat(rng.sample(pool, Math.min(pool.length, 24 - fams.length)));
    fams = fams.slice(0, 24);
    fams = fams.map(f => ({ f, k: (easy.includes(f.id) ? 0 : 1) + rng.float(-0.7, 0.7) })).sort((a, b) => a.k - b.k).map(x => x.f);
    const items = fams.map((f, i) => {
      const it = f.fn(rng.fork('mng' + i + f.id));
      it.kind = f.id;
      return it;
    });
    return { items };
  };
  T.gen.mng.fromPool = fromPool;
})(window.TMS);
