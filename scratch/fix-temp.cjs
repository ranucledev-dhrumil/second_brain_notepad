const fs = require('fs');

let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

lib = lib.replace(/let conn = app\.state::<db::DbState>\(\)\.0\.lock\(\)\.unwrap\(\);/, `let state = app.state::<db::DbState>();
            let conn = state.0.lock().unwrap();`);

fs.writeFileSync('src-tauri/src/lib.rs', lib);
