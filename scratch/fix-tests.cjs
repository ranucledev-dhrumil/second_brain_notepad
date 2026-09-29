const fs = require('fs');
let ts = fs.readFileSync('src-tauri/src/tests.rs', 'utf8');

ts = ts.replace('use second_brain_lib::db::{db_setup, db_save_workspace_document};', 'use crate::db::{db_save_workspace_document};');

fs.writeFileSync('src-tauri/src/tests.rs', ts);
