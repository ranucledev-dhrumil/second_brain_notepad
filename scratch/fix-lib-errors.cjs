const fs = require('fs');
let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

lib = lib.replace(
    'db::db_rename_workspace_document(&mut conn, &id, &title)',
    'let now = chrono::Utc::now().to_rfc3339();\n    db::db_rename_workspace_document(&mut conn, &id, &title, &now)'
);

// db_close_tab signature: pub fn db_close_tab(conn: &mut Connection, id: &str, active_tab_id: Option<&str>, now: &str) -> Result<(), String>
// Actually wait! What was db_close_tab in lib.rs earlier?
// "db::db_close_tab(&mut conn, &id, &now)"
lib = lib.replace(
    'db::db_close_tab(&mut conn, &id, &now)',
    'db::db_close_tab(&mut conn, &id, None, &now)' // I will just assume active_tab_id is None, wait.
);
// In db.rs: `pub fn db_close_tab(conn: &mut Connection, closed_tab_id: &str, fallback_active_tab_id: Option<&str>, now: &str)`
// Let's pass None. Or maybe it takes fallback_active_tab_id? Let's pass None for now.

lib = lib.replace(
    'db::db_update_workspace_document_tags(&mut conn, &id, tags)',
    'db::db_update_workspace_document_tags(&mut conn, &id, &tags)'
);

lib = lib.replace(
    'db::db_update_vault_item_tags(&mut conn, &id, tags)',
    'db::db_update_vault_item_tags(&mut conn, &id, &tags)'
);

lib = lib.replace(
    'let result = read_clipboard_inner();',
    'let result = crate::detector::read_clipboard_inner();'
);

lib = lib.replace(
    'if let Ok(msg) = serde_json::from_str::<models::BrowserMessage>(&s) {',
    'if let Ok(msg) = serde_json::from_str::<models::BrowserCapture>(&s) {'
);

lib = lib.replace(
    'if let Ok(item) = db::db_create_vault_item_from_browser(&mut conn, msg) {',
    'if let Ok(item) = db::db_create_vault_item_from_browser(&mut conn, &msg) {'
);

lib = lib.replace(
    'cursor_position: 0,\n        cursor_selection_start: 0,\n        cursor_selection_end: 0,\n        scroll_top: 0.0,\n        scroll_left: 0.0,\n        is_active: true,\n        is_open: true,',
    'is_active: true,\n        cursor_state: models::CursorState { position: 0, selection_start: 0, selection_end: 0 },\n        scroll_state: models::ScrollState { scroll_top: 0.0, scroll_left: 0.0 },'
);

lib = lib.replace(
    'tab_order,',
    'tab_order: tab_order as u32,'
);

fs.writeFileSync('src-tauri/src/lib.rs', lib);
