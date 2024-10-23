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

use log::info;
use sqlx::SqlitePool;
use tokio::fs::{create_dir_all, File};

pub async fn connect_and_migrate(path: String) -> SqlitePool {
    // The path is the full direction from the directory to the file data.db itself
    // Chop off the right half to get the parent directories and create them
    // After that create the database file
    let (parent_dir, _) = path
        .rsplit_once("/")
        .expect("Cannot split path to get parent dir");

    // 2 function calls below will emit an error if the directory or file already exists
    // however `.ok()` will ignore the error and move on

    // Create parent directory
    create_dir_all(parent_dir).await.ok();

    // Create database file
    File::create_new(&path).await.ok();

    let db = SqlitePool::connect(&format!("sqlite://{path}"))
        .await
        .map_err(|err| log::error!("{err}"))
        .expect("Cannot get db file");

    info!("Connected to database");

    sqlx::migrate!("../migrations")
        .run(&db)
        .await
        .map_err(|err| log::error!("{err}"))
        .expect("Migrate failed");

    info!("Migrate database successfully");

    db
}
