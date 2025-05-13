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

use axum::{http::StatusCode, response::IntoResponse, Json};
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

    #[error("File does not exists on path: {0}")]
    FileNotFound(#[from] tauri_plugin_fs::Error),

    #[error(transparent)]
    Db(#[from] sqlx::Error),

    #[error(transparent)]
    IpAddr(#[from] local_ip_address::Error),

    #[error(transparent)]
    Reqwest(#[from] tauri_plugin_http::reqwest::Error),
}

/*
 * Serialize custom Rust error types into string
 */
impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

/*
 * Custom error types can now be automatically converts to http errors
 */
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
