const fs = require('fs');

const code = `
#[tauri::command]
fn rename_workspace_document(
    state: tauri::State<db::DbState>,
    id: String,
    title: String,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::db_rename_workspace_document(&mut conn, &id, &title)
}

#[tauri::command]
fn update_workspace_document_body(
    state: tauri::State<db::DbState>,
    id: String,
    body: String,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_update_body(&mut conn, &id, &body, &now)
}

#[tauri::command]
fn update_workspace_document_type(
    state: tauri::State<db::DbState>,
    id: String,
    suggested_type: String,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_update_workspace_document_type(&mut conn, &id, &suggested_type, &now)
}

#[tauri::command]
fn set_active_tab(
    state: tauri::State<db::DbState>,
    id: String,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_set_active_tab(&mut conn, &id, &now)
}

#[tauri::command]
fn reorder_tabs(
    state: tauri::State<db::DbState>,
    updates: Vec<TabOrderUpdate>,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    let orders: Vec<(String, u32)> = updates.into_iter().map(|u| (u.id, u.tab_order)).collect();
    db::db_reorder_tabs(&mut conn, &orders, &now)
}

#[tauri::command]
fn close_tab(
    state: tauri::State<db::DbState>,
    id: String,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_close_tab(&mut conn, &id, &now)
}

#[tauri::command]
fn save_workspace_document(
    state: tauri::State<db::DbState>,
    payload: SaveContentPayload,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_save_workspace_document(
        &conn,
        &payload.id,
        &payload.body,
        payload.cursor_position,
        payload.cursor_selection_start,
        payload.cursor_selection_end,
        payload.scroll_top,
        payload.scroll_left,
        payload.url.as_deref(),
        &now,
    )
}

#[tauri::command]
fn mark_tab_closed(
    state: tauri::State<db::DbState>,
    id: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_mark_tab_closed(&conn, &id, &now)
}

#[tauri::command]
fn save_workspace_document_to_vault(
    id: String,
    state: tauri::State<db::DbState>,
) -> Result<(), String> {
    use chrono::Utc;
    use uuid::Uuid;

    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let tx = guard
        .transaction()
        .map_err(|e| format!("save_workspace_document_to_vault transaction: {}", e))?;

    let (title, body, type_str, source_vault_item_id, doc_url): (String, String, String, Option<String>, Option<String>) = tx
        .query_row(
            "SELECT title, body, suggested_type, source_vault_item_id, url FROM workspace_documents WHERE id = ?1",
            rusqlite::params![id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
        )
        .map_err(|e| format!("save_workspace_document_to_vault read: {}", e))?;

    let vault_type_str = match models::ContentType::from_db_str(&type_str)
        .unwrap_or(models::ContentType::Note)
    {
        models::ContentType::CodeSnippet => "codeSnippet",
        models::ContentType::Link        => "link",
        _                                => "note",
    };

    let mut tag_stmt = tx.prepare("SELECT tag FROM workspace_document_tags WHERE doc_id = ?1").unwrap();
    let tag_rows = tag_stmt.query_map(rusqlite::params![id], |row| row.get::<_, String>(0)).unwrap();
    let mut tags = Vec::new();
    for t in tag_rows.flatten() {
        tags.push(t);
    }
    drop(tag_stmt);

    let now = Utc::now().to_rfc3339();
    
    let (link_source_url, link_source_domain) = if vault_type_str == "link" {
        let u_opt = doc_url.as_ref().map(|s| s.trim()).filter(|s| !s.is_empty());
        let domain = u_opt.and_then(|trimmed| {
            let without_proto = if let Some(stripped) = trimmed.strip_prefix("https://") {
                stripped
            } else if let Some(stripped) = trimmed.strip_prefix("http://") {
                stripped
            } else {
                trimmed
            };
            without_proto.split('/').next().map(|s| s.to_string())
        });
        (u_opt.map(|s| s.to_string()), domain)
    } else {
        (None, None)
    };

    let target_vault_id = if let Some(vault_id) = source_vault_item_id {
        tx.execute(
            "UPDATE vault_items SET title = ?1, body = ?2, type = ?3, updated_at = ?4, source_url = COALESCE(?5, source_url), source_domain = COALESCE(?6, source_domain) WHERE id = ?7",
            rusqlite::params![title, body, vault_type_str, now, link_source_url, link_source_domain, vault_id.clone()],
        )
        .map_err(|e| format!("save_workspace_document_to_vault update: {}", e))?;
        vault_id
    } else {
        let vault_id = Uuid::new_v4().to_string();
        tx.execute(
            "INSERT INTO vault_items
             (id, title, body, type, source_url, source_domain,
              source_title, captured_at, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, NULL, ?7, ?8)",
            rusqlite::params![vault_id, title, body, vault_type_str, link_source_url, link_source_domain, now.clone(), now],
        )
        .map_err(|e| format!("save_workspace_document_to_vault insert: {}", e))?;
        vault_id
    };

    tx.execute("DELETE FROM vault_item_tags WHERE item_id = ?1", rusqlite::params![target_vault_id])
        .map_err(|e| format!("save_workspace_document_to_vault delete tags: {}", e))?;
    
    for tag in tags {
        tx.execute(
            "INSERT INTO vault_item_tags (item_id, tag) VALUES (?1, ?2)",
            rusqlite::params![target_vault_id, tag],
        )
        .map_err(|e| format!("save_workspace_document_to_vault insert tags: {}", e))?;
    }

    tx.commit()
        .map_err(|e| format!("save_workspace_document_to_vault commit: {}", e))?;

    Ok(())
}

#[tauri::command]
fn delete_vault_item(id: String, state: tauri::State<db::DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::db_delete_vault_item(&conn, &id)
}

#[tauri::command]
fn export_vault_item(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content.as_bytes())
        .map_err(|e| format!("export failed: {}", e))
}

#[tauri::command]
fn update_workspace_document_tags(
    id: String,
    tags: Vec<String>,
    state: tauri::State<db::DbState>,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::db_update_workspace_document_tags(&mut conn, &id, tags)
}

#[tauri::command]
fn update_vault_item_tags(
    id: String,
    tags: Vec<String>,
    state: tauri::State<db::DbState>,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::db_update_vault_item_tags(&mut conn, &id, tags)
}

#[tauri::command]
fn get_all_tags(
    state: tauri::State<db::DbState>,
) -> Result<Vec<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::db_get_all_tags(&conn)
}

#[tauri::command]
fn search_vault_items(
    state: tauri::State<db::DbState>,
    query: String,
    content_type: Option<String>,
    tag: Option<String>,
) -> Result<Vec<models::VaultItem>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::search_vault_items(&conn, &query, content_type.as_deref(), tag.as_deref())
}

#[tauri::command]
fn read_clipboard() -> models::ClipboardCaptureResult {
    crate::detector::read_clipboard_inner()
}

#[tauri::command]
fn get_app_settings(
    state: tauri::State<db::DbState>,
) -> Result<models::AppSettings, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::read_app_settings(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_app_settings(
    state: tauri::State<db::DbState>,
    settings: models::AppSettings,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::db_update_app_settings(&mut conn, &settings)
}
`;

let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

// The file currently has run() at the end.
// I will insert all this right before run().
lib = lib.replace('#[cfg_attr(mobile, tauri::mobile_entry_point)]\npub fn run() {', code + '\n\n#[cfg_attr(mobile, tauri::mobile_entry_point)]\npub fn run() {');

// I also need to make sure the open_vault_item_for_edit and capture_workspace_document are there.
// They were written to scratch/fn.rs and scratch/cap.rs.
const fnStr = fs.readFileSync('scratch/fn.rs', 'utf8');
const capStr = fs.readFileSync('scratch/cap.rs', 'utf8');

lib = lib.replace('#[cfg_attr(mobile, tauri::mobile_entry_point)]\npub fn run() {', fnStr + '\n\n' + capStr + '\n\n#[cfg_attr(mobile, tauri::mobile_entry_point)]\npub fn run() {');

fs.writeFileSync('src-tauri/src/lib.rs', lib);
