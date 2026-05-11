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
import GnomeBluetooth from 'gi://GnomeBluetooth';
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { CustomButton } from './button.js';

export var BluetoothIndicator = GObject.registerClass({
    GTypeName: 'BluetoothIndicator',
},
class BluetoothIndicator extends CustomButton {

    _init(extensionPath) {
        super._init('BluetoothIndicator');
        this._extensionPath = extensionPath;
        this.menu.actor.add_style_class_name('aggregate-menu');

        this._bluetooth = null;

        if (Config.HAVE_BLUETOOTH)
            this._bluetooth = Main.panel.statusArea.aggregateMenu._bluetooth;

        if (!this._bluetooth) {
            this.hide();
            return;
        }

        this._bluetooth_paired_gicon = Gio.icon_new_for_string(
            `${this._extensionPath}/icons/bluetooth-paired-symbolic.svg`
        );

        this._bluetooth.remove_actor(this._bluetooth._indicator);
        this._bluetooth._indicator.hide();
        this._bluetooth._item.menu._setSettingsVisibility(false);

        this._indicator = new St.Icon({ style_class: 'system-status-icon' });
        this._indicator.icon_name = 'bluetooth-active-symbolic';
        this.box.add_child(this._indicator);

        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._bluetooth.menu.actor);
        this.menu.addMenuItem(this._bluetooth.menu);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._settingsItem = new PopupMenu.PopupMenuItem(_('Bluetooth Settings'));
        this._settingsItem.connect('activate', () => this._openApp('gnome-bluetooth-panel.desktop'));
        this.menu.addMenuItem(this._settingsItem);

        this._bluetooth_properties_changed = this._bluetooth._proxy.connect(
            'g-properties-changed', () => this._sync()
        );
        this._bluetooth._sync();

        this._client = new GnomeBluetooth.Client();
        this._deviceNotifyConnected = new Set();

        const deviceStore = this._client.get_devices();
        for (let i = 0; i < deviceStore.get_n_items(); i++)
            this._connectDeviceNotify(deviceStore.get_item(i));

        this._client.connect('device-removed', (c, path) => {
            this._deviceNotifyConnected.delete(path);
            this._sync();
        });
        this._client.connect('device-added', (c, device) => {
            this._connectDeviceNotify(device);
            this._sync();
        });

        this.menu.connect('open-state-changed', (menu, isOpen) => {
            if (isOpen)
                this._bluetooth._item.actor.show();
        });

        this._sync();
    }

    _connectDeviceNotify(device) {
        const path = device.get_object_path?.() ?? device.address;
        if (this._deviceNotifyConnected.has(path))
            return;
        device.connect('notify', () => this._sync());
        this._deviceNotifyConnected.add(path);
    }

    _sync() {
        let sensitive = !Main.sessionMode.isLocked && !Main.sessionMode.isGreeter;
        this.menu.setSensitive(sensitive);

        let devices = this._bluetooth._getDeviceInfos();
        let connectedDevices = devices.filter(dev => dev.connected);
        let nConnectedDevices = connectedDevices.length;
        const adapterPowered = this._client.default_adapter_powered;

        if (nConnectedDevices > 0) {
            this._indicator.gicon = this._bluetooth_paired_gicon;
            this._bluetooth._item.icon.gicon = this._bluetooth_paired_gicon;
        } else if (adapterPowered) {
            this._indicator.icon_name = 'bluetooth-active-symbolic';
            this._bluetooth._item.icon.icon_name = 'bluetooth-active-symbolic';
        } else {
            this._bluetooth._item.actor.show();
            this._indicator.icon_name = 'bluetooth-disabled-symbolic';
            this._bluetooth._item.icon.icon_name = 'bluetooth-disabled-symbolic';
        }
    }

    destroy() {
        if (this._bluetooth) {
            this._bluetooth._proxy.disconnect(this._bluetooth_properties_changed);
            try { this.box.remove_child(this._bluetooth._indicator); } catch (_) {}
            try { this.menu.box.remove_actor(this._bluetooth.menu.actor); } catch (_) {}
            this._bluetooth.add_actor(this._bluetooth._indicator);
            this._bluetooth._item.menu._setSettingsVisibility(true);
            Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._bluetooth.menu.actor);
        }
        super.destroy();
    }
});
