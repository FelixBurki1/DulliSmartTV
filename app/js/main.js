/*
 * DulliSmartTV: Startbildschirm mit Uhr und App-Kacheln, bedienbar mit der
 * Fernbedienung. ES5, damit es im Browser von Tizen 2.4 laeuft.
 */
(function () {
    'use strict';

    var VERSION = '0.1.0';
    var STORE_KEY = 'dulli.settings.v1';
    var SETTINGS_TILE = { id: '__settings__', name: 'Einstellungen', color: '#30343c', badge: '⚙' };

    var DOCK_STEP = 268;    // Kachelbreite + Abstand
    var DOCK_VISIBLE = 6;
    var LIST_STEP = 112;    // Zeilenhoehe + Abstand
    var LIST_VISIBLE = 5;
    var PANEL_VISIBLE = 8;

    var WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    var MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
        'August', 'September', 'Oktober', 'November', 'Dezember'];

    var settings = loadSettings();

    // 'home' oder eines der Menues: 'settings', 'edit', 'picker'
    var view = 'home';
    var homeIndex = 0;
    var tileEls = [];

    var menu = { rows: [], index: 0, col: 0, start: 0, moving: false };
    var confirmReset = false;
    var installed = null;       // null = noch nicht geladen
    var installedError = null;
    var toastTimer = null;

    function $(id) {
        return document.getElementById(id);
    }

    function esc(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function copyApps(apps) {
        var out = [];
        for (var i = 0; i < apps.length; i++) {
            out.push({ id: apps[i].id, name: apps[i].name, color: apps[i].color });
        }
        return out;
    }

    function defaultSettings() {
        return { layout: 'dock', bg: 0, apps: copyApps(DULLI_DEFAULT_APPS) };
    }

    // ---------- Speichern ----------

    function loadSettings() {
        var result = defaultSettings();
        var raw = null;
        try {
            raw = window.localStorage.getItem(STORE_KEY);
        } catch (e) {
            raw = null;
        }
        if (!raw) {
            return result;
        }
        try {
            var saved = JSON.parse(raw);
            if (saved.layout === 'dock' || saved.layout === 'list') {
                result.layout = saved.layout;
            }
            if (typeof saved.bg === 'number' && saved.bg >= 0 && saved.bg < DULLI_BACKGROUNDS.length) {
                result.bg = saved.bg;
            }
            if (saved.apps && saved.apps.length !== undefined) {
                var apps = [];
                for (var i = 0; i < saved.apps.length; i++) {
                    var a = saved.apps[i];
                    if (a && a.id && a.name) {
                        apps.push({ id: String(a.id), name: String(a.name), color: a.color || colorFor(a.id) });
                    }
                }
                result.apps = apps;
            }
        } catch (e) {
            // kaputte Daten: Standard nehmen
        }
        return result;
    }

    function saveSettings() {
        try {
            window.localStorage.setItem(STORE_KEY, JSON.stringify(settings));
        } catch (e) {
            toast('Einstellungen konnten nicht gespeichert werden');
        }
    }

    function colorFor(id) {
        var hash = 0;
        for (var i = 0; i < id.length; i++) {
            hash = (hash * 31 + id.charCodeAt(i)) % 1000;
        }
        return DULLI_COLORS[hash % DULLI_COLORS.length];
    }

    // ---------- Hintergrund und Uhr ----------

    function applyBackground() {
        var bg = DULLI_BACKGROUNDS[settings.bg];
        var el = $('bg');
        el.style.backgroundImage = '';
        if (bg.image) {
            el.style.backgroundImage = 'url("' + bg.image + '")';
        } else {
            // Erst die alte WebKit-Schreibweise, dann die heutige; was der
            // Browser nicht versteht, ignoriert er.
            el.style.backgroundImage = '-webkit-linear-gradient(top left, ' + bg.stops + ')';
            el.style.backgroundImage = 'linear-gradient(to bottom right, ' + bg.stops + ')';
        }
        $('stage').className = bg.light ? 'light' : '';
    }

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function updateClock() {
        var now = new Date();
        $('time').innerHTML = pad(now.getHours()) + ':' + pad(now.getMinutes());
        $('date').innerHTML = WEEKDAYS[now.getDay()] + ', ' + now.getDate() + '. ' + MONTHS[now.getMonth()];
    }

    // ---------- Startbildschirm ----------

    function homeTiles() {
        return settings.apps.concat([SETTINGS_TILE]);
    }

    function renderHome() {
        var tiles = homeTiles();
        var html = '';
        for (var i = 0; i < tiles.length; i++) {
            var t = tiles[i];
            var badge = t.badge || t.name.charAt(0).toUpperCase();
            html += '<div class="tile">' +
                '<div class="badge" style="background:' + esc(t.color) + '">' + esc(badge) + '</div>' +
                '<div class="label">' + esc(t.name) + '</div>' +
                '</div>';
        }
        $('tiles').className = settings.layout;
        $('tiles-inner').innerHTML = html;
        tileEls = $('tiles-inner').children;
        if (homeIndex >= tiles.length) {
            homeIndex = tiles.length - 1;
        }
        focusTile(homeIndex);
    }

    function focusTile(index) {
        if (tileEls[homeIndex]) {
            tileEls[homeIndex].className = 'tile';
        }
        homeIndex = index;
        tileEls[homeIndex].className = 'tile focused';
        scrollTiles();
    }

    function scrollTiles() {
        var dock = settings.layout === 'dock';
        var visible = dock ? DOCK_VISIBLE : LIST_VISIBLE;
        var step = dock ? DOCK_STEP : LIST_STEP;
        var start = homeIndex - Math.floor(visible / 2);
        start = Math.max(0, Math.min(start, tileEls.length - visible));
        var offset = -start * step;
        var transform = dock ? 'translate(' + offset + 'px, 0)' : 'translate(0, ' + offset + 'px)';
        var inner = $('tiles-inner');
        inner.style.webkitTransform = transform;
        inner.style.transform = transform;
    }

    function homeKey(key) {
        var count = tileEls.length;
        var dock = settings.layout === 'dock';
        var prev = dock ? 'left' : 'up';
        var next = dock ? 'right' : 'down';

        if (key === prev && homeIndex > 0) {
            focusTile(homeIndex - 1);
        } else if (key === next && homeIndex < count - 1) {
            focusTile(homeIndex + 1);
        } else if (key === 'enter') {
            var tile = homeTiles()[homeIndex];
            if (tile.id === SETTINGS_TILE.id) {
                openMenu('settings');
            } else {
                Platform.launch(tile, toast);
            }
        } else if (key === 'blue' || key === 'info') {
            openMenu('settings');
        } else if (key === 'back') {
            if (!Platform.exitApp()) {
                toast('Vorschau: Zurück beendet auf dem TV die App');
            }
        }
    }

    // ---------- Menues ----------
    //
    // Eine Zeile: { label, value, buttons, disabled, left(), right(), enter(col) }

    function openMenu(name) {
        view = name;
        menu.index = 0;
        menu.col = 0;
        menu.start = 0;
        menu.moving = false;
        confirmReset = false;
        $('panel').className = '';
        if (name === 'picker' && installed === null) {
            loadInstalled();
        }
        renderMenu();
    }

    function closeMenu() {
        view = 'home';
        $('panel').className = 'hidden';
        renderHome();
    }

    function settingsRows() {
        var bg = DULLI_BACKGROUNDS[settings.bg];
        return [
            {
                label: 'Anordnung',
                value: '‹ ' + (settings.layout === 'dock' ? 'Dock' : 'Liste') + ' ›',
                left: toggleLayout, right: toggleLayout, enter: toggleLayout
            },
            {
                label: 'Hintergrund',
                value: '‹ ' + bg.name + ' ›',
                left: function () { cycleBackground(-1); },
                right: function () { cycleBackground(1); },
                enter: function () { cycleBackground(1); }
            },
            {
                label: 'Apps sortieren und entfernen',
                value: settings.apps.length + ' ›',
                enter: function () { openMenu('edit'); }
            },
            {
                label: 'App hinzufügen',
                value: '›',
                enter: function () { openMenu('picker'); }
            },
            {
                label: confirmReset ? 'Wirklich zurücksetzen? Nochmal OK' : 'Auf Standard zurücksetzen',
                enter: resetSettings
            },
            {
                label: 'Version ' + VERSION,
                value: Platform.describe(),
                disabled: true
            }
        ];
    }

    function editRows() {
        if (settings.apps.length === 0) {
            return [{ label: 'Keine Apps. Füge welche hinzu.', disabled: true }];
        }
        var rows = [];
        for (var i = 0; i < settings.apps.length; i++) {
            rows.push({
                label: settings.apps[i].name,
                buttons: ['Verschieben', 'Entfernen'],
                enter: editEnter
            });
        }
        return rows;
    }

    function pickerRows() {
        if (installedError) {
            return [{ label: 'Apps konnten nicht gelesen werden:', disabled: true },
                { label: installedError, disabled: true }];
        }
        if (installed === null) {
            return [{ label: 'Lese installierte Apps…', disabled: true }];
        }
        var choices = [{ id: '__tv__', name: 'Fernsehen (zurück zum TV-Bild)' }].concat(installed);
        var rows = [];
        for (var i = 0; i < choices.length; i++) {
            rows.push(pickerRow(choices[i]));
        }
        return rows;
    }

    function pickerRow(app) {
        var onHome = indexOfApp(app.id) >= 0;
        return {
            label: app.name,
            value: onHome ? '✓ auf dem Startbildschirm' : '',
            enter: function () { togglePicked(app); }
        };
    }

    function buildRows() {
        if (view === 'settings') {
            return settingsRows();
        }
        if (view === 'edit') {
            return editRows();
        }
        return pickerRows();
    }

    function renderMenu() {
        var titles = { settings: 'Einstellungen', edit: 'Apps sortieren', picker: 'App hinzufügen' };
        var hints = {
            settings: '← → ändern · OK auswählen · Zurück schließen',
            edit: menu.moving ? '↑ ↓ verschieben · OK fertig' :
                '← → Aktion wählen · OK ausführen · Zurück',
            picker: 'OK hinzufügen oder entfernen · Zurück'
        };
        menu.rows = buildRows();
        if (menu.index >= menu.rows.length) {
            menu.index = menu.rows.length - 1;
        }
        if (menu.index < menu.start) {
            menu.start = menu.index;
        }
        if (menu.index >= menu.start + PANEL_VISIBLE) {
            menu.start = menu.index - PANEL_VISIBLE + 1;
        }

        var html = '';
        if (menu.start > 0) {
            html += '<div class="more">↑ ' + menu.start + ' weitere</div>';
        }
        var end = Math.min(menu.rows.length, menu.start + PANEL_VISIBLE);
        for (var i = menu.start; i < end; i++) {
            html += rowHtml(menu.rows[i], i === menu.index);
        }
        if (end < menu.rows.length) {
            html += '<div class="more">↓ ' + (menu.rows.length - end) + ' weitere</div>';
        }
        $('panel-title').innerHTML = titles[view];
        $('panel-list').innerHTML = html;
        $('panel-hint').innerHTML = hints[view];
    }

    function rowHtml(row, focused) {
        var cls = 'row';
        if (focused) {
            cls += menu.moving ? ' moving' : ' focused';
        }
        if (row.disabled) {
            cls += ' disabled';
        }
        var html = '<div class="' + cls + '"><span class="name">' + esc(row.label) + '</span>';
        if (row.buttons) {
            html += '<span class="buttons">';
            for (var b = 0; b < row.buttons.length; b++) {
                var active = focused && !menu.moving && b === menu.col;
                html += '<span class="btn' + (active ? ' active' : '') + '">' + esc(row.buttons[b]) + '</span>';
            }
            html += '</span>';
        } else if (row.value) {
            html += '<span class="value">' + esc(row.value) + '</span>';
        }
        return html + '</div>';
    }

    function menuKey(key) {
        var row = menu.rows[menu.index];

        if (menu.moving) {
            if (key === 'up' && menu.index > 0) {
                swapApps(menu.index, menu.index - 1);
                menu.index--;
            } else if (key === 'down' && menu.index < settings.apps.length - 1) {
                swapApps(menu.index, menu.index + 1);
                menu.index++;
            } else if (key === 'enter' || key === 'back') {
                menu.moving = false;
                saveSettings();
            }
            renderMenu();
            return;
        }

        if (key === 'up' && menu.index > 0) {
            menu.index--;
            confirmReset = false;
        } else if (key === 'down' && menu.index < menu.rows.length - 1) {
            menu.index++;
            confirmReset = false;
        } else if (key === 'left') {
            if (row.buttons) {
                menu.col = Math.max(0, menu.col - 1);
            } else if (row.left) {
                row.left();
            }
        } else if (key === 'right') {
            if (row.buttons) {
                menu.col = Math.min(row.buttons.length - 1, menu.col + 1);
            } else if (row.right) {
                row.right();
            }
        } else if (key === 'enter') {
            if (row.enter && !row.disabled) {
                row.enter(menu.col);
            }
        } else if (key === 'back') {
            if (view === 'settings') {
                closeMenu();
            } else {
                var from = view;
                openMenu('settings');
                menu.index = from === 'edit' ? 2 : 3;
            }
        }
        if (view !== 'home') {
            renderMenu();
        }
    }

    // ---------- Aktionen ----------

    function toggleLayout() {
        settings.layout = settings.layout === 'dock' ? 'list' : 'dock';
        saveSettings();
        renderHome();
    }

    function cycleBackground(step) {
        var n = DULLI_BACKGROUNDS.length;
        settings.bg = (settings.bg + step + n) % n;
        saveSettings();
        applyBackground();
    }

    function resetSettings() {
        if (!confirmReset) {
            confirmReset = true;
            return;
        }
        confirmReset = false;
        settings = defaultSettings();
        saveSettings();
        applyBackground();
        renderHome();
        toast('Auf Standard zurückgesetzt');
    }

    function editEnter(col) {
        if (col === 0) {
            menu.moving = true;
        } else {
            var removed = settings.apps.splice(menu.index, 1)[0];
            saveSettings();
            toast(removed.name + ' entfernt');
        }
    }

    function swapApps(a, b) {
        var tmp = settings.apps[a];
        settings.apps[a] = settings.apps[b];
        settings.apps[b] = tmp;
    }

    function indexOfApp(id) {
        for (var i = 0; i < settings.apps.length; i++) {
            if (settings.apps[i].id === id) {
                return i;
            }
        }
        return -1;
    }

    function togglePicked(app) {
        var index = indexOfApp(app.id);
        if (index >= 0) {
            settings.apps.splice(index, 1);
            toast(app.name + ' entfernt');
        } else {
            var name = app.id === '__tv__' ? 'Fernsehen' : app.name;
            settings.apps.push({ id: app.id, name: name, color: colorFor(app.id) });
            toast(name + ' hinzugefügt');
        }
        saveSettings();
    }

    function loadInstalled() {
        installedError = null;
        Platform.listInstalled(function (err, list) {
            if (err) {
                installedError = err;
            } else {
                installed = list;
            }
            if (view === 'picker') {
                renderMenu();
            }
        });
    }

    // ---------- Hinweis ----------

    function toast(text) {
        var el = $('toast');
        el.innerHTML = esc(text);
        el.className = '';
        if (toastTimer) {
            clearTimeout(toastTimer);
        }
        toastTimer = setTimeout(function () {
            el.className = 'hidden';
        }, 3500);
    }

    // ---------- Start ----------

    function fitStage() {
        // Auf dem TV ist das Fenster 1920 breit; in der Vorschau skalieren.
        var scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        if (Math.abs(scale - 1) < 0.01) {
            scale = 1;
        }
        var stage = $('stage');
        stage.style.webkitTransform = 'scale(' + scale + ')';
        stage.style.transform = 'scale(' + scale + ')';
    }

    function onKey(event) {
        var key = Platform.keyName(event);
        if (!key) {
            return;
        }
        event.preventDefault();
        if (view === 'home') {
            homeKey(key);
        } else {
            menuKey(key);
        }
    }

    function init() {
        Platform.registerKeys();
        fitStage();
        window.addEventListener('resize', fitStage);
        document.addEventListener('keydown', onKey);
        applyBackground();
        renderHome();
        updateClock();
        setInterval(updateClock, 10000);
    }

    init();
})();
