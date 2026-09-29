const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\EditorArea\\EditorArea.css';
let content = fs.readFileSync(path, 'utf8');

const css = `
.editor-area__tiptap-wrapper .tiptap pre {
  background: var(--sb-surface-hover);
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  border: 1px solid var(--sb-border-default);
}
.editor-area__tiptap-wrapper .tiptap code {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 0.9em;
}
.editor-area__tiptap-wrapper .tiptap p code {
  background: var(--sb-surface-hover);
  padding: 0.2em 0.4em;
  border-radius: 3px;
}
`;

fs.writeFileSync(path, content + css, 'utf8');
console.log("CSS appended.");
