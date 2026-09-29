const fs = require('fs');
let content = fs.readFileSync('src-tauri/src/db.rs', 'utf8');
const search = 'let body = payload.selected_text.clone().unwrap_or_default();';
const replace = search + `\n
    // CHANGE 28: Duplicate detection (prevent rapid multiple saves)
    {
        let mut stmt = conn.prepare("SELECT id, created_at FROM vault_items WHERE IFNULL(source_url, '') = IFNULL(?1, '') AND body = ?2 ORDER BY rowid DESC LIMIT 1").unwrap();
        let mut rows = stmt.query(rusqlite::params![payload.url, body]).unwrap();
        if let Ok(Some(row)) = rows.next() {
            let existing_id: String = row.get(0).unwrap();
            let existing_created_at: String = row.get(1).unwrap();
            if let Ok(parsed_time) = chrono::DateTime::parse_from_rfc3339(&existing_created_at) {
                if chrono::Utc::now().signed_duration_since(parsed_time.with_timezone(&chrono::Utc)).num_seconds() < 5 {
                    return Ok((existing_id, vault_type.to_string()));
                }
            }
        }
    }\n`;
content = content.replace(search, replace);
fs.writeFileSync('src-tauri/src/db.rs', content);
