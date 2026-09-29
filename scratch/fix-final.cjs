const fs = require('fs');
let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

// Fix tab_order
lib = lib.replace(/tab_order,\n\s*is_active: true,/g, 'tab_order: tab_order as u32,\n        is_active: true,');
lib = lib.replace(/tab_order,\n\s*is_active: false,/g, 'tab_order: tab_order as u32,\n        is_active: false,');

// Fix is_open: true,
lib = lib.replace(/\s*is_open: true,/g, '');

fs.writeFileSync('src-tauri/src/lib.rs', lib);
