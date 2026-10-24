/*
 * Normwerte zur Einordnung der Ergebnisse.
 *
 * Grundlage (Stand der Recherche 10/2026):
 *  - Offizieller TMS-Testbericht (ITB Consulting, 2024): Testwert = Skala mit Mittelwert 100, SD 10;
 *    Prozentrang 30–70 = durchschnittlich.
 *  - Max. 20 gewertete Punkte je Untertest, 18 im Textverständnis, 158 insgesamt.
 *  - Veröffentlichte Durchschnittswerte vergangener TMS-Termine (Vorbereitungsanbieter, u. a. 2021/2022):
 *    Muster zuordnen ≈ 10–12 (2022: 12,1), MNG ≈ 10,5–11, Schlauchfiguren ≈ 13,8–14,
 *    Quantitative Probleme ≈ 10, Figuren lernen ≈ 11, Fakten lernen ≈ 9,4–12 (2021: 10,6; 2022: 9,35),
 *    Textverständnis ≈ 10 (von 18), Diagramme und Tabellen ≈ 9,9–10 (2022: 9,85).
 *  - Prozentrang 90 im Gesamtwert ≈ 112 von 158 Punkten.
 * Die Standardabweichungen sind so gewählt, dass die veröffentlichten Schwellen
 * ("überdurchschnittlich ab …", "Top ab …") näherungsweise reproduziert werden.
 */
window.TMS = window.TMS || {};

(function (T) {
  'use strict';
  const U = T.util;

  const NORMS = {
    mz:  { max: 20, mean: 11.0, sd: 3.6 },
    mng: { max: 20, mean: 10.8, sd: 3.8 },
    sf:  { max: 20, mean: 13.9, sd: 3.4 },
    qfp: { max: 20, mean: 10.0, sd: 3.7 },
    fig: { max: 20, mean: 11.5, sd: 4.8 },
    fak: { max: 20, mean: 10.3, sd: 4.6 },
    tv:  { max: 18, mean: 10.0, sd: 3.3 },
    dt:  { max: 20, mean:  9.9, sd: 3.4 },
    total: { max: 158, mean: 87.4, sd: 19.0 }
  };

  function classify(pr) {
    if (pr > 70) return { key: 'high', label: 'überdurchschnittlich' };
    if (pr >= 30) return { key: 'mid', label: 'durchschnittlich' };
    return { key: 'low', label: 'unterdurchschnittlich' };
  }

  /**
   * Bewertet einen Untertest: richtige / gestellte Aufgaben → TMS-äquivalente Punkte,
   * Testwert (100 ± 10) und Prozentrang.
   */
  function scoreSubtest(id, correct, total) {
    const n = NORMS[id];
    const ratio = total > 0 ? correct / total : 0;
    const points = ratio * n.max;
    return Object.assign({ id, correct, total, ratio, points }, toScale(points, n));
  }

  function toScale(points, n) {
    const z = (points - n.mean) / n.sd;
    const testwert = Math.round(U.clamp(100 + 10 * z, 70, 130));
    const pr = Math.round(U.clamp(U.phi(z) * 100, 0, 100));
    return { z, testwert, pr, cls: classify(pr) };
  }

  function scoreTotal(subScores) {
    // Gesamtpunkte = Summe der TMS-äquivalenten Punkte aller acht Untertests
    const points = subScores.reduce((s, x) => s + x.points, 0);
    const max = subScores.reduce((s, x) => s + NORMS[x.id].max, 0);
    // Werden nicht alle Untertests bearbeitet, wird die Norm anteilig skaliert
    const f = max / NORMS.total.max;
    const n = { mean: NORMS.total.mean * f, sd: NORMS.total.sd * Math.sqrt(f) };
    return Object.assign({ id: 'total', points, max, ratio: points / max }, toScale(points, n));
  }

  /** Benötigte Punkte für einen Ziel-Prozentrang (für Info-Tabellen). */
  function pointsForPR(id, pr) {
    const n = NORMS[id];
    // inverse Normalverteilung per Bisektion
    let lo = -4, hi = 4;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (U.phi(m) * 100 < pr) lo = m; else hi = m; }
    return U.clamp(n.mean + n.sd * (lo + hi) / 2, 0, n.max);
  }

  T.norms = { NORMS, scoreSubtest, scoreTotal, classify, pointsForPR };
})(window.TMS);
