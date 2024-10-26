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
    Ios,
    Android,
}

impl From<tauri_plugin_os::OsType> for OsType {
    fn from(os_type: tauri_plugin_os::OsType) -> Self {
        match os_type {
            tauri_plugin_os::OsType::Linux => OsType::Linux,
            tauri_plugin_os::OsType::Windows => OsType::Windows,
            tauri_plugin_os::OsType::Macos => OsType::Macos,
            tauri_plugin_os::OsType::IOS => OsType::Ios,
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
