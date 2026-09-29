const Database = require('better-sqlite3');
try {
    const db = new Database('C:\\Users\\Admin\\AppData\\Roaming\\SecondBrain\\database.sqlite');
    
    // Check user_version (migration level)
    const version = db.prepare("PRAGMA user_version").get();
    console.log("DB user_version (migrations applied):", version.user_version);
    
    // Check if url column exists
    const cols = db.prepare("PRAGMA table_info(workspace_documents)").all();
    console.log("workspace_documents columns:", cols.map(c => c.name));
    
    // Check if is_open exists
    const openDocs = db.prepare("SELECT id, title, is_open FROM workspace_documents LIMIT 5").all();
    console.log("Open docs sample:", openDocs);
    
} catch (e) {
    console.error("Error:", e.message);
}
