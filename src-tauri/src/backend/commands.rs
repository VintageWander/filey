use crate::{error::Error, files::model::FileResponse, AppState, ServerResponse};
use axum::Router;
use tauri::Manager;
use tauri_plugin_http::reqwest::Client;
use tokio::{net::TcpListener, signal, sync::oneshot::Receiver};

use super::{
    handlers::{get_file, get_files, info},
    model::{OsType, Peer, ServerState},
};

/*
    This command starts up an HTTP server to serve files and report its info
    It does not contain any magic when it comes to Filey peers connecting to
    each other, it literally just connecting to other peers through HTTP but
    rendered in a beautiful interface

    It starts up a Axum HTTP server at 0.0.0.0:38899
    Why 38899 you ask? No reason, that's just a random number I thought of, and
    of course it has to be a fixed port so that other peers can see each other
*/
#[tauri::command]
pub async fn start_server(app_handle: tauri::AppHandle) -> Result<(), Error> {
    // Get the tauri state
    let state = app_handle.state::<AppState>();

    // Make a one shot channel, including a shutdown listener and the shutdown trigger
    let (backend_shutdown_trigger, backend_shutdown_listener) =
        tokio::sync::oneshot::channel::<()>();
    /*
        Load the shutdown trigger in the tauri state
        So that other commands can shutdown the server
    */
    *state.backend_shutdown_trigger.lock().await = Some(backend_shutdown_trigger);

    // Load the handlers into the Router
    let router = Router::new()
        .merge(info())
        .merge(get_files())
        .merge(get_file())
        .with_state(ServerState {
            db: state.db.clone(),
            app_handle: app_handle.clone(),
        });

    // Listens for TCP requests on 0.0.0.0:38899
    let tcp_listener = TcpListener::bind("0.0.0.0:38899")
        .await
        .expect("Cannot listen on 0.0.0.0:38899");

    // Starts the server
    axum::serve(tcp_listener, router)
        // ...loaded with a function that listens for shutdown signal
        .with_graceful_shutdown(backend_shutdown_signal(backend_shutdown_listener))
        .await
        .map_err(Into::into)
}

// As the name implies, it listens to specific signal to shut the server down
async fn backend_shutdown_signal(oneshot_recv: Receiver<()>) {
    // Ctrl + C signal
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    // UNIX terminate signal (SIGTERM)
    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    // No idea, it just works
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = oneshot_recv => {}
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}

// This command stops the server, by getting the backend shutdown trigger, and triggering it
#[tauri::command]
pub async fn stop_server(state: tauri::State<'_, AppState>) -> Result<(), Error> {
    if let Some(shutdown_signal) = state.backend_shutdown_trigger.lock().await.take() {
        shutdown_signal.send(()).ok();
    }
    Ok(())
}

/*
    Tries to get info from a peer at a certain IP address
    Much much more complicated than just an ICMP ping, as we need to verify
    if the address is a Filey peer
    This is on the requesting side, on the serving side, it will be handled
    by a handler in backend::handlers::info
*/
#[tauri::command]
pub async fn check_peer(ip: &str) -> Result<Peer, Error> {
    let address = format!("http://{ip}:38899/info");
    let response: ServerResponse<OsType> = Client::new().get(&address).send().await?.json().await?;
    Ok(Peer {
        address: ip.to_string(),
        os_type: response.data,
    })
}

/*
    As the name implies, getting list of files from another Filey peer
    This is on the requesting side, on the serving side, it will be handled
    by a handler in backend::handlers::get_files
*/
#[tauri::command]
pub async fn get_files_from_peer(ip: &str) -> Result<Vec<FileResponse>, Error> {
    let address = format!("http://{ip}:38899/files");
    let response: ServerResponse<Vec<FileResponse>> =
        Client::new().get(&address).send().await?.json().await?;

    Ok(response.data)
}

/*
    There is no get_file_from peer command, because getting a single file
    actually does NOT get the file info, but the entire file CONTENTS
*/