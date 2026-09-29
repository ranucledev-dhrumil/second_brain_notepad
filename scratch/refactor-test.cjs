const fs = require('fs');

let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

const innerFn = `
pub fn save_workspace_document_to_vault_inner(
    id: String,
    conn: &mut rusqlite::Connection,
) -> Result<(), String> {
    use chrono::Utc;
    use uuid::Uuid;

    let tx = conn
        .transaction()
        .map_err(|e| format!("save_workspace_document_to_vault transaction: {}", e))?;

    let (title, body, type_str, source_vault_item_id, doc_url): (String, String, String, Option<String>, Option<String>) = tx
        .query_row(
            "SELECT title, body, suggested_type, source_vault_item_id, url FROM workspace_documents WHERE id = ?1",
            rusqlite::params![id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
        )
        .map_err(|e| format!("save_workspace_document_to_vault read: {}", e))?;

    let vault_type_str = match crate::models::ContentType::from_db_str(&type_str)
        .unwrap_or(crate::models::ContentType::Note)
    {
        crate::models::ContentType::CodeSnippet => "codeSnippet",
        crate::models::ContentType::Link        => "link",
        _                                       => "note",
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
`;

lib = lib.replace(/#\[tauri::command\]\nfn save_workspace_document_to_vault\([\s\S]*?\n\}/, `
${innerFn}

#[tauri::command]
fn save_workspace_document_to_vault(
    id: String,
    state: tauri::State<db::DbState>,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    save_workspace_document_to_vault_inner(id, &mut guard)
}
`);
fs.writeFileSync('src-tauri/src/lib.rs', lib);

let tests = fs.readFileSync('src-tauri/src/tests.rs', 'utf8');

tests = tests.replace(/crate::save_workspace_document_to_vault\("([^"]+)"\.to_string\(\), state\.clone\(\)\)\.unwrap\(\);/g, 'crate::save_workspace_document_to_vault_inner("$1".to_string(), &mut conn).unwrap();');
tests = tests.replace(/let state = tauri::State::from[\s\S]*?\n/, '');
tests = tests.replace(/let mut conn = state\.0\.lock\(\)\.unwrap\(\);/g, '');
tests = tests.replace('crate::db::db_setup', 'crate::db::init_db'); // Wait, init_db() doesn't take &mut conn.
tests = tests.replace(/fn setup_test_db[\s\S]*?\}/, `
    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        // Run migrations
        let migrations = rusqlite_migration::Migrations::new(vec![
            rusqlite_migration::M::up(include_str!("../migrations/001_initial.sql")),
            rusqlite_migration::M::up(include_str!("../migrations/002_add_is_open.sql")),
            rusqlite_migration::M::up(include_str!("../migrations/003_indexes.sql")),
            rusqlite_migration::M::up(include_str!("../migrations/004_add_source_vault_item_id.sql")),
            rusqlite_migration::M::up(include_str!("../migrations/005_add_editor_zoom.sql")),
            rusqlite_migration::M::up(include_str!("../migrations/006_add_workspace_document_tags.sql")),
            rusqlite_migration::M::up(include_str!("../migrations/007_add_url_to_workspace_documents.sql")),
        ]);
        migrations.to_latest(&mut conn).unwrap();
        conn
    }
`);

fs.writeFileSync('src-tauri/src/tests.rs', tests);

