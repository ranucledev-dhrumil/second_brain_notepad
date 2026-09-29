const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\VaultBrowser\\VaultBrowser.tsx';
let content = fs.readFileSync(path, 'utf8');

const importOpener = `import { open } from '@tauri-apps/plugin-opener';`;
if (!content.includes(importOpener)) {
  content = content.replace(`import { Markdown } from 'tiptap-markdown';`, `import { Markdown } from 'tiptap-markdown';\nimport { open } from '@tauri-apps/plugin-opener';`);
}

// Fix VaultItemRenderer
const vaultRendererOld = `  function VaultItemRenderer({ body }: { body: string }) {
    const editor = useEditor({
      editable: false,
      extensions: [
        StarterKit,
        Link.configure({ openOnClick: true }),
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        Markdown,
      ],
      content: body,
    });`;

const vaultRendererNew = `  function VaultItemRenderer({ body }: { body: string }) {
    const editor = useEditor({
      editable: false,
      extensions: [
        StarterKit,
        Link.configure({ openOnClick: false }),
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        Markdown,
      ],
      editorProps: {
        handleClick(view, pos, event) {
          const target = event.target as HTMLElement;
          const link = target.closest('a');
          if (link && link.href) {
            event.preventDefault();
            event.stopPropagation();
            open(link.href).catch(console.error);
            return true;
          }
          return false;
        },
      },
      content: body,
    });`;

if (content.includes(vaultRendererOld)) {
  content = content.replace(vaultRendererOld, vaultRendererNew);
} else {
  // Use Regex if indentation is different
  const vrRegex = /function VaultItemRenderer\(\{ body \}: \{ body: string \}\) \{\s*const editor = useEditor\(\{\s*editable: false,\s*extensions: \[\s*StarterKit,\s*Link\.configure\(\{ openOnClick: true \}\),\s*Table\.configure\(\{ resizable: false \}\),\s*TableRow,\s*TableHeader,\s*TableCell,\s*Markdown,\s*\],\s*content: body,\s*\}\);/g;
  content = content.replace(vrRegex, vaultRendererNew);
}

// Fix explicit link 'a' tag
const linkRegex = /<a\s+className="vault-detail__link-url"\s+href=\{selectedItem\.sourceUrl \|\| selectedItem\.body\}\s+target="_blank"\s+rel="noreferrer"\s*>/g;
const newLink = `<a
                        className="vault-detail__link-url"
                        href={selectedItem.sourceUrl || selectedItem.body}
                        onClick={(e) => {
                          e.preventDefault();
                          open(selectedItem.sourceUrl || selectedItem.body).catch(console.error);
                        }}
                      >`;

content = content.replace(linkRegex, newLink);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated VaultBrowser.tsx");
