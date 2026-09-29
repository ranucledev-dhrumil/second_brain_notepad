const fs = require('fs');

function fixWorkspaceEditor() {
  const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\WorkspaceEditor\\WorkspaceEditor.tsx';
  let content = fs.readFileSync(path, 'utf8');

  const oldCode = `            const link = target.closest('a');
            if (link && link.href) {
              event.preventDefault();
              event.stopPropagation();
              openUrl(link.href).catch(console.error);
              return true;
            }`;

  const newCode = `            const link = target.closest('a');
            if (link) {
              let href = link.getAttribute('href');
              if (href) {
                event.preventDefault();
                event.stopPropagation();
                if (!/^[a-zA-Z][a-zA-Z\\d+\\-.]*:/.test(href)) {
                  href = 'https://' + href;
                }
                openUrl(href).catch(console.error);
                return true;
              }
            }`;

  content = content.replace(oldCode, newCode);
  fs.writeFileSync(path, content, 'utf8');
  console.log("WorkspaceEditor fixed.");
}

function fixVaultBrowser() {
  const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\VaultBrowser\\VaultBrowser.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Fix VaultItemRenderer handleClick
  const oldCode = `          const link = target.closest('a');
          if (link && link.href) {
            event.preventDefault();
            event.stopPropagation();
            openUrl(link.href).catch(console.error);
            return true;
          }`;

  const newCode = `          const link = target.closest('a');
          if (link) {
            let href = link.getAttribute('href');
            if (href) {
              event.preventDefault();
              event.stopPropagation();
              if (!/^[a-zA-Z][a-zA-Z\\d+\\-.]*:/.test(href)) {
                href = 'https://' + href;
              }
              openUrl(href).catch(console.error);
              return true;
            }
          }`;
  content = content.replace(oldCode, newCode);

  // Fix explicit link item
  const oldLinkCode = `                        onClick={(e) => {
                          e.preventDefault();
                          openUrl(selectedItem.sourceUrl || selectedItem.body).catch(console.error);
                        }}`;
  const newLinkCode = `                        onClick={(e) => {
                          e.preventDefault();
                          let href = selectedItem.sourceUrl || selectedItem.body;
                          if (href) {
                            if (!/^[a-zA-Z][a-zA-Z\\d+\\-.]*:/.test(href)) {
                              href = 'https://' + href;
                            }
                            openUrl(href).catch(console.error);
                          }
                        }}`;
  content = content.replace(oldLinkCode, newLinkCode);

  fs.writeFileSync(path, content, 'utf8');
  console.log("VaultBrowser fixed.");
}

fixWorkspaceEditor();
fixVaultBrowser();
