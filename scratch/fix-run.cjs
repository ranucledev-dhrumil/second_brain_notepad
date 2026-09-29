const fs = require('fs');
let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

const recoveryLogic = `
            let conn = match db::init_db() {
                Ok(c) => c,
                Err(e) if e.starts_with("CORRUPTION_DETECTED") => {
                    use tauri_plugin_dialog::DialogExt;
                    let app_data_dir = app.path().app_data_dir().unwrap();
                    let db_path = app_data_dir.join("database.sqlite");
                    let backup_path = app_data_dir.join(format!("database_corrupt_{}.sqlite", chrono::Utc::now().format("%Y%m%d_%H%M%S")));
                    std::fs::rename(&db_path, &backup_path).unwrap();
                    app.dialog().message(format!("Database corruption detected and moved to {:?}. A new database will be created.", backup_path)).title("Database Error").blocking_show();
                    db::init_db().unwrap()
                },
                Err(e) => panic!("Database initialization failed: {}", e),
            };
`;

lib = lib.replace(/let conn = db::init_db\(\)\.unwrap\(\);/, recoveryLogic);

fs.writeFileSync('src-tauri/src/lib.rs', lib);
