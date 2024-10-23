use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::AppHandle;

// Axum state
#[derive(Clone)]
pub struct ServerState {
    pub db: SqlitePool,
    pub app_handle: AppHandle,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OsType {
    Linux,
    Windows,
    Macos,
    IOS,
    Android,
}

impl From<tauri_plugin_os::OsType> for OsType {
    fn from(os_type: tauri_plugin_os::OsType) -> Self {
        match os_type {
            tauri_plugin_os::OsType::Linux => OsType::Linux,
            tauri_plugin_os::OsType::Windows => OsType::Windows,
            tauri_plugin_os::OsType::Macos => OsType::Macos,
            tauri_plugin_os::OsType::IOS => OsType::IOS,
            tauri_plugin_os::OsType::Android => OsType::Android,
        }
    }
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Peer {
    pub address: String,
    pub os_type: OsType,
}
