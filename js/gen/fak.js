/* Fakten lernen: 15 fiktive Patientenbeschreibungen, 20 Fragen */
(function (T) {
  'use strict';
  const RNG = T.RNG, U = T.util;

  const NAMES = ['Arndt', 'Bäumler', 'Pauls', 'Weiler', 'Fischer', 'Holz', 'Schuster', 'Müller', 'Lemke', 'Ton', 'Brandt', 'Kessler', 'Lorenz', 'Wagner',
    'Seidel', 'Krause', 'Vogt', 'Hahn', 'Busch', 'Kuhn', 'Engel', 'Pohl', 'Franke', 'Graf', 'Haas', 'Jansen', 'Kraft', 'Lang', 'Mohr', 'Nowak', 'Ott',
    'Petersen', 'Rausch', 'Sauer', 'Thiel', 'Ulrich', 'Voss', 'Winter', 'Ziegler', 'Adler', 'Berg', 'Dorn', 'Eckert', 'Funk', 'Gerber', 'Heck', 'Iske',
    'Jäger', 'Kolb', 'Lindner', 'Marx', 'Naumann', 'Oswald', 'Pfeiffer', 'Quast', 'Roth', 'Stein', 'Timm', 'Urban', 'Vetter', 'Wolf', 'Zander', 'Böhm',
    'Fuchs', 'Gabler', 'Hein', 'Kaiser', 'Lutz', 'Mertens', 'Nolte', 'Probst', 'Reuter', 'Schick', 'Theis', 'Wendt', 'Brück', 'Dietz', 'Ernst', 'Falk', 'Kern'];

  // [männlich, weiblich, Mindestalter, Höchstalter]
  const PROFS = [
    ['Schüler', 'Schülerin', 10, 15], ['Auszubildender', 'Auszubildende', 15, 25], ['Student', 'Studentin', 20, 30], ['Rentner', 'Rentnerin', 65, 80],
    ['Krankenpfleger', 'Krankenpflegerin', 20, 60], ['Erzieher', 'Erzieherin', 20, 60], ['Dachdecker', 'Dachdeckerin', 20, 55], ['Installateur', 'Installateurin', 20, 60],
    ['Architekt', 'Architektin', 25, 65], ['Heilpädagoge', 'Heilpädagogin', 25, 60], ['Maschinenschlosser', 'Maschinenschlosserin', 20, 60], ['Bäcker', 'Bäckerin', 20, 60],
    ['Lehrer', 'Lehrerin', 25, 65], ['Elektriker', 'Elektrikerin', 20, 60], ['Friseur', 'Friseurin', 20, 60], ['Journalist', 'Journalistin', 25, 65],
    ['Richter', 'Richterin', 30, 65], ['Polizist', 'Polizistin', 20, 60], ['Gärtner', 'Gärtnerin', 20, 65], ['Tischler', 'Tischlerin', 20, 60],
    ['Koch', 'Köchin', 20, 60], ['Kellner', 'Kellnerin', 20, 55], ['Pilot', 'Pilotin', 25, 60], ['Apotheker', 'Apothekerin', 25, 65],
    ['Ingenieur', 'Ingenieurin', 25, 65], ['Physiker', 'Physikerin', 25, 65], ['Bankkaufmann', 'Bankkauffrau', 20, 65], ['Landwirt', 'Landwirtin', 20, 65],
    ['Maler', 'Malerin', 20, 65], ['Musiker', 'Musikerin', 20, 65], ['Fotograf', 'Fotografin', 20, 65], ['Schneider', 'Schneiderin', 20, 65],
    ['Bibliothekar', 'Bibliothekarin', 25, 65], ['Verkäufer', 'Verkäuferin', 20, 60], ['Mechaniker', 'Mechanikerin', 20, 60], ['Programmierer', 'Programmiererin', 20, 60],
    ['Steuerberater', 'Steuerberaterin', 25, 65], ['Tierarzt', 'Tierärztin', 25, 65], ['Zahnarzt', 'Zahnärztin', 25, 65], ['Hausmeister', 'Hausmeisterin', 25, 65],
    ['Busfahrer', 'Busfahrerin', 25, 60], ['Metzger', 'Metzgerin', 20, 60], ['Schauspieler', 'Schauspielerin', 20, 65], ['Sozialarbeiter', 'Sozialarbeiterin', 25, 60],
    ['Optiker', 'Optikerin', 20, 60], ['Goldschmied', 'Goldschmiedin', 25, 65], ['Winzer', 'Winzerin', 25, 65], ['Förster', 'Försterin', 25, 65],
    ['Dolmetscher', 'Dolmetscherin', 25, 65], ['Chemiker', 'Chemikerin', 25, 65], ['Biologe', 'Biologin', 25, 65], ['Florist', 'Floristin', 20, 60],
    ['Schornsteinfeger', 'Schornsteinfegerin', 20, 60], ['Rechtsanwalt', 'Rechtsanwältin', 25, 65], ['Physiotherapeut', 'Physiotherapeutin', 20, 60],
    ['Hotelfachmann', 'Hotelfachfrau', 20, 55], ['Kfz-Mechatroniker', 'Kfz-Mechatronikerin', 20, 55], ['Logopäde', 'Logopädin', 25, 60], ['Zimmermann', 'Zimmerin', 20, 55]
  ];

  const DIAGS = ['Magengeschwür', 'Asthmaanfall', 'Schädelbasisbruch', 'Karies', 'Bluthochdruck', 'Lungenentzündung', 'Herzinfarkt', 'Blinddarmentzündung',
    'Gallensteine', 'Nierenkolik', 'Migräne', 'Schlaganfall', 'Diabetes', 'Bandscheibenvorfall', 'Gürtelrose', 'Mandelentzündung', 'Schilddrüsenüberfunktion',
    'Leistenbruch', 'Meniskusriss', 'Mittelohrentzündung', 'Hepatitis', 'Gicht', 'Rheuma', 'Bronchitis', 'Tinnitus', 'Hörsturz', 'Thrombose', 'Kreuzbandriss',
    'Gehirnerschütterung', 'Sonnenstich', 'Lebensmittelvergiftung', 'Heuschnupfen', 'Neurodermitis', 'Schuppenflechte', 'Grauer Star', 'Bindehautentzündung',
    'Borreliose', 'Blasenentzündung', 'Krampfadern', 'Rippenbruch', 'Armbruch', 'Schlüsselbeinbruch', 'Achillessehnenriss', 'Tennisarm', 'Hexenschuss',
    'Nasennebenhöhlenentzündung', 'Magen-Darm-Grippe', 'Blutarmut', 'Osteoporose', 'Arthrose', 'Epilepsie', 'Sehnenscheidenentzündung', 'Muskelfaserriss',
    'Nierenbeckenentzündung', 'Herzrhythmusstörung', 'Bauchspeicheldrüsenentzündung', 'Wundrose', 'Kiefernbruch', 'Masern', 'Windpocken'];

  // label = Darstellung in der Liste, pred = Prädikat, attr = attributives Adjektiv (ohne Endung) oder mit = Präpositionalgruppe
  const adj = a => ({ label: a, pred: 'ist ' + a, attr: a });
  const MERKS = [
    adj('impulsiv'), adj('kontaktfreudig'), adj('ledig'), adj('verheiratet'), adj('verwitwet'), adj('geschieden'), adj('alleinerziehend'), adj('kinderlos'),
    adj('ängstlich'), adj('nervös'), adj('gesprächig'), adj('schweigsam'), adj('misstrauisch'), adj('ungeduldig'), adj('humorvoll'), adj('hilfsbereit'),
    adj('schwerhörig'), adj('übergewichtig'), adj('sportlich'), adj('zerstreut'), adj('gereizt'), adj('optimistisch'), adj('kurzsichtig'), adj('tätowiert'),
    adj('privat versichert'), adj('gehbehindert'), adj('vergesslich'), adj('schüchtern'), adj('wehleidig'), adj('launisch'), adj('höflich'), adj('ehrgeizig'),
    adj('nikotinabhängig'), adj('vegetarisch lebend'),
    { label: 'Notfall', pred: 'ist ein Notfall', attr: 'als Notfall eingeliefert' },
    { label: 'Erstbesuch', pred: 'ist zum ersten Mal in Behandlung', attr: 'zum ersten Mal behandelt' },
    { label: 'drei Kinder', pred: 'hat drei Kinder', mit: 'mit drei Kindern' },
    { label: 'Zwillinge', pred: 'hat Zwillinge', mit: 'mit Zwillingen' },
    { label: 'Krankmeldung', pred: 'hat eine Krankmeldung', mit: 'mit Krankmeldung' },
    { label: 'Überweisung', pred: 'hat eine Überweisung', mit: 'mit Überweisung' },
    { label: 'Herzschrittmacher', pred: 'hat einen Herzschrittmacher', mit: 'mit Herzschrittmacher' },
    { label: 'Brille', pred: 'trägt eine Brille', mit: 'mit Brille' },
    { label: 'Hörgerät', pred: 'trägt ein Hörgerät', mit: 'mit Hörgerät' },
    { label: 'Allergiepass', pred: 'hat einen Allergiepass', mit: 'mit Allergiepass' },
    { label: 'keine Geschwister', pred: 'hat keine Geschwister', mit: 'ohne Geschwister' }
  ];

  const AGES = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];

  function profName(p) { return p.gender === 'm' ? p.prof[0] : p.prof[1]; }

  function buildPersons(rng) {
    for (let attempt = 0; attempt < 200; attempt++) {
      // Altersgruppen
      const pattern = rng.chance(0.5) ? [3, 3, 3, 3, 3] : [3, 2, 2, 2, 2, 2, 2];
      const ages = rng.sample(AGES.filter(a => a >= 15 && a <= 75), pattern.length).sort((a, b) => a - b);
      const persons = [];
      pattern.forEach((cnt, gi) => {
        const genders = rng.shuffle(cnt === 2 ? ['m', 'f'] : ['m', 'f', rng.pick(['m', 'f'])]);
        for (let k = 0; k < cnt; k++) persons.push({ age: ages[gi], gender: genders[k] });
      });
      // Berufe passend zum Alter, alle verschieden
      const usedProf = new Set();
      let ok = true;
      for (const p of persons) {
        const cands = PROFS.filter(pr => p.age >= pr[2] && p.age <= pr[3] && !usedProf.has(pr[0]));
        // Spezialberufe nicht zu häufig
        const special = c => ['Schüler', 'Auszubildender', 'Student', 'Rentner'].includes(c[0]);
        const pool = rng.chance(0.25) ? cands : cands.filter(c => !special(c));
        const pr = rng.pick(pool.length ? pool : cands);
        if (!pr) { ok = false; break; }
        usedProf.add(pr[0]); p.prof = pr;
      }
      if (!ok) continue;
      // Namen
      const names = rng.sample(NAMES, 15);
      persons.forEach((p, i) => { p.name = names[i]; });
      // Diagnosen und Merkmale: 10 verschiedene, 5 davon doppelt (bei unterschiedlichem Alter)
      const assignDup = (pool, field) => {
        const vals = rng.sample(pool, 10);
        const slots = vals.concat(vals.slice(0, 5));
        for (let t = 0; t < 100; t++) {
          const sh = rng.shuffle(slots);
          let good = true;
          for (let i = 0; i < 15 && good; i++) for (let j = i + 1; j < 15; j++) {
            if (sh[i] === sh[j] && persons[i].age === persons[j].age) { good = false; break; }
          }
          if (good) { persons.forEach((p, i) => { p[field] = sh[i]; }); return true; }
        }
        return false;
      };
      if (!assignDup(DIAGS, 'diag') || !assignDup(MERKS, 'merk')) continue;
      // keine Person mit identischer Kombination aus Diagnose UND Merkmal wie eine andere
      if (persons.some((p, i) => persons.some((q, j) => j > i && p.diag === q.diag && p.merk === q.merk))) continue;
      return persons;
    }
    throw new Error('Fakten lernen: keine gültige Personenliste');
  }

  // ---------- Beschreibungen (Subjekte) ----------
  function matches(p, d) {
    if (d.gender && p.gender !== d.gender) return false;
    if (d.age && p.age !== d.age) return false;
    if (d.diag && p.diag !== d.diag) return false;
    if (d.merk && p.merk !== d.merk) return false;
    if (d.prof && p.prof !== d.prof) return false;
    if (d.name && p.name !== d.name) return false;
    return true;
  }
  function resolve(persons, d) {
    const base = persons.filter(p => matches(p, d));
    if (!d.comp) return base;
    if (base.length !== 2 || base[0].age === base[1].age) return [];
    const sorted = base.slice().sort((a, b) => a.age - b.age);
    return [d.comp === 'jünger' ? sorted[0] : sorted[1]];
  }

  function describe(d) {
    if (d.name) return (d.gender === 'm' ? 'Herr ' : 'Frau ') + d.name;
    if (d.prof) return d.gender === 'm' ? 'Der ' + d.prof[0].replace(/ender$/, 'ende') : 'Die ' + d.prof[1];
    const art = d.gender === 'm' ? 'Der' : 'Die';
    const noun = d.gender === 'm' ? 'Patient' : d.gender === 'f' ? 'Patientin' : 'Person';
    const adjs = [];
    if (d.comp) adjs.push(d.comp + 'e');
    if (d.age) adjs.push(`ca. ${d.age}-jährige`);
    if (d.merk && d.merk.attr) adjs.push(d.merk.attr + 'e');
    let s = [art].concat(adjs, [noun]).join(' ');
    const post = [];
    if (d.merk && d.merk.mit) post.push(d.merk.mit);
    if (d.diag) post.push('mit der Diagnose ' + d.diag);
    if (post.length) s += ' ' + post.join(' und ').replace(' und mit ', ' und ');
    return s;
  }

  function findDescriptor(rng, persons, P, ask) {
    const g = P.gender;
    const cands = [];
    const add = (d, w) => cands.push({ d, w });
    if (ask !== 'diag') { add({ diag: P.diag }, 5); add({ diag: P.diag, gender: g }, 4); if (ask !== 'age') add({ diag: P.diag, comp: 'jünger' }, 2), add({ diag: P.diag, comp: 'älter' }, 2); }
    if (ask !== 'merk') {
      add({ merk: P.merk }, 5); add({ merk: P.merk, gender: g }, 4);
      if (ask !== 'age') add({ merk: P.merk, comp: 'jünger' }, 2), add({ merk: P.merk, comp: 'älter' }, 2);
      if (ask !== 'age' && !P.merk.mit) add({ merk: P.merk, age: P.age }, 1.5);
    }
    if (ask !== 'age') { add({ age: P.age, gender: g }, 3); if (ask !== 'diag') add({ age: P.age, diag: P.diag }, 1.5); }
    if (ask !== 'prof') add({ prof: P.prof, gender: g }, 1.2);
    if (ask !== 'name') add({ name: P.name, gender: g }, 1.2);
    const valid = cands.filter(c => { const r = resolve(persons, c.d); return r.length === 1 && r[0] === P; });
    if (!valid.length) return null;
    // einfachste eindeutige Beschreibung bevorzugen, aber mit etwas Zufall
    const pick = rng.weighted(valid, valid.map(c => c.w));
    return pick.d;
  }

  function makeQuestion(rng, persons, P, ask) {
    const d = findDescriptor(rng, persons, P, ask);
    if (!d) return null;
    const subj = describe(d);
    const genderKnown = !!d.gender;
    let stem, correct, pool;
    switch (ask) {
      case 'name':
        stem = `${subj} heißt …`;
        correct = P.name + '.';
        pool = rng.shuffle(persons.filter(q => q !== P && (!genderKnown || rng.chance(0.7) || q.gender === P.gender))).map(q => q.name + '.');
        break;
      case 'age': {
        stem = `${subj} ist …`;
        correct = `ca. ${P.age} Jahre alt.`;
        const ages = Array.from(new Set(persons.map(q => q.age))).filter(a => a !== P.age);
        const near = ages.sort((a, b) => Math.abs(a - P.age) - Math.abs(b - P.age)).slice(0, 6);
        const chosen = rng.sample(near, 4).concat([P.age]).sort((a, b) => a - b);
        return { stem: `<p class="fak-q">${stem}</p>`, options: chosen.map(a => `ca. ${a} Jahre alt.`), correct: chosen.indexOf(P.age), meta: { P, d } };
      }
      case 'prof': {
        stem = `${subj} ist von Beruf …`;
        correct = profName(P) + '.';
        const others = persons.filter(q => q !== P);
        const same = others.filter(q => q.gender === P.gender);
        let list = genderKnown ? same.map(q => profName(q) + '.') : others.map(q => profName(q) + '.');
        if (genderKnown && list.length < 4) {
          list = list.concat(others.filter(q => q.gender !== P.gender).map(q => (P.gender === 'm' ? q.prof[0] : q.prof[1]) + '.'));
        }
        pool = rng.shuffle(list);
        break;
      }
      case 'merk':
        stem = `${subj} …`;
        correct = P.merk.pred + '.';
        pool = rng.shuffle(Array.from(new Set(persons.filter(q => q.merk !== P.merk).map(q => q.merk.pred + '.'))));
        break;
      case 'diag':
        stem = `${subj} hat die Diagnose …`;
        correct = P.diag + '.';
        pool = rng.shuffle(Array.from(new Set(persons.filter(q => q.diag !== P.diag).map(q => q.diag + '.'))));
        break;
    }
    const o = U.buildOptions(rng, correct, pool);
    return { stem: `<p class="fak-q">${stem}</p>`, options: o.options, correct: o.correct, meta: { P, d } };
  }

  function personLine(p) {
    return `<b>${p.name}:</b> ca. ${p.age} Jahre, ${profName(p)}, ${p.merk.label} – ${p.diag}`;
  }

  T.gen.fak = function (seed) {
    const rng = new RNG(seed);
    const persons = buildPersons(rng);
    const askOrder = rng.shuffle(['name', 'name', 'name', 'name', 'age', 'age', 'age', 'age', 'prof', 'prof', 'prof', 'prof', 'merk', 'merk', 'merk', 'merk', 'diag', 'diag', 'diag', 'diag']);
    const targets = rng.shuffle(persons).concat(rng.sample(persons, 5));
    const used = new Set();
    const items = [];
    for (let i = 0; i < 20; i++) {
      let q = null;
      // Zielperson + Frageart; bei Problemen andere Person versuchen
      const order = [targets[i]].concat(rng.shuffle(persons));
      for (const P of order) {
        const k = P.name + ':' + askOrder[i];
        if (used.has(k)) continue;
        q = makeQuestion(rng, persons, P, askOrder[i]);
        if (q) { used.add(k); break; }
      }
      if (!q) throw new Error('Fakten lernen: Frage nicht erzeugbar');
      const P = q.meta.P;
      q.layout = 'list';
      q.explanation = `<p>Gemeint ist <b>${P.name}</b>: ca. ${P.age} Jahre, ${profName(P)}, ${P.merk.label} – ${P.diag}.</p>`;
      delete q.meta;
      items.push(q);
    }
    const sorted = persons.slice();
    const learnHtml = `<div class="fak-list paper">${sorted.map((p, i) => `<div class="fak-row${i > 0 && sorted[i - 1].age !== p.age ? ' gap' : ''}">${personLine(p)}</div>`).join('')}</div>`;
    return { learnHtml, items, persons };
  };
})(window.TMS);
