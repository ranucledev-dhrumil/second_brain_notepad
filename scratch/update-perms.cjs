const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src-tauri\\capabilities\\default.json';
const config = JSON.parse(fs.readFileSync(path, 'utf8'));

const index = config.permissions.indexOf("opener:default");
if (index !== -1) {
  config.permissions.splice(index, 1);
  config.permissions.push("opener:allow-open-url");
  fs.writeFileSync(path, JSON.stringify(config, null, 2), 'utf8');
  console.log("Replaced opener:default with opener:allow-open-url");
} else {
  if (!config.permissions.includes("opener:allow-open-url")) {
    config.permissions.push("opener:allow-open-url");
    fs.writeFileSync(path, JSON.stringify(config, null, 2), 'utf8');
    console.log("Added opener:allow-open-url");
  } else {
    console.log("Already updated");
  }
}
