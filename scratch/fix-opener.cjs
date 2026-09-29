const fs = require('fs');
const pathEditor = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\WorkspaceEditor\\WorkspaceEditor.tsx';
const pathVault = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\VaultBrowser\\VaultBrowser.tsx';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/import \{ open \} from '@tauri-apps\/plugin-opener';/g, "import { openUrl } from '@tauri-apps/plugin-opener';");
  content = content.replace(/open\(/g, "openUrl(");
  content = content.replace(/handleClick\(view, pos, event\)/g, "handleClick(_view, _pos, event)");
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Fixed " + filePath);
}

fixFile(pathEditor);
fixFile(pathVault);
