const fs = require('fs');
let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

lib = lib.replace(/apply_mica\(&window, Some\(true\)\)\.expect\("[^"]+"\);/, 'apply_mica(&window, Some(true)).ok();');

fs.writeFileSync('src-tauri/src/lib.rs', lib);
