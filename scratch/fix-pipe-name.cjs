const fs = require('fs');
let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

lib = lib.replace(/const PIPE_NAME: &str = r"\\\\\\\\\\.\\\\pipe\\\\second-brain-nmh";/, 'const PIPE_NAME: &str = r"\\\\.\\pipe\\second-brain-nmh";');

fs.writeFileSync('src-tauri/src/lib.rs', lib);
