/*
 * Alles, was mit dem TV selbst spricht. Ohne Tizen (Browser-Vorschau)
 * gibt es harmlose Ersatzfunktionen.
 */
var Platform = (function () {
    'use strict';

    var hasTizen = typeof window.tizen !== 'undefined' && !!window.tizen.application;

    var KEYCODES = {
        37: 'left', 38: 'up', 39: 'right', 40: 'down',
        13: 'enter',
        10009: 'back', 8: 'back', 27: 'back',
        403: 'red', 404: 'green', 405: 'yellow', 406: 'blue',
        457: 'info', 73: 'info'
    };

    var PREVIEW_APPS = [
        { id: '111299001912', name: 'YouTube' },
        { id: '11101200001', name: 'Netflix' },
        { id: '3201512006785', name: 'Prime Video' },
        { id: '3201606009684', name: 'Spotify' },
        { id: '3201512006963', name: 'Plex' },
        { id: 'org.tizen.browser', name: 'Internet' },
        { id: 'com.example.mediathek', name: 'Mediathek (Beispiel)' }
    ];

    function registerKeys() {
        if (!hasTizen || !window.tizen.tvinputdevice) {
            return;
        }
        var names = ['ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue', 'Info'];
        for (var i = 0; i < names.length; i++) {
            try {
                window.tizen.tvinputdevice.registerKey(names[i]);
            } catch (e) {
                // Taste gibt es auf diesem Modell nicht, egal.
            }
        }
    }

    function keyName(event) {
        return KEYCODES[event.keyCode] || null;
    }

    function ownAppId() {
        try {
            return window.tizen.application.getCurrentApplication().appInfo.id;
        } catch (e) {
            return null;
        }
    }

    function exitApp() {
        if (!hasTizen) {
            return false;
        }
        try {
            window.tizen.application.getCurrentApplication().exit();
        } catch (e) {
            return false;
        }
        return true;
    }

    function errorText(err) {
        if (!err) {
            return 'unbekannter Fehler';
        }
        return err.name || err.message || String(err);
    }

    // fail bekommt einen fertigen Text fuer den Hinweis.
    function launch(app, fail) {
        if (app.id === '__tv__') {
            if (!exitApp()) {
                fail('Vorschau: würde zum Fernsehbild wechseln');
            }
            return;
        }
        if (!hasTizen) {
            fail('Vorschau: würde "' + app.name + '" starten (' + app.id + ')');
            return;
        }
        try {
            window.tizen.application.launch(app.id, null, function (err) {
                fail(app.name + ' ließ sich nicht starten (' + errorText(err) + ')');
            });
        } catch (e) {
            fail(app.name + ' ließ sich nicht starten (' + errorText(e) + ')');
        }
    }

    // callback(fehlertext, liste) mit liste = [{id, name}], nach Name sortiert.
    function listInstalled(callback) {
        if (!hasTizen) {
            setTimeout(function () {
                callback(null, PREVIEW_APPS.slice(0));
            }, 300);
            return;
        }
        var self = ownAppId();
        try {
            window.tizen.application.getAppsInfo(function (infos) {
                var out = [];
                for (var i = 0; i < infos.length; i++) {
                    var info = infos[i];
                    if (info.show === false || info.id === self) {
                        continue;
                    }
                    out.push({ id: info.id, name: info.name || info.id });
                }
                out.sort(function (a, b) {
                    return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
                });
                callback(null, out);
            }, function (err) {
                callback(errorText(err), null);
            });
        } catch (e) {
            callback(errorText(e), null);
        }
    }

    function describe() {
        if (!hasTizen) {
            return 'Browser-Vorschau';
        }
        var version = '';
        try {
            version = window.tizen.systeminfo.getCapability('http://tizen.org/feature/platform.version');
        } catch (e) {
            version = '?';
        }
        return 'Tizen ' + version;
    }

    return {
        isTV: hasTizen,
        registerKeys: registerKeys,
        keyName: keyName,
        launch: launch,
        exitApp: exitApp,
        listInstalled: listInstalled,
        describe: describe
    };
})();
