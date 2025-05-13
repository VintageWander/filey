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

use super::models::Visibility;
use crate::{error::Error, files::models::FileModel, AppState};
use std::str::FromStr;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_fs::{FsExt, OpenOptions, SafeFilePath};
use uuid::{fmt::Hyphenated, Uuid};

/*
 * This command opens up file explorer and show the file at location
 */
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

    // Mobile platform does not support reveal file in explorer
    #[cfg(any(target_os = "android", target_os = "ios"))]
    let err = vec![];

    match err.is_empty() {
        true => Ok(()),
        false => Err(Error::Command(format!(
            "Cannot reveal path: {path}.\nError: {}",
            String::from_utf8(err).unwrap()
        ))),
    }
}

/*
 * Checks if a file at path exists or not
 */
#[tauri::command]
pub fn file_exists(app_handle: AppHandle, path: &str) -> bool {
    let Ok(path) = SafeFilePath::from_str(path) else {
        return false;
    };
    app_handle
        .fs()
        .open(path, OpenOptions::new().read(true).clone())
        .is_ok()
}

// Returns a list of local files
#[tauri::command]
pub async fn get_files(state: State<'_, AppState>) -> Result<Vec<FileModel>, Error> {
    let files = sqlx::query_as!(
        FileModel,
        r#"
            select
                id as "id!: Hyphenated",
                name,
                mime,
                visibility as "visibility!: Visibility",
                path
            from files
        "#
    )
    .fetch_all(&state.db)
    .await?;

    Ok(files)
}

/*
    The reason for the upsert is to receive the same array that used to update React state
    React updates the state by using an entirely new state to replace old state.
    This function here will insert new rows if it has not yet exist,
    or update existing ones
*/
#[tauri::command]
pub async fn upsert_files(
    app_handle: AppHandle,
    files: Vec<FileModel>,
) -> Result<Vec<FileModel>, Error> {
    let state = app_handle.state::<AppState>();
    // We receive the list of file info, and iterate through each of them
    for FileModel {
        id,
        name,
        visibility,
        path,
        ..
    } in files
    {
        // Convert id to string
        let id = id.to_string();

        // Convert visibility enum to string
        let visibility = visibility.to_string();

        /*
         * Fetch the file by id
         * fetch_optional will tell us if the row exists or not without causing an error
         * I use fetch_optional a lot just to make sure the query will run and forget about
         * the output, causing no errors whatsoever
         */
        match sqlx::query!("select id from files where id = $1", id)
            .fetch_optional(&state.db)
            .await?
        {
            // If there is, simply update it
            Some(file) => {
                sqlx::query!(
                    "
                        update files set
                            visibility = $1
                        where id = $2
                        returning id
                    ",
                    visibility,
                    file.id
                )
                .fetch_optional(&state.db)
                .await?;
            }
            // If there isn't, do some work before insertion
            None => {
                /*
                 * The file name from the function argument comes in 2 variants
                 * 1) file.txt
                 *    Does have an extension, reported on desktop platforms
                 * 2) content://file
                 *    Does NOT have extension, as on mobile platforms, it sits behind an URI
                 *    this is because mobile platforms only let apps read the file contents, but NOT the file path
                 *    therefore detecting the mime of the file will be a bit tricky
                 *    because in most cases the mime can be read by just looking at the file extension.
                 *    We have to rely on reading the "magic numbers" in the file content to determine the mime
                 */
                let (name, mime) = match name.rsplit_once(".") {
                    // Case 1: file.txt -> Just use the .txt
                    Some((name, extension)) => (
                        format!("{name}.{extension}"),
                        mime_guess::from_ext(extension)
                            .first_or_octet_stream()
                            .to_string(),
                    ),
                    // Case 2: content://file -> Read the magic numbers in the file bytes
                    None => {
                        // Get the file bytes
                        let file_bytes = app_handle.fs().read(SafeFilePath::from_str(&path)?)?;
                        // Infer the extension based on the file's magic numbers
                        let info = infer::get(&file_bytes).expect("Cannot get info");
                        // Extract the extension
                        let extension = info.extension();
                        (format!("{name}.{extension}"), info.mime_type().into())
                    }
                };

                // After finish processing, insert a new row
                sqlx::query!(
                    "
                        insert into files
                            (id, name, mime, visibility, path)
                        values
                            ($1, $2, $3, $4, $5)
                        on conflict (id)
                        do nothing
                        returning id
                    ",
                    id,
                    name,
                    mime,
                    visibility,
                    path
                )
                .fetch_optional(&state.db)
                .await?;
            }
        }
    }
    /*
     * Query row by id and return
     * Notice the Hyphenated part, this is because we inserted a new row in hyphenated form
     * BUT when we query and parse the model into Rust,
     * we have to convert to Hyphenated in the select statement, or else the Rust model will fail to parse
     *
     * We're returning the entire list of files, not only the newly added ones, because React requires
     * the entire array of elements to be used for re-rendering
     */
    Ok(sqlx::query_as!(
        FileModel,
        r#"
            select
                id as "id!: Hyphenated",
                name,
                mime,
                visibility as "visibility!: Visibility",
                path
            from files
        "#
    )
    .fetch_all(&state.db)
    .await?)
}

// Delete the file by id
#[tauri::command]
pub async fn delete_file(state: State<'_, AppState>, id: Uuid) -> Result<(), Error> {
    let id = id.to_string();
    sqlx::query!("delete from files where id = $1 returning id", id)
        .fetch_one(&state.db)
        .await?;
    Ok(())
}
