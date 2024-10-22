use axum::{http::StatusCode, response::IntoResponse, Json};
use tauri_plugin_http::reqwest;
use thiserror::Error;

use crate::ServerResponse;

#[derive(Debug, Error)]
pub enum Error {
    #[error(transparent)]
    Tauri(#[from] tauri::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("Command ran and returned error: {0}")]
    Command(String),
    #[error("File not found from path: {0}")]
    FileNotFound(#[from] tauri_plugin_fs::Error),
    #[error(transparent)]
    Db(#[from] sqlx::Error),
    #[error(transparent)]
    IpAddr(#[from] local_ip_address::Error),
    #[error(transparent)]
    Reqwest(#[from] reqwest::Error),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> axum::response::Response {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ServerResponse {
                message: self.to_string(),
                data: (),
            }),
        )
            .into_response()
    }
}
