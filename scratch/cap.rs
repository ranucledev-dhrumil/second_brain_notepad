#[tauri::command]
fn capture_workspace_document(
    state: tauri::State<db::DbState>,
    title: String,
    body: String,
    suggested_type: String,
    source_vault_item_id: Option<String>,
) -> Result<models::WorkspaceDocument, String> {
    use chrono::Utc;
    use uuid::Uuid;

    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();

    let tab_order = db::db_get_next_tab_order(&mut *guard).unwrap_or(0);

    db::db_create_workspace_document(
        &mut *guard,
        &id,
        &title,
        &body,
        &suggested_type,
        tab_order,
        None,
        &source_vault_item_id,
        &now,
    )?;

    // Deactivate all other tabs, make this one active
    db::db_set_active_tab(&mut *guard, &id, &now)?;

    let tags = if let Some(ref vault_id) = source_vault_item_id {
        let mut stmt = guard.prepare("SELECT tag FROM vault_item_tags WHERE item_id = ?1").unwrap();
        let rows = stmt.query_map(rusqlite::params![vault_id], |row| row.get::<_, String>(0)).unwrap();
        let mut t = Vec::new();
        for tag in rows.flatten() {
            guard.execute("INSERT INTO workspace_document_tags (doc_id, tag) VALUES (?1, ?2)", rusqlite::params![&id, &tag]).unwrap();
            t.push(tag);
        }
        t
    } else {
        Vec::new()
    };

    Ok(models::WorkspaceDocument {
        id,
        title,
        body,
        suggested_type: models::ContentType::from_db_str(&suggested_type).unwrap_or(models::ContentType::Note),
        tab_order,
        is_active: true,
        is_open: true,
        cursor_state: models::CursorState { position: 0, selection_start: 0, selection_end: 0 },
        scroll_state: models::ScrollState { scroll_top: 0.0, scroll_left: 0.0 },
        created_at: now.clone(),
        updated_at: now,
        attachments: vec![],
        tags,
        source_vault_item_id,
        url: None,
    })
}