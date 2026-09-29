const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\WorkspaceEditor\\WorkspaceEditor.tsx';
let content = fs.readFileSync(path, 'utf8');

const importOpener = `import { open } from '@tauri-apps/plugin-opener';`;
if (!content.includes(importOpener)) {
  content = content.replace(`import { Markdown } from 'tiptap-markdown';`, `import { Markdown } from 'tiptap-markdown';\nimport { open } from '@tauri-apps/plugin-opener';`);
}

const editorPropsCode = `      editorProps: {
        handleClick(view, pos, event) {
          if (event.ctrlKey) {
            const target = event.target as HTMLElement;
            const link = target.closest('a');
            if (link && link.href) {
              event.preventDefault();
              event.stopPropagation();
              open(link.href).catch(console.error);
              return true;
            }
          }
          return false;
        },
      },
      onSelectionUpdate:`;

if (!content.includes('editorProps: {')) {
  content = content.replace('      onSelectionUpdate:', editorPropsCode);
}

fs.writeFileSync(path, content, 'utf8');
console.log("Injected handleClick");
