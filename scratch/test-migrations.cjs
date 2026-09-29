const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const BASE = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain';

// Create temp DB
const tmpPath = path.join(process.env.TEMP || '/tmp', 'sb_migration_test_' + Date.now() + '.sqlite');
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

migrations.forEach((sql, i) => {
  try {
    db.exec(sql);
    console.log('Migration ' + (i+1) + ': OK');
  } catch(e) {
    console.error('Migration ' + (i+1) + ' FAILED:', e.message);
    process.exit(1);
  }
});

const cols = db.pragma('table_info(workspace_documents)').map(c => c.name);
const aCols = db.pragma('table_info(app_settings)').map(c => c.name);
console.log('workspace_documents cols:', cols.join(', '));
console.log('app_settings cols:', aCols.join(', '));
console.log('url col present:', cols.includes('url') ? 'YES' : 'NO');
console.log('source_vault_item_id present:', cols.includes('source_vault_item_id') ? 'YES' : 'NO');
console.log('tags col (workspace_documents):', cols.includes('tags') ? 'DIRECT COL (unexpected)' : 'not direct col (join table approach - correct)');
const tagTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='workspace_document_tags'").get();
console.log('workspace_document_tags table:', tagTable ? 'EXISTS' : 'MISSING');
const editorZoom = aCols.includes('editor_zoom');
console.log('editor_zoom in app_settings:', editorZoom ? 'YES' : 'NO');

const settings = db.prepare('SELECT * FROM app_settings WHERE id=1').get();
console.log('app_settings default row:', JSON.stringify(settings));

// Check vault_items schema
const vCols = db.pragma('table_info(vault_items)').map(c => c.name);
console.log('vault_items cols:', vCols.join(', '));

db.close();
fs.unlinkSync(tmpPath);
console.log('ALL MIGRATION TESTS PASSED');
