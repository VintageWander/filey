/*
    Filey - simple peer-to-peer file sending across devices on different platforms
    Copyright (C) 2024 Wander Watterson

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

use local_ip_address::list_afinet_netifas;
use tauri::{path::BaseDirectory, AppHandle, Manager};
use tauri_plugin_fs::{FsExt, OpenOptions};

use crate::error::Error;

#[tauri::command]
pub async fn database_ready(app_handle: AppHandle) -> bool {
    // Resolve the path to the database file
    // If it fails -> database not ready
    let Ok(path) = app_handle.path().resolve("data.db", BaseDirectory::AppData) else {
        return false;
    };
    // Try to open the file, if it does not -> database not ready
    app_handle
        .fs()
        .open(path, OpenOptions::new().read(true).clone())
        .is_ok()
}

#[tauri::command]
pub fn local_ips() -> Result<Vec<String>, Error> {
    let local_ips =
    // List all network interfaces
    list_afinet_netifas()?
        // Goes through each of them
        .iter()
        // Only takes the ip address, ignore the interface name (each item is a pair of name:ip)
        .map(|(_, ip)| ip.to_string())
        // Keeps the private ip addresses, those starts with 10.0, 172.16 and 192.168
        .filter(|ip| {
            ip.starts_with("10.0") || ip.starts_with("172.16") || ip.starts_with("192.168")
        })
        // collect them into a list
        .collect();

    Ok(local_ips)
}

// Neat trick to determine whether or not a device is a laptop, mobile or desktop
// Though this could be bypassed easily by using a laptop without a battery.
// Technically speaking a laptop that does not have battery, lives on a desktop, pretty much is a desktop at this point
#[tauri::command]
pub fn check_battery() -> bool {
    // On devices that are NOT mobile -> checks for battery's existence
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        let Ok(manager) = battery::Manager::new() else {
            return false;
        };
        let Ok(batteries) = manager.batteries() else {
            return false;
        };

        !batteries.into_iter().collect::<Vec<_>>().is_empty()
    }
    // On devices that ARE mobile -> just return true, they all have batteries
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        true
    }
}
