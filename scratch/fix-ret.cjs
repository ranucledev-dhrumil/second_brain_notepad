const fs = require('fs');
let ts = fs.readFileSync('src/hooks/useTabs.ts', 'utf8');

// I will just replace `captureTab: (body: string, suggestedType: ContentType, title?: string, sourceVaultItemId?: string) => Promise<void>;`
ts = ts.replace(
    /captureTab: \(body: string, suggestedType: ContentType, title\?: string, sourceVaultItemId\?: string\) => Promise<void>;/,
    'captureTab: (body: string, suggestedType: ContentType, title?: string, sourceVaultItemId?: string) => Promise<void>;\n  openVaultItemForEdit: (item: VaultItem) => Promise<void>;'
);

fs.writeFileSync('src/hooks/useTabs.ts', ts);
