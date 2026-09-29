const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\hooks\\useTabs.ts';
let content = fs.readFileSync(path, 'utf8');

const closeTabOld = `  const closeTab = useCallback(
    async (id: string) => {`;
    
const closeTabNew = `  const closeTab = useCallback(
    async (id: string, reason: 'explicit' | 'saveToVault' = 'explicit') => {`;

if (content.includes(closeTabOld)) {
  content = content.replace(closeTabOld, closeTabNew);
}

const remainingOld = `      // CHANGE 29: Quit the app when the last tab is closed (Notepad-style).
      // On next launch, loadOpenTabs will find zero open docs and auto-create a fresh Untitled tab.
      if (remaining.length === 0) {
        await getCurrentWindow().close();
        return;
      }`;
      
const remainingNew = `      // CHANGE 29: Quit the app when the last tab is closed explicitly (Notepad-style).
      if (remaining.length === 0) {
        if (reason === 'explicit') {
          await getCurrentWindow().close();
          return;
        } else {
          // If closed due to Save-to-Vault, just open a fresh Untitled tab instead of quitting
          const doc = await invoke<WorkspaceDocument>('new_workspace_document', {
            title: 'Untitled',
          });
          setTabs([ { ...doc, isActive: true } ]);
          setActiveTabId(doc.id);
          setTabBodies({ [doc.id]: '' });
          setTabUrls({ [doc.id]: '' });
          return;
        }
      }`;

if (content.includes(remainingOld)) {
  content = content.replace(remainingOld, remainingNew);
} else {
  console.log("Could not find remaining block.");
}

// ALSO need to update the interface type for UseTabsReturn
const intOld = `  closeTab: (id: string) => Promise<void>;`;
const intNew = `  closeTab: (id: string, reason?: 'explicit' | 'saveToVault') => Promise<void>;`;

if (content.includes(intOld)) {
  content = content.replace(intOld, intNew);
}

fs.writeFileSync(path, content, 'utf8');
console.log("Updated useTabs.ts");
