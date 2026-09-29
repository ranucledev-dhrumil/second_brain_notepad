const fs = require('fs');

function wrapOpenUrl(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // We will intercept openUrl to see if it's called multiple times
  const interceptCode = `
let openUrlCallCount = 0;
const safeOpenUrl = (url: string) => {
  openUrlCallCount++;
  console.log('openUrl called! Count:', openUrlCallCount, 'URL:', url);
  if (openUrlCallCount > 1) {
    console.log('Preventing duplicate openUrl within the same session!');
    // Reset after a short delay
    setTimeout(() => { openUrlCallCount = 0; }, 500);
    return Promise.resolve();
  }
  setTimeout(() => { openUrlCallCount = 0; }, 500);
  return openUrl(url);
};
`;

  if (!content.includes('safeOpenUrl')) {
    // Insert after imports
    content = content.replace(`import { openUrl } from '@tauri-apps/plugin-opener';`, `import { openUrl } from '@tauri-apps/plugin-opener';\n${interceptCode}`);
    
    // Replace openUrl with safeOpenUrl (only where we added it)
    content = content.replace(/openUrl\(formatUrl\(href\)\)/g, `safeOpenUrl(formatUrl(href))`);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Wrapped openUrl in " + filePath);
  }
}

wrapOpenUrl('D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\WorkspaceEditor\\WorkspaceEditor.tsx');
wrapOpenUrl('D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\VaultBrowser\\VaultBrowser.tsx');
