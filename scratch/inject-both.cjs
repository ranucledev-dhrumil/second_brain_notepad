const fs = require('fs');
let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');
const capStr = fs.readFileSync('scratch/cap.rs', 'utf8');
const fnStr = fs.readFileSync('scratch/fn.rs', 'utf8');

// Insert it right before #[tauri::command] fn get_app_settings
lib = lib.replace(
    '#[tauri::command]\nfn get_app_settings',
    fnStr + '\n\n' + capStr + '\n\n#[tauri::command]\nfn get_app_settings'
);

// add to generate_handler
lib = lib.replace(
    'get_app_settings,',
    'open_vault_item_for_edit,\n            capture_workspace_document,\n            get_app_settings,'
);

fs.writeFileSync('src-tauri/src/lib.rs', lib);
