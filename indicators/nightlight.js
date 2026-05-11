/* Panel Indicators GNOME Shell extension
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

import St from 'gi://St';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Slider from 'resource:///org/gnome/shell/ui/slider.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { CustomButton } from './button.js';

export var NightLightIndicator = GObject.registerClass({
    GTypeName: 'NightLightIndicator',
},
class NightLightIndicator extends CustomButton {

    _init() {
        super._init('NightLightIndicator');

        this._min = 4700;
        this._max = 1700;

        this.menu.actor.add_style_class_name('aggregate-menu');

        this._nightLight = Main.panel.statusArea.aggregateMenu._nightLight;
        this._nightLight.remove_actor(this._nightLight._indicator);
        this._nightLight.show();
        this._nightLight._sync = function() {};

        this.box.add_child(this._nightLight._indicator);

        this._label = new St.Label({ style_class: 'label-menu' });

        this._colorSettings = new Gio.Settings({
            schema_id: 'org.gnome.settings-daemon.plugins.color',
        });
        this._colorSettings.connect('changed::night-light-enabled', () => this._sync());

        let sliderItem = new PopupMenu.PopupBaseMenuItem({ activate: false });
        let sliderIcon = new St.Icon({
            icon_name: 'daytime-sunset-symbolic',
            style_class: 'popup-menu-icon',
        });
        sliderItem.actor.add(sliderIcon);

        this._slider = new Slider.Slider(0);
        this._slider.connect('notify::value', (s, value) => this._sliderChanged(s, value));
        this._slider.accessible_name = 'Temperature';

        this.menu.connect('open-state-changed', (menu, isOpen) => {
            if (isOpen)
                this._updateView();
        });

        sliderItem.actor.add(this._slider);

        this.menu.box.add_child(this._label);
        this.menu.addMenuItem(sliderItem);

        this._separator = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(this._separator);

        this._disableItem = new PopupMenu.PopupMenuItem(_('Resume'));
        this._disableItem.connect('activate', () => this._change());
        this.menu.addMenuItem(this._disableItem);

        this.turnItem = new PopupMenu.PopupMenuItem(_('Turn Off'));
        this.turnItem.connect('activate', () => this._toggleFeature());
        this.menu.addMenuItem(this.turnItem);

        let nightSettings = new PopupMenu.PopupMenuItem(_('Display Settings'));
        nightSettings.connect('activate', () => this._openApp('gnome-display-panel.desktop'));
        this.menu.addMenuItem(nightSettings);

        this._properties_changed = this._nightLight._proxy.connect(
            'g-properties-changed', () => this._sync()
        );

        Main.sessionMode.connect('updated', () => this._sync());

        this._sync();
        this._updateView();
    }

    _sliderChanged(slider, value) {
        const temperature = parseInt(this._slider.value * (this._max - this._min)) + this._min;
        this._colorSettings.set_uint('night-light-temperature', temperature);
    }

    _updateView() {
        const temperature = this._colorSettings.get_uint('night-light-temperature');
        const value = (temperature - this._min) / (this._max - this._min);
        this._slider.value = value;
    }

    _change() {
        this._nightLight._proxy.DisabledUntilTomorrow = !this._nightLight._proxy.DisabledUntilTomorrow;
        this._sync();
    }

    _toggleFeature() {
        let enabled = this._colorSettings.get_boolean('night-light-enabled');
        this._colorSettings.set_boolean('night-light-enabled', !enabled);
        this._sync();
    }

    _sync() {
        let featureEnabled = this._colorSettings.get_boolean('night-light-enabled');
        this.turnItem.label.set_text(featureEnabled ? _('Turn Off') : _('Turn On'));
        let disabled = this._nightLight._proxy.DisabledUntilTomorrow || !this._nightLight._proxy.NightLightActive;
        this._label.set_text(disabled ? _('Night Light Disabled') : _('Night Light On'));
        this._disableItem.label.text = disabled ? _('Resume') : _('Disable Until Tomorrow');
        this._disableItem.actor.visible = featureEnabled;
        this.visible = true;
    }

    destroy() {
        this._nightLight._proxy.disconnect(this._properties_changed);
        try { this.box.remove_child(this._nightLight._indicator); } catch (_) {}
        this._nightLight.hide();
        this._nightLight.add_actor(this._nightLight._indicator);
        super.destroy();
    }
});
