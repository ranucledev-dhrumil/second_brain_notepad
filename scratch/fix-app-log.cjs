const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
    "console.log('[CHANGE 18] Received browser message from:', event.payload.source);",
    "console.log('[CHANGE 18] Received browser message from:', event.payload.payload.source);"
);

fs.writeFileSync('src/App.tsx', code);
