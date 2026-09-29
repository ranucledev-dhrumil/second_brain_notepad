
#[tauri::command]
fn open_vault_item_for_edit(
    source_vault_item_id: String,
    state: tauri::State<db::DbState>,
) -> Result<models::WorkspaceDocument, String> {
    use chrono::Utc;
    use uuid::Uuid;

    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();

    let tx = guard.transaction().map_err(|e| format!("open_vault_item_for_edit tx: {}", e))?;

    let (title, body, type_str, source_url): (String, String, String, Option<String>) = tx
        .query_row(
            "SELECT title, body, type, source_url FROM vault_items WHERE id = ?1",
            rusqlite::params![source_vault_item_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .map_err(|e| format!("open_vault_item_for_edit read: {}", e))?;

    let suggested_type = match type_str.as_str() {
        "codeSnippet" => "codeSnippet",
        "link" => "link",
        _ => "note",
    };

    let max_order: Option<i64> = tx
        .query_row(
            "SELECT MAX(tab_order) FROM workspace_documents",
            [],
            |row| row.get(0),
        )
        .ok()
        .flatten();
    let tab_order = max_order.map(|o| o + 1).unwrap_or(0);

    let url_for_workspace = if suggested_type == "link" {
        source_url
    } else {
        None
    };

    tx.execute(
        "INSERT INTO workspace_documents
         (id, title, body, suggested_type, tab_order,
          cursor_position, cursor_selection_start, cursor_selection_end,
          scroll_top, scroll_left, is_active, is_open, source_vault_item_id, url, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 0, 0, 0, 0.0, 0.0, 1, 1, ?6, ?7, ?8, ?8)",
        rusqlite::params![
            id,
            title,
            body,
            suggested_type,
            tab_order,
            source_vault_item_id,
            url_for_workspace,
            now
        ],
    )
    .map_err(|e| format!("open_vault_item_for_edit insert: {}", e))?;

    let mut tag_stmt = tx.prepare("SELECT tag FROM vault_item_tags WHERE item_id = ?1").unwrap();
    let tag_rows = tag_stmt.query_map(rusqlite::params![source_vault_item_id], |row| row.get::<_, String>(0)).unwrap();
    let mut tags = Vec::new();
    for t in tag_rows.flatten() {
        tags.push(t);
    }
    drop(tag_stmt);

    for tag in &tags {
        tx.execute(
            "INSERT INTO workspace_document_tags (doc_id, tag) VALUES (?1, ?2)",
            rusqlite::params![id, tag],
        )
        .map_err(|e| format!("open_vault_item_for_edit insert tags: {}", e))?;
    }

    tx.execute(
        "UPDATE workspace_documents SET is_active = 0 WHERE id != ?1",
        rusqlite::params![id],
    )
    .map_err(|e| format!("open_vault_item_for_edit update active: {}", e))?;

    tx.commit().map_err(|e| format!("open_vault_item_for_edit commit: {}", e))?;

    let doc = models::WorkspaceDocument {
        id,
        title,
        body,
        suggested_type: models::ContentType::from_db_str(suggested_type).unwrap_or(models::ContentType::Note),
        tab_order,
        cursor_position: 0,
        cursor_selection_start: 0,
        cursor_selection_end: 0,
        scroll_top: 0.0,
        scroll_left: 0.0,
        is_active: true,
        is_open: true,
        created_at: now.clone(),
        updated_at: now,
        attachments: vec![],
        tags,
        source_vault_item_id: Some(source_vault_item_id),
        url: url_for_workspace,
    };

    Ok(doc)
}
