const fs = require('fs');

const correctCode = `
fn try_re_register_hotkey(app: &tauri::AppHandle, shortcut_str: &str) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
    
    let shortcut: Shortcut = shortcut_str.parse().map_err(|e| format!("Invalid hotkey format: {}", e))?;
    
    // Unregister any existing hotkey first
    let _ = app.global_shortcut().unregister_all();
    
    // Attempt to register the new one
    app.global_shortcut().register(shortcut.clone())
        .map_err(|e| format!("Failed to register hotkey '{}': {} (another app may already own this combination)", shortcut_str, e))?;
        
    // We don't set up the handler here, because the handler is set globally in run()
    // However, tauri-plugin-global-shortcut's builder handler in run() listens to ANY registered shortcut
    // So just registering it is enough to make it hit our global handler!
    Ok(())
}

#[tauri::command]
fn update_app_settings(
    app: tauri::AppHandle,
    state: tauri::State<db::DbState>,
    settings: models::AppSettings,
) -> Result<(), String> {
    let shortcut_str = hotkey_to_shortcut_str(&settings.capture_hotkey);
    
    try_re_register_hotkey(&app, &shortcut_str)?;
    
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::db_update_app_settings(&mut conn, &settings)
}
`;

let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

// replace old update_app_settings
lib = lib.replace(/#\[tauri::command\]\nfn update_app_settings\([\s\S]*?\n\}/, correctCode);

fs.writeFileSync('src-tauri/src/lib.rs', lib);
