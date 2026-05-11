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
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { CustomButton } from './button.js';

export var LightIndicator = GObject.registerClass({
    GTypeName: 'LightIndicator',
},
class LightIndicator extends CustomButton {

    _init() {
        super._init('LightIndicator');
        this.menu.actor.add_style_class_name('aggregate-menu');

        this._brightness = Main.panel.statusArea.aggregateMenu._brightness;
        this._brightnessIcon = new St.Icon({
            icon_name: 'display-brightness-symbolic',
            style_class: 'system-status-icon',
        });
        this.box.add_child(this._brightnessIcon);

        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._brightness.menu.actor);
        this.menu.box.add_actor(this._brightness.menu.actor);

        this._separator = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(this._separator);
    }

    destroy() {
        try { this.box.remove_child(this._brightnessIcon); } catch (_) {}
        try { this.menu.box.remove_actor(this._brightness.menu.actor); } catch (_) {}
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._brightness.menu.actor);
        super.destroy();
    }
});
