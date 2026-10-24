/* Lokale Speicherung (localStorage) – keine Datenbank, alles bleibt im Browser */
window.TMS = window.TMS || {};

(function (T) {
  'use strict';

  const K_SETTINGS = 'tms.settings.v1';
  const K_ATTEMPTS = 'tms.attempts.v1';
  const K_RUN = 'tms.run.v1';

  const DEFAULTS = {
    theme: 'system',
    timeFactor: 1,
    noTimeLimit: false,
    customTimes: {},          // { mz: Minuten, ..., 'fig-learn': Minuten }
    pauseMinutes: 60,
    retentionMinutes: 0,
    warnMinutes: 5,
    autoAdvance: true,
    allowPause: false,
    allowEarlyFinish: true,
    practiceMode: false,
    showTimer: true,
    showInstructions: true
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignorieren */ } }

  let settingsCache = null;
  function getSettings() {
    if (!settingsCache) settingsCache = Object.assign({}, DEFAULTS, read(K_SETTINGS, {}));
    if (!settingsCache.customTimes) settingsCache.customTimes = {};
    return settingsCache;
  }
  function saveSettings(s) { settingsCache = Object.assign({}, DEFAULTS, s); write(K_SETTINGS, settingsCache); }
  function resetSettings() { settingsCache = Object.assign({}, DEFAULTS, { customTimes: {} }); write(K_SETTINGS, settingsCache); }

  /** Zeit in Sekunden für einen Untertest-Abschnitt, null = ohne Zeitlimit. */
  function timeFor(subId, phase) {
    const s = getSettings();
    if (s.noTimeLimit) return null;
    const sub = T.subtests.byId[subId];
    const key = phase === 'learn' ? subId + '-learn' : subId;
    const custom = s.customTimes[key];
    if (custom !== undefined && custom !== null && custom !== '' && !isNaN(custom)) return Math.max(10, Math.round(Number(custom) * 60));
    const base = phase === 'learn' ? sub.learnTime : sub.time;
    return Math.max(10, Math.round(base * (Number(s.timeFactor) || 1)));
  }

  /** true, wenn die aktuellen Zeiteinstellungen den Originalbedingungen entsprechen. */
  function isOriginalTiming(subIds) {
    const s = getSettings();
    if (s.noTimeLimit || Number(s.timeFactor) !== 1) return false;
    for (const id of subIds) {
      const c = s.customTimes[id], cl = s.customTimes[id + '-learn'];
      const sub = T.subtests.byId[id];
      if (c !== undefined && c !== null && c !== '' && Number(c) * 60 !== sub.time) return false;
      if (sub.memory && cl !== undefined && cl !== null && cl !== '' && Number(cl) * 60 !== sub.learnTime) return false;
    }
    return true;
  }

  function getAttempts() { return read(K_ATTEMPTS, []); }
  function saveAttempt(a) {
    const list = getAttempts();
    const i = list.findIndex(x => x.id === a.id);
    if (i >= 0) list[i] = a; else list.push(a);
    write(K_ATTEMPTS, list);
  }
  function getAttempt(id) { return getAttempts().find(a => a.id === id) || null; }
  function deleteAttempt(id) { write(K_ATTEMPTS, getAttempts().filter(a => a.id !== id)); }
  function clearAttempts() { write(K_ATTEMPTS, []); }

  function getRun() { return read(K_RUN, null); }
  function saveRun(r) { write(K_RUN, r); }
  function clearRun() { remove(K_RUN); }

  function exportAll() {
    return JSON.stringify({ app: 'tms-vorbereitung', version: 1, exportedAt: new Date().toISOString(), settings: getSettings(), attempts: getAttempts() }, null, 2);
  }
  function importAll(json) {
    const data = JSON.parse(json);
    if (!data || data.app !== 'tms-vorbereitung') throw new Error('Keine gültige Exportdatei dieser Seite.');
    if (Array.isArray(data.attempts)) {
      const map = new Map(getAttempts().map(a => [a.id, a]));
      data.attempts.forEach(a => map.set(a.id, a));
      write(K_ATTEMPTS, Array.from(map.values()).sort((a, b) => a.startedAt - b.startedAt));
    }
    if (data.settings) saveSettings(data.settings);
    return (data.attempts || []).length;
  }

  T.store = {
    DEFAULTS, getSettings, saveSettings, resetSettings, timeFor, isOriginalTiming,
    getAttempts, saveAttempt, getAttempt, deleteAttempt, clearAttempts,
    getRun, saveRun, clearRun, exportAll, importAll
  };
})(window.TMS);
