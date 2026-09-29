const fs = require('fs');

const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src-tauri\\src\\lib.rs';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `            let conn = match db::init_db() {
                Ok(c) => c,
                Err(e) if e.starts_with("CORRUPTION_DETECTED") => {
                    use tauri_plugin_dialog::DialogExt;
                    let app_data_dir = std::path::PathBuf::from(std::env::var("APPDATA").unwrap()).join("SecondBrain");
                    let db_path = app_data_dir.join("database.sqlite");
                    let backup_path = app_data_dir.join(format!("database_corrupt_{}.sqlite", chrono::Utc::now().format("%Y%m%d_%H%M%S")));
                    std::fs::rename(&db_path, &backup_path).unwrap();
                    app.dialog().message(format!("Database corruption detected and moved to {:?}. A new database will be created.", backup_path)).title("Database Error").blocking_show();
                    db::init_db().unwrap()
                },
                Err(e) => panic!("Database initialization failed: {}", e),
            };`;

const newCode = `            let conn = match db::init_db() {
                Ok(c) => {
                    eprintln!("init_db succeeded!");
                    c
                },
                Err(e) if e.starts_with("CORRUPTION_DETECTED") => {
                    eprintln!("CORRUPTION DETECTED! {}", e);
                    use tauri_plugin_dialog::DialogExt;
                    let app_data_dir = std::path::PathBuf::from(std::env::var("APPDATA").unwrap()).join("SecondBrain");
                    let db_path = app_data_dir.join("database.sqlite");
                    let backup_path = app_data_dir.join(format!("database_corrupt_{}.sqlite", chrono::Utc::now().format("%Y%m%d_%H%M%S")));
                    eprintln!("Renaming {:?} to {:?}", db_path, backup_path);
                    std::fs::rename(&db_path, &backup_path).unwrap();
                    app.dialog().message(format!("Database corruption detected and moved to {:?}. A new database will be created.", backup_path)).title("Database Error").blocking_show();
                    eprintln!("Dialog closed, initializing new db...");
                    db::init_db().unwrap()
                },
                Err(e) => {
                    eprintln!("Database initialization failed with: {}", e);
                    panic!("Database initialization failed: {}", e)
                },
            };`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(path, content, 'utf8');
