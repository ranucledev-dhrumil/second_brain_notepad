const fs = require('fs');

// The REAL fix: Create a custom Tiptap Link extension that overrides renderHTML
// to output data-href instead of href. Since there is no real href, Tauri's
// OS-level interceptor (which watches href attributes) finds nothing to grab.
// Our JS click handler reads data-href instead.
//
// This is applied in BOTH WorkspaceEditor and VaultBrowser.

const customLinkExtensionCode = `// Custom Link extension: renders data-href instead of href so Tauri's OS-level
// link interceptor (triggered by real href attributes) never fires.
const SafeLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    const { href, ...rest } = HTMLAttributes;
    return ['a', { ...rest, 'data-href': href, class: 'safe-link' }, 0];
  },
});
`;

function fixWorkspaceEditor() {
  const filePath = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\WorkspaceEditor\\WorkspaceEditor.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert SafeLink definition after the openUrl import
  if (!content.includes('const SafeLink')) {
    content = content.replace(
      `import { openUrl } from '@tauri-apps/plugin-opener';`,
      `import { openUrl } from '@tauri-apps/plugin-opener';\n\n${customLinkExtensionCode}`
    );
  }

  // Replace Link.configure with SafeLink.configure
  content = content.replace(
    /Link\.configure\(\{ openOnClick: false.*?\}\)/gs,
    `SafeLink.configure({ openOnClick: false })`
  );

  // Update handleClick to read data-href
  content = content.replace(
    `let href = link.getAttribute('href');`,
    `let href = link.getAttribute('data-href') || link.getAttribute('href');`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("WorkspaceEditor updated.");
}

function fixVaultBrowser() {
  const filePath = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\VaultBrowser\\VaultBrowser.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert SafeLink definition after the openUrl import
  if (!content.includes('const SafeLink')) {
    content = content.replace(
      `import { openUrl } from '@tauri-apps/plugin-opener';`,
      `import { openUrl } from '@tauri-apps/plugin-opener';\n\n${customLinkExtensionCode}`
    );
  }

  // Replace Link.configure with SafeLink.configure
  content = content.replace(
    /Link\.configure\(\{ openOnClick: false.*?\}\)/gs,
    `SafeLink.configure({ openOnClick: false })`
  );

  // Update handleClick to read data-href
  content = content.replace(
    /let href = link\.getAttribute\('href'\);/g,
    `let href = link.getAttribute('data-href') || link.getAttribute('href');`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("VaultBrowser updated.");
}

fixWorkspaceEditor();
fixVaultBrowser();
