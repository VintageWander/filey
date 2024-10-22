mod db;
mod error;
mod files;
mod info;

use files::commands::*;
use info::commands::*;
use log::LevelFilter;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::{path::BaseDirectory, Manager};
use tokio::sync::{oneshot::Sender, Mutex};

pub struct AppState {
    pub db: SqlitePool,
    pub shutdown_sender: Mutex<Option<Sender<()>>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerResponse<T: Serialize> {
    pub message: String,
    pub data: T,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
                shutdown_sender: Mutex::new(None),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            database_ready,
            local_ips,
            check_battery,
            reveal,
            exists,
        ])
        .run(tauri::generate_context!())
        .expect("Application failed to start");
}
