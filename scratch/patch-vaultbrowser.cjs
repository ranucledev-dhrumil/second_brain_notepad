const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\VaultBrowser\\VaultBrowser.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Import exportAsTxt for preview stripping
content = content.replace(
  `import type { VaultItem, ContentType } from '../../types';`,
  `import type { VaultItem, ContentType } from '../../types';
import { exportAsTxt } from '../../lib/exportMarkdown';`
);

// 2. Strip markdown from preview snippet
content = content.replace(
  `                      <p className="vault-item-card__preview">{item.body || '(Empty)'}</p>`,
  `                      <p className="vault-item-card__preview">
                        {exportAsTxt(item.body || '').slice(0, 120) || '(Empty)'}
                      </p>`
);

// 3. Replace "Exported successfully" flash with onFlash (auto-dismiss handled in App.tsx)
// Already uses onFlash?.('Exported successfully') — just keep it (showFlash in App handles dismiss)

// 4. Add border-top separator above vault-list-pane__header (done via CSS, not here)

fs.writeFileSync(path, content, 'utf8');
console.log("VaultBrowser.tsx updated");

const result = fs.readFileSync(path, 'utf8');
const checks = ['exportAsTxt', 'exportAsTxt(item.body'];
checks.forEach(c => console.log(c + ':', result.includes(c) ? 'OK' : 'MISSING'));
