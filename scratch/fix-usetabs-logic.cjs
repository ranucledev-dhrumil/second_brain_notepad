const fs = require('fs');
let ts = fs.readFileSync('src/hooks/useTabs.ts', 'utf8');

// Fix VaultItem import
ts = ts.replace("import type { ContentType, WorkspaceDocument } from '../types';", "import type { ContentType, WorkspaceDocument, VaultItem } from '../types';");

// Remove openVaultItemForEdit from buildSavePayload
ts = ts.replace(/return \{\n\s*openVaultItemForEdit,\n\s*payload:/, 'return {\n    payload:');

// Let's remove the wrongly injected function definition!
// The wrongly injected function was placed before the FIRST `return {` (which was in `buildSavePayload`).
const regexWrongDef = /const openVaultItemForEdit = useCallback\(async \(item: VaultItem\) => \{[\s\S]*?\}, \[tabs, activeTabId, setTabs, setActiveTabId\]\);/;
const extractedDef = ts.match(regexWrongDef);
if (extractedDef) {
    ts = ts.replace(extractedDef[0], '');
    
    // Now inject it before the LAST `return {` which is the one for useTabs!
    const lastReturnIdx = ts.lastIndexOf('  return {');
    if (lastReturnIdx !== -1) {
        ts = ts.slice(0, lastReturnIdx) + extractedDef[0] + '\n\n' + ts.slice(lastReturnIdx);
    }
}

// Add to UseTabsReturn interface
if (!ts.includes('openVaultItemForEdit: (item: VaultItem) => Promise<void>;')) {
    ts = ts.replace(/captureTab: \(\) => Promise<void>;\n\}/, 'captureTab: () => Promise<void>;\n  openVaultItemForEdit: (item: VaultItem) => Promise<void>;\n}');
}

fs.writeFileSync('src/hooks/useTabs.ts', ts);
