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

use crate::{
    error::Error, files::models::FileResponse, http_server::models::OsType, ServerResponse,
};
use axum::{
    extract::{Path, Query, State},
    response::{AppendHeaders, IntoResponse, Response},
    routing::{get, options},
    Json, Router,
};
use axum_extra::{headers::Range, TypedHeader};
use axum_range::{KnownSize, Ranged};
use reqwest::{
    header::{CONTENT_DISPOSITION, CONTENT_TYPE},
    StatusCode,
};
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use tauri_plugin_fs::{FsExt, OpenOptions, SafeFilePath};
use tauri_plugin_os::type_;
use uuid::{fmt::Hyphenated, Uuid};

use super::models::ServerState;

pub fn preflight() -> Router<ServerState> {
    async fn handler(Path(rest): Path<String>) -> Result<Response, Error> {
        let _ = rest;
        Ok((
            StatusCode::OK,
            Json(ServerResponse {
                message: "Preflight request passed".into(),
                data: (),
            }),
        )
            .into_response())
    }
    Router::new().route("/{*rest}", options(handler))
}

// Returns a message and OS type
pub fn info() -> Router<ServerState> {
    async fn handler() -> Result<Response, Error> {
        Ok((
            StatusCode::OK,
            Json(ServerResponse::<OsType> {
                message: "This Filey server is healthy".into(),
                data: type_().into(),
            }),
        )
            .into_response())
    }
    Router::new().route("/info", get(handler))
}

// Show the list of PUBLIC files
pub fn get_files() -> Router<ServerState> {
    async fn handler(State(ServerState { db, .. }): State<ServerState>) -> Result<Response, Error> {
        let db_files = sqlx::query_as!(
            FileResponse,
            r#"
                select
                    id as "id!: Hyphenated",
                    name,
                    mime
                from files
                where visibility = 'public'
            "#
        )
        .fetch_all(&db)
        .await?;

        Ok((
            StatusCode::OK,
            Json(ServerResponse {
                message: "Get all files success".into(),
                data: db_files,
            }),
        )
            .into_response())
    }
    Router::new().route("/files", get(handler))
}

/*
 * This is for additional query
 * ?mode=download or ?mode=view
 * View => Tell the browser to render the content in the browser itself (default)
 * Download => Download the file
 */
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
enum Mode {
    View,
    Download,
}

#[derive(Serialize, Deserialize)]
struct ModeQuery {
    mode: Option<Mode>,
}

// Returns the file content
pub fn get_file() -> Router<ServerState> {
    async fn handler(
        State(ServerState { db, app_handle }): State<ServerState>,
        Path(id): Path<Uuid>,
        Query(ModeQuery { mode }): Query<ModeQuery>,
        range: Option<TypedHeader<Range>>,
    ) -> Result<Response, Error> {
        /*
         * Get the mode query (?mode=view OR ?mode=download)
         * Default is view
         */
        let mode = mode.unwrap_or(Mode::View);
        let id = id.to_string();

        // Get the exact file by id from the path, and it is also has to be set public
        let row = sqlx::query!(
            "
                select name, path, mime
                from files
                where
                    id = $1
                and visibility = 'public'
                limit 1
            ",
            id
        )
        .fetch_one(&db)
        .await?;

        // Extract the variables from select statement
        let name = row.name;
        let path = row.path;
        let mime = row.mime;

        /*
         *  Opens the file using tauri's plugin-fs file opener
         *
         *  Why not just use std::fs::File or tokio::fs::File you ask?
         *  Well both aforementioned File struct can open desktop file path,
         *  but NOT mobile platforms
         *
         *  Since mobile platforms only return content URI, therefore std::fs::File
         *  or tokio::fs::File can't read that.
         *
         *  However tauri provides plugin-fs that can get the file content from
         *  both desktop path and content URI, and it returns std::fs::File, which can
         *  be converted to tokio::fs::File, how convenient is that?
         */
        let file: tokio::fs::File = app_handle
            .fs()
            .open(
                SafeFilePath::from_str(&path)?,
                OpenOptions::new().read(true).clone(),
            )?
            .into();
        /*
         *  axum_range's KnownSize will setup apropriate headers to tell the browser
         *  on the requesting side to STREAM the file.
         *
         *  This is very important as big mp4 files can be viewed immediately instead
         *  of the default behaviour (downloading the entire file while trying to view,
         *  very long spinning wheel time, very frustrating)
         */
        let body = KnownSize::file(file).await?;
        let range = range.map(|TypedHeader(range)| range);

        /*
         * Append extra headers, indicating the mime for the browser to know how to render
         * along with the mode to view the content in browser, or just download it
         */
        Ok((
            AppendHeaders([
                (CONTENT_TYPE, mime),
                (
                    CONTENT_DISPOSITION,
                    format!(
                        "{}; filename={name}",
                        match mode {
                            Mode::View => "inline",
                            Mode::Download => "attachment",
                        }
                    ),
                ),
            ]),
            Ranged::new(range, body),
        )
            .into_response())
    }
    Router::new().route("/files/{id}", get(handler))
}
