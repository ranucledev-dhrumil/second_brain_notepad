const fs = require('fs');
let code = fs.readFileSync('src/hooks/useTabs.ts', 'utf8');

// The error is TS2304: Cannot find name 'VaultItem'.
if (code.includes('openVaultItemForEdit = useCallback(async (item: VaultItem) => {')) {
    code = code.replace(
        'import { ContentType, SaveContentPayload, TabOrderUpdate, WorkspaceDocument } from \'../types/workspace\';',
        'import { ContentType, SaveContentPayload, TabOrderUpdate, WorkspaceDocument } from \'../types/workspace\';\nimport { VaultItem } from \'../types/vault\';'
    );
}

// Add to UseTabsReturn
code = code.replace(
    'captureTab: () => Promise<void>;\n}',
    'captureTab: () => Promise<void>;\n  openVaultItemForEdit: (item: VaultItem) => Promise<void>;\n}'
);

fs.writeFileSync('src/hooks/useTabs.ts', code);
