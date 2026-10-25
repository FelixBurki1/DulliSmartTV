# DulliSmartTV

Ein schlichter Startbildschirm für ältere Samsung-Fernseher mit Tizen 2.4
(z. B. UE55KU6659 aus 2016): große Uhr, Datum und App-Kacheln, ganz mit der
Fernbedienung bedienbar.

Die Idee stammt von [CleanFrame](https://github.com/nthnclrk/CleanFrame), das
für neue The-Frame-TVs gebaut ist. DulliSmartTV ist eine eigene, schlanke
Umsetzung für die alte Tizen-Version.

## Funktionen

- Uhr und Datum (deutsch)
- App-Kacheln als **Dock** (Reihe unten) oder **Liste**
- 9 Hintergründe (Farbverläufe, hell und dunkel), eigene Bilder möglich
- Apps hinzufügen (aus den installierten Apps), sortieren, entfernen
- Kachel **Fernsehen**: zurück zum TV-Bild
- Alles wird auf dem Fernseher gespeichert

Bewusst schlank: ES5-JavaScript, kein Framework, keine Bibliotheken,
animiert werden nur `transform`, damit die alte Hardware flüssig bleibt.

## Vorschau im Browser

Doppelklick auf `vorschau.bat` (braucht Python), dann öffnet sich
<http://localhost:8080>. Bedienung mit Pfeiltasten, Enter und Esc (Zurück),
`i` öffnet die Einstellungen. Apps starten in der Vorschau nicht, es gibt nur
einen Hinweis.

## Auf den Fernseher

Siehe [docs/einrichtung.md](docs/einrichtung.md): Entwicklermodus, Tizen
Studio, Samsung-Zertifikat und dann:

```powershell
.\tools\tv.ps1 -TvIp <IP des Fernsehers>
```

## Aufbau

```
app/              die TV-App (wird als .wgt verpackt)
  config.xml      Tizen-Manifest (App-ID DulliTV001.DulliSmartTV)
  index.html
  css/style.css
  js/data.js      Standard-Apps, Farben, Hintergründe
  js/platform.js  Zugriff auf den TV (App starten, Apps auflisten, Tasten)
  js/main.js      Oberfläche und Bedienung
tools/tv.ps1      bauen, signieren, installieren, starten
tools/make_icon.py erzeugt app/icon.png
docs/             Einrichtungsanleitung
```

## Grenzen

- Ersetzt **nicht** den Samsung-Startbildschirm und startet nicht automatisch
  (auf Tizen 2.4 nicht möglich). Die App wird über die Apps-Liste geöffnet.
- Die vorbelegten App-IDs (YouTube, Netflix, …) sind die üblichen
  Samsung-IDs. Ob sie auf deinem Gerät stimmen, zeigt sich erst am Fernseher.
  Notfalls über „App hinzufügen“ neu wählen.
- Noch nicht auf echter Hardware getestet.
