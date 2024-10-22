use std::str::FromStr;

use tauri::AppHandle;
use tauri_plugin_fs::{FsExt, OpenOptions, SafeFilePath};

use crate::error::Error;

#[tauri::command]
pub async fn reveal(path: &str) -> Result<(), Error> {
    #[cfg(target_os = "macos")]
    let err = tokio::process::Command::new("open")
        .args(["-R", path])
        .output()
        .await?
        .stderr;

    #[cfg(target_os = "windows")]
    let err = tokio::process::Command::new("explorer.exe")
        .args(["/select", path])
        .output()
        .await?
        .stderr;

    #[cfg(any(target_os = "android", target_os = "ios"))]
    // Mobile platform does not support reveal file in explorer
    let err = vec![];

    match err.is_empty() {
        true => Ok(()),
        false => Err(Error::Command(format!(
            "Cannot reveal path: {path}.\nError: {}",
            String::from_utf8(err).unwrap()
        ))),
    }
}

#[tauri::command]
pub fn exists(app_handle: AppHandle, path: &str) -> bool {
    let Ok(path) = SafeFilePath::from_str(path) else {
        return false;
    };
    app_handle
        .fs()
        .open(path, OpenOptions::new().read(true).clone())
        .is_ok()
}
