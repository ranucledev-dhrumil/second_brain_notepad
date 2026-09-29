const fs = require('fs');

const pathDb = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src-tauri\\src\\db.rs';
let contentDb = fs.readFileSync(pathDb, 'utf8');

const oldCodeDb = `    if is_existing_db {
        eprintln!("is_existing_db is true. Running quick_check on {:?}", db_path);
        // CHANGE 21: Fast integrity check on startup to prevent silent corruption propagation
        let integrity_check = conn.query_row("PRAGMA quick_check", [], |row| row.get::<_, String>(0));
        match integrity_check {
            Ok(res) if res.to_lowercase() != "ok" => {
                eprintln!("quick_check returned: {}", res);
                return Err(format!("CORRUPTION_DETECTED: {}", res));
            }
            Err(e) => {
                eprintln!("quick_check returned Err: {}", e);
                // This catches "file is not a database" and other SQLite decode errors
                return Err(format!("CORRUPTION_DETECTED: {}", e));
            }
            _ => {
                eprintln!("quick_check returned ok");
            } // OK
        }
    } else {
        eprintln!("is_existing_db is false for {:?}", db_path);
    }`;

const newCodeDb = `    if is_existing_db {
        // CHANGE 21: Fast integrity check on startup to prevent silent corruption propagation
        let integrity_check = conn.query_row("PRAGMA quick_check", [], |row| row.get::<_, String>(0));
        match integrity_check {
            Ok(res) if res.to_lowercase() != "ok" => {
                return Err(format!("CORRUPTION_DETECTED: {}", res));
            }
            Err(e) => {
                // This catches "file is not a database" and other SQLite decode errors
                return Err(format!("CORRUPTION_DETECTED: {}", e));
            }
            _ => {} // OK
        }
    }`;

if (contentDb.includes(oldCodeDb)) {
  contentDb = contentDb.replace(oldCodeDb, newCodeDb);
  fs.writeFileSync(pathDb, contentDb, 'utf8');
}


const pathLib = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src-tauri\\src\\lib.rs';
let contentLib = fs.readFileSync(pathLib, 'utf8');

const oldCodeLib = `            let conn = match db::init_db() {
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

const newCodeLib = `            let conn = match db::init_db() {
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

if (contentLib.includes(oldCodeLib)) {
  contentLib = contentLib.replace(oldCodeLib, newCodeLib);
  fs.writeFileSync(pathLib, contentLib, 'utf8');
}

console.log("Trace removed.");
