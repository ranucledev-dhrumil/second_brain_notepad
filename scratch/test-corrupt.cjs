const Database = require('better-sqlite3');
const fs = require('fs');

const file = 'test-corruption.sqlite';
fs.writeFileSync(file, 'This is a garbage text file that is not a sqlite database at all.');

try {
  const db = new Database(file);
  console.log("Opened.");
  db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;");
  console.log("Pragmas set.");
  const check = db.pragma('quick_check', { simple: true });
  console.log("Quick check:", check);
} catch (e) {
  console.error("Error:", e.message);
}

console.log("File size:", fs.statSync(file).size);
