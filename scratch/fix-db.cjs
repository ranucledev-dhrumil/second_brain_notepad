const fs = require('fs');

const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src-tauri\\src\\db.rs';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `    let db_path = dir.join("database.sqlite");
    let mut conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database at {:?}: {}", db_path, e))?;

    // WAL mode: readers don't block writers - better for future multi-window use.
    // busy_timeout=5000: wait up to 5s for locks to resolve concurrent writes (CHANGE 21).
    // foreign_keys: enforce ON DELETE CASCADE on vault_item_tags.
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;")
        .map_err(|e| format!("Failed to set PRAGMA: {}", e))?;

    // CHANGE 21: Fast integrity check on startup to prevent silent corruption propagation
    let integrity_check: String = conn
        .query_row("PRAGMA quick_check", [], |row| row.get(0))
        .map_err(|e| format!("Failed to run integrity check: {}", e))?;

    if integrity_check.to_lowercase() != "ok" {
        return Err(format!("CORRUPTION_DETECTED: {}", integrity_check));
    }`;

const newCode = `    let db_path = dir.join("database.sqlite");
    
    // If the file exists and is not empty, we MUST verify its integrity BEFORE running pragmas.
    // Running WAL pragma on a garbage text file might otherwise corrupt it or fail with a generic error.
    let is_existing_db = fs::metadata(&db_path).map(|m| m.len() > 0).unwrap_or(false);

    let mut conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database at {:?}: {}", db_path, e))?;

    if is_existing_db {
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
    }

    // WAL mode: readers don't block writers - better for future multi-window use.
    // busy_timeout=5000: wait up to 5s for locks to resolve concurrent writes (CHANGE 21).
    // foreign_keys: enforce ON DELETE CASCADE on vault_item_tags.
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;")
        .map_err(|e| format!("Failed to set PRAGMA: {}", e))?;`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Could not find old code. Length:", oldCode.length);
  // Just print the region we want to replace
  const match = content.match(/let db_path = dir\.join\("database\.sqlite"\);[\s\S]*?return Err\(format!\("CORRUPTION_DETECTED: \{\}", integrity_check\)\);\n    \}/);
  if (match) {
    console.log("Found match with length:", match[0].length);
    content = content.replace(match[0], newCode);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Success with regex.");
  } else {
    console.log("Not found at all.");
  }
}
