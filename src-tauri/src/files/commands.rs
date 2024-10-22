use super::model::{File, Visibility};
use crate::{error::Error, AppState};
use std::str::FromStr;
use tauri::{AppHandle, Manager};
use tauri_plugin_fs::{FsExt, OpenOptions, SafeFilePath};
use uuid::fmt::Hyphenated;

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

/*
    The reason for the upsert is to receive the same array that used to update React state
    React updates the state by using an entirely new state to replace old state.
    This function here will insert new rows if it has not yet exist,
    or update existing ones
*/
#[tauri::command]
pub async fn upsert_files(app_handle: AppHandle, files: Vec<File>) -> Result<Vec<File>, Error> {
    let state = app_handle.state::<AppState>();
    // We receive the list of file info, and iterate through each of them
    for File {
        id,
        name,
        visibility,
        path,
    } in files
    {
        // Convert id to string
        let id = id.to_string();

        // Convert visibility enum to string
        let visibility = visibility.to_string();

        /*
            Fetch the file by id
            fetch_optional will tell us if the row exists or not without causing an error
            I use fetch_optional a lot just to make sure the query will run and forget about
            the output, causing no errors whatsoever
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
                    The file name from the function argument comes in 2 variants
                    1) file.txt
                        Does have an extension, reported on desktop platforms
                    2) content://file
                        Does NOT have extension, as on mobile platforms, it sits behind an URI
                        this is because mobile platforms only let apps read the file contents, but NOT the file path
                        therefore detecting the mime of the file will be a bit tricky
                        because in most cases the mime can be read by just looking at the file extension.
                        We have to rely on reading the "magic numbers" in the file content to determine the mime
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
    Ok(sqlx::query_as!(
        File,
        r#"
            select 
                id as "id!: Hyphenated",
                name,
                visibility as "visibility!: Visibility",
                path
            from files
        "#
    )
    .fetch_all(&state.db)
    .await?)
}
