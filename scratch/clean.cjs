const fs = require('fs');
let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

// Remove open_vault_item_for_edit
const startIdx = lib.indexOf('#[tauri::command]\nfn open_vault_item_for_edit');
if (startIdx !== -1) {
    const endIdx = lib.indexOf('#[tauri::command]\nfn capture_workspace_document');
    lib = lib.slice(0, startIdx) + lib.slice(endIdx);
}

// Remove from generate_handler
lib = lib.replace(/open_vault_item_for_edit,\s*/g, '');

// Remove tests
const testIdx = lib.indexOf('#[cfg(test)]\nmod tests {');
if (testIdx !== -1) {
    lib = lib.slice(0, testIdx);
}

// Fix the macro mistake (where capture_workspace_document was replaced with open... inside macro)
lib = lib.replace(/__cmd__open_vault_item_for_edit[\s\S]*?__cmd__capture_workspace_document/, '__cmd__capture_workspace_document');
// Wait, I can just replace the weird handler stuff...
// If the handler looks weird:
if (lib.includes('open_vault_item_for_edit\nfn capture_workspace_document,')) {
    lib = lib.replace('open_vault_item_for_edit\nfn capture_workspace_document,', 'capture_workspace_document,');
}
fs.writeFileSync('src-tauri/src/lib.rs', lib);
