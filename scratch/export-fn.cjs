const fs = require('fs');
let code = fs.readFileSync('src/hooks/useTabs.ts', 'utf8');

code = code.replace(
  /return \{/g,
  'return {\n    openVaultItemForEdit,'
);

fs.writeFileSync('src/hooks/useTabs.ts', code);
