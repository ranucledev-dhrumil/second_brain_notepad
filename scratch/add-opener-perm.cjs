const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src-tauri\\capabilities\\default.json';
const config = JSON.parse(fs.readFileSync(path, 'utf8'));

if (!config.permissions.includes("opener:default")) {
  config.permissions.push("opener:default");
  fs.writeFileSync(path, JSON.stringify(config, null, 2), 'utf8');
  console.log("Added opener:default");
} else {
  console.log("Already exists");
}
