const fs = require('fs');

const realPipeServer = `
const PIPE_NAME: &str = r"\\\\.\\pipe\\second-brain-nmh";

#[cfg(windows)]
async fn start_named_pipe_server(app: tauri::AppHandle) {
    use tokio::net::windows::named_pipe::ServerOptions;

    println!("[CHANGE 18] Named pipe server starting on: {}", PIPE_NAME);

    loop {
        let server = match ServerOptions::new().create(PIPE_NAME) {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[CHANGE 18] Failed to create named pipe instance: {}", e);
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                continue;
            }
        };

        println!("[CHANGE 18] Named pipe waiting: {}", PIPE_NAME);

        if let Err(e) = server.connect().await {
            eprintln!("[CHANGE 18] Named pipe client connect error: {}", e);
            continue;
        }

        let handle = app.clone();
        tauri::async_runtime::spawn(handle_pipe_connection(server, handle));
    }
}

#[cfg(windows)]
async fn handle_pipe_connection(
    mut pipe: tokio::net::windows::named_pipe::NamedPipeServer,
    app: tauri::AppHandle,
) {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    let mut len_buf = [0u8; 4];
    if let Err(e) = pipe.read_exact(&mut len_buf).await {
        eprintln!("[CHANGE 18] Failed to read message length from pipe: {}", e);
        return;
    }

    let msg_len = u32::from_le_bytes(len_buf) as usize;
    if msg_len > 65_536 {
        eprintln!("[CHANGE 18] Message too large ({} bytes), dropping", msg_len);
        let resp = crate::models::BrowserMessageResponse {
            ok: false,
            error: Some(format!("Message too large: {} bytes (max 65536)", msg_len)),
        };
        let resp_json = serde_json::to_string(&resp).unwrap();
        let resp_len = (resp_json.len() as u32).to_le_bytes();
        let _ = pipe.write_all(&resp_len).await;
        let _ = pipe.write_all(resp_json.as_bytes()).await;
        return;
    }

    let mut msg_buf = vec![0u8; msg_len];
    if let Err(e) = pipe.read_exact(&mut msg_buf).await {
        eprintln!("[CHANGE 18] Failed to read message body from pipe: {}", e);
        return;
    }

    let msg_str = match String::from_utf8(msg_buf) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[CHANGE 18] Message not valid UTF-8: {}", e);
            return;
        }
    };

    let msg: crate::models::BrowserMessage = match serde_json::from_str(&msg_str) {
        Ok(m) => m,
        Err(e) => {
            eprintln!("[CHANGE 18] Failed to parse browser message JSON: {}", e);
            return;
        }
    };

    use tauri::Emitter;
    app.emit("browser-message", &msg).ok();

    if msg.action == "capture" {
        let state = app.state::<crate::db::DbState>();
        let mut guard = state.0.lock().unwrap();

        let resp = match crate::db::db_create_vault_item_from_browser(&mut guard, &msg.payload) {
            Ok(item) => {
                app.emit("browser-capture-saved", &item).ok();
                crate::models::BrowserMessageResponse { ok: true, error: None }
            }
            Err(e) => {
                eprintln!("[CHANGE 18] Failed to save browser capture: {}", e);
                crate::models::BrowserMessageResponse { ok: false, error: Some(e) }
            }
        };

        let resp_json = serde_json::to_string(&resp).unwrap();
        let resp_len = (resp_json.len() as u32).to_le_bytes();
        let _ = pipe.write_all(&resp_len).await;
        let _ = pipe.write_all(resp_json.as_bytes()).await;
    }
}

#[cfg(not(windows))]
async fn start_named_pipe_server(_app: tauri::AppHandle) {
    // no-op on non-Windows
}
`;

let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

lib = lib.replace(/#\[cfg\(target_os = "windows"\)\]\nasync fn start_named_pipe_server[\s\S]*?async fn start_named_pipe_server\(_app_handle: tauri::AppHandle\) \{\}/, realPipeServer);

fs.writeFileSync('src-tauri/src/lib.rs', lib);
