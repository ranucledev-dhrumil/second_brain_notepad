const fs = require('fs');

const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src-tauri\\src\\lib.rs';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `                    let app_data_dir = app.path().app_data_dir().unwrap();`;
const newCode = `                    let app_data_dir = std::path::PathBuf::from(std::env::var("APPDATA").unwrap()).join("SecondBrain");`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Not found.");
}
