const fs = require('fs');
let code = fs.readFileSync('src-tauri/src/db.rs', 'utf8');

code = code.replace(
  /url: Option<&str>,/g,
  "url: Option<&str>,"
);

code = code.replace(
  /now,[\s]*url,[\s]*id,/g,
  "now,\n            url.map(|s| s.trim()).filter(|s| !s.is_empty()),\n            id,"
);

fs.writeFileSync('src-tauri/src/db.rs', code);
