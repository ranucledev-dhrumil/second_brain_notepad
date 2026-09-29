const fs = require('fs');

const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src-tauri\\src\\db.rs';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `    if is_existing_db {
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

const newCode = `    if is_existing_db {
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

content = content.replace(oldCode, newCode);
fs.writeFileSync(path, content, 'utf8');
