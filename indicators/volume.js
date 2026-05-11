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

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { CustomButton } from './button.js';

export var VolumeIndicator = GObject.registerClass({
    GTypeName: 'VolumeIndicator',
},
class VolumeIndicator extends CustomButton {

    _init() {
        super._init('VolumeIndicator');
        this.menu.actor.add_style_class_name('aggregate-menu');

        this._volume = Main.panel.statusArea.aggregateMenu._volume;
        this._volume.remove_actor(this._volume._primaryIndicator);
        this.box.add_child(this._volume._primaryIndicator);

        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._volume.menu.actor);
        this.menu.box.add_actor(this._volume.menu.actor);

        this.connect('scroll-event', (actor, event) => this.onScroll(event));

        let settings = new PopupMenu.PopupMenuItem(_('Volume Settings'));
        settings.connect('activate', () => this._openApp('gnome-sound-panel.desktop'));

        this.menu.connect('open-state-changed', (menu, isPoppedUp) => {
            if (isPoppedUp) {
                let children = this._volume._volumeMenu._getMenuItems();
                for (let i = 0; i < children.length; i++)
                    children[i].show();
            }
        });
        this.menu.addMenuItem(settings);
    }

    onScroll(event) {
        let result = this._volume._volumeMenu.scroll(event);
        if (result === Clutter.EVENT_PROPAGATE || this._volume.menu.actor.mapped)
            return result;

        let gicon   = new Gio.ThemedIcon({ name: this._volume._volumeMenu.getOutputIcon() });
        let level   = this._volume._volumeMenu.getLevel();
        let maxLevel = this._volume._volumeMenu.getMaxLevel();
        Main.osdWindowManager.show(-1, gicon, null, level, maxLevel);
    }

    destroy() {
        try { this.box.remove_child(this._volume._primaryIndicator); } catch (_) {}
        try { this.menu.box.remove_actor(this._volume.menu.actor); } catch (_) {}
        this._volume.add_actor(this._volume._primaryIndicator);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._volume.menu.actor);
        super.destroy();
    }
});
