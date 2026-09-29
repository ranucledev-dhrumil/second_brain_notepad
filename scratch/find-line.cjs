const fs = require('fs');
const lines = fs.readFileSync('src-tauri/src/lib.rs', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes('fn capture_workspace_document'));
console.log("capture_workspace_document line: ", idx + 1);
