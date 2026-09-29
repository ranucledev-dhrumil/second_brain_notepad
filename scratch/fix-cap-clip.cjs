const fs = require('fs');

const actualCapture = `
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
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let ct = models::ContentType::from_db_str(&suggested_type)
        .unwrap_or(models::ContentType::Note);

    let tx = guard.transaction().map_err(|e| e.to_string())?;

    let tab_order: u32 = tx
        .query_row(
            "SELECT COALESCE(MAX(tab_order) + 1, 0) FROM workspace_documents WHERE is_open = 1",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|e| e.to_string())? as u32;

    tx.execute(
        "UPDATE workspace_documents SET is_active = 0 WHERE is_open = 1",
        [],
    )
    .map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO workspace_documents
         (id, title, body, suggested_type, tab_order, is_active, is_open,
          cursor_position, cursor_selection_start, cursor_selection_end,
          scroll_top, scroll_left, created_at, updated_at, source_vault_item_id)
         VALUES (?1, ?2, ?3, ?4, ?5, 1, 1, 0, 0, 0, 0.0, 0.0, ?6, ?6, ?7)",
        rusqlite::params![id, title, body, ct.to_db_str(), tab_order, now, source_vault_item_id],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(models::WorkspaceDocument {
        id,
        title,
        body,
        suggested_type: ct,
        tab_order,
        is_active: true,
        cursor_state: models::CursorState {
            position: 0,
            selection_start: 0,
            selection_end: 0,
        },
        scroll_state: models::ScrollState {
            scroll_top: 0.0,
            scroll_left: 0.0,
        },
        created_at: now.clone(),
        updated_at: now,
        attachments: vec![],
        tags: vec![],
        source_vault_item_id: source_vault_item_id.clone(),
        url: None,
    })
}
`;

const actualClipboard = `
#[derive(serde::Serialize)]
#[serde(tag = "status")]
pub enum ClipboardCaptureResult {
    #[serde(rename = "success")]
    Success { text: String, suggested_type: String },
    #[serde(rename = "empty")]
    Empty,
}
impl ClipboardCaptureResult {
    pub fn kind_label(&self) -> &str {
        match self {
            Self::Success { .. } => "success",
            Self::Empty => "empty",
        }
    }
}

pub fn read_clipboard_inner() -> ClipboardCaptureResult {
    if let Ok(mut clipboard) = arboard::Clipboard::new() {
        if let Ok(text) = clipboard.get_text() {
            let text = text.trim().to_string();
            if !text.is_empty() {
                let suggested_type = crate::detector::detect_content_type(&text).to_string();
                return ClipboardCaptureResult::Success { text, suggested_type };
            }
        }
    }
    ClipboardCaptureResult::Empty
}
`;

let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

const capStart = lib.indexOf('#[tauri::command]\nfn capture_workspace_document');
if (capStart !== -1) {
    const nextFn = lib.indexOf('#[tauri::command]', capStart + 10);
    if (nextFn !== -1) {
        lib = lib.slice(0, capStart) + actualCapture + '\n' + lib.slice(nextFn);
    } else {
        const runIdx = lib.indexOf('#[cfg_attr(mobile, tauri::mobile_entry_point)]');
        lib = lib.slice(0, capStart) + actualCapture + '\n' + lib.slice(runIdx);
    }
}

const rcStart = lib.indexOf('#[tauri::command]\nfn read_clipboard');
if (rcStart !== -1) {
    lib = lib.slice(0, rcStart) + actualClipboard + '\n' + lib.slice(rcStart);
}

fs.writeFileSync('src-tauri/src/lib.rs', lib);
