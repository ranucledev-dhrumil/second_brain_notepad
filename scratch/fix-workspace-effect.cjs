const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\WorkspaceEditor\\WorkspaceEditor.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldEffect = `    useEffect(() => {
      const prev = prevTypeRef.current;
      const curr = suggestedType;
      prevTypeRef.current = curr;
      if (!editor || prev === curr || prev === undefined) return;

      if (curr === 'codeSnippet') {
        const md = (editor.storage as any).markdown.getMarkdown();
        const unwrapped = md.replace(/^^\`\`\`[\\w]*\\n/, '').replace(/\\n\`\`\`$/, '');
        editor.commands.setContent('\`\`\`\\n' + unwrapped + '\\n\`\`\`');
      }

      if (prev === 'link' && curr === 'note') {
        const urlToInsert = url?.trim() ?? '';
        if (urlToInsert) {
          editor.chain()
            .focus('end')
            .insertContent({ type: 'paragraph' })
            .setLink({ href: urlToInsert })
            .insertContent(urlToInsert)
            .unsetLink()
        }
        onUrlChange?.('');
      }
    }, [suggestedType, editor, url, onUrlChange]);`;

const newEffect = `    useEffect(() => {
      const prev = prevTypeRef.current;
      const curr = suggestedType;
      prevTypeRef.current = curr;
      if (!editor || prev === curr || prev === undefined) return;

      if (curr === 'codeSnippet') {
        const md = (editor.storage as any).markdown.getMarkdown();
        const unwrapped = md.replace(/^^\`\`\`[\\w]*\\n/, '').replace(/\\n\`\`\`$/, '');
        editor.commands.setContent('\`\`\`\\n' + unwrapped + '\\n\`\`\`');
      }

      if (prev === 'link' && curr === 'note') {
        const urlToInsert = url?.trim() ?? '';
        if (urlToInsert) {
          editor.chain()
            .focus('end')
            .insertContent(\`\\n\\n[\${urlToInsert}](\${urlToInsert})\`)
            .run();
        }
        onUrlChange?.('');
      }
    }, [suggestedType, editor, url, onUrlChange]);`;

// Regex replacement because of backticks and escapes
const startIdx = content.indexOf(`    useEffect(() => {
      const prev = prevTypeRef.current;
      const curr = suggestedType;`);
const endIdx = content.indexOf(`    }, [suggestedType, editor, url, onUrlChange]);`) + 50;

if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
  content = content.slice(0, startIdx) + newEffect + content.slice(endIdx);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Replaced useEffect");
} else {
  console.log("Could not find useEffect");
}
