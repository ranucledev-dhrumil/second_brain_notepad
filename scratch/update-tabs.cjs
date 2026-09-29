const fs = require('fs');
let code = fs.readFileSync('src/hooks/useTabs.ts', 'utf8');

// Replace captureTab with openVaultItemForEdit where needed
const newFn = `
  const openVaultItemForEdit = useCallback(async (item: VaultItem) => {
    const doc = await invoke<WorkspaceDocument>('open_vault_item_for_edit', {
      sourceVaultItemId: item.id
    });
    setTabs(prev => [
      ...prev.map(t => ({ ...t, isActive: false })),
      doc,
    ]);
    setActiveTabId(doc.id);
    setTabBodies(prev => ({ ...prev, [doc.id]: doc.body }));
    setTabUrls(prev => ({ ...prev, [doc.id]: doc.url || '' }));
    manuallyRenamedRef.current.add(doc.id);
  }, []);
`;

code = code.replace(/const captureTab = useCallback/g, newFn + '\n  const captureTab = useCallback');

code = code.replace(
  /export function useTabs\(\) \{/g, 
  "import type { VaultItem } from '../types';\nexport function useTabs() {"
);

fs.writeFileSync('src/hooks/useTabs.ts', code);
