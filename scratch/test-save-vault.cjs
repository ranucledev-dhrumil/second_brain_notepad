const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const BASE = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain';
const tmpPath = path.join(process.env.TEMP || '/tmp', 'sb_save_test_' + Date.now() + '.sqlite');
const db = new Database(tmpPath);

const migrations = [
  fs.readFileSync(path.join(BASE, 'src-tauri/migrations/001_initial.sql'), 'utf8'),
  fs.readFileSync(path.join(BASE, 'src-tauri/migrations/002_add_is_open.sql'), 'utf8'),
  fs.readFileSync(path.join(BASE, 'src-tauri/migrations/003_indexes.sql'), 'utf8'),
  fs.readFileSync(path.join(BASE, 'src-tauri/migrations/004_add_source_vault_item_id.sql'), 'utf8'),
  fs.readFileSync(path.join(BASE, 'src-tauri/migrations/005_add_editor_zoom.sql'), 'utf8'),
  fs.readFileSync(path.join(BASE, 'src-tauri/migrations/006_add_workspace_document_tags.sql'), 'utf8'),
  fs.readFileSync(path.join(BASE, 'src-tauri/migrations/007_add_url_to_workspace_documents.sql'), 'utf8'),
];

migrations.forEach(sql => db.exec(sql));

// Create workspace doc
db.prepare(`
  INSERT INTO workspace_documents (id, title, body, suggested_type, tab_order, created_at, updated_at) 
  VALUES ('test-id', 'Test Note', 'Hello world', 'note', 1, '2023-10-10', '2023-10-10')
`).run();

console.log("Workspace doc created.");

try {
  // Simulate Rust code
  const doc = db.prepare("SELECT title, body, suggested_type, source_vault_item_id, url FROM workspace_documents WHERE id = 'test-id'").get();
  console.log("Read doc:", doc);
  
  const vaultId = 'vault-id-123';
  db.prepare(`
    INSERT INTO vault_items
    (id, title, body, type, source_url, source_domain, source_title, captured_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)
  `).run(vaultId, doc.title, doc.body, doc.suggested_type, null, null, '2023-10-10', '2023-10-10');
  
  console.log("Saved to vault.");
} catch(e) {
  console.error("ERROR:", e);
}

db.close();
fs.unlinkSync(tmpPath);
