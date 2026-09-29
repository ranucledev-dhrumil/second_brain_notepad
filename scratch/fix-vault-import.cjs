const fs = require('fs');

let str = fs.readFileSync('src/components/VaultBrowser/VaultBrowser.tsx', 'utf8');

// Revert the bad import addition
str = str.replace(
  /import \{ NoteIcon, CodeIcon, LinkIcon, ImageIcon, FileIcon \} from '\.\.\/Icons\/Icons';\nimport \{ listen \} from '@tauri-apps\/api\/event';/,
  `import { NoteIcon, CodeIcon, LinkIcon, ImageIcon, FileIcon } from '../Icons/Icons';`
);

fs.writeFileSync('src/components/VaultBrowser/VaultBrowser.tsx', str);
