const fs = require('fs');

let toolbarStr = fs.readFileSync('src/components/Toolbar/Toolbar.tsx', 'utf8');

// Replace all buttons after toolbar__divider with disabled={isLinkMode || isCodeMode}
// But only inside the format group
toolbarStr = toolbarStr.replace(
  /<button \n          className=\{btnClass\(editor\?\.isActive\('heading'\) \?\? false\)\}/,
  `<button disabled={isLinkMode || isCodeMode}\n          className={btnClass(editor?.isActive('heading') ?? false)}`
);

toolbarStr = toolbarStr.replace(
  /<button \n          className=\{btnClass\(editor\?\.isActive\('bulletList'\) \?\? false\)\}/,
  `<button disabled={isLinkMode || isCodeMode}\n          className={btnClass(editor?.isActive('bulletList') ?? false)}`
);

toolbarStr = toolbarStr.replace(
  /<button \n          className=\{btnClass\(editor\?\.isActive\('bold'\) \?\? false\)\}/,
  `<button disabled={isLinkMode || isCodeMode}\n          className={btnClass(editor?.isActive('bold') ?? false)}`
);

toolbarStr = toolbarStr.replace(
  /<button \n          className=\{btnClass\(editor\?\.isActive\('italic'\) \?\? false\)\}/,
  `<button disabled={isLinkMode || isCodeMode}\n          className={btnClass(editor?.isActive('italic') ?? false)}`
);

toolbarStr = toolbarStr.replace(
  /<button \n          className=\{btnClass\(editor\?\.isActive\('strike'\) \?\? false\)\}/,
  `<button disabled={isLinkMode || isCodeMode}\n          className={btnClass(editor?.isActive('strike') ?? false)}`
);

toolbarStr = toolbarStr.replace(
  /<button \n          className=\{btnClass\(editor\?\.isActive\('link'\) \?\? false\)\}/,
  `<button disabled={isLinkMode || isCodeMode}\n          className={btnClass(editor?.isActive('link') ?? false)}`
);

toolbarStr = toolbarStr.replace(
  /<button \n          className=\{btnClass\(editor\?\.isActive\('table'\) \?\? false\)\}/,
  `<button disabled={isLinkMode || isCodeMode}\n          className={btnClass(editor?.isActive('table') ?? false)}`
);

toolbarStr = toolbarStr.replace(
  /<button \n          className="toolbar__btn toolbar__btn--icon"\n          onClick=\{\(\) => editor\?\.chain\(\)\.focus\(\)\.clearNodes\(\)\.unsetAllMarks\(\)\.run\(\)\}/,
  `<button disabled={isLinkMode || isCodeMode}\n          className="toolbar__btn toolbar__btn--icon"\n          onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}`
);

fs.writeFileSync('src/components/Toolbar/Toolbar.tsx', toolbarStr);
