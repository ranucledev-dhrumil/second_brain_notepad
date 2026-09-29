const fs = require('fs');
let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

if (!lib.includes('mod tests;')) {
    lib += '\n\n#[cfg(test)]\nmod tests;\n';
    fs.writeFileSync('src-tauri/src/lib.rs', lib);
}
