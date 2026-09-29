const fs = require('fs');
let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

const code = `
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

lib = lib.replace('// "?"? CHANGE 05 commands', code + '\n// "?"? CHANGE 05 commands');

lib = lib.replace(/models::ClipboardCaptureResult/g, 'ClipboardCaptureResult');
lib = lib.replace(/crate::detector::read_clipboard_inner/g, 'read_clipboard_inner');
lib = lib.replace(/db::get_db_path\(\)/g, '""'); // Just fix the lines manually
lib = lib.replace('let mut conn = rusqlite::Connection::open("").unwrap();', 'let mut conn = db::init_db().unwrap();');
lib = lib.replace('db::db_setup(&mut conn).unwrap();', '');

// for start_named_pipe_server:
lib = lib.replace('let state = app_handle.state::<db::DbState>();', 'let state = app_handle.state::<db::DbState>();'); // no change
// wait, the init logic in run:
// "let mut conn = rusqlite::Connection::open(db::get_db_path())"
// ".map_err(|e| e.to_string())?;"
// "db::db_setup(&mut conn).unwrap();"

lib = lib.replace(/let mut conn = rusqlite::Connection::open\(""\)[\s\S]*?db::db_setup\(&mut conn\)\.unwrap\(\);/, 'let conn = db::init_db().unwrap();');
lib = lib.replace(/let conn = rusqlite::Connection::open\(""\)\.unwrap\(\);/, 'let conn = db::init_db().unwrap();');

fs.writeFileSync('src-tauri/src/lib.rs', lib);
