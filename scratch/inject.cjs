const fs = require('fs');
const lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');
const fnStr = fs.readFileSync('scratch/fn.rs', 'utf8');
const newLib = lib.replace('fn capture_workspace_document', fnStr + '\nfn capture_workspace_document');
fs.writeFileSync('src-tauri/src/lib.rs', newLib);

// Also need to register it in generate_context!
const lines = fs.readFileSync('src-tauri/src/lib.rs', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes('capture_workspace_document,'));
lines.splice(idx, 0, '            open_vault_item_for_edit,');
fs.writeFileSync('src-tauri/src/lib.rs', lines.join('\n'));
