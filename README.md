# TMS-Trainer

Statische Übungsseite für den **Test für Medizinische Studiengänge (TMS)** – ohne Datenbank, ohne Server, ohne Build-Schritt.

## Starten

`index.html` im Browser öffnen (Doppelklick genügt). Alternativ lässt sich der Ordner auf jedem statischen Webspace hosten (z. B. GitHub Pages, Netlify).

## Umfang

| Untertest | Aufgaben je Simulation | Originalzeit |
|---|---|---|
| Muster zuordnen | 24 | 30 Min. |
| Medizinisch-naturwissenschaftliches Grundverständnis | 24 | 60 Min. |
| Schlauchfiguren | 24 | 15 Min. |
| Quantitative und formale Probleme | 24 | 60 Min. |
| Figuren lernen | 20 Figuren / 20 Fragen | 4 Min. Einprägen + 5 Min. Abfrage |
| Fakten lernen | 15 Personen / 20 Fragen | 6 Min. Einprägen + 7 Min. Abfrage |
| Textverständnis | 4 Texte, 24 Fragen | 60 Min. |
| Diagramme und Tabellen | 24 | 60 Min. |

- **15 feste Simulationen pro Untertest** (120 insgesamt) plus beliebig viele Zufallssimulationen
- **6 Gesamtsimulationen** im Originalablauf (Vormittag, Mittagspause, Einprägephasen vor dem Textverständnis, Abfrage danach) plus zufällige Gesamtsimulation
- **Zeitlimits einstellbar:** Originalzeiten, Zeitfaktor (25–200 %), eigene Minuten je Abschnitt oder ohne Limit; Mittagspause, Behaltensintervall und Warnhinweis konfigurierbar
- **Auswertung** mit Umrechnung auf TMS-Punkte (20 je Untertest, 18 im TV, 158 gesamt), Testwert (100 ± 10) und Prozentrang, orientiert an veröffentlichten Durchschnittswerten früherer TMS-Termine (siehe `js/core/norms.js`)
- Aufgabenbesprechung mit Lösungsweg, Übungsmodus, Antwortbogen, Markieren, Tastatursteuerung (A–E, 1–5, ←/→, M)
- Laufende Simulationen werden gespeichert und können nach dem Neuladen fortgesetzt werden
- Verlauf mit Entwicklung je Untertest, Export/Import als JSON

## Daten

Alle Ergebnisse und Einstellungen liegen ausschließlich im `localStorage` des Browsers. Beim Öffnen über `file://` gilt der Speicher nur für diesen Dateipfad und Browser.

## Aufbau

```
index.html
css/style.css
js/core/   util.js (Seed-Zufall, Optionen), norms.js (Normwerte), subtests.js (Aufbau), storage.js
js/gen/    ein Generator je Untertest (mz, mng, sf, qfp, fig, fak, tv, dt)
js/ui/     views.js, runner.js (Ablauf, Timer, Auswertung), app.js (Seiten, Routing)
```

Jede Simulation wird deterministisch aus einem Seed erzeugt (`sim:<untertest>:<nr>` bzw. `full:<nr>:<untertest>`), dadurch enthält z. B. „Schlauchfiguren – Simulation 7“ bei jedem Aufruf dieselben Aufgaben.

## Hinweise

- Kein offizielles Angebot der TMS-Koordinationsstelle oder der ITB Consulting GmbH.
- Die Aufgaben sind computergeneriert und nicht am echten TMS kalibriert; Prozentränge sind eine Orientierung.
- Stand der Recherche: Oktober 2026. Der TMS soll ab 2027 durch den TMSnat abgelöst werden.
