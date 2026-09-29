const fs = require('fs');
let str = fs.readFileSync('src/hooks/useTabs.ts', 'utf8');
str = str.replace(/updateAutoTitle: \(id: string, body: string\) => void;/, 'updateAutoTitle: (id: string, body: string, isCodeMode?: boolean) => void;');
fs.writeFileSync('src/hooks/useTabs.ts', str);

let appStr = fs.readFileSync('src/App.tsx', 'utf8');
appStr = appStr.replace(/m\(t,e\)\}/, 'm(t, e, ce?.suggestedType === "codeSnippet")}');
appStr = appStr.replace(/updateAutoTitle\(t,e\)\}/, 'updateAutoTitle(t, e, ce?.suggestedType === "codeSnippet")}');
// The minified output from my earlier run might mean it's updateAutoTitle(t, e), let's check App.tsx precisely.
