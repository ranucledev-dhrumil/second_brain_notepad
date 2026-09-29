const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const BASE = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain';
const PROD_DB = 'C:\\Users\\Admin\\AppData\\Roaming\\SecondBrain\\database.sqlite';
const COPY_DB = path.join('C:\\Users\\Admin\\AppData\\Local\\Temp', 'sb_copy_test_' + Date.now() + '.sqlite');

// Copy production DB
fs.copyFileSync(PROD_DB, COPY_DB);
console.log('Copied production DB to:', COPY_DB);

const db = new Database(COPY_DB);

// List tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
console.log('Tables in DB:', tables.join(', '));

if (!tables.includes('workspace_documents')) {
  console.log('RESULT: DB appears to be empty/fresh-only (4096 bytes WAL). No pre-existing data to upgrade.');
  db.close();
  fs.unlinkSync(COPY_DB);
  process.exit(0);
}

const existingDocs = db.prepare('SELECT count(*) as c FROM workspace_documents').get().c;
const existingVault = db.prepare('SELECT count(*) as c FROM vault_items').get().c;
console.log('Pre: workspace_documents=' + existingDocs + ', vault_items=' + existingVault);

const cols = db.pragma('table_info(workspace_documents)').map(c => c.name);
const aCols = db.pragma('table_info(app_settings)').map(c => c.name);
console.log('workspace_documents cols:', cols.join(', '));
console.log('app_settings cols:', aCols.join(', '));
console.log('url present:', cols.includes('url') ? 'YES' : 'NO (migration needed)');
console.log('editor_zoom present:', aCols.includes('editor_zoom') ? 'YES' : 'NO (migration needed)');

db.close();
fs.unlinkSync(COPY_DB);
console.log('EXISTING DB CHECK COMPLETE');
