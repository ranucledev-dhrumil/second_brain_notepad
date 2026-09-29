const fs = require('fs');
const path = require('path');

const file = path.join('D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\App.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace the useEffect for browser-capture-saved
content = content.replace(
  /\/\*\*\s+\*\s+CHANGE 19[\s\S]*?\}, \[\]\);/,
  `/**
   * CHANGE 19: Browser integration (Chrome Extension).
   * Direct vault creation via named pipe.
   */
  useEffect(() => {
    let unlistenSaved: (() => void) | undefined;
    let unlistenError: (() => void) | undefined;
    
    listen<BrowserCaptureSaved>('browser-capture-saved', async () => {
      setFlashMessage("✓ Saved from Browser");
      setTimeout(() => setFlashMessage(null), 3000);
      try {
        const { sendNotification } = await import('@tauri-apps/plugin-notification');
        sendNotification({ title: 'Second Brain', body: 'Successfully saved from browser.' });
      } catch (e) { console.error(e); }
    }).then(fn => unlistenSaved = fn);
    
    listen<string>('browser-capture-error', async (event) => {
      setFlashMessage(\`Failed to save from browser: \${event.payload}\`);
      setTimeout(() => setFlashMessage(null), 5000);
      try {
        const { sendNotification } = await import('@tauri-apps/plugin-notification');
        sendNotification({ title: 'Second Brain Error', body: \`Failed to save from browser: \${event.payload}\` });
      } catch (e) { console.error(e); }
    }).then(fn => unlistenError = fn);

    return () => {
      unlistenSaved?.();
      unlistenError?.();
    };
  }, []);`
);

// Replace handleSaveToVaultDirectly
content = content.replace(
  /const handleSaveToVaultDirectly = async \(id: string\) => \{[\s\S]*?setTimeout\(\(\) => setFlashMessage\(null\), 3000\);\n\s*\}\n\s*\};/,
  `const handleSaveToVaultDirectly = async (id: string) => {
    try {
      await saveWorkspaceDocumentToVault(id);
      setFlashMessage("✓ Saved to Vault");
      setTimeout(() => setFlashMessage(null), 3000);
      try {
        const { sendNotification } = await import('@tauri-apps/plugin-notification');
        sendNotification({ title: 'Second Brain', body: 'Successfully saved to vault.' });
      } catch (e) { console.error(e); }
      await closeTab(id, true);
    } catch (e: unknown) {
      console.error('Failed to save to vault:', e);
      const msg = typeof e === 'string' ? e : "Couldn't save to Vault";
      setFlashMessage(msg);
      setTimeout(() => setFlashMessage(null), 3000);
      try {
        const { sendNotification } = await import('@tauri-apps/plugin-notification');
        sendNotification({ title: 'Second Brain Error', body: msg });
      } catch (err) { console.error(err); }
    }
  };`
);

fs.writeFileSync(file, content, 'utf8');
console.log('done');
