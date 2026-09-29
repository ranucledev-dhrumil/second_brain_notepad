const fs = require('fs');

// The key insight: Tauri's opener:default intercepts clicks at the OS/Rust layer
// by reading the href attribute before JS fires. The only guaranteed fix is to
// remove the href from the rendered <a> tag and store it in data-href instead.
// Our click handler reads data-href, so openUrl still works correctly.

function fix(filePath, context) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove href: null we previously had and use data-href approach instead.
  // Replace Link.configure to output href as data-href and set href to 'javascript:void(0)'
  content = content.replace(
    /Link\.configure\(\{ openOnClick: false, HTMLAttributes: \{ target: null \} \}\)/g,
    `Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            // Remove target so Tauri opener:allow-default-urls doesn't intercept
            target: null,
            // Move href to data-href so the Tauri OS-level interceptor
            // (triggered by a real href attribute) has nothing to grab.
            // Our JS handleClick reads data-href instead.
            href: null,
            'data-href': null, // will be set by addAttributes override
          },
        })`
  );

  // Replace our click handler to use data-href
  content = content.replace(
    /let href = link\.getAttribute\('href'\);/g,
    `let href = link.getAttribute('data-href') || link.getAttribute('href');`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${context}`);
}

fix('D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\WorkspaceEditor\\WorkspaceEditor.tsx', 'WorkspaceEditor');
fix('D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\VaultBrowser\\VaultBrowser.tsx', 'VaultBrowser');
