/* Panel indicators GNOME Shell extension
 *
 * Copyright (C) 2019 Leandro Vital <leavitals@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { MenuItems } from './menuItems.js';
import { CalendarIndicator } from './indicators/calendar.js';
import { NetworkIndicator } from './indicators/network.js';
import { BluetoothIndicator } from './indicators/bluetooth.js';
import { NightLightIndicator } from './indicators/nightlight.js';
import { LightIndicator } from './indicators/light.js';
import { NotificationIndicator } from './indicators/notification.js';
import { PowerIndicator } from './indicators/power.js';
import { UserIndicator } from './indicators/system.js';
import { VolumeIndicator } from './indicators/volume.js';

export default class PanelIndicatorsExtension extends Extension {

    enable() {
        this._settings = this.getSettings();
        this._menuItems = new MenuItems(this._settings);
        this._indicators = null;
        this._settingsChanged = [];

        // Indikatoren instanziieren
        this._network      = new NetworkIndicator();
        this._bluetooth    = new BluetoothIndicator();
        this._volume       = new VolumeIndicator();
        this._power        = new PowerIndicator();
        this._calendar     = new CalendarIndicator();
        this._notification = new NotificationIndicator();
        this._user         = new UserIndicator();
        this._nightlight   = new NightLightIndicator();
        this._light        = new LightIndicator();

        // Originale GNOME-Indikatoren ausblenden
        Main.panel.statusArea.aggregateMenu.hide();
        Main.panel.statusArea.dateMenu.hide();
        Main.panel._centerBox.remove_child(
            Main.panel.statusArea.dateMenu.container
        );

        // Indikatoren in die Panel-Statusarea eintragen
        const addTo = (indicator) => {
            if (indicator)
                Main.panel.addToStatusArea(indicator.name, indicator, 0, 'right');
        };
        addTo(this._notification);
        addTo(this._user);
        addTo(this._calendar);
        addTo(this._power);
        addTo(this._network);
        addTo(this._bluetooth);
        addTo(this._volume);
        addTo(this._nightlight);
        addTo(this._light);

        // Settings-Listener
        let i = 0;
        this._settingsChanged[i++] = this._settings.connect('changed::items',                           () => this._applySettings());
        this._settingsChanged[i++] = this._settings.connect('changed::spacing',                         () => this._applySettings());
        this._settingsChanged[i++] = this._settings.connect('changed::user-icon',                       () => this._changeUsericon());
        this._settingsChanged[i++] = this._settings.connect('changed::date-format',                     () => this._changeDateformat());
        this._settingsChanged[i++] = this._settings.connect('changed::activate-spacing',                () => this._applySettings());
        this._settingsChanged[i++] = this._settings.connect('changed::separate-date-and-notification',  () => this._applySettings());

        this._applySettings();
        this._changeUsername();
        this._changeUsericon();
        this._changeDateformat();
    }

    disable() {
        // Settings-Listener trennen
        this._settingsChanged.forEach(id => this._settings.disconnect(id));
        this._settingsChanged = null;
        this._settings = null;

        // Indikatoren aufräumen
        this._light.destroy();
        this._nightlight.destroy();
        this._volume.destroy();
        this._power.destroy();
        this._network.destroy();
        this._bluetooth.destroy();
        this._user.destroy();
        this._notification.destroy();
        this._calendar.destroy();

        this._light        = null;
        this._nightlight   = null;
        this._volume       = null;
        this._power        = null;
        this._network      = null;
        this._bluetooth    = null;
        this._user         = null;
        this._notification = null;
        this._calendar     = null;
        this._menuItems    = null;
        this._indicators   = null;

        // Originale GNOME-Indikatoren wiederherstellen
        Main.panel.statusArea.aggregateMenu.container.show();
        Main.panel.statusArea.dateMenu.container.show();
        Main.panel._centerBox.add_child(
            Main.panel.statusArea.dateMenu.container
        );
    }

    _changeUsername() {
        this._user.changeLabel('');
    }

    _changeUsericon() {
        const enableUserIcon = this._settings.get_boolean('user-icon');
        this._user.changeIcon(enableUserIcon);
    }

    _changeDateformat() {
        const dateformat = this._settings.get_string('date-format');
        this._calendar.override(dateformat);
    }

    _applySettings() {
        const CENTER_BOX = Main.panel._centerBox;
        const RIGHT_BOX  = Main.panel._rightBox;

        const enabled = this._menuItems.getEnableItems();
        const center  = this._menuItems.getCenterItems();
        this._indicators = new Array(enabled.length);

        this._removeAll();

        this._setup(enabled, center, 'power',        this._power);
        this._setup(enabled, center, 'user',         this._user);
        this._setup(enabled, center, 'volume',       this._volume);
        this._setup(enabled, center, 'network',      this._network);
        this._setup(enabled, center, 'bluetooth',    this._bluetooth);
        this._setup(enabled, center, 'calendar',     this._calendar);
        this._setup(enabled, center, 'notification', this._notification);
        this._setup(enabled, center, 'nightlight',   this._nightlight);
        this._setup(enabled, center, 'light',        this._light);

        const rightchildren  = RIGHT_BOX.get_children().length;
        const centerchildren = CENTER_BOX.get_children().length;

        let spacing = this._settings.get_int('spacing');
        if (!this._settings.get_boolean('activate-spacing'))
            spacing = -1;

        this._indicators.reverse().forEach(item => {
            item.set_spacing(spacing);
            if (item._center)
                CENTER_BOX.insert_child_at_index(item.container, centerchildren);
            else
                RIGHT_BOX.insert_child_at_index(item.container, rightchildren);
        });
    }

    _setup(enabledItems, centerItems, name, indicator) {
        if (!indicator) return;
        const index = enabledItems.indexOf(name);
        if (index !== -1) {
            this._indicators[index] = indicator;
            this._indicators[index]._center = centerItems.indexOf(name) !== -1;
        }
    }

    _removeAll() {
        [
            this._light,
            this._nightlight,
            this._volume,
            this._network,
            this._bluetooth,
            this._power,
            this._calendar,
            this._user,
            this._notification,
        ].forEach(item => this._removeContainer(item));
    }

    _removeContainer(item) {
        if (!item) return;
        const box = item._center ? Main.panel._centerBox : Main.panel._rightBox;
        try {
            box.remove_child(item.container);
        } catch (_) {
            // Container war nicht in dieser Box — ignorieren
        }
        item._center = false;
    }
}
