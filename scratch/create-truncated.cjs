const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dir = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\scratch\\test-appdata\\SecondBrain';
fs.mkdirSync(dir, { recursive: true });
const dbPath = path.join(dir, 'database.sqlite');

// Create a real DB
const db = new Database(dbPath);
db.exec("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)");
for (let i = 0; i < 1000; i++) {
    db.prepare("INSERT INTO test (data) VALUES (?)").run(`Some padding data to make the file larger ${i} AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`);
}
db.close();

const originalSize = fs.statSync(dbPath).size;
console.log(`Original DB size: ${originalSize} bytes`);

// Truncate it
const fd = fs.openSync(dbPath, 'r+');
const newSize = Math.floor(originalSize / 2); // Cut exactly in half
fs.ftruncateSync(fd, newSize);
fs.closeSync(fd);

console.log(`Truncated DB size: ${fs.statSync(dbPath).size} bytes`);
