/* Seitenaufbau und Navigation (Hash-Routing, keine Server-Komponente) */
(function (T) {
  'use strict';
  const U = T.util, V = T.views, ST = T.subtests, store = T.store, N = T.norms;
  const app = document.getElementById('app');

  // ---------- Hilfen ----------
  function applyTheme() {
    const t = store.getSettings().theme;
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }

  function shell(active, body) {
    const nav = [['#/', 'Start', 'home'], ['#/untertests', 'Untertests', 'sub'], ['#/gesamt', 'Gesamtsimulationen', 'full'], ['#/verlauf', 'Verlauf', 'hist'], ['#/einstellungen', 'Einstellungen', 'set'], ['#/info', 'Infos zum TMS', 'info']];
    app.innerHTML = `<header class="topbar"><div class="topbar-in">
        <a class="brand" href="#/"><span class="brand-logo">T</span><span>TMS-Trainer</span></a>
        <nav class="nav" aria-label="Hauptnavigation">${nav.map(n => `<a href="${n[0]}" class="${active === n[2] ? 'active' : ''}">${n[1]}</a>`).join('')}</nav>
      </div></header>
      <main class="page">${resumeBanner()}${body}</main>
      <footer class="footer"><div class="footer-in">TMS-Trainer · statische Übungsseite ohne Datenbank – alle Ergebnisse bleiben in Ihrem Browser (localStorage). Kein offizielles Angebot der TMS-Koordinationsstelle oder der ITB Consulting GmbH.</div></footer>`;
    window.scrollTo(0, 0);
  }

  function resumeBanner() {
    const r = store.getRun();
    if (!r) return '';
    return `<div class="notice warn" style="margin-bottom:18px"><div class="row"><span><b>Laufende Simulation:</b> ${U.esc(r.label)}. Die Zeit läuft im Hintergrund weiter.</span><span class="spacer"></span><a class="btn small primary" href="#/lauf">Fortsetzen</a></div></div>`;
  }

  const attemptsFor = (pred) => store.getAttempts().filter(pred).sort((a, b) => b.finishedAt - a.finishedAt);
  const timingBadge = a => a.noLimit ? '<span class="badge warn">ohne Zeitlimit</span>' : a.original ? '<span class="badge high">Originalzeiten</span>' : `<span class="badge warn">angepasste Zeiten${a.timeFactor !== 1 ? ' (' + Math.round(a.timeFactor * 100) + ' %)' : ''}</span>`;
  const pct = r => Math.round(r * 100) + ' %';

  function subCard(s) {
    const atts = attemptsFor(a => a.subs && a.subs.includes(s.id));
    const sims = new Set(atts.filter(a => a.kind === 'single' && a.sub === s.id).map(a => a.simNo));
    const best = atts.length ? Math.max(...atts.map(a => a.scores[s.id].pr)) : null;
    const t = store.timeFor(s.id, 'test');
    const meta = s.memory ? `${s.items} Fragen · ${V.timeLabel(store.timeFor(s.id, 'learn'))} Einprägen + ${V.timeLabel(t)} Abfrage` : `${s.items} Aufgaben · ${V.timeLabel(t)}`;
    return `<a class="card st-card" href="#/untertest/${s.id}">
      <div class="st-top"><span class="st-abbr">${s.short}</span><div><div class="st-name">${s.name}</div><div class="st-meta">${s.part} · ${meta}</div></div></div>
      <div class="progress" title="${sims.size} von ${ST.SIMS_PER_SUBTEST} Simulationen bearbeitet"><i style="width:${sims.size / ST.SIMS_PER_SUBTEST * 100}%"></i></div>
      <div class="row"><span class="st-meta">${sims.size}/${ST.SIMS_PER_SUBTEST} Simulationen</span><span class="spacer"></span>${best !== null ? `<span class="badge ${N.classify(best).key}">bester PR ${best}</span>` : '<span class="badge">noch offen</span>'}</div>
    </a>`;
  }

  // ---------- Seiten ----------
  function pageHome() {
    const atts = store.getAttempts();
    const last10 = atts.slice(-10);
    const prs = last10.flatMap(a => a.subs.map(s => a.scores[s].pr));
    const avgPr = prs.length ? Math.round(prs.reduce((s, x) => s + x, 0) / prs.length) : null;
    const fulls = atts.filter(a => a.total && !a.partial);
    const bestFull = fulls.length ? Math.max(...fulls.map(a => a.total.pr)) : null;
    const simsDone = new Set(atts.filter(a => a.kind === 'single').map(a => a.sub + a.simNo)).size;
    shell('home', `
      <section class="hero">
        <div class="card hero-main">
          <span class="badge info">Test für Medizinische Studiengänge</span>
          <h1 style="margin-top:10px">Trainieren Sie alle acht TMS-Untertests</h1>
          <p>Je ${ST.SIMS_PER_SUBTEST} Simulationen pro Untertest und ${ST.FULL_SIMS} vollständige Gesamtsimulationen im Originalablauf – mit einstellbaren Zeitlimits und einer Auswertung, die sich an veröffentlichten Ergebnissen früherer TMS-Termine orientiert (Testwert und Prozentrang).</p>
          <div class="row"><a class="btn primary" href="#/gesamt">Gesamtsimulation starten</a><a class="btn" href="#/untertests">Untertest üben</a></div>
        </div>
        <div class="stats">
          <div class="stat"><div class="stat-v">${atts.length}</div><div class="stat-l">abgeschlossene Durchläufe</div></div>
          <div class="stat"><div class="stat-v">${simsDone}<small style="font-size:.9rem">/${ST.SIMS_PER_SUBTEST * ST.SUBTESTS.length}</small></div><div class="stat-l">Einzelsimulationen bearbeitet</div></div>
          <div class="stat"><div class="stat-v">${avgPr !== null ? avgPr : '–'}</div><div class="stat-l">Ø Prozentrang (letzte 10)</div></div>
          <div class="stat"><div class="stat-v">${bestFull !== null ? bestFull : '–'}</div><div class="stat-l">bester Gesamt-Prozentrang</div></div>
        </div>
      </section>
      <section class="section">
        <div class="section-head"><h2>Untertests</h2><span class="muted">Vormittag: 4 Untertests · Nachmittag: 4 Untertests</span></div>
        <div class="grid grid-3">${ST.SUBTESTS.map(subCard).join('')}</div>
      </section>
      <section class="section">
        <div class="section-head"><h2>Gesamtsimulationen</h2><span class="muted">kompletter Testtag in der Original-Reihenfolge</span></div>
        <div class="grid grid-sims">${fullCards()}</div>
      </section>
      <section class="section card">
        <h3>Gut zu wissen</h3>
        <p>Der TMS besteht seit 2022 aus acht Untertests (der Untertest „Konzentriertes und sorgfältiges Arbeiten“ ist entfallen). Pro Untertest sind 20 Punkte erreichbar, im Textverständnis 18 – insgesamt 158 Punkte. Laut Ankündigung wird der TMS ab 2027 durch den TMSnat abgelöst. <a href="#/info">Mehr zum Aufbau und zur Auswertung</a></p>
      </section>`);
  }

  function pageSubtests() {
    shell('sub', `<h1>Untertests</h1><p class="muted">Wählen Sie einen Untertest. Für jeden stehen ${ST.SIMS_PER_SUBTEST} feste Simulationen und beliebig viele Zufallssimulationen bereit.</p>
      <div class="grid grid-3">${ST.SUBTESTS.map(subCard).join('')}</div>`);
  }

  function pageSubtest(id) {
    const s = ST.byId[id];
    if (!s) return pageNotFound();
    const atts = attemptsFor(a => a.kind === 'single' && a.sub === id);
    const lastBy = {};
    atts.forEach(a => { if (!lastBy[a.simNo]) lastBy[a.simNo] = a; });
    const randoms = attemptsFor(a => a.kind === 'random' && a.sub === id).slice(0, 5);
    const t = store.timeFor(id, 'test'), tl = s.memory ? store.timeFor(id, 'learn') : null;
    const orig = store.isOriginalTiming([id]);
    const cards = U.range(ST.SIMS_PER_SUBTEST).map(k => {
      const n = k + 1, a = lastBy[n];
      const sc = a && a.scores[id];
      return `<div class="card sim-card ${a ? 'done' : ''}"><div class="sim-title">Simulation ${n}</div>
        <div class="sim-res">${sc ? `${sc.correct}/${sc.total} richtig (${pct(sc.ratio)})<br><span class="badge ${sc.cls.key}">PR ${sc.pr}</span>` : 'noch nicht bearbeitet'}</div>
        <div class="row"><button class="btn small ${a ? '' : 'primary'}" data-start="${n}">${a ? 'Wiederholen' : 'Starten'}</button>${a ? `<a class="btn small ghost" href="#/ergebnis/${a.id}">Ergebnis</a>` : ''}</div></div>`;
    }).join('');
    shell('sub', `
      <p><a href="#/untertests">← Alle Untertests</a></p>
      <div class="row" style="align-items:flex-start"><span class="st-abbr" style="width:56px;height:56px;font-size:1.1rem">${s.short}</span>
        <div style="flex:1;min-width:240px"><h1 style="margin-bottom:4px">${s.name}</h1><p class="muted" style="margin:0">${s.measures}</p></div></div>
      <div class="phase-meta"><span class="badge info">${s.part}</span><span class="badge">${s.items} Aufgaben${s.scored < s.items ? `, davon im Original ${s.scored} gewertet` : ''}</span>
        ${s.memory ? `<span class="badge">Einprägen: ${V.timeLabel(tl)}</span><span class="badge">Abfrage: ${V.timeLabel(t)}</span>` : `<span class="badge">Zeit: ${V.timeLabel(t)}</span>`}
        ${orig ? '<span class="badge high">Originalzeit</span>' : '<span class="badge warn">angepasste Zeit</span>'}</div>
      <div class="grid grid-2">
        <div class="card"><h3>Aufgabenstellung</h3><p>${s.instruction}</p>${s.memory ? `<p class="muted">Im Original liegt zwischen Einprägen und Abfrage etwa eine Stunde (Textverständnis). Für Einzelsimulationen können Sie in den <a href="#/einstellungen">Einstellungen</a> ein Behaltensintervall festlegen.</p>` : ''}</div>
        <div class="card"><h3>Strategie-Tipps</h3><ul class="tips">${s.tips.map(x => `<li>${x}</li>`).join('')}</ul></div>
      </div>
      <section class="section"><div class="section-head"><h2>Simulationen</h2><span class="muted">jede Simulation enthält eigene, vollständige Aufgabensätze im Originalumfang</span><span class="spacer"></span><button class="btn" data-start="random">Zufallssimulation</button></div>
        <div class="grid grid-sims">${cards}</div></section>
      ${randoms.length ? `<section class="section"><h3>Letzte Zufallssimulationen</h3><div class="table-wrap"><table class="data"><thead><tr><th>Datum</th><th class="num">Richtig</th><th class="num">PR</th><th></th></tr></thead><tbody>${randoms.map(a => `<tr><td>${U.fmtDate(a.finishedAt)}</td><td class="num">${a.scores[id].correct}/${a.scores[id].total}</td><td class="num">${a.scores[id].pr}</td><td><a href="#/ergebnis/${a.id}">ansehen</a></td></tr>`).join('')}</tbody></table></div></section>` : ''}`);
    app.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => startGuard(() => T.runner.startSingle(id, b.dataset.start === 'random' ? 'random' : Number(b.dataset.start)))));
  }

  function fullCards() {
    const atts = attemptsFor(a => a.kind === 'full');
    const lastBy = {};
    atts.forEach(a => { if (!lastBy[a.fullNo]) lastBy[a.fullNo] = a; });
    return U.range(ST.FULL_SIMS).map(k => {
      const n = k + 1, a = lastBy[n];
      return `<div class="card sim-card ${a ? 'done' : ''}"><div class="sim-title">Gesamtsimulation ${n}</div>
        <div class="sim-res">${a && a.total ? `${U.fmt(a.total.points, 1)}/${a.total.max} Punkte${a.partial ? ' (teilweise)' : ''}<br><span class="badge ${a.total.cls.key}">PR ${a.total.pr}</span>` : '8 Untertests · ca. ' + fullDurationLabel()}</div>
        <div class="row"><button class="btn small ${a ? '' : 'primary'}" data-full="${n}">${a ? 'Wiederholen' : 'Starten'}</button>${a ? `<a class="btn small ghost" href="#/ergebnis/${a.id}">Ergebnis</a>` : ''}</div></div>`;
    }).join('') + `<div class="card sim-card"><div class="sim-title">Zufällige Gesamtsimulation</div><div class="sim-res">neue, zufällig erzeugte Aufgaben für alle Untertests</div><div class="row"><button class="btn small" data-full="random">Starten</button></div></div>`;
  }

  function fullSchedule() {
    const set = store.getSettings();
    const rows = [];
    ST.FULL_ORDER.forEach(st => {
      if (st.type === 'pause') { rows.push(['Mittagspause', Number(set.pauseMinutes) ? Number(set.pauseMinutes) * 60 : 0]); return; }
      const s = ST.byId[st.sub];
      const lbl = st.type === 'learn' ? `${s.name} – Einprägephase` : st.type === 'recall' ? `${s.name} – Reproduktionsphase` : s.name;
      rows.push([lbl, store.timeFor(st.sub, st.type === 'learn' ? 'learn' : 'test')]);
    });
    return rows;
  }
  function fullDurationLabel() {
    const rows = fullSchedule();
    if (rows.some(r => r[1] === null)) return 'offen (ohne Zeitlimit)';
    const sec = rows.reduce((s, r) => s + r[1], 0);
    return `${Math.floor(sec / 3600)} h ${Math.round(sec % 3600 / 60)} min`;
  }

  function pageFull() {
    const rows = fullSchedule();
    shell('full', `<h1>Gesamtsimulationen</h1>
      <p class="muted">Ein kompletter TMS-Testtag mit allen acht Untertests in der Reihenfolge des Originaltests. Die Einprägephasen von „Figuren lernen“ und „Fakten lernen“ liegen – wie im Original – vor dem Textverständnis, die Abfrage danach.</p>
      <div class="grid grid-sims">${fullCards()}</div>
      <section class="section card"><h3>Ablauf mit Ihren aktuellen Zeiteinstellungen</h3>
        <div class="table-wrap"><table class="data"><thead><tr><th>#</th><th>Abschnitt</th><th class="num">Zeit</th></tr></thead><tbody>
        ${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td class="num">${r[1] === 0 ? 'entfällt' : V.timeLabel(r[1])}</td></tr>`).join('')}
        </tbody><tfoot><tr><th></th><th>Gesamtdauer</th><th class="num">${fullDurationLabel()}</th></tr></tfoot></table></div>
        <p class="muted" style="margin-top:10px">Zeiten, Pause und Instruktionsseiten lassen sich in den <a href="#/einstellungen">Einstellungen</a> anpassen. Eine laufende Simulation wird automatisch gespeichert und kann nach dem Neuladen fortgesetzt werden.</p></section>`);
    app.querySelectorAll('[data-full]').forEach(b => b.addEventListener('click', () => startGuard(() => T.runner.startFull(b.dataset.full === 'random' ? 'random' : Number(b.dataset.full)))));
  }

  async function startGuard(fn) {
    if (store.getRun()) {
      const v = await V.modal({ title: 'Laufende Simulation', body: '<p>Es gibt bereits eine laufende Simulation. Soll sie verworfen werden?</p>', buttons: [{ label: 'Fortsetzen', value: 'resume', cls: 'primary' }, { label: 'Verwerfen und neu starten', value: 'new', cls: 'danger' }] });
      if (v === 'resume') { location.hash = '#/lauf'; return; }
      if (v !== 'new') return;
      store.clearRun();
    }
    fn();
  }

  // ---------- Ergebnis ----------
  function kpis(sc, sub) {
    const n = N.NORMS[sub];
    return `<div class="kpis">
      <div class="kpi"><div class="kpi-v">${sc.correct}/${sc.total}</div><div class="kpi-l">richtig (${pct(sc.ratio)})</div></div>
      <div class="kpi"><div class="kpi-v">${U.fmt(sc.points, 1)}<small style="font-size:.9rem">/${n.max}</small></div><div class="kpi-l">TMS-Punkte (umgerechnet)</div></div>
      <div class="kpi"><div class="kpi-v">${sc.testwert}</div><div class="kpi-l">Testwert</div></div>
      <div class="kpi"><div class="kpi-v">${sc.pr}</div><div class="kpi-l">Prozentrang · ${sc.cls.label}</div></div>
    </div>`;
  }

  function reviewList(a, sub) {
    const c = T.runner.content(sub, a.seeds[sub]);
    const ans = a.answers[sub];
    const extra = [];
    if (c.learnHtml) extra.push(`<details class="review-item"><summary><b>Lernmaterial anzeigen</b></summary><div class="review-body">${c.learnHtml}</div></details>`);
    if (c.passages) c.passages.forEach((p, i) => extra.push(`<details class="review-item"><summary><b>Text ${i + 1}: ${p.title}</b></summary><div class="review-body paper" style="padding:16px 20px">${p.html}</div></details>`));
    const rows = c.items.map((it, i) => {
      const v = ans[i], ok = v === it.correct;
      const st = v === null ? 'na' : ok ? 'ok' : 'no';
      return `<details class="review-item" data-st="${st}" data-rev="${sub}:${i}"><summary><span class="dot ${st}"></span><b>Aufgabe ${i + 1}</b>${it.passage !== undefined ? `<span class="muted">Text ${it.passage + 1}</span>` : ''}<span class="spacer"></span>
        <span class="muted">Ihre Antwort: <b>${v === null ? '–' : U.LETTERS[v]}</b> · richtig: <b>${U.LETTERS[it.correct]}</b></span></summary><div class="review-body"></div></details>`;
    }).join('');
    return `<div class="row" style="margin:10px 0"><div class="seg" data-filter="${sub}"><button class="on" data-f="all">Alle</button><button data-f="no">Falsch</button><button data-f="na">Unbeantwortet</button><button data-f="ok">Richtig</button></div></div>${extra.join('')}<div data-list="${sub}">${rows}</div>`;
  }

  function renderReviewBody(det, a) {
    const [sub, iStr] = det.dataset.rev.split(':');
    const i = Number(iStr);
    const it = T.runner.content(sub, a.seeds[sub]).items[i];
    const v = a.answers[sub][i];
    const opts = it.options.map((o, k) => `<div class="opt ${k === it.correct ? 'is-right' : k === v ? 'is-wrong' : ''}" style="cursor:default"><span class="opt-l">(${U.LETTERS[k]})</span>${sub === 'fig' ? '' : `<span class="opt-t">${o}</span>`}</div>`).join('');
    const ex = typeof it.explanation === 'function' ? it.explanation() : it.explanation;
    det.querySelector('.review-body').innerHTML = `<div class="item-stem">${it.stem}</div><div class="opts ${it.layout || 'list'}">${opts}</div>${ex ? `<div class="expl"><b>Erläuterung</b>${/^<(ul|p|div)/.test(ex) ? '' : '<br>'}${ex}</div>` : ''}`;
  }

  function pageResult(id) {
    const a = store.getAttempt(id);
    if (!a) return pageNotFound();
    const isFull = !!a.total;
    let top = '';
    if (isFull) {
      top = `<div class="card"><div class="res-head"><div style="flex:1;min-width:260px"><h2>Gesamtergebnis</h2>
        <div class="kpis"><div class="kpi"><div class="kpi-v">${U.fmt(a.total.points, 1)}<small style="font-size:.9rem">/${a.total.max}</small></div><div class="kpi-l">TMS-Punkte (umgerechnet)</div></div>
        <div class="kpi"><div class="kpi-v">${pct(a.total.ratio)}</div><div class="kpi-l">Anteil richtig</div></div>
        <div class="kpi"><div class="kpi-v">${a.total.testwert}</div><div class="kpi-l">Testwert</div></div>
        <div class="kpi"><div class="kpi-v">${a.total.pr}</div><div class="kpi-l">Prozentrang · ${a.total.cls.label}</div></div></div></div>
        <div>${V.bell(a.total.z, a.total.pr)}</div></div>
        <div class="table-wrap" style="margin-top:14px"><table class="data"><thead><tr><th>Untertest</th><th class="num">Richtig</th><th class="num">%</th><th class="num">Punkte</th><th class="num">Testwert</th><th class="num">PR</th><th style="min-width:140px">Einordnung</th></tr></thead><tbody>
        ${a.subs.map(s => { const sc = a.scores[s]; return `<tr><td>${ST.byId[s].name}</td><td class="num">${sc.correct}/${sc.total}</td><td class="num">${pct(sc.ratio)}</td><td class="num">${U.fmt(sc.points, 1)}/${N.NORMS[s].max}</td><td class="num">${sc.testwert}</td><td class="num">${sc.pr}</td><td>${V.prBar(sc.pr)}<small>${sc.cls.label}</small></td></tr>`; }).join('')}
        </tbody></table></div>
        ${a.partial ? '<p class="notice warn" style="margin-top:12px">Diese Gesamtsimulation wurde vorzeitig beendet. Der Gesamtwert bezieht sich nur auf die bearbeiteten Untertests und ist entsprechend skaliert.</p>' : ''}</div>`;
    }
    const subsHtml = a.subs.map(s => {
      const sc = a.scores[s], st = ST.byId[s];
      const used = a.used[s], dur = a.durations ? a.durations[s] : null;
      return `<section class="card" id="sub-${s}">
        <div class="res-head"><div style="flex:1;min-width:260px"><h2>${st.name} ${V.clsBadge(sc.cls)}</h2>${kpis(sc, s)}
          <p class="muted" style="margin-top:10px">Bearbeitungszeit: ${U.fmtTime(used || 0)}${dur ? ` von ${U.fmtTime(dur)}` : ' (ohne Limit)'} · beantwortet: ${sc.answered}/${sc.total}</p></div>
          ${isFull ? '' : `<div>${V.bell(sc.z, sc.pr)}</div>`}</div>
        <details style="margin-top:8px"><summary><b>Aufgaben durchgehen</b> <span class="muted">(${sc.total - sc.correct} falsch oder offen)</span></summary>${reviewList(a, s)}</details>
      </section>`;
    }).join('');
    const again = a.kind === 'single' ? `<button class="btn primary" data-again>Simulation wiederholen</button>${a.simNo < ST.SIMS_PER_SUBTEST ? `<button class="btn" data-next>Nächste Simulation</button>` : ''}<a class="btn ghost" href="#/untertest/${a.sub}">Zur Untertest-Seite</a>`
      : a.kind === 'full' ? `<button class="btn primary" data-again>Gesamtsimulation wiederholen</button><a class="btn ghost" href="#/gesamt">Zu den Gesamtsimulationen</a>`
        : `<a class="btn ghost" href="${a.sub ? '#/untertest/' + a.sub : '#/gesamt'}">Zurück</a>`;
    shell(isFull ? 'full' : 'sub', `
      <p><a href="#/verlauf">← Verlauf</a></p>
      <h1>${U.esc(a.label)}</h1>
      <div class="phase-meta"><span class="badge">${U.fmtDate(a.finishedAt)}</span>${timingBadge(a)}${a.partial ? '<span class="badge warn">vorzeitig beendet</span>' : ''}</div>
      ${!a.original ? '<p class="notice warn">Die Zeitbedingungen entsprachen nicht dem Original. Prozentrang und Testwert sind daher nur eingeschränkt mit echten TMS-Ergebnissen vergleichbar.</p>' : ''}
      ${top}
      ${subsHtml}
      <div class="row section">${again}</div>
      <p class="muted section" style="font-size:.88rem"><b>So wird ausgewertet:</b> Der Anteil richtiger Antworten wird auf die im TMS gewerteten Punkte umgerechnet (20 je Untertest, 18 im Textverständnis, 158 gesamt). Testwert (Mittelwert 100, SD 10) und Prozentrang werden aus Durchschnittswerten früherer TMS-Termine abgeleitet. Prozentrang 30–70 gilt im TMS als durchschnittlich. Die Werte sind eine Orientierung – die echte Normierung hängt vom jeweiligen Testtermin ab. <a href="#/info">Details</a></p>`);
    app.querySelectorAll('details.review-item[data-rev]').forEach(d => d.addEventListener('toggle', () => { if (d.open && !d.dataset.loaded) { renderReviewBody(d, a); d.dataset.loaded = '1'; } }));
    app.querySelectorAll('[data-filter]').forEach(seg => seg.addEventListener('click', e => {
      const b = e.target.closest('button[data-f]'); if (!b) return;
      seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      const list = app.querySelector(`[data-list="${seg.dataset.filter}"]`);
      list.querySelectorAll('.review-item').forEach(it => { it.style.display = b.dataset.f === 'all' || it.dataset.st === b.dataset.f ? '' : 'none'; });
    }));
    const ag = app.querySelector('[data-again]');
    if (ag) ag.addEventListener('click', () => startGuard(() => a.kind === 'full' ? T.runner.startFull(a.fullNo) : T.runner.startSingle(a.sub, a.simNo)));
    const nx = app.querySelector('[data-next]');
    if (nx) nx.addEventListener('click', () => startGuard(() => T.runner.startSingle(a.sub, a.simNo + 1)));
  }

  // ---------- Verlauf ----------
  function pageHistory() {
    const atts = store.getAttempts().slice().sort((a, b) => b.finishedAt - a.finishedAt);
    const perSub = ST.SUBTESTS.map(s => {
      const list = store.getAttempts().filter(a => a.subs.includes(s.id)).sort((a, b) => a.finishedAt - b.finishedAt);
      const vals = list.map(a => a.scores[s.id].pr);
      return `<div class="card"><div class="row"><b>${s.name}</b><span class="spacer"></span>${vals.length ? `<span class="badge ${N.classify(vals[vals.length - 1]).key}">zuletzt PR ${vals[vals.length - 1]}</span>` : '<span class="badge">keine Daten</span>'}</div>
        ${vals.length ? V.miniChart(vals.slice(-20)) + `<div class="muted" style="font-size:.8rem">${vals.length} Durchläufe · Ø PR ${Math.round(vals.reduce((x, y) => x + y, 0) / vals.length)} · Band = durchschnittlich (PR 30–70)</div>` : '<p class="muted" style="margin:8px 0 0">Noch kein Ergebnis.</p>'}</div>`;
    }).join('');
    shell('hist', `<h1>Verlauf</h1>
      <p class="muted">Alle Ergebnisse werden ausschließlich lokal in diesem Browser gespeichert. Sichern Sie sie bei Bedarf per Export.</p>
      <div class="row" style="margin-bottom:16px"><button class="btn" data-export>Exportieren (JSON)</button><label class="btn">Importieren<input type="file" accept="application/json,.json" data-import hidden></label><span class="spacer"></span><button class="btn danger" data-clear>Alle Ergebnisse löschen</button></div>
      <h2>Entwicklung je Untertest (Prozentrang)</h2>
      <div class="grid grid-3">${perSub}</div>
      <section class="section"><h2>Alle Durchläufe</h2>
      ${atts.length ? `<div class="table-wrap card" style="padding:0"><table class="data"><thead><tr><th>Datum</th><th>Durchlauf</th><th class="num">Richtig</th><th class="num">PR</th><th>Zeit</th><th></th></tr></thead><tbody>
      ${atts.map(a => {
        const corr = a.subs.reduce((s, x) => s + a.scores[x].correct, 0), tot = a.subs.reduce((s, x) => s + a.scores[x].total, 0);
        const pr = a.total ? a.total.pr : a.scores[a.subs[0]].pr;
        return `<tr><td>${U.fmtDate(a.finishedAt)}</td><td>${U.esc(a.label)}${a.partial ? ' <span class="badge warn">teilweise</span>' : ''}</td><td class="num">${corr}/${tot}</td><td class="num"><span class="badge ${N.classify(pr).key}">${pr}</span></td><td>${timingBadge(a)}</td><td><a class="btn small ghost" href="#/ergebnis/${a.id}">Ansehen</a><button class="btn small ghost danger" data-del="${a.id}">Löschen</button></td></tr>`;
      }).join('')}</tbody></table></div>` : '<p class="card muted">Noch keine abgeschlossenen Durchläufe.</p>'}</section>`);
    app.querySelector('[data-export]').addEventListener('click', () => {
      const blob = new Blob([store.exportAll()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `tms-trainer-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    app.querySelector('[data-import]').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { try { const n = store.importAll(rd.result); V.toast(`${n} Durchläufe importiert.`); pageHistory(); } catch (err) { V.modal({ title: 'Import fehlgeschlagen', body: `<p>${U.esc(err.message)}</p>` }); } };
      rd.readAsText(f);
    });
    app.querySelector('[data-clear]').addEventListener('click', async () => {
      const ok = await V.modal({ title: 'Alle Ergebnisse löschen?', body: '<p>Dies kann nicht rückgängig gemacht werden.</p>', buttons: [{ label: 'Abbrechen', value: false }, { label: 'Löschen', value: true, cls: 'danger' }] });
      if (ok) { store.clearAttempts(); pageHistory(); }
    });
    app.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      const ok = await V.modal({ title: 'Durchlauf löschen?', buttons: [{ label: 'Abbrechen', value: false }, { label: 'Löschen', value: true, cls: 'danger' }] });
      if (ok) { store.deleteAttempt(b.dataset.del); pageHistory(); }
    }));
  }

  // ---------- Einstellungen ----------
  function pageSettings() {
    const s = store.getSettings();
    const mode = s.noTimeLimit ? 'none' : Number(s.timeFactor) === 1 ? 'orig' : 'factor';
    const timeRows = ST.SUBTESTS.map(st => {
      const rows = [];
      if (st.memory) rows.push([st.id + '-learn', `${st.name} – Einprägen`, st.learnTime]);
      rows.push([st.id, st.memory ? `${st.name} – Abfrage` : st.name, st.time]);
      return rows;
    }).flat();
    shell('set', `<h1>Einstellungen</h1>
      <p class="muted">Änderungen werden sofort gespeichert und gelten für neu gestartete Simulationen.</p>
      <div class="card"><h2>Zeitlimits</h2>
        <div class="form-row"><span class="lbl">Zeitmodus</span><div><div class="seg" data-mode>
          <button data-v="orig" class="${mode === 'orig' ? 'on' : ''}">Originalzeiten</button><button data-v="factor" class="${mode === 'factor' ? 'on' : ''}">Zeitfaktor</button><button data-v="none" class="${mode === 'none' ? 'on' : ''}">Ohne Zeitlimit</button></div>
          <div class="hint" style="margin-top:6px">Für eine realistische Einordnung sollten Sie unter Originalbedingungen üben.</div></div></div>
        <div class="form-row" ${mode !== 'factor' ? 'style="display:none"' : ''} data-factor-row><label class="lbl" for="tf">Zeitfaktor</label><div class="row"><input type="range" id="tf" min="25" max="200" step="5" value="${Math.round((Number(s.timeFactor) || 1) * 100)}"><b data-tfv>${Math.round((Number(s.timeFactor) || 1) * 100)} %</b></div></div>
        <div class="form-row"><span class="lbl">Individuelle Zeiten</span><div><div class="hint">Optional: feste Minutenwerte je Untertest (leer = automatisch). Überschreiben den Zeitfaktor.</div>
          <div class="table-wrap"><table class="data" style="margin-top:6px"><thead><tr><th>Abschnitt</th><th class="num">Original</th><th class="num">Aktuell</th><th>Eigene Minuten</th></tr></thead><tbody>
          ${timeRows.map(r => `<tr><td>${r[1]}</td><td class="num">${r[2] / 60} Min.</td><td class="num" data-cur="${r[0]}"></td><td><input type="number" min="0.5" max="300" step="0.5" data-ct="${r[0]}" value="${s.customTimes[r[0]] !== undefined && s.customTimes[r[0]] !== null ? s.customTimes[r[0]] : ''}" placeholder="auto"></td></tr>`).join('')}
          </tbody></table></div><button class="btn small" data-reset-times style="margin-top:8px">Eigene Zeiten zurücksetzen</button></div></div>
        <div class="form-row"><label class="lbl" for="pm">Mittagspause (Gesamtsimulation)</label><div class="row"><input type="number" id="pm" min="0" max="120" step="5" value="${s.pauseMinutes}"><span class="hint">Minuten · 0 = keine Pause (überspringbar)</span></div></div>
        <div class="form-row"><label class="lbl" for="rm">Behaltensintervall (Einzelsimulation Figuren/Fakten)</label><div class="row"><input type="number" id="rm" min="0" max="90" step="1" value="${s.retentionMinutes}"><span class="hint">Minuten zwischen Einprägen und Abfrage · im Original ca. 60</span></div></div>
        <div class="form-row"><label class="lbl" for="wm">Warnhinweis vor Ablauf</label><div class="row"><input type="number" id="wm" min="0" max="30" step="1" value="${s.warnMinutes}"><span class="hint">Minuten · 0 = aus</span></div></div>
      </div>
      <div class="card"><h2>Bearbeitung</h2>
        ${[['autoAdvance', 'Automatisch zur nächsten Aufgabe springen', 'bei Muster zuordnen, Schlauchfiguren und Figuren lernen'],
          ['practiceMode', 'Übungsmodus: Lösung sofort anzeigen', 'Antworten werden gesperrt und sofort erklärt – ideal zum Lernen, nicht zur Leistungsmessung'],
          ['allowPause', 'Pausieren erlauben', 'im Original nicht möglich'],
          ['allowEarlyFinish', 'Einprägephase vorzeitig beenden erlauben', ''],
          ['showInstructions', 'Instruktionsseite vor jedem Untertest der Gesamtsimulation', 'die Zeit läuft dort nicht'],
          ['showTimer', 'Restzeit anzeigen', 'ausgeschaltet erscheint nur „läuft“ und der Warnhinweis']].map(([k, l, h]) =>
          `<div class="form-row"><span class="lbl">${l}</span><label class="check"><input type="checkbox" data-bool="${k}" ${s[k] ? 'checked' : ''}><span class="hint">${h || ''}</span></label></div>`).join('')}
      </div>
      <div class="card"><h2>Darstellung</h2>
        <div class="form-row"><span class="lbl">Farbschema</span><div class="seg" data-theme-seg>${[['system', 'System'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([v, l]) => `<button data-v="${v}" class="${s.theme === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      </div>
      <div class="row section"><button class="btn danger" data-reset-all>Alle Einstellungen zurücksetzen</button></div>`);
    const save = patch => { store.saveSettings(Object.assign({}, store.getSettings(), patch)); updateCur(); };
    const updateCur = () => app.querySelectorAll('[data-cur]').forEach(td => {
      const k = td.dataset.cur, learn = k.endsWith('-learn');
      td.textContent = V.timeLabel(store.timeFor(learn ? k.replace('-learn', '') : k, learn ? 'learn' : 'test'));
    });
    updateCur();
    app.querySelector('[data-mode]').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const v = b.dataset.v;
      app.querySelectorAll('[data-mode] button').forEach(x => x.classList.toggle('on', x === b));
      app.querySelector('[data-factor-row]').style.display = v === 'factor' ? '' : 'none';
      const tfv = Number(app.querySelector('#tf').value) / 100;
      save({ noTimeLimit: v === 'none', timeFactor: v === 'factor' ? (tfv === 1 ? 0.8 : tfv) : 1 });
      if (v === 'factor' && tfv === 1) { app.querySelector('#tf').value = 80; app.querySelector('[data-tfv]').textContent = '80 %'; }
    });
    app.querySelector('#tf').addEventListener('input', e => { app.querySelector('[data-tfv]').textContent = e.target.value + ' %'; save({ timeFactor: Number(e.target.value) / 100 }); });
    app.querySelectorAll('[data-ct]').forEach(inp => inp.addEventListener('change', () => {
      const ct = Object.assign({}, store.getSettings().customTimes);
      if (inp.value === '' || Number(inp.value) <= 0) delete ct[inp.dataset.ct]; else ct[inp.dataset.ct] = Number(inp.value);
      save({ customTimes: ct });
    }));
    app.querySelector('[data-reset-times]').addEventListener('click', () => { save({ customTimes: {} }); app.querySelectorAll('[data-ct]').forEach(i => { i.value = ''; }); });
    [['#pm', 'pauseMinutes'], ['#rm', 'retentionMinutes'], ['#wm', 'warnMinutes']].forEach(([sel, key]) => app.querySelector(sel).addEventListener('change', e => save({ [key]: Math.max(0, Number(e.target.value) || 0) })));
    app.querySelectorAll('[data-bool]').forEach(cb => cb.addEventListener('change', () => save({ [cb.dataset.bool]: cb.checked })));
    app.querySelector('[data-theme-seg]').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      app.querySelectorAll('[data-theme-seg] button').forEach(x => x.classList.toggle('on', x === b));
      save({ theme: b.dataset.v }); applyTheme();
    });
    app.querySelector('[data-reset-all]').addEventListener('click', async () => {
      const ok = await V.modal({ title: 'Einstellungen zurücksetzen?', buttons: [{ label: 'Abbrechen', value: false }, { label: 'Zurücksetzen', value: true, cls: 'danger' }] });
      if (ok) { store.resetSettings(); applyTheme(); pageSettings(); }
    });
  }

  // ---------- Info ----------
  function pageInfo() {
    const rows = ST.SUBTESTS.map(s => `<tr><td><b>${s.name}</b><br><small>${s.measures}</small></td><td>${s.part}</td><td class="num">${s.items}</td><td class="num">${s.scored}</td><td class="num">${s.memory ? `${s.learnTime / 60} + ${s.time / 60}` : s.time / 60} Min.</td></tr>`).join('');
    const normRows = ST.SUBTESTS.map(s => { const n = N.NORMS[s.id]; return `<tr><td>${s.name}</td><td class="num">${n.max}</td><td class="num">${U.fmt(n.mean, 1)}</td><td class="num">${U.fmt(N.pointsForPR(s.id, 30), 1)}</td><td class="num">${U.fmt(N.pointsForPR(s.id, 70), 1)}</td><td class="num">${U.fmt(N.pointsForPR(s.id, 90), 1)}</td></tr>`; }).join('');
    const tn = N.NORMS.total;
    const totalPR = pr => U.fmt(tn.mean + tn.sd * zFor(pr), 0);
    function zFor(pr) { let lo = -4, hi = 4; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (U.phi(m) * 100 < pr) lo = m; else hi = m; } return (lo + hi) / 2; }
    shell('info', `<h1>Infos zum TMS</h1>
      <p class="muted">Zusammenfassung der Recherche (Stand: Oktober 2026). Maßgeblich sind immer die aktuellen Angaben auf <a href="https://www.tms-info.org" target="_blank" rel="noopener">tms-info.org</a>.</p>
      <div class="card"><h2>Aufbau des TMS</h2>
        <p>Der TMS besteht aus acht Aufgabengruppen. Einige enthalten neben den gewerteten Aufgaben nicht gewertete Einstreuaufgaben, die zur Erprobung neuer Aufgaben dienen. Der frühere Untertest „Konzentriertes und sorgfältiges Arbeiten“ ist seit 2022 nicht mehr Bestandteil des Tests.</p>
        <div class="table-wrap"><table class="data"><thead><tr><th>Untertest</th><th>Teil</th><th class="num">Aufgaben</th><th class="num">gewertet</th><th class="num">Zeit</th></tr></thead><tbody>${rows}</tbody>
        <tfoot><tr><th>Gesamt</th><th></th><th class="num">184</th><th class="num">158</th><th class="num">ca. 5 h + Pause</th></tr></tfoot></table></div>
        <p class="muted" style="margin-top:10px">Ablauf am Testtag: Vormittag Muster zuordnen → Medizinisch-naturwissenschaftliches Grundverständnis → Schlauchfiguren → Quantitative und formale Probleme; Mittagspause; Nachmittag Einprägen Figuren → Einprägen Fakten → Textverständnis → Abfrage Figuren → Abfrage Fakten → Diagramme und Tabellen.</p></div>
      <div class="card"><h2>Auswertung: Testwert und Prozentrang</h2>
        <p>Jede gewertete richtige Antwort zählt einen Punkt; falsche oder fehlende Antworten führen nicht zu Abzügen. Die Punkte werden in einen <b>Testwert</b> auf einer Skala mit Mittelwert 100 und Standardabweichung 10 umgerechnet (ca. 68 % der Teilnehmenden liegen zwischen 90 und 110). Der <b>Prozentrang</b> gibt an, wie viel Prozent der Teilnehmenden ein schlechteres oder gleich gutes Ergebnis erzielt haben; ein Prozentrang von 30 bis 70 gilt als durchschnittlich. Der Gesamtwert wird aus der Summe aller Punkte berechnet, nicht als Mittelwert der Untertest-Ergebnisse.</p>
        <h3>Normwerte dieser Trainingsseite</h3>
        <p>Weil keine offiziellen Umrechnungstabellen veröffentlicht werden, orientiert sich die Auswertung an veröffentlichten Durchschnittswerten früherer TMS-Termine (z. B. Muster zuordnen 2022: 12,1 Punkte; Schlauchfiguren ≈ 13,8–14; Fakten lernen 2021: 10,6 / 2022: 9,35; Diagramme und Tabellen 2022: 9,85; Prozentrang 90 im Gesamtwert ≈ 112 von 158 Punkten). Ihre Trefferquote wird auf die gewerteten Punkte umgerechnet und anhand einer Normalverteilung eingeordnet:</p>
        <div class="table-wrap"><table class="data"><thead><tr><th>Untertest</th><th class="num">max. Punkte</th><th class="num">Ø Punkte</th><th class="num">PR 30 ab</th><th class="num">PR 70 ab</th><th class="num">PR 90 ab</th></tr></thead><tbody>${normRows}
        <tr><td><b>Gesamtwert</b></td><td class="num">158</td><td class="num">${U.fmt(tn.mean, 1)}</td><td class="num">${totalPR(30)}</td><td class="num">${totalPR(70)}</td><td class="num">${totalPR(90)}</td></tr></tbody></table></div>
        <p class="notice warn" style="margin-top:12px">Die Einordnung ist eine Annäherung. Die Aufgaben dieser Seite sind computergeneriert und nicht am echten TMS kalibriert; zudem wird die echte Normierung je Testtermin neu berechnet. Nutzen Sie die Werte vor allem, um Ihre Entwicklung zu verfolgen.</p></div>
      <div class="card"><h2>Über die Aufgaben dieser Seite</h2>
        <p>Alle Simulationen werden aus festen Startwerten (Seeds) algorithmisch erzeugt: Simulation 7 eines Untertests enthält daher bei jedem Aufruf dieselben Aufgaben – so lassen sich Wiederholungen vergleichen. Zufallssimulationen erzeugen jedes Mal neue Aufgaben.</p>
        <ul class="tips"><li><b>Muster zuordnen:</b> generierte Strichzeichnungen; vier Ausschnitte sind gezielt verändert (fehlende/zusätzliche Elemente, Füllungen, Verschiebungen …).</li>
        <li><b>Schlauchfiguren:</b> echte 3D-Kabel im Würfel mit Zentralperspektive – nahe Kabelteile erscheinen dicker und verdecken fernere.</li>
        <li><b>MNG und Textverständnis:</b> Texte zu physiologischen Regelkreisen, Nervenbahnen, Erbgängen, Gefäßversorgung usw. Die Lösungen werden aus einem Logikmodell berechnet. Teils werden fiktive Bezeichnungen verwendet, damit Vorwissen nicht hilft – wie im echten TMS stehen alle nötigen Informationen im Text.</li>
        <li><b>Quantitative Probleme:</b> 25 Aufgabentypen nach den in der offiziellen Broschüre genannten Grundmustern (Dreisatz, Prozent, Konzentrationen, Formeln umstellen, Einheiten …).</li>
        <li><b>Figuren & Fakten lernen:</b> 20 Figuren mit je fünf Feldern bzw. 15 Personen mit Doppelungen, Abfrage in veränderter Reihenfolge.</li>
        <li><b>Diagramme und Tabellen:</b> Balken-, Linien- und Anteilsdiagramme sowie Tabellen; „ableitbar/nicht ableitbar“ wird aus den Daten mit Sicherheitsabständen berechnet.</li></ul></div>
      <div class="card"><h2>Ausblick: TMSnat ab 2027</h2>
        <p>Nach Angaben aus der Vorbereitungsliteratur ist der Termin im November 2026 (7./8.11.) der letzte reguläre TMS. Ab 2027 sollen TMS und HAM-Nat zum <b>TMSnat</b> zusammengeführt werden (erster Termin voraussichtlich 8./9. Mai 2027). Angekündigt ist, dass Muster zuordnen, Schlauchfiguren und Figuren lernen entfallen und Naturwissenschaftsfragen sowie Arithmetisches Problemlösen hinzukommen. Bitte prüfen Sie die aktuellen Informationen der Koordinationsstelle.</p></div>
      <div class="card"><h2>Quellen</h2><ul class="tips">
        <li><a href="https://www.tms-info.org/wp-content/uploads/informationsbroschuere_tms.pdf" target="_blank" rel="noopener">TMS – Beispielaufgaben zur Vorbereitung (ITB Consulting, 2025)</a>: Aufbau, Aufgabenzahlen, Bearbeitungszeiten, Instruktionen</li>
        <li><a href="https://www.tms-info.org/wp-content/uploads/beispiel_testbericht.pdf" target="_blank" rel="noopener">Beispiel-Testbericht (ITB Consulting, 2024)</a>: Testwert, Prozentrang, Einstreuaufgaben</li>
        <li><a href="https://medcoaches.de/tms/tms-durchschnittswerte/" target="_blank" rel="noopener">Medcoaches: TMS-Durchschnittswerte</a></li>
        <li><a href="https://www.stark-verlag.de/blog/tms-punkte" target="_blank" rel="noopener">STARK Verlag: TMS-Punkte</a></li>
        <li><a href="https://medirechner.de/tms-ergebnis" target="_blank" rel="noopener">medirechner: TMS-Ergebnis</a> und <a href="https://medirechner.de/ratgeber/wissen/tmsnat-aufbau-geplante-untertests" target="_blank" rel="noopener">TMSnat-Aufbau</a></li>
        <li><a href="https://testhelden.com/tms-standardwert/" target="_blank" rel="noopener">Testhelden: TMS-Standardwert</a></li>
      </ul></div>`);
  }

  function pageNotFound() {
    shell('', `<div class="card"><h1>Nicht gefunden</h1><p>Diese Seite oder dieses Ergebnis existiert nicht (mehr).</p><a class="btn primary" href="#/">Zur Startseite</a></div>`);
  }

  // ---------- Routing ----------
  function route() {
    applyTheme();
    const h = location.hash.replace(/^#/, '') || '/';
    const parts = h.split('/').filter(Boolean);
    if (parts[0] !== 'lauf') T.runner.unmount();
    switch (parts[0]) {
      case undefined: return pageHome();
      case 'untertests': return pageSubtests();
      case 'untertest': return pageSubtest(parts[1]);
      case 'gesamt': return pageFull();
      case 'ergebnis': return pageResult(parts[1]);
      case 'verlauf': return pageHistory();
      case 'einstellungen': return pageSettings();
      case 'info': return pageInfo();
      case 'lauf':
        app.innerHTML = '';
        if (!T.runner.mount(app)) location.hash = '#/';
        return;
      default: return pageNotFound();
    }
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('storage', e => { if (e.key && e.key.startsWith('tms.settings')) applyTheme(); });
  T.app = { route };
  route();
})(window.TMS);
