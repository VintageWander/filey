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
