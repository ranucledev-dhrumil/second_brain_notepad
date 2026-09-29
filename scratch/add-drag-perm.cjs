const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src-tauri\\capabilities\\default.json';
const config = JSON.parse(fs.readFileSync(path, 'utf8'));

if (!config.permissions.includes("core:window:allow-start-dragging")) {
  config.permissions.push("core:window:allow-start-dragging");
  fs.writeFileSync(path, JSON.stringify(config, null, 2), 'utf8');
  console.log("Added allow-start-dragging");
} else {
  console.log("Already exists");
}
