const fs = require('fs');

const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. capture-hotkey-triggered
const captureOld = `  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<ClipboardReadResult>('capture-hotkey-triggered', event => {
      void onCaptureHotkeyTriggered(event.payload);
    }).then(fn => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, [onCaptureHotkeyTriggered]);`;

const captureNew = `  useEffect(() => {
    const unlistenPromise = listen<ClipboardReadResult>('capture-hotkey-triggered', event => {
      void onCaptureHotkeyTriggered(event.payload);
    });
    return () => {
      unlistenPromise.then(fn => fn());
    };
  }, [onCaptureHotkeyTriggered]);`;

content = content.replace(captureOld, captureNew);

// 2. browser-message
const msgOld = `  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<BrowserMessage>('browser-message', event => {
      console.log('[CHANGE 18] Received browser message from:', event.payload.payload.source);
    }).then(fn => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, []);`;

const msgNew = `  useEffect(() => {
    const unlistenPromise = listen<BrowserMessage>('browser-message', event => {
      console.log('[CHANGE 18] Received browser message from:', event.payload.payload.source);
    });
    return () => {
      unlistenPromise.then(fn => fn());
    };
  }, []);`;

content = content.replace(msgOld, msgNew);

// 3. browser-capture-saved and browser-capture-error
const capOld = `  useEffect(() => {
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
  }, []);`;

const capNew = `  useEffect(() => {
    const unlistenSavedPromise = listen<BrowserCaptureSaved>('browser-capture-saved', async () => {
      setFlashMessage("✓ Saved from Browser");
      setTimeout(() => setFlashMessage(null), 3000);
      try {
        const { sendNotification } = await import('@tauri-apps/plugin-notification');
        sendNotification({ title: 'Second Brain', body: 'Successfully saved from browser.' });
      } catch (e) { console.error(e); }
    });
    
    const unlistenErrorPromise = listen<string>('browser-capture-error', async (event) => {
      setFlashMessage(\`Failed to save from browser: \${event.payload}\`);
      setTimeout(() => setFlashMessage(null), 5000);
      try {
        const { sendNotification } = await import('@tauri-apps/plugin-notification');
        sendNotification({ title: 'Second Brain Error', body: \`Failed to save from browser: \${event.payload}\` });
      } catch (e) { console.error(e); }
    });

    return () => {
      unlistenSavedPromise.then(fn => fn());
      unlistenErrorPromise.then(fn => fn());
    };
  }, []);`;

// Handle the o" checkmark weirdness just in case
const capOldAlt = capOld.replace("✓", "o\"");
if (content.includes(capOld)) {
  content = content.replace(capOld, capNew);
} else if (content.includes(capOldAlt)) {
  content = content.replace(capOldAlt, capNew);
} else {
  // Try regex for the last block
  const capRegex = /useEffect\(\(\) => \{\s*let unlistenSaved: \(\(\) => void\) \| undefined;\s*let unlistenError: \(\(\) => void\) \| undefined;[\s\S]*?unlistenError\?\.\(\);\s*\};\s*\}, \[\]\);/g;
  content = content.replace(capRegex, capNew);
}

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed listen memory leaks");
