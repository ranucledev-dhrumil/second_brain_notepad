const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\App.tsx';
let content = fs.readFileSync(path, 'utf8');

// ── 1. Add new imports ────────────────────────────────────────────────────
content = content.replace(
  `import { saveWorkspaceDocumentToVault } from './lib/vault';`,
  `import { saveWorkspaceDocumentToVault, saveWorkspaceDocumentToVaultWithTitle } from './lib/vault';
import SaveToVaultDialog from './components/SaveToVaultDialog/SaveToVaultDialog';`
);

// ── 2. Add markVaultSaved to the useTabs destructure ─────────────────────
content = content.replace(
  `    updateUrl,
    saveError: autosaveError,
  } = useTabs();`,
  `    updateUrl,
    saveError: autosaveError,
    dirtyTabIds,
    markVaultSaved,
  } = useTabs();`
);

// ── 3. Add SaveToVaultDialog state ────────────────────────────────────────
content = content.replace(
  `  /** Transient flash message in the status bar (CHANGE 19) */
  const [flashMessage, setFlashMessage] = useState<string | null>(null);`,
  `  /** Transient flash message in the status bar (CHANGE 19) */
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** First-save-to-vault dialog state */
  const [saveToVaultDialogTabId, setSaveToVaultDialogTabId] = useState<string | null>(null);
  const [saveToVaultDialogTitle, setSaveToVaultDialogTitle] = useState('');
  const [saveToVaultDialogSaving, setSaveToVaultDialogSaving] = useState(false);
  const [saveToVaultDialogError, setSaveToVaultDialogError] = useState<string | null>(null);`
);

// ── 4. Add useRef import ──────────────────────────────────────────────────
content = content.replace(
  `import { useCallback, useEffect, useState } from 'react';`,
  `import { useCallback, useEffect, useRef, useState } from 'react';`
);

// ── 5. Replace the flash helper pattern: centralize auto-dismiss ──────────
// Add a shared flash helper function right before handleSaveToVaultDirectly
content = content.replace(
  `  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeBody = activeTabId ? tabBodies[activeTabId] ?? '' : '';`,
  `  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeBody = activeTabId ? tabBodies[activeTabId] ?? '' : '';

  /** Show a status-bar flash message that auto-dismisses after 3 s. */
  const showFlash = useCallback((msg: string) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashMessage(msg);
    flashTimerRef.current = setTimeout(() => setFlashMessage(null), 3000);
  }, []);`
);

// ── 6. Rewrite handleSaveToVaultDirectly ─────────────────────────────────
content = content.replace(
  `  const handleSaveToVaultDirectly = async (id: string) => {
    try {
      await saveWorkspaceDocumentToVault(id);
      setFlashMessage("✓ Saved to Vault");
      setTimeout(() => setFlashMessage(null), 3000);
              try {
        const { sendNotification } = await import('@tauri-apps/plugin-notification');
        sendNotification({ title: 'Second Brain', body: 'Successfully saved to vault.' });
      } catch (e) { console.error(e); }
      await closeTab(id, 'saveToVault');
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
  };`,
  `  const handleSaveToVaultDirectly = async (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;

    if (tab.sourceVaultItemId) {
      // ── Second+ save: silent update, no dialog, no tab close ──
      try {
        const vaultItemId = await saveWorkspaceDocumentToVault(id);
        markVaultSaved(id, vaultItemId);
        showFlash('✓ Saved to Vault');
        try {
          const { sendNotification } = await import('@tauri-apps/plugin-notification');
          sendNotification({ title: 'Second Brain', body: 'Saved to vault.' });
        } catch (e) { console.error(e); }
      } catch (e: unknown) {
        const msg = typeof e === 'string' ? e : "Couldn't save to Vault";
        showFlash(msg);
      }
    } else {
      // ── First save: open title dialog ──
      setSaveToVaultDialogTabId(id);
      setSaveToVaultDialogTitle(tab.title);
      setSaveToVaultDialogSaving(false);
      setSaveToVaultDialogError(null);
    }
  };

  const handleSaveToVaultDialogConfirm = async (confirmedTitle: string) => {
    if (!saveToVaultDialogTabId) return;
    const id = saveToVaultDialogTabId;
    setSaveToVaultDialogSaving(true);
    setSaveToVaultDialogError(null);
    try {
      const vaultItemId = await saveWorkspaceDocumentToVaultWithTitle(id, confirmedTitle);
      // Update tab title in state (the DB was already updated by the Rust command)
      await renameTab(id, confirmedTitle);
      markVaultSaved(id, vaultItemId);
      setSaveToVaultDialogTabId(null);
      showFlash('✓ Saved to Vault');
      try {
        const { sendNotification } = await import('@tauri-apps/plugin-notification');
        sendNotification({ title: 'Second Brain', body: 'Saved to vault.' });
      } catch (e) { console.error(e); }
    } catch (e: unknown) {
      setSaveToVaultDialogSaving(false);
      setSaveToVaultDialogError(typeof e === 'string' ? e : "Couldn't save to Vault. Please try again.");
    }
  };`
);

