/* Test-Engine: Ablaufphasen, Timer, Antwortbogen, Auswertung */
(function (T) {
  'use strict';
  const U = T.util, V = T.views, ST = T.subtests, store = T.store;

  const cache = new Map();
  function content(sub, seed) {
    const k = sub + '|' + seed;
    if (!cache.has(k)) cache.set(k, T.gen[sub](seed));
    return cache.get(k);
  }

  const QUICK = ['mz', 'sf', 'fig'];
  let run = null, root = null, tickHandle = null, warned = false, finishing = false;

  // ---------- Aufbau eines Durchlaufs ----------
  function phasesSingle(sub, seed) {
    const s = ST.byId[sub], set = store.getSettings();
    if (s.memory) {
      const ph = [{ type: 'intro', sub, mode: 'learn' }, { type: 'learn', sub, seed, dur: store.timeFor(sub, 'learn') }];
      const ret = Number(set.retentionMinutes) || 0;
      if (ret > 0) ph.push({ type: 'interval', dur: ret * 60 });
      ph.push({ type: 'intro', sub, mode: 'recall' }, { type: 'recall', sub, seed, dur: store.timeFor(sub, 'test') });
      return ph;
    }
    return [{ type: 'intro', sub }, { type: 'test', sub, seed, dur: store.timeFor(sub, 'test') }];
  }

  function phasesFull(fullNo, seedFn) {
    const set = store.getSettings();
    const ph = [];
    ST.FULL_ORDER.forEach(step => {
      if (step.type === 'pause') {
        const m = Number(set.pauseMinutes) || 0;
        if (m > 0) ph.push({ type: 'pause', dur: m * 60 });
        return;
      }
      const seed = seedFn(step.sub);
      if (set.showInstructions || !ph.length) ph.push({ type: 'intro', sub: step.sub, mode: step.type === 'learn' ? 'learn' : step.type === 'recall' ? 'recall' : 'test' });
      ph.push({ type: step.type, sub: step.sub, seed, dur: store.timeFor(step.sub, step.type === 'learn' ? 'learn' : 'test') });
    });
    return ph;
  }

  function newRun(o) {
    const subs = o.phases.filter(p => p.seed).map(p => p.sub).filter((v, i, a) => a.indexOf(v) === i);
    const set = store.getSettings();
    const r = {
      id: 'a' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      kind: o.kind, sub: o.sub || null, simNo: o.simNo || null, fullNo: o.fullNo || null, label: o.label,
      phases: o.phases, idx: 0, phaseStart: null, elapsedBefore: 0, paused: false,
      answers: {}, flags: {}, cur: {}, used: {}, seeds: {}, subs,
      startedAt: Date.now(), original: store.isOriginalTiming(subs), timeFactor: Number(set.timeFactor) || 1, noLimit: !!set.noTimeLimit
    };
    o.phases.forEach(p => { if (p.seed) r.seeds[p.sub] = p.seed; });
    subs.forEach(s => { const n = ST.byId[s].items; r.answers[s] = Array(n).fill(null); r.flags[s] = Array(n).fill(false); r.cur[s] = 0; r.used[s] = 0; });
    return r;
  }

  function start(o) {
    run = newRun(o);
    enterPhase();
    store.saveRun(run);
    if (location.hash !== '#/lauf') location.hash = '#/lauf'; else T.app.route();
  }

  function startSingle(sub, simNo) {
    const random = simNo === 'random';
    const seed = random ? `random:${sub}:${Date.now()}` : ST.seedFor(sub, simNo);
    start({ kind: random ? 'random' : 'single', sub, simNo: random ? null : simNo, phases: phasesSingle(sub, seed),
      label: `${ST.byId[sub].name} – ${random ? 'Zufallssimulation' : 'Simulation ' + simNo}` });
  }

  function startFull(fullNo) {
    const random = fullNo === 'random';
    const stamp = Date.now();
    const seedFn = sub => random ? `random-full:${stamp}:${sub}` : ST.fullSeedFor(fullNo, sub);
    start({ kind: random ? 'full-random' : 'full', fullNo: random ? null : fullNo, phases: phasesFull(fullNo, seedFn),
      label: random ? 'Zufällige Gesamtsimulation' : `Gesamtsimulation ${fullNo}` });
  }

  // ---------- Phasen & Zeit ----------
  const phase = () => run.phases[run.idx];
  function enterPhase() {
    run.phaseStart = Date.now();
    run.elapsedBefore = 0;
    run.paused = false;
    warned = false;
  }
  function elapsed() {
    if (!run || run.phaseStart === null) return 0;
    return run.elapsedBefore + (run.paused ? 0 : (Date.now() - run.phaseStart) / 1000);
  }
  function remaining() { const p = phase(); return p.dur ? p.dur - elapsed() : null; }

  function persist() { if (run) store.saveRun(run); }

  async function finishPhase(reason) {
    if (finishing) return;
    finishing = true;
    try {
      const p = phase();
      if (p.type === 'test' || p.type === 'recall') run.used[p.sub] = Math.round(p.dur ? Math.min(elapsed(), p.dur) : elapsed());
      if (reason === 'timeout' && (p.type === 'test' || p.type === 'recall' || p.type === 'learn')) V.toast(p.type === 'learn' ? 'Die Einprägezeit ist abgelaufen.' : 'Die Bearbeitungszeit ist abgelaufen.');
      run.idx++;
      if (run.idx >= run.phases.length) { complete(); return; }
      enterPhase();
      persist();
      render();
      window.scrollTo(0, 0);
    } finally { finishing = false; }
  }

  function tick() {
    if (!run || !root) return;
    const p = phase();
    const el = root.querySelector('[data-timer]');
    const set = store.getSettings();
    if (p.dur) {
      const rem = remaining();
      if (rem <= 0 && !run.paused) { finishPhase('timeout'); return; }
      if (el) {
        el.textContent = set.showTimer || p.type === 'pause' || p.type === 'interval' ? U.fmtTime(rem) : 'läuft';
        const w = (Number(set.warnMinutes) || 0) * 60;
        const longEnough = p.dur > w * 1.5;
        el.classList.toggle('warn', longEnough && rem <= w && rem > 60);
        el.classList.toggle('crit', rem <= Math.min(60, p.dur / 4));
        el.classList.toggle('paused', run.paused);
        if (!warned && w > 0 && rem <= w && (p.type === 'test' || p.type === 'recall') && p.dur > w * 1.5) { warned = true; V.toast(`Noch ${set.warnMinutes} Minuten.`); }
      }
      const big = root.querySelector('[data-bigcount]');
      if (big) big.textContent = U.fmtTime(rem);
    } else if (el) {
      el.textContent = U.fmtTime(elapsed());
      el.title = 'Ohne Zeitlimit – bisher benötigte Zeit';
    }
  }

  // ---------- Darstellung ----------
  function mount(container) {
    root = container;
    run = store.getRun();
    if (!run) return false;
    // nach Neuladen: abgelaufene Phasen überspringen
    while (run && phase() && phase().dur && !run.paused && remaining() <= 0) {
      const p = phase();
      if (p.type === 'test' || p.type === 'recall') run.used[p.sub] = p.dur;
      run.idx++;
      if (run.idx >= run.phases.length) { complete(); return true; }
      run.phaseStart = Date.now(); run.elapsedBefore = 0;
      persist();
    }
    document.body.classList.add('running');
    render();
    clearInterval(tickHandle);
    tickHandle = setInterval(tick, 250);
    return true;
  }

  function unmount() {
    clearInterval(tickHandle);
    tickHandle = null;
    document.body.classList.remove('running');
    root = null;
  }

  function header(p, extra) {
    const s = p.sub ? ST.byId[p.sub] : null;
    const set = store.getSettings();
    const stepNo = run.phases.slice(0, run.idx + 1).filter(x => x.type !== 'intro').length;
    const steps = run.phases.filter(x => x.type !== 'intro').length;
    const title = s ? s.name : p.type === 'pause' ? 'Mittagspause' : 'Behaltensintervall';
    const phaseLbl = { learn: 'Einprägephase', recall: 'Reproduktionsphase', test: 'Bearbeitung', pause: 'Pause', interval: 'Pause bis zur Abfrage', intro: 'Instruktion' }[p.type];
    return `<header class="run-head"><div class="run-head-in">
      <div class="rh-title"><span class="rh-sub">${title}</span><span class="rh-phase">${run.label} · ${phaseLbl}${steps > 1 ? ` · Abschnitt ${stepNo}/${steps}` : ''}</span></div>
      ${p.type !== 'intro' ? `<div class="timer" data-timer aria-live="off">${p.dur ? U.fmtTime(remaining()) : U.fmtTime(elapsed())}</div>` : ''}
      <div class="rh-actions">${extra || ''}
        ${set.allowPause && p.dur && p.type !== 'intro' ? `<button class="btn small" data-act="pause">${run.paused ? 'Fortsetzen' : 'Pause'}</button>` : ''}
        <button class="btn small ghost" data-act="abort">Abbrechen</button>
      </div></div><div class="run-progress"><i style="width:${(run.idx / run.phases.length * 100).toFixed(1)}%"></i></div></header>`;
  }

  function render() {
    if (!root || !run) return;
    const p = phase();
    if (!p) return;
    if (p.type === 'intro') return renderIntro(p);
    if (p.type === 'learn') return renderLearn(p);
    if (p.type === 'pause' || p.type === 'interval') return renderPause(p);
    return renderTest(p);
  }

  function renderIntro(p) {
    const s = ST.byId[p.sub];
    const next = run.phases[run.idx + 1];
    const dur = next && next.dur !== undefined ? next.dur : null;
    let what, meta;
    if (p.mode === 'learn') {
      what = s.id === 'fig' ? 'Einprägephase: Prägen Sie sich bei allen 20 Figuren ein, welches Feld geschwärzt ist.' : 'Einprägephase: Prägen Sie sich die Angaben zu den 15 Personen ein.';
      meta = [`Einprägezeit: ${V.timeLabel(dur)}`, `Abfrage später: ${s.items} Aufgaben`];
    } else if (p.mode === 'recall') {
      what = s.id === 'fig' ? 'Reproduktionsphase: Geben Sie für jede Figur an, welches Feld geschwärzt war. Die Reihenfolge ist verändert.' : 'Reproduktionsphase: Beantworten Sie 20 Fragen zu den Personen, die Sie sich eingeprägt haben.';
      meta = [`${s.items} Aufgaben`, `Bearbeitungszeit: ${V.timeLabel(dur)}`];
    } else {
      what = s.instruction;
      meta = [`${s.items} Aufgaben${s.scored < s.items ? ` (im Original ${s.scored} gewertet)` : ''}`, `Bearbeitungszeit: ${V.timeLabel(dur)}`];
    }
    root.innerHTML = `<div class="run">${header(p)}<div class="phase-box card">
      <span class="badge info">${s.part}</span>
      <h1>${s.name}</h1>
      <p class="muted">${s.measures}</p>
      <div class="phase-meta">${meta.map(m => `<span class="badge">${m}</span>`).join('')}</div>
      <p>${p.mode ? what : s.instruction}</p>
      ${s.memory ? '<div class="notice warn">Notizen sind bei den Merkfähigkeitstests nicht erlaubt.</div>' : '<p class="muted">Im Original-Test dürfen Sie im Testheft unterstreichen, skizzieren und Notizen machen – nutzen Sie dafür ruhig Papier.</p>'}
      <details style="margin-top:12px"><summary>Strategie-Tipps</summary><ul class="tips" style="margin-top:8px">${s.tips.map(t => `<li>${t}</li>`).join('')}</ul></details>
      <div class="row" style="margin-top:20px"><button class="btn primary" data-act="next">${p.mode === 'learn' ? 'Einprägephase starten' : 'Bearbeitung starten'}</button><span class="kbd-hint">oder <kbd>Enter</kbd></span></div>
    </div></div>`;
    bind();
  }

  function renderLearn(p) {
    const c = content(p.sub, p.seed);
    const set = store.getSettings();
    root.innerHTML = `<div class="run">${header(p, set.allowEarlyFinish ? '<button class="btn small primary" data-act="finish">Einprägen beenden</button>' : '')}
      <div class="run-main"><div class="item" style="max-width:1000px"><p class="muted center">Prägen Sie sich alles gut ein – Notizen sind nicht erlaubt.</p>${c.learnHtml}</div></div></div>`;
    bind();
  }

  function renderPause(p) {
    const isPause = p.type === 'pause';
    root.innerHTML = `<div class="run">${header(p)}<div class="phase-box card center">
      <h1>${isPause ? 'Mittagspause' : 'Behaltensintervall'}</h1>
      <p class="muted">${isPause ? 'Im Original folgt nach dem Vormittagsteil eine Pause. Danach beginnt der Nachmittagsteil mit den Einprägephasen.' : 'Zwischen Einprägen und Abfrage liegt im Original der Untertest Textverständnis. Lenken Sie sich ab – ohne an die Lerninhalte zu denken.'}</p>
      <div class="big-count" data-bigcount>${U.fmtTime(remaining())}</div>
      <button class="btn primary" data-act="finish">${isPause ? 'Pause beenden' : 'Zur Abfrage'}</button>
    </div></div>`;
    bind();
  }

  function renderTest(p) {
    const s = ST.byId[p.sub];
    const c = content(p.sub, p.seed);
    const items = c.items;
    const i = U.clamp(run.cur[p.sub] || 0, 0, items.length - 1);
    run.cur[p.sub] = i;
    const it = items[i];
    const ans = run.answers[p.sub][i];
    const set = store.getSettings();
    const practice = set.practiceMode;
    const answeredCount = run.answers[p.sub].filter(a => a !== null).length;
    const opts = it.options.map((o, k) => {
      let cls = '';
      if (ans === k) cls += ' sel';
      if (practice && ans !== null) { if (k === it.correct) cls += ' is-right'; else if (ans === k) cls += ' is-wrong'; }
      const label = it.layout === 'inline' && (p.sub === 'fig') ? `<span class="opt-l">(${U.LETTERS[k]})</span>` : `<span class="opt-l">(${U.LETTERS[k]})</span><span class="opt-t">${o}</span>`;
      return `<button class="opt${cls}" data-opt="${k}" aria-pressed="${ans === k}">${label}</button>`;
    }).join('');
    let fb = '';
    if (practice && ans !== null) {
      const ex = typeof it.explanation === 'function' ? it.explanation() : it.explanation;
      fb = `<div class="item-fb"><div class="notice ${ans === it.correct ? '' : 'warn'}"><b>${ans === it.correct ? 'Richtig.' : `Falsch – richtig ist (${U.LETTERS[it.correct]}).`}</b></div>${ex ? `<div class="expl">${ex}</div>` : ''}</div>`;
    }
    const itemHtml = `<div class="item">
      <div class="item-no">Aufgabe ${i + 1} von ${items.length}${run.flags[p.sub][i] ? ' <span class="badge warn">markiert</span>' : ''}</div>
      <div class="item-stem">${it.stem}</div>
      <div class="opts ${it.layout || 'list'}" role="group" aria-label="Antwortmöglichkeiten">${opts}</div>${fb}</div>`;
    let main;
    if (p.sub === 'tv' && c.passages) {
      const pa = c.passages[it.passage];
      main = `<div class="tv-layout"><article class="tv-passage paper"><h3>Text ${it.passage + 1}: ${pa.title}</h3>${pa.html}</article>${itemHtml}</div>`;
    } else main = itemHtml;
    const sheet = items.map((_, k) => {
      let cls = '';
      if (run.answers[p.sub][k] !== null) cls += ' ans';
      if (practice && run.answers[p.sub][k] !== null) cls += run.answers[p.sub][k] === items[k].correct ? ' right' : ' wrong';
      if (run.flags[p.sub][k]) cls += ' flag';
      if (k === i) cls += ' cur';
      return `<button class="${cls.trim()}" data-go="${k}" title="Aufgabe ${k + 1}">${k + 1}</button>`;
    }).join('');
    root.innerHTML = `<div class="run">${header(p, `<button class="btn small" data-act="sheet">Bogen ${answeredCount}/${items.length}</button><button class="btn small primary" data-act="submit">Abgeben</button>`)}
      <div class="run-body"><main class="run-main">${main}</main>
      <aside class="run-sheet" data-sheet><b>Antwortbogen</b><p class="muted" style="font-size:.82rem;margin:.2em 0 .8em">${answeredCount} von ${items.length} beantwortet</p><div class="sheet-grid">${sheet}</div>
      <div class="sheet-legend"><span><kbd>A</kbd>–<kbd>E</kbd> bzw. <kbd>1</kbd>–<kbd>5</kbd> antworten</span><span><kbd>←</kbd> <kbd>→</kbd> blättern</span><span><kbd>M</kbd> markieren</span></div></aside></div>
      <footer class="run-foot"><div class="run-foot-in">
        <button class="btn" data-act="prev" ${i === 0 ? 'disabled' : ''}>← Zurück</button>
        <button class="btn ghost" data-act="flag">${run.flags[p.sub][i] ? 'Markierung entfernen' : 'Markieren'}</button>
        <span class="spacer"></span><span class="kbd-hint">${s.short} · ${i + 1}/${items.length}</span>
        ${i < items.length - 1 ? '<button class="btn primary" data-act="next-item">Weiter →</button>' : '<button class="btn primary" data-act="submit">Abgeben</button>'}
      </div></footer></div>`;
    bind();
    tick();
  }

  // ---------- Interaktion ----------
  function bind() {
    root.onclick = onClick;
    tick();
  }

  function go(k) {
    const p = phase();
    const n = content(p.sub, p.seed).items.length;
    run.cur[p.sub] = U.clamp(k, 0, n - 1);
    persist();
    renderTest(p);
    const m = root.querySelector('.run-main');
    window.scrollTo(0, 0);
    if (m) m.scrollTop = 0;
  }

  function answer(k) {
    const p = phase();
    if (p.type !== 'test' && p.type !== 'recall') return;
    if (run.paused) { V.toast('Die Zeit ist pausiert.'); return; }
    const i = run.cur[p.sub];
    const set = store.getSettings();
    const cur = run.answers[p.sub][i];
    if (set.practiceMode && cur !== null) return;
    run.answers[p.sub][i] = cur === k && !set.practiceMode ? null : k;
    persist();
    const n = content(p.sub, p.seed).items.length;
    if (set.autoAdvance && !set.practiceMode && QUICK.includes(p.sub) && run.answers[p.sub][i] !== null && i < n - 1) {
      renderTest(p);
      setTimeout(() => { if (run && phase() === p && run.cur[p.sub] === i) go(i + 1); }, 180);
    } else renderTest(p);
  }

  async function submit() {
    const p = phase();
    const open = run.answers[p.sub].filter(a => a === null).length;
    const ok = await V.modal({
      title: 'Untertest abgeben?',
      body: open ? `<p>Es sind noch <b>${open}</b> Aufgaben unbeantwortet. Im TMS gibt es keinen Punktabzug für falsche Antworten – raten lohnt sich.</p>` : '<p>Alle Aufgaben sind beantwortet.</p>' + (p.dur ? `<p class="muted">Verbleibende Zeit: ${U.fmtTime(remaining())}</p>` : ''),
      buttons: [{ label: 'Weiter bearbeiten', value: false }, { label: 'Abgeben', value: true, cls: 'primary' }]
    });
    if (ok && run && phase() === p) finishPhase('submit');
  }

  async function abort() {
    const answeredAny = run.subs.some(s => run.answers[s].some(a => a !== null));
    const v = await V.modal({
      title: 'Simulation abbrechen?',
      body: '<p>Sie können die bisherigen Antworten auswerten lassen (unbearbeitete Untertests werden nicht gewertet) oder die Simulation verwerfen.</p>',
      buttons: [{ label: 'Weiter bearbeiten', value: 'cont' }, { label: 'Verwerfen', value: 'discard', cls: 'danger' }].concat(answeredAny ? [{ label: 'Jetzt auswerten', value: 'eval', cls: 'primary' }] : [])
    });
    if (v === 'discard') { const back = run.sub ? `#/untertest/${run.sub}` : '#/gesamt'; store.clearRun(); run = null; unmount(); location.hash = back; }
    if (v === 'eval') {
      const p = phase();
      if (p.type === 'test' || p.type === 'recall') run.used[p.sub] = Math.round(p.dur ? Math.min(elapsed(), p.dur) : elapsed());
      complete(true);
    }
  }

  function togglePause() {
    if (run.paused) { run.paused = false; run.phaseStart = Date.now(); }
    else { run.elapsedBefore = elapsed(); run.paused = true; }
    persist();
    render();
  }

  function onClick(e) {
    const b = e.target.closest('[data-act],[data-opt],[data-go]');
    if (!b || !run) return;
    if (b.dataset.opt !== undefined) return answer(Number(b.dataset.opt));
    if (b.dataset.go !== undefined) { const sh = root.querySelector('[data-sheet]'); if (sh) sh.classList.remove('open'); return go(Number(b.dataset.go)); }
    const p = phase();
    switch (b.dataset.act) {
      case 'next': return finishPhase('next');
      case 'finish': return finishPhase('early');
      case 'submit': return submit();
      case 'abort': return abort();
      case 'pause': return togglePause();
      case 'prev': return go(run.cur[p.sub] - 1);
      case 'next-item': return go(run.cur[p.sub] + 1);
      case 'flag': { const i = run.cur[p.sub]; run.flags[p.sub][i] = !run.flags[p.sub][i]; persist(); return renderTest(p); }
      case 'sheet': { const sh = root.querySelector('[data-sheet]'); if (sh) sh.classList.toggle('open'); return; }
    }
  }

  document.addEventListener('keydown', e => {
    if (!run || !root || document.querySelector('.modal-back')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    const p = phase();
    if (!p) return;
    if (p.type === 'intro' && e.key === 'Enter') { e.preventDefault(); return finishPhase('next'); }
    if (p.type !== 'test' && p.type !== 'recall') return;
    const key = e.key.toLowerCase();
    const map = { a: 0, b: 1, c: 2, d: 3, e: 4, '1': 0, '2': 1, '3': 2, '4': 3, '5': 4 };
    if (key in map) { e.preventDefault(); return answer(map[key]); }
    if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); return go(run.cur[p.sub] + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); return go(run.cur[p.sub] - 1); }
    if (key === 'm') { const i = run.cur[p.sub]; run.flags[p.sub][i] = !run.flags[p.sub][i]; persist(); renderTest(p); }
  });

  // ---------- Auswertung ----------
  function scoreAttempt(a) {
    const scores = {};
    a.subs.forEach(sub => {
      const items = content(sub, a.seeds[sub]).items;
      const ans = a.answers[sub];
      const correct = items.reduce((s, it, i) => s + (ans[i] === it.correct ? 1 : 0), 0);
      scores[sub] = T.norms.scoreSubtest(sub, correct, items.length);
      scores[sub].answered = ans.filter(x => x !== null).length;
    });
    return scores;
  }

  function complete(partial) {
    const r = run;
    const done = r.subs.filter(s => {
      if (!partial) return true;
      const lastIdx = r.phases.map((p, i) => (p.sub === s && (p.type === 'test' || p.type === 'recall')) ? i : -1).filter(i => i >= 0).pop();
      return lastIdx !== undefined && (lastIdx < r.idx || (lastIdx === r.idx));
    });
    const attempt = {
      id: r.id, kind: r.kind, sub: r.sub, simNo: r.simNo, fullNo: r.fullNo, label: r.label,
      subs: done, seeds: r.seeds, answers: {}, used: {}, startedAt: r.startedAt, finishedAt: Date.now(),
      original: r.original, timeFactor: r.timeFactor, noLimit: r.noLimit, partial: !!partial && done.length < r.subs.length,
      durations: {}
    };
    done.forEach(s => {
      attempt.answers[s] = r.answers[s]; attempt.used[s] = r.used[s];
      const ph = r.phases.find(p => p.sub === s && (p.type === 'test' || p.type === 'recall'));
      attempt.durations[s] = ph ? ph.dur : null;
    });
    attempt.scores = scoreAttempt(attempt);
    if (r.kind.startsWith('full') && done.length) attempt.total = T.norms.scoreTotal(done.map(s => attempt.scores[s]));
    if (done.length) store.saveAttempt(attempt);
    store.clearRun();
    run = null;
    unmount();
    location.hash = done.length ? '#/ergebnis/' + attempt.id : '#/';
  }

  T.runner = { startSingle, startFull, mount, unmount, content, scoreAttempt, hasRun: () => !!store.getRun() };
})(window.TMS);
