const fs = require('fs');
let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

const utils = `
fn hotkey_to_shortcut_str(hotkey: &models::Hotkey) -> String {
    let mut parts: Vec<String> = hotkey
        .modifiers
        .iter()
        .map(|m| match m.to_lowercase().as_str() {
            "ctrl" => "Ctrl".to_string(),
            "shift" => "Shift".to_string(),
            "alt" => "Alt".to_string(),
            "meta" => "Super".to_string(),
            other => {
                let mut s = other.to_string();
                if let Some(c) = s.get_mut(0..1) {
                    c.make_ascii_uppercase();
                }
                s
            }
        })
        .collect();
    let key = if hotkey.key.len() == 1 {
        hotkey.key.to_uppercase()
    } else {
        let mut s = hotkey.key.clone();
        if let Some(c) = s.get_mut(0..1) {
            c.make_ascii_uppercase();
        }
        s
    };
    parts.push(key);
    parts.join("+")
}

#[cfg(target_os = "windows")]
async fn start_named_pipe_server(app_handle: tauri::AppHandle) {
    use tokio::net::windows::named_pipe::ServerOptions;
    use tokio::io::AsyncReadExt;
    use tauri::Manager;

    let pipe_name = r"\\\\.\\pipe\\second-brain-capture";
    loop {
        let mut server = match ServerOptions::new()
            .first_pipe_instance(false)
            .create(pipe_name)
        {
            Ok(server) => server,
            Err(_) => {
                tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                continue;
            }
        };

        match server.connect().await {
            Ok(_) => {
                let mut buf = Vec::new();
                if let Ok(_) = server.read_to_end(&mut buf).await {
                    if let Ok(s) = String::from_utf8(buf) {
                        if let Ok(msg) = serde_json::from_str::<models::BrowserCapture>(&s) {
                            let state = app_handle.state::<db::DbState>();
                            let mut conn = state.0.lock().unwrap();
                            if let Ok(item) = db::db_create_vault_item_from_browser(&mut conn, &msg) {
                                let _ = app_handle.emit("browser-capture-saved", item);
                            }
                        }
                    }
                }
            },
            Err(_) => {}
        }
    }
}

#[cfg(not(target_os = "windows"))]
async fn start_named_pipe_server(_app_handle: tauri::AppHandle) {}
`;

lib = lib.replace('#[cfg_attr(mobile, tauri::mobile_entry_point)]\npub fn run', utils + '\n#[cfg_attr(mobile, tauri::mobile_entry_point)]\npub fn run');

fs.writeFileSync('src-tauri/src/lib.rs', lib);