// ── 7. Fix handleTabClose to use dirtyTabIds for the dot condition ────────
content = content.replace(
  `  const handleTabClose = async (id: string) => {
    const tab = tabs.find(t => t.id === id);
    // Only show confirmation if it's an unsaved workspace tab
    if (tab && !tab.sourceVaultItemId) {`,
  `  const handleTabClose = async (id: string) => {
    const tab = tabs.find(t => t.id === id);
    // Show confirmation if the tab has un-synced changes (dirty) regardless of vault link
    if (tab && dirtyTabIds.has(id)) {`
);

// ── 8. Fix handleConfirmSaveToVault — close dialog path uses plain closeTab ─
content = content.replace(
  `      setPendingCloseTabId(null);
      setIsSaving(false);
      await closeTab(id, 'saveToVault');`,
  `      setPendingCloseTabId(null);
      setIsSaving(false);
      await closeTab(id);`
);

// ── 9. Fix browser-capture flash to use showFlash ────────────────────────
content = content.replace(
  `      setFlashMessage("✓ Saved from Browser");
      setTimeout(() => setFlashMessage(null), 3000);`,
  `      showFlash('✓ Saved from Browser');`
);

content = content.replace(
  `      setFlashMessage(\`Failed to save from browser: \${event.payload}\`);
      setTimeout(() => setFlashMessage(null), 5000);`,
  `      showFlash(\`Failed to save from browser: \${event.payload}\`);`
);

// ── 10. Fix TitleTabRow showDot to use dirtyTabIds ────────────────────────
content = content.replace(
  `      onReorder={reorderTabs}
      />`,
  `      onReorder={reorderTabs}
      dirtyTabIds={dirtyTabIds}
      />`
);

// ── 11. Fix onSaveToVault prop ────────────────────────────────────────────
// (no change needed — already passes handleSaveToVaultDirectly)

// ── 12. Add SaveToVaultDialog render ─────────────────────────────────────
content = content.replace(
  `      {pendingCloseTabId !== null && (
        <CloseConfirmDialog`,
  `      {saveToVaultDialogTabId !== null && (
        <SaveToVaultDialog
          initialTitle={saveToVaultDialogTitle}
          isSaving={saveToVaultDialogSaving}
          saveError={saveToVaultDialogError}
          onSave={handleSaveToVaultDialogConfirm}
          onCancel={() => setSaveToVaultDialogTabId(null)}
        />
      )}

      {pendingCloseTabId !== null && (
        <CloseConfirmDialog`
);

// ── 13. Fix VaultBrowser flash to use showFlash ───────────────────────────
content = content.replace(
  `        onFlash={setFlashMessage}`,
  `        onFlash={showFlash}`
);

fs.writeFileSync(path, content, 'utf8');
console.log("App.tsx updated");

const result = fs.readFileSync(path, 'utf8');
const checks = [
  'SaveToVaultDialog',
  'saveToVaultDialogTabId',
  'handleSaveToVaultDialogConfirm',
  'markVaultSaved',
  'dirtyTabIds',
  'showFlash',
  'saveWorkspaceDocumentToVaultWithTitle',
];
checks.forEach(c => console.log(c + ':', result.includes(c) ? 'OK' : 'MISSING'));
