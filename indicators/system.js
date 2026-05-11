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

import AccountsService from 'gi://AccountsService';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import St from 'gi://St';
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { CustomButton } from './button.js';

const PANEL_ICON_SIZE = 16;

export var UserIndicator = GObject.registerClass({
    GTypeName: 'UserIndicator',
},
class UserIndicator extends CustomButton {

    _init() {
        super._init('UserIndicator');
        this.menu.actor.add_style_class_name('aggregate-menu');

        this._system    = Main.panel.statusArea.aggregateMenu._system;
        this._screencast = Main.panel.statusArea.aggregateMenu._screencast;

        let userManager = AccountsService.UserManager.get_default();
        this._user = userManager.get_user(GLib.get_user_name());

        this._nameLabel = new St.Label({
            text: this._user.get_real_name(),
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'panel-status-menu-box',
        });

        this._powerIcon = new St.Icon({
            icon_name: 'avatar-default-symbolic',
            style_class: 'system-status-icon',
        });

        if (this._screencast)
            this.box.add_child(this._screencast);
        this.box.add_child(this._powerIcon);
        this.box.add_child(this._nameLabel);

        this._createSubMenu();

        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._system.menu.actor);
    }

    _createSubMenu() {
        this._switchUserSubMenu = new PopupMenu.PopupSubMenuMenuItem('', true);
        this._switchUserSubMenu.icon.icon_name = 'avatar-default-symbolic';

        this.menu.connect('open-state-changed', (menu, isOpen) => {
            if (isOpen) {
                this._switchUserSubMenu.label.text = this._user.get_real_name();
                this._nameLabel.text = this._user.get_real_name();
            }
        });

        let logout = new PopupMenu.PopupMenuItem(_('Log Out'));
        logout.connect('activate', () => this._system._systemActions.activateLogout());
        if (!this._system._logoutItem.actor.visible)
            logout.actor.hide();
        this._switchUserSubMenu.menu.addMenuItem(logout);

        let account = new PopupMenu.PopupMenuItem(_('Account Settings'));
        account.connect('activate', () => this._openApp('gnome-user-accounts-panel.desktop'));
        this._switchUserSubMenu.menu.addMenuItem(account);

        this.menu.addMenuItem(this._switchUserSubMenu);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // System Settings
        let settings = new PopupMenu.PopupBaseMenuItem();
        settings.actor.add_actor(new St.Icon({
            icon_name: 'preferences-system-symbolic',
            style_class: 'system-status-icon',
            icon_size: PANEL_ICON_SIZE,
        }));
        settings.actor.add_actor(new St.Label({
            text: _('System Settings'),
            y_align: Clutter.ActorAlign.CENTER,
        }));
        settings.connect('activate', () => {
            if (!this._openApp('gnome-control-center.desktop'))
                this._openApp('org.gnome.Settings.desktop');
        });
        this.menu.addMenuItem(settings);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Lock
        let lock = new PopupMenu.PopupBaseMenuItem();
        lock.actor.add_actor(new St.Icon({
            icon_name: 'changes-prevent-symbolic',
            style_class: 'system-status-icon',
            icon_size: PANEL_ICON_SIZE,
        }));
        lock.actor.add_actor(new St.Label({
            text: _('Lock'),
            y_align: Clutter.ActorAlign.CENTER,
        }));
        lock.connect('activate', () => this._system._systemActions.activateLockScreen());
        this.menu.addMenuItem(lock);

        // Switch User
        let switchuser = new PopupMenu.PopupBaseMenuItem();
        switchuser.actor.add_actor(new St.Icon({
            icon_name: 'system-switch-user-symbolic',
            icon_size: PANEL_ICON_SIZE,
        }));
        switchuser.actor.add_actor(new St.Label({
            text: _('Switch User'),
            y_align: Clutter.ActorAlign.CENTER,
        }));
        switchuser.connect('activate', () => this._system._systemActions.activateSwitchUser());
        if (!this._system._loginScreenItem.actor.visible)
            switchuser.actor.hide();
        this.menu.addMenuItem(switchuser);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Orientation Lock
        let orientation = new PopupMenu.PopupBaseMenuItem();
        orientation.actor.add_actor(new St.Icon({
            icon_name: 'rotation-locked-symbolic',
            icon_size: PANEL_ICON_SIZE,
        }));
        orientation.actor.add_actor(new St.Label({
            text: _('Orientation Lock'),
            y_align: Clutter.ActorAlign.CENTER,
        }));
        orientation.connect('activate', () => this._system._systemActions.activateLockOrientation());
        this.menu.addMenuItem(orientation);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Suspend
        let suspend = new PopupMenu.PopupBaseMenuItem();
        suspend.actor.add_actor(new St.Icon({
            icon_name: 'media-playback-pause-symbolic',
            style_class: 'system-status-icon',
            icon_size: PANEL_ICON_SIZE,
        }));
        suspend.actor.add_actor(new St.Label({
            text: _('Suspend'),
            y_align: Clutter.ActorAlign.CENTER,
        }));
        suspend.connect('activate', () => this._system._systemActions.activateSuspend());
        this.menu.addMenuItem(suspend);

        // Restart
        let restart = new PopupMenu.PopupBaseMenuItem();
        restart.actor.add_actor(new St.Icon({
            icon_name: 'system-reboot-symbolic',
            style_class: 'system-status-icon',
            icon_size: PANEL_ICON_SIZE,
        }));
        restart.actor.add_actor(new St.Label({
            text: _('Restart'),
            y_align: Clutter.ActorAlign.CENTER,
        }));
        restart.connect('activate', () => this._system._systemActions.activateRestart());
        this.menu.addMenuItem(restart);

        // Power Off
        let power = new PopupMenu.PopupBaseMenuItem();
        power.actor.add_actor(new St.Icon({
            icon_name: 'system-shutdown-symbolic',
            style_class: 'system-status-icon',
            icon_size: PANEL_ICON_SIZE,
        }));
        power.actor.add_actor(new St.Label({
            text: _('Power Off'),
            y_align: Clutter.ActorAlign.CENTER,
        }));
        power.connect('activate', () => this._system._systemActions.activatePowerOff());
        this.menu.addMenuItem(power);
    }

    changeLabel(label) {
        if (label === '')
            label = GLib.get_real_name();
        this._nameLabel.set_text(label);
    }

    changeIcon(enabled) {
        if (enabled) {
            this._powerIcon.show();
            this._nameLabel.hide();
        } else {
            this._powerIcon.hide();
            this._nameLabel.show();
        }
    }

    destroy() {
        try { this.menu.box.remove_actor(this._system.menu.actor); } catch (_) {}
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._system.menu.actor);
        super.destroy();
    }
});
