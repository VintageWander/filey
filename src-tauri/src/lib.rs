mod error;

use log::LevelFilter;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
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

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(LevelFilter::Error)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("Application failed to start");
}
