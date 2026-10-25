/*
 * Standard-Apps und Hintergruende.
 *
 * Die App-IDs sind die bekannten Samsung-IDs dieser Apps. Auf deinem TV
 * koennen sie anders lauten; nutze dann in den Einstellungen
 * "App hinzufuegen", dort stehen die echten IDs der installierten Apps.
 *
 * "__tv__" ist ein Sonderfall: beendet DulliSmartTV und zeigt wieder das
 * Fernsehbild.
 */
var DULLI_DEFAULT_APPS = [
    { id: '__tv__', name: 'Fernsehen', color: '#4a4f5a' },
    { id: '111299001912', name: 'YouTube', color: '#e62117' },
    { id: '11101200001', name: 'Netflix', color: '#b20710' },
    { id: '3201512006785', name: 'Prime Video', color: '#1a98ff' },
    { id: '3201901017640', name: 'Disney+', color: '#113ccf' },
    { id: '3201606009684', name: 'Spotify', color: '#1db954' }
];

/* Farben fuer Apps, die ueber "App hinzufuegen" dazukommen. */
var DULLI_COLORS = [
    '#e53935', '#8e24aa', '#3949ab', '#039be5', '#00897b',
    '#7cb342', '#fdd835', '#fb8c00', '#6d4c41', '#546e7a'
];

/*
 * Hintergruende: Farbverlauf (stops, von oben links nach unten rechts)
 * oder eigenes Bild (image: 'img/datei.jpg', Bild in app/img/ ablegen).
 * light: true schaltet auf dunkle Schrift.
 */
var DULLI_BACKGROUNDS = [
    { name: 'Abendrot', stops: '#2b1055 0%, #b8336a 55%, #f39c5a 100%' },
    { name: 'Ozean', stops: '#0f2027 0%, #203a43 45%, #2c7a8c 100%' },
    { name: 'Wald', stops: '#0b1f14 0%, #1f4a2e 50%, #5f8f4e 100%' },
    { name: 'Nacht', stops: '#05060a 0%, #141a33 60%, #2a2f5c 100%' },
    { name: 'Schiefer', stops: '#1c1f24 0%, #2f343c 50%, #4b525c 100%' },
    { name: 'Schwarz', stops: '#000 0%, #000 100%' },
    { name: 'Sand', stops: '#f6efe3 0%, #e8d8bd 60%, #d4b98f 100%', light: true },
    { name: 'Nebel', stops: '#f4f6f8 0%, #dde3ea 60%, #c3ccd6 100%', light: true },
    { name: 'Pfirsich', stops: '#fff1eb 0%, #f7d6c7 55%, #e9b1a0 100%', light: true }
];
