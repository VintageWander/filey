use local_ip_address::list_afinet_netifas;
use tauri::{path::BaseDirectory, AppHandle, Manager};
use tauri_plugin_fs::{FsExt, OpenOptions};

use crate::error::Error;

#[tauri::command]
pub async fn database_ready(app_handle: AppHandle) -> bool {
    let Ok(path) = app_handle.path().resolve("data.db", BaseDirectory::AppData) else {
        return false;
    };
    app_handle
        .fs()
        .open(path, OpenOptions::new().read(true).clone())
        .is_ok()
}

#[tauri::command]
pub fn local_ips() -> Result<Vec<String>, Error> {
    let local_ips = list_afinet_netifas()?
        .iter()
        .map(|(_, ip)| ip.to_string())
        .filter(|ip| {
            ip.starts_with("10.0") || ip.starts_with("172.16") || ip.starts_with("192.168")
        })
        .collect();

    Ok(local_ips)
}

// Neat trick to determine whether or not a device is a laptop or desktop
// Though this could be bypassed easily by just use a laptop without a battery, powered from wall outlet
// but the question is, why do you have to?
#[tauri::command]
pub fn check_battery() -> bool {
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
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        true
    }
}
