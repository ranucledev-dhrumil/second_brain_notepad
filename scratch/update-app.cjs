const fs = require('fs');

let str = fs.readFileSync('src/hooks/useTabs.ts', 'utf8');
str = str.replace(/updateAutoTitle: \(id: string, body: string\) => void;/, 'updateAutoTitle: (id: string, body: string, isCodeMode?: boolean) => void;');
fs.writeFileSync('src/hooks/useTabs.ts', str);

let appStr = fs.readFileSync('src/App.tsx', 'utf8');
appStr = appStr.replace(/updateAutoTitle\(activeTabId, body\);/, 'updateAutoTitle(activeTabId, body, activeTab?.suggestedType === "codeSnippet");');
fs.writeFileSync('src/App.tsx', appStr);
