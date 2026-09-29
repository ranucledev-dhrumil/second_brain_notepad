const fs = require('fs');

const runStr = `
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize Database
            use tauri::Manager;
            let mut conn = rusqlite::Connection::open(db::get_db_path())
                .map_err(|e| e.to_string())?;
            db::db_setup(&mut conn).unwrap();
            app.manage(db::DbState(std::sync::Mutex::new(conn)));

            // Setup Named Pipe for browser extension
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                start_named_pipe_server(app_handle).await;
            });

            // Make window vibrant
            #[cfg(target_os = "windows")]
            {
                use window_vibrancy::apply_mica;
                let window = app.get_webview_window("main").unwrap();
                apply_mica(&window, Some(true)).expect("Unsupported platform! 'apply_mica' is only supported on Windows 11");
            }

            // Register global hotkey
            let handle = app.handle().clone();
            let app_handle = handle.clone();
            
            let conn = rusqlite::Connection::open(db::get_db_path()).unwrap();
            let settings = db::read_app_settings(&conn).unwrap_or_else(|e| {
                eprintln!("[CHANGE 15] read_app_settings failed: {}; using defaults", e);
                models::AppSettings::default()
            });

            let shortcut_str = hotkey_to_shortcut_str(&settings.capture_hotkey);
            
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
            let shortcut: Shortcut = shortcut_str.parse().unwrap();
            
            if let Err(e) = app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |_app, shortcut_event, event| {
                        if shortcut_event == &shortcut && event.state() == ShortcutState::Pressed {
                            let result = read_clipboard_inner();
                            app_handle.emit("capture-hotkey-triggered", &result).ok();
                            println!(
                                "[CHANGE 15/16] capture-hotkey-triggered emitted ({})",
                                result.kind_label()
                            );
                        }
                    })
                    .build(),
            ) {
                eprintln!("[CHANGE 15] plugin err: {}", e);
            }
            
            if let Err(e) = handle.global_shortcut().register(shortcut.clone()) {
                eprintln!("[CHANGE 15] register err: {}", e);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_workspace_document,
            list_workspace_documents,
            create_vault_item,
            list_vault_items,
            open_workspace_documents,
            new_workspace_document,
            rename_workspace_document,
            update_workspace_document_body,
            update_workspace_document_type,
            set_active_tab,
            reorder_tabs,
            close_tab,
            save_workspace_document,
            mark_tab_closed,
            save_workspace_document_to_vault,
            delete_vault_item,
            export_vault_item,
            update_workspace_document_tags,
            update_vault_item_tags,
            get_all_tags,
            search_vault_items,
            read_clipboard,
            open_vault_item_for_edit,
            capture_workspace_document,
            get_app_settings,
            update_app_settings,
        ]);

    builder.run(tauri::generate_context!())
        .expect("error while running tauri application");
}
`;
fs.appendFileSync('src-tauri/src/lib.rs', runStr);
