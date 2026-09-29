const Database = require('better-sqlite3');
try {
    const db = new Database('C:\\Users\\Admin\\AppData\\Roaming\\SecondBrain\\database.sqlite');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("Tables in database:", tables);
} catch (e) {
    console.error("Error opening db:", e);
}
