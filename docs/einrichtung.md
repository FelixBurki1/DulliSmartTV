# DulliSmartTV auf den Fernseher bringen

Geschrieben für den Samsung **UE55KU6659** (2016, Tizen 2.4). Andere
Samsung-TVs ab 2016 sollten ähnlich funktionieren.

Einmalig dauert das etwa eine Stunde. Danach reicht ein Befehl pro Update.

## 1. Was du brauchst

- Windows-PC im **selben Netzwerk** wie der Fernseher
- Ein **Samsung-Konto** (für das Zertifikat)
- Die **IP-Adresse des Fernsehers**: Einstellungen → Allgemein → Netzwerk →
  Netzwerkstatus → IP-Einst.
- Die **IP-Adresse des PCs**: in PowerShell `ipconfig` ausführen, Zeile
  „IPv4-Adresse“

## 2. Entwicklermodus am Fernseher einschalten

1. Auf der Fernbedienung **Smart Hub** (Haus-Taste) drücken und zu **Apps**
   gehen.
2. Auf der Apps-Seite nacheinander **1 2 3 4 5** eingeben. Bei der
   Smart Control ohne Zifferntasten: über die Taste mit den Ziffern
   („123“) die Bildschirm-Zifferntastatur öffnen.
3. Im Fenster **Developer mode** auf **On** stellen und die **IP des PCs**
   eintragen, dann **OK**.
4. Den Fernseher **ganz ausschalten**: Netzstecker ziehen oder Power-Taste
   gedrückt halten, bis er neu startet. Normales Ausschalten reicht nicht.
5. Danach steht oben auf der Apps-Seite „Developer Mode“.

## 3. Tizen Studio installieren

1. Tizen Studio (mit IDE) von
   <https://developer.tizen.org/development/tizen-studio/download>
   herunterladen und nach `C:\tizen-studio` installieren. Es bringt ein
   eigenes Java mit.
2. Den **Package Manager** öffnen:
   - Reiter **Main SDK**: „Tizen SDK tools“ installieren.
   - Reiter **Extension SDK**: **TV Extensions** und **Samsung Certificate
     Extension** installieren. Wenn es eine **TV Extensions-2.4** gibt, die
     auch, sonst die älteste angebotene.

## 4. Fernseher verbinden

PowerShell im Ordner `DulliSmartTV` öffnen:

```powershell
.\tools\tv.ps1 -Aktion verbinden -TvIp 192.168.178.50
```

(IP durch die deines Fernsehers ersetzen.) Unter „List of devices“ muss der
Fernseher erscheinen. Wenn nicht: Entwicklermodus prüfen, Fernseher noch
einmal ganz neu starten, PC-Firewall prüfen (Port 26101).

Beim ersten Mal muss PowerShell eventuell Skripte erlauben:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## 5. Samsung-Zertifikat erstellen

Samsung-Fernseher installieren nur Apps mit einem Samsung-Zertifikat, das an
genau diesen Fernseher (seine DUID) gebunden ist.

1. Tizen Studio starten → **Tools → Certificate Manager**.
2. **+** → **Samsung** → **TV** → Profilname **`DulliTV`**.
3. **Author-Zertifikat** neu erstellen (Name und Passwort ausdenken und
   merken), dann mit dem **Samsung-Konto anmelden**.
4. **Distributor-Zertifikat**: Privilege „Public“. Bei den Geräten muss die
   **DUID des Fernsehers** stehen. Ist er per sdb verbunden (Schritt 4),
   trägt Tizen Studio sie selbst ein.
5. Fertigstellen.

Der Profilname muss zu `-Profil` im Skript passen (Standard: `DulliTV`).

## 6. Bauen, installieren, starten

```powershell
.\tools\tv.ps1 -TvIp 192.168.178.50
```

Das Skript verbindet sich, baut und signiert `DulliSmartTV.wgt`,
installiert es und startet die App. Danach liegt **DulliSmartTV** in der
Apps-Liste des Fernsehers. Nach Code-Änderungen einfach erneut ausführen.

## Bedienung

| Taste | Startbildschirm | Einstellungen |
|---|---|---|
| ← → (Dock) / ↑ ↓ (Liste) | Kachel wählen | Zeile wählen, Wert ändern |
| OK | App starten | Auswählen |
| Zurück | App beenden, zurück zum TV | Eine Ebene zurück |
| Blau oder Info | Einstellungen öffnen | |

## Wenn etwas nicht klappt

- **„Installation fehlgeschlagen“ / Zertifikatsfehler**: Fast immer fehlt die
  DUID im Distributor-Zertifikat oder es wurde ein Tizen-Zertifikat statt eines
  Samsung-Zertifikats gewählt. Zertifikat neu anlegen, solange der TV verbunden
  ist.
- **Eine App startet nicht** („… ließ sich nicht starten“): Die App-ID in
  `app/js/data.js` stimmt für deinen Fernseher nicht. Die Kachel entfernen und
  über Einstellungen → **App hinzufügen** neu hinzufügen. Dort stehen die
  echten IDs.
- **„App hinzufügen“ zeigt einen Fehler**: Diese Firmware erlaubt das Auslesen
  der installierten Apps nicht. Dann die IDs in `app/js/data.js` von Hand
  eintragen.
- **Fehlersuche**: In Tizen Studio das Projekt `app` importieren und mit
  „Debug As → Tizen Web Application“ starten. Dann gibt es die
  Entwicklerwerkzeuge mit Konsole.

## Was nicht geht

DulliSmartTV kann **nicht** den Samsung-Startbildschirm (Smart Hub)
ersetzen oder beim Einschalten automatisch starten. Auf Tizen 2.4 haben
normale Apps dafür keine Berechtigung. Öffne sie über die Apps-Liste; danach
steht sie auch in der Leiste unter „Zuletzt verwendet“.
