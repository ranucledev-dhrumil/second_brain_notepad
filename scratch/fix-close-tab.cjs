const fs = require('fs');
let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

lib = lib.replace(
    /fn close_tab\(\s*state: tauri::State<db::DbState>,\s*id: String,\s*\) -> Result<\(\), String> \{\s*let mut conn = state\.0\.lock\(\)\.map_err\(\|e\| e\.to_string\(\)\)\?;\s*let now = chrono::Utc::now\(\)\.to_rfc3339\(\);\s*db::db_close_tab\(&mut conn, &id, None, &now\)\s*\}/,
    `fn close_tab(
    state: tauri::State<db::DbState>,
    id: String,
    body: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_close_tab(&conn, &id, &body, &now)
}`
);

fs.writeFileSync('src-tauri/src/lib.rs', lib);
