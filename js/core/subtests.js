/* Verzeichnis der TMS-Untertests (Aufbau laut offizieller Beispielbroschüre 2025, ITB Consulting) */
window.TMS = window.TMS || {};
window.TMS.gen = window.TMS.gen || {};

(function (T) {
  'use strict';

  const SUBTESTS = [
    {
      id: 'mz', name: 'Muster zuordnen', short: 'MZ', part: 'Vormittag',
      items: 24, scored: 20, time: 30 * 60,
      measures: 'Visuelle Wahrnehmung: Ausschnitte in einem komplexen Bild wiedererkennen.',
      instruction: 'Pro Aufgabe sehen Sie ein „Muster“ und fünf „Musterausschnitte“ (A) bis (E). Nur einer der Ausschnitte kann an irgendeiner Stelle deckungsgleich und vollständig auf das Muster gelegt werden. Die Ausschnitte sind weder vergrößert, verkleinert, gedreht noch gekippt.',
      tips: [
        'Suchen Sie zuerst die vier <b>falschen</b> Ausschnitte – Abweichungen zu finden ist leichter als Deckungsgleichheit zu beweisen.',
        'Orientieren Sie sich an einem markanten Element im Ausschnitt und suchen Sie es im Muster; vergleichen Sie dann systematisch die Umgebung.',
        'Typische Abweichungen: fehlende/zusätzliche Elemente, andere Füllung oder Schraffur, verschobene oder veränderte Linien.',
        'Die Abweichungen liegen nie in winzigen Details wie der genauen Anzahl einzelner Pünktchen.',
        'Der Untertest ist auf Zeitdruck ausgelegt – nicht an einer Aufgabe festbeißen.'
      ]
    },
    {
      id: 'mng', name: 'Medizinisch-naturwissenschaftliches Grundverständnis', short: 'MNG', part: 'Vormittag',
      items: 24, scored: 20, time: 60 * 60,
      measures: 'Verbal-schlussfolgerndes, deduktives Denken in medizinisch-naturwissenschaftlichen Kontexten.',
      instruction: 'Jede Aufgabe besteht aus einem kurzen Text und einer Frage. Alle benötigten Informationen stehen im Text – Fachwissen ist nicht erforderlich. Markieren Sie die richtige Antwort.',
      tips: [
        'Unterstreichen Sie zentrale Begriffe und die Verben, die Beziehungen ausdrücken („fördert“, „hemmt“, „besteht aus“).',
        'Bei Regelkreisen hilft eine Pfeilskizze mit + / − für gleich- und gegensinnige Wirkung.',
        'Bei Nervenbahnen und Gefäßen: Verlauf skizzieren und Kreuzungsstellen markieren.',
        'Bei Bilanzaufgaben: Aufnahme und Abgabe gegenüberstellen.',
        'Beurteilen Sie I, II, III einzeln und streichen Sie dann die Antwortoptionen.'
      ]
    },
    {
      id: 'sf', name: 'Schlauchfiguren', short: 'SF', part: 'Vormittag',
      items: 24, scored: 20, time: 15 * 60,
      measures: 'Räumliches Vorstellungsvermögen.',
      instruction: 'Links sehen Sie stets die Vorderansicht eines durchsichtigen Würfels mit einem oder zwei Kabeln. Rechts ist derselbe Würfel aus einer anderen Perspektive abgebildet. Geben Sie an, ob er von rechts (r), links (l), unten (u), oben (o) oder hinten (h) gezeigt wird.',
      tips: [
        '„Oben“: Die Oberkante der Vorderansicht wird zur Unterkante der Ansicht – der Würfel ist nach vorn gekippt.',
        '„Unten“: Die Unterkante der Vorderansicht wird zur Oberkante – der Würfel ist nach hinten gekippt.',
        '„Hinten“ ist seitenverkehrt zur Vorderansicht; nahe (dicke) Teile erscheinen nun fern (dünn).',
        'Achten Sie auf die Perspektive: Kabelteile nahe am Betrachter wirken dicker und verdecken fernere Teile.',
        'Kabelenden und markante Schleifen sind gute Orientierungspunkte.',
        'Mit ca. 37 Sekunden pro Aufgabe ist Tempo entscheidend.'
      ]
    },
    {
      id: 'qfp', name: 'Quantitative und formale Probleme', short: 'QFP', part: 'Vormittag',
      items: 24, scored: 20, time: 60 * 60,
      measures: 'Umgang mit Zahlen, Größen, Einheiten und Formeln in medizinisch-naturwissenschaftlichen Kontexten.',
      instruction: 'Eingekleidete Rechenaufgaben auf Mittelstufen-Niveau (Dreisatz, Prozentrechnung, Potenzen, Umformen von Gleichungen, Einheiten). Ein Taschenrechner ist nicht erlaubt.',
      tips: [
        'Erst den Sachverhalt verstehen, dann rechnen: Was ist gegeben, was gesucht?',
        'Einheiten konsequent mitführen – viele Distraktoren entstehen durch vergessene Umrechnungen (·60, ·1000).',
        'Grob überschlagen: Oft reicht die Größenordnung, um vier Optionen auszuschließen.',
        'Bei Formel-Aufgaben Proportionalitäten nutzen („r halbiert → r⁴ wird 1/16“).',
        'Mit Zehnerpotenzen rechnen statt mit langen Zahlen.'
      ]
    },
    {
      id: 'fig', name: 'Figuren lernen', short: 'FL', part: 'Nachmittag',
      items: 20, scored: 20, learnTime: 4 * 60, time: 5 * 60, memory: true,
      measures: 'Merkfähigkeit für grafisches Material.',
      instruction: 'Sie sehen 20 Figuren, die jeweils in fünf Felder unterteilt sind; eines davon ist geschwärzt. Prägen Sie sich die Lage der schwarzen Fläche ein. Später werden die Figuren in anderer Reihenfolge ohne Schwärzung gezeigt – geben Sie an, welches Feld schwarz war. Notizen sind nicht erlaubt.',
      tips: [
        'Geben Sie jeder Figur einen Namen oder eine Assoziation (Tier, Gegenstand, Land) und verknüpfen Sie die schwarze Fläche damit („der Hund mit dem schwarzen Ohr“).',
        'Merken Sie sich primär die Gesamtform – die Abfrage erfolgt in veränderter Reihenfolge.',
        'Nutzen Sie die ganze Einprägezeit und wiederholen Sie die Figuren in einem zweiten Durchgang.'
      ]
    },
    {
      id: 'fak', name: 'Fakten lernen', short: 'FaL', part: 'Nachmittag',
      items: 20, scored: 20, learnTime: 6 * 60, time: 7 * 60, memory: true,
      measures: 'Merkfähigkeit für verbales Material.',
      instruction: '15 Personen werden mit Name, Altersgruppe, Beruf (und damit Geschlecht), einem weiteren Merkmal und einer Diagnose vorgestellt. Einige Eigenschaften kommen doppelt vor. Später werden 20 Fragen zu Details gestellt. Notizen sind nicht erlaubt.',
      tips: [
        'Bilden Sie zu jeder Person eine kleine Geschichte, die Name, Beruf, Merkmal und Diagnose verbindet.',
        'Achten Sie besonders auf Doppelungen und darauf, wodurch sich die Personen unterscheiden.',
        'Das Geschlecht ergibt sich aus der Berufsbezeichnung – es wird häufig abgefragt.',
        'Die Personen sind nach Altersgruppen geordnet – nutzen Sie diese Struktur.'
      ]
    },
    {
      id: 'tv', name: 'Textverständnis', short: 'TV', part: 'Nachmittag',
      items: 24, scored: 18, time: 60 * 60,
      measures: 'Verständnis lehrbuchartiger Texte und Ziehen von Schlussfolgerungen.',
      instruction: 'Vier Texte (je ca. eine Seite) mit medizinisch-naturwissenschaftlichen Themen, jeweils gefolgt von sechs Fragen, die sich ausschließlich auf den Inhalt des Textes beziehen.',
      tips: [
        'Zeit einteilen: ca. 15 Minuten pro Text inklusive Fragen.',
        'Beim Lesen strukturieren: Abläufe als Kette, Regelungen als Pfeilschema skizzieren.',
        'Achten Sie auf Signalwörter wie „nur“, „stets“, „nicht“, „ausschließlich“, „kann“.',
        'Prüfen Sie jede Aussage am Text – nicht am Vorwissen. Die Texte in dieser Trainingsseite beschreiben teils fiktive Systeme, damit Vorwissen nicht hilft.'
      ]
    },
    {
      id: 'dt', name: 'Diagramme und Tabellen', short: 'DT', part: 'Nachmittag',
      items: 24, scored: 20, time: 60 * 60,
      measures: 'Informationen aus Diagrammen und Tabellen erschließen.',
      instruction: 'Jede Aufgabe präsentiert ein Diagramm oder eine Tabelle mit einer Frage. Wählen Sie die richtige Antwort aus. Ziehen Sie ausschließlich die dargebotenen Informationen heran.',
      tips: [
        'Erst Achsen, Einheiten, Legende und Überschrift lesen – dann die Aussagen.',
        'Bei „nicht ableitbar“: Achten Sie auf Aussagen, die zwar plausibel klingen, aber mit den Daten nicht belegbar sind (z. B. Ursachen, absolute Zahlen aus Prozentanteilen).',
        'Wörter wie „stets“, „mehr als doppelt so“ und „kontinuierlich“ genau prüfen.',
        'Grobe Schätzungen genügen meist – nicht exakt ablesen, wenn es nicht nötig ist.'
      ]
    }
  ];

  const byId = {};
  SUBTESTS.forEach(s => { byId[s.id] = s; });

  // Ablauf am Testtag (laut Broschüre): Vormittag MZ, MNG, SF, QFP – Mittagspause –
  // Einprägen Figuren, Einprägen Fakten, Textverständnis, Reproduktion Figuren, Reproduktion Fakten, Diagramme und Tabellen
  const FULL_ORDER = [
    { type: 'test', sub: 'mz' },
    { type: 'test', sub: 'mng' },
    { type: 'test', sub: 'sf' },
    { type: 'test', sub: 'qfp' },
    { type: 'pause' },
    { type: 'learn', sub: 'fig' },
    { type: 'learn', sub: 'fak' },
    { type: 'test', sub: 'tv' },
    { type: 'recall', sub: 'fig' },
    { type: 'recall', sub: 'fak' },
    { type: 'test', sub: 'dt' }
  ];

  const SIMS_PER_SUBTEST = 15;
  const FULL_SIMS = 6;

  function seedFor(subId, simNo) { return `sim:${subId}:${simNo}`; }
  function fullSeedFor(fullNo, subId) { return `full:${fullNo}:${subId}`; }

  T.subtests = { SUBTESTS, byId, FULL_ORDER, SIMS_PER_SUBTEST, FULL_SIMS, seedFor, fullSeedFor };
})(window.TMS);
