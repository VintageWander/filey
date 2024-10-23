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

mod backend;
mod db;
mod error;
mod files;
mod info;

use backend::commands::*;
use files::commands::*;
use info::commands::*;
use log::LevelFilter;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::{path::BaseDirectory, Manager};
use tokio::sync::{oneshot::Sender, Mutex};

pub struct AppState {
    pub db: SqlitePool,
    pub backend_shutdown_trigger: Mutex<Option<Sender<()>>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerResponse<T: Serialize> {
    pub message: String,
    pub data: T,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let path = app
                .path()
                .resolve("data.db", BaseDirectory::AppData)?
                .display()
                .to_string();

            let db = tauri::async_runtime::block_on(db::connect_and_migrate(path));

            app.manage(AppState {
                db,
                backend_shutdown_trigger: Mutex::new(None),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            database_ready,
            local_ips,
            check_battery,
            reveal,
            exists,
            get_files,
            upsert_files,
            delete_file,
            check_peer,
            get_files_from_peer,
            start_server,
            stop_server,
        ])
        .run(tauri::generate_context!())
        .expect("Application failed to start");
}
