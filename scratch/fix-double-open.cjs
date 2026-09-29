const fs = require('fs');

function getFormatUrlFn() {
  return `function formatUrl(href: string): string {
  href = href.trim();
  if (/^[a-zA-Z][a-zA-Z\\d+\\-.]*:/.test(href)) {
    return href;
  }
  if (href.includes('.') && !href.includes(' ')) {
    return 'https://' + href;
  }
  return 'https://www.google.com/search?q=' + encodeURIComponent(href);
}
`;
}

function fixWorkspaceEditor() {
  const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\WorkspaceEditor\\WorkspaceEditor.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Insert formatUrl if not exists
  if (!content.includes('function formatUrl')) {
    content = content.replace(`export default function WorkspaceEditor`, getFormatUrlFn() + `\nexport default function WorkspaceEditor`);
  }

  // Update Link.configure
  content = content.replace(/Link\.configure\(\{ openOnClick: false \}\)/g, `Link.configure({ openOnClick: false, HTMLAttributes: { target: null } })`);

  // Update handleClick logic
  const oldCode = `                if (!/^[a-zA-Z][a-zA-Z\\d+\\-.]*:/.test(href)) {
                  href = 'https://' + href;
                }
                openUrl(href).catch(console.error);`;
  const newCode = `                openUrl(formatUrl(href)).catch(console.error);`;
  content = content.replace(oldCode, newCode);

  fs.writeFileSync(path, content, 'utf8');
  console.log("WorkspaceEditor fixed.");
}

function fixVaultBrowser() {
  const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\VaultBrowser\\VaultBrowser.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Insert formatUrl if not exists
  if (!content.includes('function formatUrl')) {
    content = content.replace(`export default function VaultBrowser`, getFormatUrlFn() + `\nexport default function VaultBrowser`);
  }

  // Update Link.configure
  content = content.replace(/Link\.configure\(\{ openOnClick: false \}\)/g, `Link.configure({ openOnClick: false, HTMLAttributes: { target: null } })`);

  // Update handleClick logic
  const oldCode1 = `              if (!/^[a-zA-Z][a-zA-Z\\d+\\-.]*:/.test(href)) {
                href = 'https://' + href;
              }
              openUrl(href).catch(console.error);`;
  const newCode1 = `              openUrl(formatUrl(href)).catch(console.error);`;
  content = content.replace(oldCode1, newCode1);

  // Update explicit link logic
  const oldCode2 = `                          if (!/^[a-zA-Z][a-zA-Z\\d+\\-.]*:/.test(href)) {
                              href = 'https://' + href;
                            }
                            openUrl(href).catch(console.error);`;
  const newCode2 = `                            openUrl(formatUrl(href)).catch(console.error);`;
  content = content.replace(oldCode2, newCode2);

  // Remove target="_blank" and rel="noreferrer" from explicit link
  content = content.replace(/target="_blank"\s*rel="noreferrer"/g, "");

  fs.writeFileSync(path, content, 'utf8');
  console.log("VaultBrowser fixed.");
}

fixWorkspaceEditor();
fixVaultBrowser();
