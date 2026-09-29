const fs = require('fs');

let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

lib = lib.replace(/            \/\/ Initialize Database\n            use tauri::Manager;\n            let mut conn = rusqlite::Connection::open\(""\)\n                \.map_err\(\|e\| e\.to_string\(\)\)\?;\n            \n            app\.manage\(db::DbState\(std::sync::Mutex::new\(conn\)\)\);\n/g, '');

lib = lib.replace(/                Err\(e\) => panic!\("Database initialization failed: \{\}", e\),\n            \};/, `                Err(e) => panic!("Database initialization failed: {}", e),
            };
            app.manage(db::DbState(std::sync::Mutex::new(conn)));
            
            // Re-acquire for read_app_settings since we just gave it away
            let conn = app.state::<db::DbState>().0.lock().unwrap();`);

fs.writeFileSync('src-tauri/src/lib.rs', lib);
