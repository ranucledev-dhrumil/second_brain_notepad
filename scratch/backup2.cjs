const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
const backupDir = path.resolve('..', 'second-brain-backup-' + timestamp);

fs.mkdirSync(backupDir);
fs.writeFileSync(path.join(backupDir, 'exclude.txt'), 'target\nnode_modules\n');

cp.execSync(`xcopy src "${path.join(backupDir, 'src')}\\" /E /I /H /Y /C`);
cp.execSync(`xcopy src-tauri "${path.join(backupDir, 'src-tauri')}\\" /E /I /H /Y /C /EXCLUDE:${path.join(backupDir, 'exclude.txt')}`);
cp.execSync(`xcopy second-brain-host "${path.join(backupDir, 'second-brain-host')}\\" /E /I /H /Y /C /EXCLUDE:${path.join(backupDir, 'exclude.txt')}`);

console.log("Backup created at:", backupDir);
