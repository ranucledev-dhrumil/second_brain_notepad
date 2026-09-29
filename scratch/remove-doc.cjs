const fs = require('fs');
let lib = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

lib = lib.replace(
    `/// Creates a new workspace document pre-filled with captured content (CHANGE 16).
/// Distinct from new_workspace_document (blank tab): accepts body + suggested_type
/// so the capture workflow can pre-fill both without an extra round-trip.
`, ''
);

fs.writeFileSync('src-tauri/src/lib.rs', lib);
