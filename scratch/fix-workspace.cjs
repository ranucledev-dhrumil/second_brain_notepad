const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\WorkspaceEditor\\WorkspaceEditor.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /if \(!editor \|\| prev === curr \|\| prev === undefined\) return;\s*if \(curr === 'codeSnippet'\) \{[\s\S]*?\}\s*if \(prev === 'link' && curr === 'note'\) \{[\s\S]*?\}\s*\}/;

const replacement = `if (!editor || prev === curr || prev === undefined) return;

      if (curr === 'codeSnippet') {
        // Use native TipTap commands instead of parsing markdown manually,
        // which guarantees a proper <pre><code> block is created regardless of markdown parsing quirks.
        editor.chain().selectAll().setCodeBlock().run();
        // Prevent the body-sync useEffect from immediately erasing this change
        lastBodyRef.current = body;
      }

      if (prev === 'link' && curr === 'note') {
        const urlToInsert = url?.trim() ?? '';
        if (urlToInsert) {
          editor.chain()
            .focus('end')
            .insertContent(\`\\n\\n[\${urlToInsert}](\${urlToInsert})\`)
            .run();
          // Prevent the body-sync useEffect from immediately erasing this change
          lastBodyRef.current = body;
        }
        onUrlChange?.('');
      }
    }`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log("Fixed WorkspaceEditor.tsx");
