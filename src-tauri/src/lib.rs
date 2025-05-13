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

use device::commands::*;
use files::commands::*;
use http_server::commands::*;

use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::{path::BaseDirectory, Manager};
use tauri_plugin_log::{Target, TargetKind};
use tokio::sync::{oneshot::Sender, Mutex};

mod db;
mod device;
mod error;
mod files;
mod http_server;

pub struct AppState {
    pub db: SqlitePool,
    pub http_server_shutdown_trigger: Mutex<Option<Sender<()>>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerResponse<T: Serialize> {
    pub message: String,
    pub data: T,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .target(Target::new(TargetKind::Stdout))
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let path = app
                .path()
                .resolve("data.db", BaseDirectory::AppData)?
                .display()
                .to_string();

            let db = tauri::async_runtime::block_on(db::connect_and_migrate_db(path));

            app.manage(AppState {
                db,
                http_server_shutdown_trigger: Mutex::new(None),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            database_ready,
            os_info,
            local_ips,
            has_battery,
            reveal,
            file_exists,
            get_files,
            upsert_files,
            delete_file,
            start_server,
            stop_server,
            check_peer,
            get_files_from_peer,
        ])
        .run(tauri::generate_context!())
        .expect("Application failed to start");
}
