const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
const backupDir = path.resolve('..', 'second-brain-backup-' + timestamp);

fs.mkdirSync(backupDir);

cp.execSync(`xcopy src "${path.join(backupDir, 'src')}\\" /E /I /H /Y /C`);
cp.execSync(`xcopy src-tauri "${path.join(backupDir, 'src-tauri')}\\" /E /I /H /Y /C /EXCLUDE:exclude.txt`);

console.log("Backup created at:", backupDir);
