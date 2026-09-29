const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\App.tsx';
let content = fs.readFileSync(path, 'utf8');

const saveOld = `        try {
        const { sendNotification } = await import('@tauri-apps/plugin-notification');
        sendNotification({ title: 'Second Brain', body: 'Successfully saved to vault.' });
      } catch (e) { console.error(e); }
      await closeTab(id);`;

const saveNew = `        try {
        const { sendNotification } = await import('@tauri-apps/plugin-notification');
        sendNotification({ title: 'Second Brain', body: 'Successfully saved to vault.' });
      } catch (e) { console.error(e); }
      await closeTab(id, 'saveToVault');`;

if (content.includes(saveOld)) {
  content = content.replace(saveOld, saveNew);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Updated App.tsx");
} else {
  // Try regex
  const regex = /try \{\s*const \{ sendNotification \} = await import\('@tauri-apps\/plugin-notification'\);\s*sendNotification\(\{ title: 'Second Brain', body: 'Successfully saved to vault.' \}\);\s*\} catch \(e\) \{ console.error\(e\); \}\s*await closeTab\(id\);/g;
  if (regex.test(content)) {
    content = content.replace(regex, saveNew);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Updated App.tsx with Regex");
  } else {
    console.log("Could not find App.tsx closeTab block");
  }
}
