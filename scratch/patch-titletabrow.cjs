const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\components\\TitleTabRow\\TitleTabRow.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add dirtyTabIds to TitleTabRowProps interface
content = content.replace(
  `  onReorder: (tabs: WorkspaceDocument[]) => void;
}`,
  `  onReorder: (tabs: WorkspaceDocument[]) => void;
  /** Set of tab IDs whose content is not yet synced with their vault item. */
  dirtyTabIds: Set<string>;
}`
);

// 2. Add dirtyTabIds to the destructured props
content = content.replace(
  `}: TitleTabRowProps) {`,
  `  dirtyTabIds,
}: TitleTabRowProps) {`
);

// 3. Change showDot from isWorkspaceDoc(tab) to dirtyTabIds.has(tab.id)
content = content.replace(
  `                showDot={isWorkspaceDoc(tab)}`,
  `                showDot={dirtyTabIds.has(tab.id)}`
);

fs.writeFileSync(path, content, 'utf8');
console.log("TitleTabRow.tsx updated");

const result = fs.readFileSync(path, 'utf8');
const checks = ['dirtyTabIds', 'dirtyTabIds.has(tab.id)'];
checks.forEach(c => console.log(c + ':', result.includes(c) ? 'OK' : 'MISSING'));
