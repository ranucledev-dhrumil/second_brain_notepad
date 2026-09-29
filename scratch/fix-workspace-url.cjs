const fs = require('fs');

function getFormatUrlFn() {
  return `function formatUrl(href: string): string {
  href = href.trim();
  if (/^[a-zA-Z][a-zA-Z\\d+\\-.]*:/.test(href)) {
    return href;
  }
  if (href.includes('.') && !href.includes(' ')) {
    return 'https://' + href;
  }
  return 'https://www.google.com/search?q=' + encodeURIComponent(href);
}
`;
}

const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\WorkspaceEditor\\WorkspaceEditor.tsx';
let content = fs.readFileSync(path, 'utf8');
if (!content.includes('function formatUrl')) {
  content = content.replace(`const WorkspaceEditor = forwardRef<EditorRef, WorkspaceEditorProps>(`, getFormatUrlFn() + `\nconst WorkspaceEditor = forwardRef<EditorRef, WorkspaceEditorProps>(`);
  fs.writeFileSync(path, content, 'utf8');
  console.log("WorkspaceEditor fixed.");
} else {
  console.log("Already has formatUrl");
}
