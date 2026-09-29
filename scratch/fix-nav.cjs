const fs = require('fs');

function restoreOpenerDefault() {
  const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src-tauri\\capabilities\\default.json';
  const config = JSON.parse(fs.readFileSync(path, 'utf8'));

  const index = config.permissions.indexOf("opener:allow-open-url");
  if (index !== -1) {
    config.permissions.splice(index, 1);
  }
  if (!config.permissions.includes("opener:default")) {
    config.permissions.push("opener:default");
  }
  fs.writeFileSync(path, JSON.stringify(config, null, 2), 'utf8');
  console.log("Restored opener:default");
}

function fixWorkspaceEditor() {
  const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\WorkspaceEditor\\WorkspaceEditor.tsx';
  let content = fs.readFileSync(path, 'utf8');

  const oldCode = `        handleClick(_view, _pos, event) {
          if (event.ctrlKey) {
            const target = event.target as HTMLElement;
            const link = target.closest('a');
            if (link) {
              let href = link.getAttribute('href');
              if (href) {
                event.preventDefault();
                event.stopPropagation();
                safeOpenUrl(formatUrl(href)).catch(console.error);
                return true;
              }
            }
          }
          return false;
        },`;

  const newCode = `        handleClick(_view, _pos, event) {
          const target = event.target as HTMLElement;
          const link = target.closest('a');
          if (link) {
            // ALWAYS prevent default webview navigation for any click on a link
            event.preventDefault();
            
            if (event.ctrlKey) {
              event.stopPropagation();
              let href = link.getAttribute('href');
              if (href) safeOpenUrl(formatUrl(href)).catch(console.error);
              return true; // Stop ProseMirror processing
            }
            // If plain click: let ProseMirror handle cursor placement
            return false;
          }
          return false;
        },`;

  content = content.replace(oldCode, newCode);
  fs.writeFileSync(path, content, 'utf8');
  console.log("WorkspaceEditor click handler fixed.");
}

restoreOpenerDefault();
fixWorkspaceEditor();
