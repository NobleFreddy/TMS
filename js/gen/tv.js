/* Textverständnis: parametrisierte Lehrbuchtexte (teils fiktiv) mit je sechs Fragen */
(function (T) {
  'use strict';
  const RNG = T.RNG, U = T.util;
  const S = (text, truth, why) => ({ text, truth, why });
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const P = s => `<p>${s}</p>`;
  const Q = s => `<p class="q">${s}</p>`;

  function pool(rng, q, statements, o) {
    return T.gen.mng.fromPool(rng, '', statements, Object.assign({ qSubset: q, mode: 'subset' }, o || {}));
  }
  function single(rng, q, correct, distractors, why) {
    const o = U.buildOptions(rng, correct, rng.shuffle(distractors));
    return { stem: Q(q), options: o.options, correct: o.correct, layout: 'list', explanation: why };
  }
  function numeric(rng, q, val, ds, fmt, unit, why) {
    const o = U.numericOptions(rng, val, ds, fmt || (x => U.fmt(x, 2)), unit);
    return { stem: Q(q), options: o.options, correct: o.correct, layout: 'list', explanation: why };
  }
  function selectedPool(rng, q, trues, falses, o) {
    // gemischter Pool aus wahren und falschen Aussagen
    return pool(rng, q, rng.shuffle(trues).slice(0, 3).concat(rng.shuffle(falses).slice(0, 3)), o);
  }

  const FAMS = [];
  const fam = (id, fn) => FAMS.push({ id, fn });

  // ---------- A: Hormondrüse ----------
  fam('druese', rng => {
    const st = rng.pick(['Pella', 'Kalva', 'Meri', 'Tosa', 'Venu']);
    const gland = st + 'drüse';
    const [el, ion, abbr] = rng.pick([['Brom', 'Bromid', 'B'], ['Selen', 'Selenid', 'S'], ['Fluor', 'Fluorid', 'F']]);
    const HA = st + 'tonin', HB = st + 'sin', TH = st + 'tropin', RH = st + 'liberin', glob = st + 'globulin';
    const M = 'M' + abbr + 'T', Dd = 'D' + abbr + 'T';
    const MName = 'Mono' + el.toLowerCase() + 'tyrosin', DName = 'Di' + el.toLowerCase() + 'tyrosin';
    const D1 = rng.pick(['Perchlorin', 'Thiozyanol', 'Nitrazan']), D2 = rng.pick(['Methimazin', 'Propylan', 'Carbazol']);
    const N = rng.pick([4, 6, 8, 10, 12]);
    const [up, down] = rng.pick([['Kälte', 'Wärme'], ['körperliche Belastung', 'Ruhe']]);
    const recipe = rng.chance(0.6) ? { A: [M, Dd], B: [Dd, Dd] } : { A: [M, M], B: [M, Dd] };
    const atoms = r => r.reduce((s, x) => s + (x === M ? 1 : 2), 0);
    const nA = atoms(recipe.A), nB = atoms(recipe.B);
    const comb = r => r[0] === r[1] ? `je zwei ${r[0]}-Resten` : `je einem ${r[0]}- und einem ${r[1]}-Rest`;
    const html = [
      `Die ${gland} bildet, speichert und setzt die ${el.toLowerCase()}haltigen Hormone ${HA} und ${HB} frei. In der Drüse liegen zahlreiche kleine Hohlräume (Bläschen), deren Wände aus einer einzigen Schicht von Drüsenzellen bestehen. Die Bläschen sind mit einer zähen Substanz gefüllt, in der beide Hormone in einer inaktiven Speicherform enthalten sind. Der gespeicherte Vorrat reicht beim Menschen aus, um den Organismus etwa ${N} Monate lang mit den Hormonen zu versorgen.`,
      `Das für die Hormonbildung benötigte ${el} stammt aus der Nahrung und wird von den Drüsenzellen als ${ion} aus dem Blut aufgenommen. Diese Aufnahme erfolgt an der dem Blut zugewandten Zellmembran durch eine Transportpumpe. Die Pumpe wird durch das Hormon ${TH} aus der Hirnanhangsdrüse stimuliert; durch das Medikament ${D1} lässt sie sich hemmen. Bei einer seltenen erblichen Erkrankung ist die Pumpe von Geburt an funktionslos.`,
      `In den Drüsenzellen wird das aufgenommene ${ion} unter dem Einfluss eines Enzyms in freies ${el} umgewandelt und in die Bläschen abgegeben. Auch die Aktivität dieses Enzyms kann durch ein Medikament, das ${D2}, gehemmt werden.`,
      `Die letzten Schritte der Hormonbildung finden in den Bläschen statt, also außerhalb der Drüsenzellen. An Tyrosin-Reste des Speichereiweißes ${glob} wird zunächst ein ${el}atom gebunden; so entstehen ${MName}-Reste (${M}). Ein Teil davon wird durch Bindung eines weiteren ${el}atoms in ${DName}-Reste (${Dd}) umgewandelt. Durch die Verknüpfung von ${comb(recipe.A)} entsteht ${HA}, aus der Verknüpfung von ${comb(recipe.B)} geht ${HB} hervor. Beide Hormone werden in den Bläschen gespeichert und bei Bedarf über die Drüsenzellen ins Blut abgegeben.`,
      `Die Freisetzung der Hormone ins Blut wird über die Hirnanhangsdrüse und den Hypothalamus, einen Teil des Zwischenhirns, gesteuert: ${TH} stimuliert nicht nur die Bildung, sondern auch die Freisetzung von ${HA} und ${HB}. Die Freisetzung von ${TH} ist ihrerseits abhängig von dem Hormon ${RH} aus dem Hypothalamus. Die Freisetzung von ${RH} wird z. B. durch ${up} gesteigert, während ${down} hemmend wirkt. Daneben besteht ein Rückkopplungsmechanismus: Hohe Konzentrationen von ${HA} und ${HB} im Blut hemmen die Freisetzung von ${TH} und ${RH}, niedrige Konzentrationen steigern sie.`,
      `${HA} und ${HB} steigern den Sauerstoffverbrauch stoffwechselaktiver Organe und damit den Energieumsatz des Körpers. Eine zu niedrige Konzentration beider Hormone im Blut (Unterfunktion) senkt daher die Stoffwechselaktivität unter den Normalwert, eine zu hohe Konzentration (Überfunktion) steigert sie. ${HA}, ${HB}, ${TH} und ${RH} lassen sich für diagnostische und therapeutische Zwecke künstlich herstellen.`
    ].map(P).join('');
    const steps = [`Transport von ${ion} aus dem Blut in die Drüsenzellen`, `Umwandlung von ${ion} in freies ${el} in den Drüsenzellen`, `Abgabe von freiem ${el} in die Bläschen`, `Bindung von ${el} an Tyrosin-Reste in den Bläschen`];
    const needsD = recipe.A.includes(Dd);
    if (needsD) steps.push(`Umwandlung von ${M}- in ${Dd}-Reste in den Bläschen`);
    steps.push(`Verknüpfung von ${comb(recipe.A).replace('je ', '')} in den Bläschen`);
    const wrongSteps = [`Umwandlung von ${el} in ${ion} in den Bläschen`, `Bindung von ${ion} an ${glob} in den Drüsenzellen`];
    if (!needsD) wrongSteps.push(`Verknüpfung von zwei ${Dd}-Resten in den Bläschen`);
    if (needsD && recipe.B[0] === Dd && recipe.B[1] === Dd) wrongSteps.push(`Verknüpfung von zwei ${Dd}-Resten in den Bläschen`);
    const Qs = [
      r => { const w = r.pick(wrongSteps); return single(r, `Welcher der folgenden Vorgänge gehört <b>nicht</b> zu den im Text beschriebenen Schritten, die zur Bildung von ${HA} führen?`, w, r.sample(steps, 4), `„${w}“ kommt im beschriebenen Bildungsweg von ${HA} nicht vor.`); },
      r => numeric(r, `Wie viele ${el}atome enthält ein Molekül ${HB} dem Text zufolge?`, nB, [1, 2, 3, 4, 5, 6].filter(x => x !== nB), x => String(x), '', `${HB} entsteht aus ${comb(recipe.B)}; ${M} trägt ein, ${Dd} zwei ${el}atome → ${nB}.`),
      r => selectedPool(r, 'Durch welche(n) der folgenden Sachverhalte kann dem Text zufolge eine verminderte Stoffwechselaktivität bedingt sein?', [
        S(`operative Entfernung der ${gland}`, true, 'Keine Hormonbildung mehr.'),
        S(`mehrjährig verminderte Aufnahme von ${el} mit der Nahrung`, true, `Nach Aufbrauchen des Vorrats (≈ ${N} Monate) fehlen die Hormone.`),
        S('Funktionsstörung in der Hirnanhangsdrüse', true, `Ohne ${TH} werden die Hormone nicht gebildet bzw. freigesetzt.`),
        S(`Langzeitbehandlung mit ${D1}`, true, 'Die Pumpe ist gehemmt; nach Aufbrauchen des Vorrats fehlen die Hormone.')], [
        S(`zweiwöchige ${el}arme Ernährung`, false, `Der Vorrat reicht etwa ${N} Monate.`),
        S(`anhaltende ${up}`, false, `${cap(up)} steigert die Freisetzung von ${RH}.`),
        S(`Gabe von ${HA}`, false, `${HA} steigert den Stoffwechsel.`)], { verb: { sg: 'Sachverhalt', pl: 'Sachverhalte', one: 'kommt infrage', many: 'kommen infrage', none: 'Keiner der Sachverhalte kommt infrage.' } }),
      r => selectedPool(r, `Welche der folgenden Unterfunktionen können dem Text zufolge durch Gaben von ${TH} positiv beeinflusst werden?`, [
        S('Unterfunktionen, die durch eine Funktionsstörung der Hirnanhangsdrüse bedingt sind', true, `Das fehlende ${TH} wird ersetzt.`),
        S('Unterfunktionen, die durch eine Funktionsstörung im Hypothalamus bedingt sind', true, `${TH} wirkt unabhängig von ${RH} auf die Drüse.`)], [
        S('Unterfunktionen, die durch einen ererbten Ausfall der Transportpumpe bedingt sind', false, 'Die Pumpe fehlt, ihre Stimulation nützt nichts.'),
        S(`Unterfunktionen nach operativer Entfernung der ${gland}`, false, 'Das Zielorgan fehlt.'),
        S(`Unterfunktionen durch Hemmung des Enzyms mit ${D2}`, false, `Die Umwandlung von ${ion} bleibt blockiert.`)], { verb: { sg: 'Unterfunktion', pl: 'Unterfunktionen', one: 'kann beeinflusst werden', many: 'können beeinflusst werden', none: 'Keine der drei Unterfunktionen kann beeinflusst werden.' } }),
      r => selectedPool(r, `Bei einer bestimmten Erkrankung bildet der Körper einen Stoff, der auf die ${gland} genauso wirkt wie ${TH}, jedoch weder von ${RH} gesteuert wird noch der Rückkopplung unterliegt. Welche(s) der folgenden Symptome kann bzw. können dem Text zufolge durch diese Erkrankung bedingt sein?`, [
        S('gesteigerter Sauerstoffverbrauch in stoffwechselaktiven Organen', true, 'Mehr Hormone → höherer Energieumsatz.'),
        S(`verringerte Freisetzung von ${RH}`, true, 'Hohe Hormonspiegel hemmen über die Rückkopplung.'),
        S(`verringerte Konzentration von ${TH} im Blut`, true, `Die Rückkopplung hemmt die ${TH}-Freisetzung.`)], [
        S(`verringerte Bildung von ${HA} und ${HB}`, false, 'Der Stoff stimuliert die Bildung.'),
        S(`erhöhte Konzentration von ${TH} im Blut`, false, 'Die Rückkopplung senkt sie.'),
        S('verminderter Energieumsatz', false, 'Der Energieumsatz steigt.')], { verb: 'symptom' }),
      r => selectedPool(r, `Welche der folgenden Aussagen über die Freisetzung von ${HA} und ${HB} lässt bzw. lassen sich aus dem Text ableiten? Eine Steigerung der Freisetzung kann bedingt sein durch …`, [
        S(`eine vorangegangene zu niedrige Konzentration von ${HA} und ${HB} im Blut.`, true, 'Niedrige Spiegel steigern über die Rückkopplung die Freisetzung.'),
        S(`${up}.`, true, `${cap(up)} steigert ${RH} → ${TH} → Hormonfreisetzung.`),
        S(`eine Gabe von ${RH}.`, true, `${RH} steigert ${TH}.`)], [
        S(`${down}.`, false, `${cap(down)} hemmt die Freisetzung von ${RH}.`),
        S('eine Überfunktion der Transportpumpe.', false, 'Die Pumpe beeinflusst die Aufnahme, über die Freisetzung macht der Text keine solche Aussage.'),
        S(`eine Gabe von ${HB}.`, false, 'Hohe Spiegel hemmen über die Rückkopplung.')], { verb: 'ableiten' }),
      r => selectedPool(r, `Welche der folgenden Aussagen über die Freisetzung von ${TH} lässt bzw. lassen sich aus dem Text ableiten? Sie kann unter bestimmten Bedingungen verändert werden durch …`, [
        S(`${up}.`, true, `über ${RH}.`),
        S(`Gaben von ${HA} und ${HB}.`, true, 'über die Rückkopplung.'),
        S(`über Jahre hinweg erfolgende Gaben von ${D1}.`, true, `Nach Erschöpfung des Vorrats sinken die Hormonspiegel → mehr ${TH}.`)], [
        S(`eine einmalige Gabe von ${D2} eine Woche zuvor.`, false, `Der Hormonvorrat reicht ${N} Monate, die Spiegel ändern sich nicht.`),
        S(`die Speicherung von ${HA} in den Bläschen.`, false, 'Die Speicherung selbst wirkt nicht auf die Hirnanhangsdrüse.')], { verb: 'ableiten' }),
      r => numeric(r, `Wie lange könnte der Organismus dem Text zufolge etwa mit ${HA} und ${HB} versorgt werden, wenn die Aufnahme von ${el} vollständig ausbliebe?`, N, [N / 2, N * 2, N + 2, N * 3, 1].filter(x => x !== N), x => U.fmt(x, 0), 'Monate', `Der Vorrat in den Bläschen reicht etwa ${N} Monate.`),
      r => single(r, `Ein Patient nimmt seit zwei Jahren täglich ${D1} ein. Welche Folge ist dem Text zufolge zu erwarten?`, `Die Konzentration von ${TH} im Blut ist erhöht.`,
        [`Die Konzentration von ${TH} im Blut ist erniedrigt.`, 'Die Stoffwechselaktivität ist gesteigert.', `Die Freisetzung von ${RH} ist vermindert.`, `Die Konzentration von ${HA} im Blut ist erhöht.`, `Die Umwandlung von ${ion} in ${el} ist beschleunigt.`],
        `${D1} hemmt die Pumpe → nach Aufbrauchen des Vorrats (≈ ${N} Monate) sinken die Hormonspiegel → über die Rückkopplung steigen ${RH} und ${TH}.`)
    ];
    return { title: `Die ${gland}`, html, Qs };
  });

  // ---------- B: Parasit ----------
  fam('parasit', rng => {
    const name = rng.pick(['Sanguinella migrans', 'Hepatozoon ferox', 'Lumbrocystis tropica', 'Febricola vagans']);
    const short = name.split(' ')[0];
    const vec = rng.pick([['Stechmücke', 'Stechmücken'], ['Sandmücke', 'Sandmücken'], ['Kriebelmücke', 'Kriebelmücken']]);
    const k1 = rng.int(6, 12), h = rng.pick([24, 48, 72]), m = rng.int(9, 16), Tm = rng.pick([16, 18, 20]);
    const dormant = rng.chance(0.6);
    const M1 = rng.pick(['Chlorasin', 'Mefloxan', 'Artemol']), M2 = rng.pick(['Primadin', 'Tafenol', 'Hepasid']);
    const html = [
      `Der Einzeller ${name} verursacht eine fieberhafte Tropenkrankheit. Für seine Entwicklung benötigt er zwei Wirte: den Menschen und die ${vec[0]}. Beim Stich einer infizierten ${vec[0]} gelangen sogenannte Keimformen in die Blutbahn des Menschen. Sie erreichen innerhalb weniger Minuten die Leber, dringen in Leberzellen ein und vermehren sich dort innerhalb von ${k1} Tagen zu Tausenden von Leberformen. ${dormant ? 'Ein Teil der Keimformen wandelt sich jedoch in Ruheformen um, die monate- bis jahrelang inaktiv in der Leber verbleiben können, bevor sie sich ebenfalls zu Leberformen weiterentwickeln.' : 'Ruheformen, die längere Zeit in der Leber überdauern könnten, bildet dieser Erreger nicht.'} Während der Entwicklung in der Leber hat der Infizierte keine Beschwerden.`,
      `Nach Ablauf der Entwicklungszeit platzen die befallenen Leberzellen; die Leberformen gelangen ins Blut und dringen in rote Blutkörperchen ein. Dort wandeln sie sich in Blutformen um, die sich weiter vermehren. Nach jeweils ${h} Stunden platzen alle befallenen Blutkörperchen nahezu gleichzeitig; die freigesetzten Erreger befallen sofort neue Blutkörperchen. Jedes dieser Ereignisse löst beim Infizierten einen Fieberschub aus. Ein kleiner Teil der Blutformen entwickelt sich zu männlichen und weiblichen Geschlechtsformen, die sich im Menschen nicht weiterentwickeln und keine Beschwerden verursachen.`,
      `Saugt eine ${vec[0]} das Blut eines Infizierten, nimmt sie mit den roten Blutkörperchen auch Geschlechtsformen auf. In ihrem Darm verschmelzen männliche und weibliche Geschlechtsformen miteinander. Daraus entstehen innerhalb von ${m} Tagen neue Keimformen, die in die Speicheldrüsen der ${vec[0]} wandern und beim nächsten Stich übertragen werden können. Diese Entwicklung findet nur bei Umgebungstemperaturen von mehr als ${Tm} °C statt. Eine direkte Übertragung von Mensch zu Mensch ist nicht möglich; eine Ausnahme bilden Übertragungen von Blut, z. B. bei Bluttransfusionen.`,
      `Nachgewiesen wird die Infektion durch den mikroskopischen Nachweis von Blutformen in einem Blutausstrich. Zur Behandlung stehen zwei Medikamente zur Verfügung: ${M1} tötet ausschließlich die Blutformen ab, ${M2} dagegen ausschließlich die in der Leber befindlichen Formen${dormant ? ' einschließlich der Ruheformen' : ''}. Geschlechtsformen werden von keinem der beiden Medikamente erfasst. Zur Vorbeugung kann ${M1} während eines Aufenthalts im Verbreitungsgebiet eingenommen werden.`
    ].map(P).join('');
    const Qs = [
      r => numeric(r, `Wie viele Tage nach dem infizierenden Stich lassen sich dem Text zufolge frühestens Blutformen im Blutausstrich nachweisen?`, k1, [1, k1 + m, m, k1 + h / 24 * 3, Math.round(k1 / 2)], x => U.fmt(x, 0), 'Tage', `Erst nach der Entwicklung in der Leber (${k1} Tage) gelangen Erreger ins Blut.`),
      r => numeric(r, `In welchem zeitlichen Abstand treten bei einem Infizierten die Fieberschübe auf?`, h, [12, 24, 48, 72, 96, h * 2].filter(x => x !== h), x => U.fmt(x, 0), 'Stunden', `Die befallenen Blutkörperchen platzen alle ${h} Stunden.`),
      r => selectedPool(r, 'Welche der folgenden Aussagen lässt bzw. lassen sich aus dem Text ableiten?', [
        S(`Eine Behandlung mit ${M1} und ${M2} erfasst alle Formen des Erregers, die Beschwerden verursachen können.`, true, 'Blut- und Leberformen werden erfasst; Geschlechtsformen verursachen keine Beschwerden.'),
        S(`Nach alleiniger Behandlung mit ${M1} können erneut Fieberschübe auftreten, wenn sich noch Erreger in der Leber befinden.`, true, 'Leberformen gelangen später ins Blut.'),
        dormant ? S(`Auch Monate nach einer erfolgreichen Behandlung mit ${M1} kann es ohne erneuten Stich zu Fieberschüben kommen.`, true, 'Ruheformen können sich später weiterentwickeln.') : S(`Mehr als ${k1} Tage nach dem letzten Stich können sich keine Erreger mehr in der Leber befinden.`, true, 'Ohne Ruheformen ist die Leberphase nach ' + k1 + ' Tagen abgeschlossen.')], [
        S(`Eine alleinige Behandlung mit ${M2} beendet die Fieberschübe einer bereits ausgebrochenen Erkrankung.`, false, `${M2} wirkt nicht auf Blutformen.`),
        S(`Nach einer Behandlung mit ${M1} kann der Patient die Erreger nicht mehr an ${vec[1]} weitergeben.`, false, 'Geschlechtsformen werden nicht erfasst.'),
        dormant ? S(`Mehr als ${k1} Tage nach dem letzten Stich können sich keine Erreger mehr in der Leber befinden.`, false, 'Ruheformen können lange überdauern.') : S(`Auch Monate nach einer erfolgreichen Behandlung mit ${M1} kann es ohne erneuten Stich zu Fieberschüben kommen.`, false, 'Ruheformen werden nicht gebildet.')], { verb: 'ableiten' }),
      r => selectedPool(r, `In einem Land herrschen ganzjährig Temperaturen unter ${Tm} °C; dort leben jedoch ${vec[1]} derselben Art. Welche der folgenden Aussagen lässt bzw. lassen sich aus dem Text ableiten?`, [
        S(`Ein dort lebender Infizierter kann über ${vec[1]} keine anderen Menschen anstecken.`, true, `Die Entwicklung in der ${vec[0]} erfordert mehr als ${Tm} °C.`),
        S('Der Erreger kann dort durch eine Bluttransfusion übertragen werden.', true, 'Blutübertragungen sind eine Ausnahme.'),
        S('Ein Reisender, der sich im Verbreitungsgebiet angesteckt hat, kann dort an Fieberschüben erkranken.', true, 'Die Entwicklung im Menschen ist temperaturunabhängig.')], [
        S('Ein Reisender, der sich im Verbreitungsgebiet angesteckt hat, erkrankt dort nicht.', false, 'Die Entwicklung im Menschen ist nicht temperaturabhängig.'),
        S(`${vec[1]} können dort keine Geschlechtsformen aufnehmen.`, false, 'Aufnehmen können sie sie; nur die Weiterentwicklung unterbleibt.')], { verb: 'ableiten' }),
      r => single(r, `Warum muss ${M1} zur Vorbeugung auch nach der Rückkehr aus dem Verbreitungsgebiet noch eine Zeit lang eingenommen werden?`,
        `Weil bis zu ${k1} Tage nach dem letzten Stich noch Erreger aus der Leber ins Blut gelangen können.`,
        [`Weil ${M1} die Geschlechtsformen erst nach mehreren Tagen abtötet.`, `Weil ${M1} auch die Leberformen abtötet, die dafür länger brauchen.`, 'Weil die Keimformen nach dem Stich mehrere Wochen im Blut verbleiben.', `Weil ${vec[1]} auch nach der Rückkehr noch Erreger übertragen können.`],
        `${M1} wirkt nur auf Blutformen. Leberformen gelangen erst nach ${k1} Tagen ins Blut und müssen dann abgetötet werden.`),
      r => single(r, 'In welcher Reihenfolge treten die Formen des Erregers im Menschen auf?', 'Keimformen – Leberformen – Blutformen – Geschlechtsformen',
        ['Keimformen – Blutformen – Leberformen – Geschlechtsformen', 'Leberformen – Keimformen – Blutformen – Geschlechtsformen', 'Geschlechtsformen – Keimformen – Leberformen – Blutformen', 'Keimformen – Leberformen – Geschlechtsformen – Blutformen'], 'Stich (Keimformen) → Leber → rote Blutkörperchen → einige Blutformen werden zu Geschlechtsformen.'),
      r => numeric(r, `Wie viele Tage nachdem eine ${vec[0]} bei mehr als ${Tm} °C das Blut eines Infizierten gesaugt hat, kann sie frühestens selbst Menschen infizieren?`, m, [k1, m + k1, h / 24, m * 2, Math.max(1, m - 5)], x => U.fmt(x, 0), 'Tage', `Die Entwicklung zu übertragbaren Keimformen dauert ${m} Tage.`),
      r => single(r, 'Welche der folgenden Aussagen lässt sich aus dem Text <b>nicht</b> ableiten?', 'Die Geschlechtsformen lösen beim Menschen die Fieberschübe aus.',
        ['Während der Entwicklung in der Leber hat der Infizierte keine Beschwerden.', `Ohne ${vec[1]} kann sich der Erreger nicht geschlechtlich fortpflanzen.`, 'Die Fieberschübe entstehen durch das gleichzeitige Platzen befallener Blutkörperchen.', 'Eine Infektion lässt sich durch einen Blutausstrich nachweisen, sobald Blutformen vorhanden sind.'],
        'Die Fieberschübe entstehen beim Platzen der Blutkörperchen; Geschlechtsformen verursachen keine Beschwerden.')
    ];
    return { title: `Der Lebenszyklus von ${name}`, html, Qs };
  });

  // ---------- C: Schmerz- und Empfindungsleitung ----------
  fam('fasern', rng => {
    const v1 = rng.pick([40, 50, 60, 70]), v2 = rng.pick([10, 12, 15, 20, 25]), v3 = rng.pick([0.5, 1, 1.5, 2]);
    const swap = rng.chance(0.5);
    const t2 = swap ? 'Wärme' : 'Kälte', t3 = swap ? 'Kälte' : 'Wärme';
    const d = rng.pick([1, 1.2, 1.5]);
    const html = [
      `Empfindungen der Haut werden über Nervenfasern unterschiedlicher Dicke zum Rückenmark geleitet. Man unterscheidet drei Fasertypen: Die dicken, von einer isolierenden Hülle umgebenen Typ-1-Fasern leiten Berührungs- und Druckempfindungen mit einer Geschwindigkeit von etwa ${v1} m/s. Die mitteldicken, ebenfalls umhüllten Typ-2-Fasern leiten mit etwa ${v2} m/s den hellen, scharfen und gut lokalisierbaren „ersten Schmerz“ sowie Empfindungen von ${t2}. Die dünnen Typ-3-Fasern besitzen keine Hülle; sie leiten mit nur etwa ${U.fmt(v3, 1)} m/s den dumpfen, schlecht lokalisierbaren „zweiten Schmerz“ sowie Empfindungen von ${t3}.`,
      `Ein kräftiger Schmerzreiz, etwa ein Stoß gegen den Zeh, erregt Typ-2- und Typ-3-Fasern gleichzeitig. Wegen der unterschiedlichen Leitungsgeschwindigkeiten nimmt der Betroffene zunächst einen scharfen und erst danach einen dumpfen Schmerz wahr.`,
      `Fasern unterschiedlicher Dicke reagieren unterschiedlich empfindlich auf äußere Einflüsse: Wird ein Nerv längere Zeit abgedrückt, fällt zuerst die Leitung in den dicken Fasern aus, danach die in den mitteldicken; die dünnen Fasern leiten am längsten. Örtliche Betäubungsmittel wirken umgekehrt: Sie blockieren zuerst die dünnen, dann die mitteldicken und zuletzt die dicken Fasern.`,
      `Im Rückenmark werden die Signale auf weitere Nervenzellen umgeschaltet. An dieser Umschaltstelle können Signale aus Typ-1-Fasern die Weiterleitung von Signalen aus Typ-3-Fasern hemmen; Signale aus Typ-2-Fasern werden dadurch nicht beeinflusst. Auch bestimmte schmerzstillende Medikamente, die Opioide, hemmen im Rückenmark ausschließlich die Weiterleitung der Signale aus Typ-3-Fasern.`
    ].map(P).join('');
    const dt = d / v3 - d / v2;
    const Qs = [
      r => numeric(r, `Ein Mann stößt sich den Zeh; die Nervenfasern legen vom Zeh bis zum Rückenmark eine Strecke von ${U.fmt(d, 1)} m zurück. Wie viel später als die Signale des ersten Schmerzes erreichen die Signale des zweiten Schmerzes etwa das Rückenmark?`,
        dt, [d / v3, d / v2, dt / 10, dt * 2, d / v1], x => U.fmt(x, 2), 's', `${U.fmt(d, 1)} m : ${U.fmt(v3, 1)} m/s − ${U.fmt(d, 1)} m : ${v2} m/s = ${U.fmt(d / v3, 2)} s − ${U.fmt(d / v2, 2)} s ≈ ${U.fmt(dt, 2)} s.`),
      r => selectedPool(r, 'Zu Beginn der Wirkung eines örtlichen Betäubungsmittels (noch nicht alle Fasern blockiert) kann ein Patient dem Text zufolge noch wahrnehmen …', [
        S('Berührungen.', true, 'Dicke Fasern werden zuletzt blockiert.'), S('den scharfen ersten Schmerz.', true, 'Mitteldicke Fasern werden nach den dünnen blockiert.'), S(`Empfindungen von ${t2}.`, true, 'Typ-2-Fasern werden erst nach den dünnen blockiert.')], [
        S('den dumpfen zweiten Schmerz.', false, 'Dünne Fasern werden zuerst blockiert.'), S(`Empfindungen von ${t3}.`, false, 'Typ-3-Fasern werden zuerst blockiert.')],
        { lead: '', verb: { sg: 'Empfindung', pl: 'Empfindungen', one: 'wird wahrgenommen', many: 'werden wahrgenommen', none: 'Keine der drei Empfindungen wird wahrgenommen.' } }),
      r => selectedPool(r, 'Ein Bein ist „eingeschlafen“, weil ein Nerv eine Zeit lang abgedrückt wurde; erst ein Teil der Fasern leitet nicht mehr. Welche der folgenden Empfindungen ist bzw. sind dem Text zufolge am ehesten bereits ausgefallen?', [
        S('Berührungsempfindungen', true, 'Dicke Fasern fallen bei Druck zuerst aus.')], [
        S('der dumpfe zweite Schmerz', false, 'Dünne Fasern leiten am längsten.'), S(`Empfindungen von ${t3}`, false, 'Typ-3-Fasern leiten am längsten.'), S('Signale aller drei Fasertypen gleichzeitig', false, 'Die Fasertypen fallen nacheinander aus.')],
        { verb: { sg: 'Empfindung', pl: 'Empfindungen', one: 'ist ausgefallen', many: 'sind ausgefallen', none: 'Keine der drei ist ausgefallen.' } }),
      r => single(r, 'Warum kann dem Text zufolge Reiben der Haut an einer gestoßenen Stelle den Schmerz lindern?', 'Weil die über Typ-1-Fasern geleiteten Signale im Rückenmark die Weiterleitung des dumpfen Schmerzes hemmen.',
        ['Weil Reiben die Typ-2-Fasern blockiert und dadurch den scharfen Schmerz verhindert.', 'Weil Reiben die Leitungsgeschwindigkeit der Typ-3-Fasern erhöht.', 'Weil Reiben wie ein Opioid alle Schmerzsignale im Rückenmark hemmt.', 'Weil durch den Druck des Reibens zuerst die dünnen Fasern ausfallen.'],
        'Berührung erregt Typ-1-Fasern; deren Signale hemmen im Rückenmark Typ-3-Signale (dumpfer Schmerz).'),
      r => selectedPool(r, 'Ein Patient erhält ein Opioid. Welche der folgenden Aussagen lässt bzw. lassen sich aus dem Text ableiten?', [
        S('Der dumpfe zweite Schmerz wird abgeschwächt.', true, 'Opioide hemmen Typ-3-Signale.'), S('Der scharfe erste Schmerz bleibt unbeeinflusst.', true, 'Typ-2-Signale werden nicht gehemmt.'), S('Berührungen werden weiterhin wahrgenommen.', true, 'Typ-1-Fasern sind nicht betroffen.')], [
        S('Der scharfe erste Schmerz wird abgeschwächt.', false, 'Typ-2-Signale werden nicht gehemmt.'), S(`Empfindungen von ${t2} werden gehemmt.`, false, `${t2} wird über Typ-2-Fasern geleitet.`), S('Opioide verlangsamen die Leitung in den Typ-3-Fasern.', false, 'Sie hemmen die Weiterleitung im Rückenmark, nicht die Leitung.')], { verb: 'ableiten' }),
      r => single(r, 'Welche der folgenden Aussagen über die Fasertypen trifft dem Text zufolge zu?', `Empfindungen von ${t3} werden langsamer geleitet als Empfindungen von ${t2}.`,
        [`Empfindungen von ${t2} werden über Fasern ohne Hülle geleitet.`, 'Berührungen werden langsamer geleitet als der erste Schmerz.', 'Die dünnsten Fasern leiten am schnellsten.', `Der dumpfe Schmerz und ${t2} werden über dieselben Fasern geleitet.`],
        `${t3}: Typ 3 (${U.fmt(v3, 1)} m/s), ${t2}: Typ 2 (${v2} m/s).`),
      r => numeric(r, `Wie lange benötigt ein Berührungssignal etwa, um von der Fußsohle bis zum Rückenmark (Strecke ${U.fmt(d, 1)} m) zu gelangen?`, d / v1 * 1000, [d / v2 * 1000, d / v3 * 1000, d / v1 * 100, d / v1 * 10000, d * v1], x => U.fmt(x, 1), 'ms', `${U.fmt(d, 1)} m : ${v1} m/s = ${U.fmt(d / v1, 4)} s ≈ ${U.fmt(d / v1 * 1000, 1)} ms.`)
    ];
    return { title: 'Die Leitung von Empfindungen', html, Qs };
  });

  // ---------- D: Blutbildung ----------
  fam('blutbildung', rng => {
    const Le = rng.pick([100, 110, 120, 130]), Lt = rng.pick([7, 8, 9, 10, 12]), Lg = rng.pick([1, 2, 3]);
    const EP = rng.pick(['Erythrolin', 'Hämatopoetin', 'Rubrin']), TP = rng.pick(['Thrombolin', 'Plättchenfaktor T', 'Megakaryn']);
    const thymus = rng.pick(['Thymus', 'Bries (Thymus)']);
    const html = [
      `Alle Blutzellen stammen von Stammzellen im Knochenmark ab. Aus diesen gehen zwei Arten von Vorläuferzellen hervor: Die myeloischen Vorläuferzellen bilden rote Blutkörperchen (Erythrozyten), Blutplättchen (Thrombozyten) sowie Granulozyten, eine Gruppe weißer Blutkörperchen. Die lymphatischen Vorläuferzellen bilden die Lymphozyten, eine weitere Gruppe weißer Blutkörperchen. Ein Teil der Lymphozyten, die sogenannten T-Lymphozyten, verlässt das Knochenmark unreif und reift erst im ${thymus}, einem Organ hinter dem Brustbein, zu funktionsfähigen Zellen heran.`,
      `Die Blutzellen haben eine begrenzte Lebensdauer und müssen ständig neu gebildet werden: Erythrozyten leben etwa ${Le} Tage, Thrombozyten etwa ${Lt} Tage und Granulozyten nur etwa ${Lg} ${Lg === 1 ? 'Tag' : 'Tage'}. Kommt die Zellbildung im Knochenmark – etwa durch eine Behandlung mit zellschädigenden Medikamenten – vorübergehend zum Erliegen, nimmt die Zahl der Zellen im Blut in dem Maß ab, in dem die vorhandenen Zellen absterben.`,
      `Die Bildung der Erythrozyten wird durch das Hormon ${EP} angeregt, das in der Niere gebildet wird. Die Niere setzt umso mehr ${EP} frei, je geringer der Sauerstoffgehalt des Blutes ist, das sie durchströmt.`,
      `Die Bildung der Thrombozyten wird durch das Hormon ${TP} angeregt, das von der Leber in stets gleicher Menge ins Blut abgegeben wird. ${TP} wird an Thrombozyten gebunden und mit ihnen abgebaut; nur das nicht gebundene, freie ${TP} kann die Thrombozytenbildung anregen.`
    ].map(P).join('');
    const Qs = [
      r => single(r, 'Bei einem Patienten kommt die Bildung aller Blutzellen im Knochenmark plötzlich vollständig zum Erliegen. Welche Zellen nehmen im Blut zuerst deutlich ab?', 'die Granulozyten',
        ['die Erythrozyten', 'die Thrombozyten', 'alle Blutzellen gleich schnell', 'die Stammzellen im Blut'], `Granulozyten leben nur ≈ ${Lg} ${Lg === 1 ? 'Tag' : 'Tage'} und verschwinden daher zuerst.`),
      r => selectedPool(r, 'Bei einem Patienten sind die lymphatischen Vorläuferzellen zerstört; alle übrigen Zellen des Knochenmarks sind intakt. Welche der folgenden Aussagen lässt bzw. lassen sich ableiten?', [
        S('Es werden keine neuen T-Lymphozyten mehr gebildet.', true, 'Sie stammen von lymphatischen Vorläufern ab.'), S('Die Bildung der Granulozyten ist nicht beeinträchtigt.', true, 'Granulozyten stammen von myeloischen Vorläufern ab.'), S('Die Thrombozytenbildung ist nicht beeinträchtigt.', true, 'Thrombozyten sind myeloisch.')], [
        S('Es werden keine neuen Erythrozyten mehr gebildet.', false, 'Erythrozyten sind myeloisch.'), S('Die Zahl der Granulozyten sinkt rasch ab.', false, 'Granulozyten werden weiter gebildet.')], { verb: 'ableiten' }),
      r => selectedPool(r, `Bei einem Erwachsenen wurde der ${thymus.replace(' (Thymus)', '')} vollständig entfernt. Welche der folgenden Aussagen lässt bzw. lassen sich dem Text zufolge ableiten?`, [
        S('Neu gebildete T-Lymphozyten können nicht mehr ausreifen.', true, 'Die Reifung erfolgt im ' + thymus + '.'), S('Die Bildung der Erythrozyten ist nicht beeinträchtigt.', true, 'Erythrozyten reifen im Knochenmark.')], [
        S('Im Knochenmark werden keine lymphatischen Vorläuferzellen mehr gebildet.', false, 'Die Vorläufer entstehen im Knochenmark.'), S('Die Zahl der Thrombozyten sinkt.', false, 'Thrombozyten sind unabhängig vom ' + thymus + '.')], { verb: 'ableiten' }),
      r => selectedPool(r, 'Welche der folgenden Aussagen lässt bzw. lassen sich aus dem Text ableiten?', [
        S(`Bei einem längeren Aufenthalt in großer Höhe (Sauerstoffmangel) wird vermehrt ${EP} freigesetzt.`, true, 'Weniger Sauerstoff → mehr ' + EP + '.'),
        S('Eine schwere Nierenerkrankung kann zu einem Mangel an Erythrozyten führen.', true, 'Die Niere bildet ' + EP + '.'),
        S(`Bei einem Mangel an Thrombozyten ist die Konzentration von freiem ${TP} erhöht.`, true, 'Weniger Thrombozyten binden weniger ' + TP + '.')], [
        S(`Bei einer stark erhöhten Zahl an Thrombozyten ist die Konzentration von freiem ${TP} erhöht.`, false, 'Mehr Thrombozyten binden mehr ' + TP + '.'),
        S(`Die Leber setzt bei einem Mangel an Thrombozyten mehr ${TP} frei.`, false, 'Die Leber gibt stets gleich viel ab.'),
        S(`Bei Sauerstoffmangel wird weniger ${EP} gebildet.`, false, 'Es wird mehr gebildet.')], { verb: 'ableiten' }),
      r => numeric(r, 'Nach wie vielen Tagen ist nach einem vollständigen Ausfall der Zellbildung etwa kein einziger der ursprünglich vorhandenen Erythrozyten mehr im Blut?', Le, [Lt, Lg, Le / 2, Le * 2, Le + Lt], x => U.fmt(x, 0), 'Tage', `Erythrozyten leben ≈ ${Le} Tage.`),
      r => single(r, 'Welche der folgenden Aussagen lässt sich aus dem Text <b>nicht</b> ableiten?', 'T-Lymphozyten leben länger als Granulozyten.',
        ['Thrombozyten und Granulozyten stammen von denselben Vorläuferzellen ab.', 'Erythrozyten leben länger als Thrombozyten.', `Die Freisetzung von ${EP} hängt vom Sauerstoffgehalt des Blutes ab.`, 'T-Lymphozyten werden im Knochenmark aus lymphatischen Vorläuferzellen gebildet.'],
        'Zur Lebensdauer der Lymphozyten enthält der Text keine Angabe.'),
      r => single(r, `Einem Patienten wird über längere Zeit künstlich hergestelltes ${EP} verabreicht. Was ist dem Text zufolge zu erwarten?`, 'Die Zahl der Erythrozyten im Blut steigt.',
        ['Die Zahl der Thrombozyten steigt.', `Die Niere bildet mehr ${EP}.`, 'Die Lebensdauer der Erythrozyten verlängert sich.', 'Die Zahl der Lymphozyten steigt.'], `${EP} regt die Erythrozytenbildung an.`)
    ];
    return { title: 'Die Bildung der Blutzellen', html, Qs };
  });

  // ---------- E: Niere ----------
  fam('niere', rng => {
    const prim = rng.pick([150, 160, 180]), pPT = rng.pick([60, 65, 70]), pH = rng.pick([20, 25]), pD = rng.pick([5, 7]);
    const thr = rng.pick([160, 180, 200]);
    const DA = rng.pick(['Furosal', 'Henlon', 'Torasid']), DB = rng.pick(['Thiazan', 'Distalin']), DC = rng.pick(['Aldoblock', 'Spironal']);
    const html = [
      `In den Nieren werden täglich etwa ${prim} Liter Primärharn aus dem Blut abgefiltert. Der Primärharn enthält neben Wasser auch Salze wie Natrium sowie Glukose. Auf seinem Weg durch die Harnkanälchen wird der größte Teil davon wieder ins Blut zurückgeholt (Rückresorption); übrig bleiben normalerweise nur etwa 1,5 Liter Endharn pro Tag.`,
      `Im ersten Abschnitt der Harnkanälchen werden etwa ${pPT} % des abgefilterten Natriums und Wassers sowie normalerweise die gesamte Glukose zurückgeholt. Die Transportsysteme für Glukose können allerdings nur eine begrenzte Menge bewältigen: Liegt der Blutzucker über etwa ${thr} mg/dl, gelangt Glukose in den Endharn. Im anschließenden schleifenförmigen Abschnitt werden weitere ${pH} % des Natriums zurückgeholt; dieser Abschnitt ist für Wasser undurchlässig. Im dritten Abschnitt werden unter dem Einfluss des Hormons Aldosteron nochmals bis zu ${pD} % des Natriums zurückgeholt. Im letzten Abschnitt, dem Sammelrohr, wird unter dem Einfluss des Hormons ADH Wasser zurückgeholt.`,
      `Wasser folgt dem Natrium, wo die Wand der Harnkanälchen für Wasser durchlässig ist. Medikamente, die die Natriumrückresorption hemmen, steigern deshalb die Harnmenge (harntreibende Mittel). Das Medikament ${DA} hemmt die Natriumrückresorption im schleifenförmigen Abschnitt, ${DB} im dritten Abschnitt. ${DC} hebt die Wirkung von Aldosteron auf.`
    ].map(P).join('');
    const Qs = [
      r => numeric(r, 'Wie viel Prozent des Primärharns werden bei einer Endharnmenge von 1,5 Litern pro Tag etwa zurückgeholt?', (prim - 1.5) / prim * 100, [1.5 / prim * 100, pPT, pPT + pH, 98, 90], x => U.fmt(x, 1), '%', `(${prim} − 1,5) / ${prim} ≈ ${U.fmt((prim - 1.5) / prim * 100, 1)} %.`),
      r => selectedPool(r, 'Welche der folgenden Aussagen lässt bzw. lassen sich aus dem Text ableiten?', [
        S(`${DA} kann die Natriumrückresorption stärker vermindern als ${DB}.`, true, `Im schleifenförmigen Abschnitt werden ${pH} %, im dritten nur bis zu ${pD} % zurückgeholt.`),
        S(`Bei einem Blutzucker von ${thr + 100} mg/dl ist Glukose im Endharn zu erwarten.`, true, `Über ≈ ${thr} mg/dl gelangt Glukose in den Endharn.`),
        S(`Ein Mangel an Aldosteron kann zu vermehrter Natriumausscheidung führen.`, true, 'Aldosteron fördert die Rückresorption im dritten Abschnitt.')], [
        S(`${DC} wirkt im ersten Abschnitt der Harnkanälchen.`, false, 'Aldosteron wirkt im dritten Abschnitt.'),
        S('Im schleifenförmigen Abschnitt folgt das Wasser dem zurückgeholten Natrium.', false, 'Dieser Abschnitt ist für Wasser undurchlässig.'),
        S(`Bei einem Blutzucker von ${thr - 40} mg/dl enthält der Endharn normalerweise Glukose.`, false, 'Unterhalb der Schwelle wird alle Glukose zurückgeholt.')], { verb: 'ableiten' }),
      r => single(r, 'Bei einem Patienten fehlt das Hormon ADH vollständig. Welche Folge ist dem Text zufolge zu erwarten?', 'Im Sammelrohr wird weniger Wasser zurückgeholt; die Harnmenge steigt.',
        ['Im ersten Abschnitt wird weniger Natrium zurückgeholt.', 'Es gelangt Glukose in den Endharn.', 'Die Primärharnmenge sinkt deutlich.', 'Der schleifenförmige Abschnitt wird für Wasser durchlässig.'], 'ADH steuert die Wasserrückresorption im Sammelrohr.'),
      r => numeric(r, `Wie viel Prozent des abgefilterten Natriums werden im ersten und im schleifenförmigen Abschnitt zusammen zurückgeholt?`, pPT + pH, [pPT, pPT + pH + pD, pH, 100 - pPT, pPT - pH], x => U.fmt(x, 0), '%', `${pPT} % + ${pH} % = ${pPT + pH} %.`),
      r => single(r, 'Welche der folgenden Aussagen lässt sich aus dem Text <b>nicht</b> ableiten?', `${DB} senkt den Blutdruck stärker als ${DA}.`,
        [`${DA} steigert die Harnmenge.`, 'Ohne Rückresorption würden täglich viel mehr als 1,5 Liter Harn ausgeschieden.', 'Glukose wird normalerweise im ersten Abschnitt vollständig zurückgeholt.', `${DC} vermindert die Natriumrückresorption.`], 'Über den Blutdruck macht der Text keine Aussage.'),
      r => single(r, `Wie viele Liter Primärharn werden dem Text zufolge in einer Woche etwa gebildet?`, U.fmt(prim * 7, 0) + ' Liter',
        [U.fmt(prim, 0) + ' Liter', U.fmt(1.5 * 7, 1) + ' Liter', U.fmt(prim * 7 / 10, 0) + ' Liter', U.fmt(prim * 30, 0) + ' Liter', U.fmt(prim * 7 * 10, 0) + ' Liter'], `${prim} l · 7 = ${prim * 7} l.`)
    ];
    return { title: 'Die Harnbildung in der Niere', html, Qs };
  });

  // ---------- F: Verdauung ----------
  fam('verdauung', rng => {
    const html = [
      `Die Nährstoffe der Nahrung müssen im Verdauungstrakt in kleine Bausteine zerlegt werden, bevor sie über die Schleimhaut des Dünndarms ins Blut aufgenommen werden können. Diese Zerlegung übernehmen Enzyme, die jeweils nur bestimmte Stoffe spalten.`,
      `Stärke wird durch das Enzym Amylase in Zweifachzucker zerlegt. Amylase wird sowohl von den Speicheldrüsen als auch von der Bauchspeicheldrüse gebildet; die Bauchspeicheldrüse liefert dabei den weitaus größten Teil. Die Zweifachzucker – darunter der Milchzucker – werden durch Enzyme der Dünndarmschleimhaut in Einfachzucker gespalten; den Milchzucker spaltet ausschließlich das Enzym Laktase. Nicht gespaltene Zweifachzucker können nicht aufgenommen werden; sie gelangen in den Dickdarm, wo sie von Bakterien unter Gasbildung abgebaut werden und Durchfälle hervorrufen.`,
      `Eiweiße werden zunächst im Magen durch das Enzym Pepsin gespalten, das nur in saurer Umgebung wirksam ist. Im Dünndarm setzen die Enzyme der Bauchspeicheldrüse, vor allem Trypsin, die Eiweißverdauung fort; sie allein reichen aus, um Eiweiße vollständig zu zerlegen.`,
      `Fette sind in Wasser unlöslich. Damit das fettspaltende Enzym Lipase aus der Bauchspeicheldrüse wirken kann, müssen die Fette zuvor durch die Gallensäuren fein verteilt werden. Galle wird ständig in der Leber gebildet und zwischen den Mahlzeiten in der Gallenblase gespeichert; über den Gallengang gelangt sie in den Dünndarm. Die Vitamine A, D, E und K sind fettlöslich und werden nur zusammen mit den Fetten aufgenommen. Vitamin K wird für die Bildung von Gerinnungsfaktoren in der Leber benötigt.`
    ].map(P).join('');
    const Qs = [
      r => selectedPool(r, 'Bei einem Patienten ist der Gallengang durch einen Stein vollständig verschlossen. Welche der folgenden Folgen ist bzw. sind dem Text zufolge zu erwarten?', [
        S('Die Fettverdauung ist gestört.', true, 'Ohne Galle kann Lipase kaum wirken.'), S('Es kann eine Störung der Blutgerinnung auftreten.', true, 'Vitamin K wird ohne Fett nicht aufgenommen.'), S('Die Aufnahme von Vitamin D ist vermindert.', true, 'Fettlösliches Vitamin.')], [
        S('Die Eiweißverdauung ist unmöglich.', false, 'Trypsin wirkt unabhängig von Galle.'), S('Milchzucker kann nicht mehr gespalten werden.', false, 'Laktase ist nicht betroffen.')], { verb: 'ausfall' }),
      r => selectedPool(r, 'Einem Patienten wurde die Gallenblase entfernt. Welche der folgenden Aussagen lässt bzw. lassen sich ableiten?', [
        S('Galle gelangt weiterhin in den Dünndarm.', true, 'Sie wird ständig in der Leber gebildet.'), S('Die Eiweißverdauung ist nicht beeinträchtigt.', true, 'Pepsin und Trypsin brauchen keine Galle.')], [
        S('Es wird keine Galle mehr gebildet.', false, 'Die Leber bildet sie.'), S('Fettlösliche Vitamine können grundsätzlich nicht mehr aufgenommen werden.', false, 'Galle gelangt weiter in den Darm.'), S('Die Stärkeverdauung ist vollständig aufgehoben.', false, 'Amylase stammt nicht aus der Gallenblase.')], { verb: 'ableiten' }),
      r => single(r, 'Ein Erwachsener bekommt nach dem Trinken von Milch regelmäßig Blähungen und Durchfall. Welche Ursache ist dem Text zufolge am wahrscheinlichsten?', 'ein Mangel an Laktase in der Dünndarmschleimhaut',
        ['ein Mangel an Amylase der Speicheldrüsen', 'ein verschlossener Gallengang', 'eine verminderte Säurebildung im Magen', 'ein Mangel an Vitamin K'], 'Ungespaltener Milchzucker gelangt in den Dickdarm → Gasbildung und Durchfall.'),
      r => selectedPool(r, 'Bei einem Patienten bildet die Bauchspeicheldrüse keine Enzyme mehr. Welche der folgenden Aussagen lässt bzw. lassen sich ableiten?', [
        S('Die Fettverdauung ist stark beeinträchtigt.', true, 'Lipase stammt aus der Bauchspeicheldrüse.'), S('Ein kleiner Teil der Stärke kann weiterhin gespalten werden.', true, 'Auch die Speicheldrüsen bilden Amylase.'), S('Eiweiße werden im Magen noch teilweise gespalten.', true, 'Pepsin stammt aus dem Magen.')], [
        S('Die Stärkeverdauung ist vollständig aufgehoben.', false, 'Speichelamylase bleibt erhalten.'), S('Milchzucker kann nicht mehr gespalten werden.', false, 'Laktase stammt aus der Dünndarmschleimhaut.')], { verb: 'ableiten' }),
      r => single(r, 'Ein Patient nimmt ein Medikament ein, das die Säurebildung im Magen vollständig unterdrückt. Was ist dem Text zufolge zu erwarten?', 'Eiweiße können trotzdem vollständig verdaut werden.',
        ['Eiweiße können nicht mehr verdaut werden.', 'Die Fettverdauung ist gestört.', 'Pepsin wirkt im Dünndarm stärker.', 'Milchzucker kann nicht mehr gespalten werden.'], 'Pepsin wird unwirksam, aber Trypsin allein genügt zur vollständigen Eiweißverdauung.'),
      r => single(r, 'Welche der folgenden Aussagen lässt sich aus dem Text <b>nicht</b> ableiten?', 'Vitamin K wird in der Leber gebildet.',
        ['Galle wird zwischen den Mahlzeiten gespeichert.', 'Amylase wird an zwei verschiedenen Orten gebildet.', 'Lipase ist auf die vorherige Wirkung der Gallensäuren angewiesen.', 'Nicht gespaltene Zweifachzucker werden von Darmbakterien abgebaut.'], 'Der Text sagt nur, dass Vitamin K in der Leber benötigt wird – nicht, dass es dort gebildet wird.')
    ];
    return { title: 'Die Verdauung der Nährstoffe', html, Qs };
  });


  T.gen.tv = function (seed) {
    const rng = new RNG(seed);
    const fams = rng.sample(FAMS, 4);
    const passages = [], items = [];
    fams.forEach((f, pi) => {
      const r = rng.fork('tv' + pi + f.id);
      const t = f.fn(r);
      passages.push({ title: t.title, html: t.html });
      const qs = r.sample(t.Qs, Math.min(6, t.Qs.length));
      qs.forEach((qf, qi) => {
        const it = qf(r.fork('q' + qi));
        it.passage = pi;
        it.kind = f.id;
        items.push(it);
      });
    });
    return { passages, items };
  };
})(window.TMS);
