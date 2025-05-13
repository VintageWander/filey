/*
  Filey - simple peer-to-peer file sending across devices on different platforms
  Copyright (C) 2024 Wander Watterson

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

use crate::error::Error;
use local_ip_address::list_afinet_netifas;
use tauri::{path::BaseDirectory, AppHandle, Manager};
use tauri_plugin_fs::{FsExt, OpenOptions};

/*
 * Checks if the database has already been created or not
 * This typically takes some time on first run since a file needs to be created
 * On 2nd run this should not take much time
 */
#[tauri::command]
pub fn database_ready(app_handle: AppHandle) -> bool {
    /*
     * Resolve the path to the database file
     * If it fails -> database not ready
     */
    let Ok(path) = app_handle.path().resolve("data.db", BaseDirectory::AppData) else {
        return false;
    };

    // Try to open the file, if it does not -> database not ready
    app_handle
        .fs()
        .open(path, OpenOptions::new().read(true).clone())
        .is_ok()
}

/*
 * Get device's operating system
 */
#[tauri::command]
pub fn os_info() -> String {
    tauri_plugin_os::type_().to_string()
}

/*
 * Gets all local ip addresses that the device can use
 * by going through each network interface that the device has (ethernet, wifi, ...)
 * filters the list by private IP addresses prefix, and return the list
 *
 * This is used for getting a list of private ip addresses
 * use as a base ip address to loop through from .1 -> .255
 *
 * Example:
 * If your mobile phone connects to a LAN that has a gateway address of 192.168.1.1
 * This function will return [192.168.1.20] (something like that), an array with 1 element
 *
 * If you're using a desktop PC that connects both wifi and ethernet,
 * you might have more than 2 private IP addresses as base e.g [192.168.1.20, 10.0.10.20]
 * then this function will return an array with 2 elements
 *
 * On the UI, it will go through each IP address in the returned array, strip off the end
 * Example: 192.168.1.20 -> 192.168.1.__
 * And then it will loop through 192.168.1.1 -> 192.168.1.255, calling port 38899 (filey peer's port number)
 * I call it scanning for peers, if there's any response that we can parse and read perfectly
 * that's a filey peer
 */
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

/*
 * Neat trick to determine whether or not a device is a laptop, mobile or desktop
 * Though this could be bypassed easily by using a laptop without a battery.
 * Technically speaking a laptop that does not have battery, pretty much is a desktop at this point
 */
#[tauri::command]
pub fn has_battery() -> bool {
    // On devices that are NOT mobile -> checks for battery's existence
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        let Ok(manager) = battery::Manager::new() else {
            return false;
        };
        let Ok(batteries) = manager.batteries() else {
            return false;
        };

        /*
         * batteries is a list of installed batteries on the device
         * checks if the list of batteries is empty or not
         */
        !batteries.into_iter().collect::<Vec<_>>().is_empty()
    }
    // On devices that ARE mobile -> just return true, they all have batteries
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        true
    }
}
