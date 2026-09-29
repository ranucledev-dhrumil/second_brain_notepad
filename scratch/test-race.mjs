import { JSDOM } from 'jsdom';
const dom = new JSDOM();
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

let lastBody = '';
let appBody = 'Just some text';

const editor = new Editor({
  extensions: [StarterKit, Markdown],
  content: '<p>Just some text</p>',
  onUpdate: ({ editor }) => {
    // 1. getMarkdown runs and updates lastBodyRef synchronously!
    lastBody = editor.storage.markdown.getMarkdown();
    console.log('[onUpdate] lastBody updated to:', lastBody);
  }
});

lastBody = 'Just some text'; // initial sync

console.log('--- Initial State ---');
console.log('HTML:', editor.getHTML());
console.log('lastBody:', lastBody);
console.log('appBody:', appBody);

console.log('\\n--- Switching to Code Mode ---');
editor.chain().selectAll().setCodeBlock().run();

console.log('\\n--- After run() completes ---');
console.log('HTML:', editor.getHTML());
console.log('lastBody:', lastBody);
console.log('appBody:', appBody);

// Simulate my fix:
console.log('\\n--- Applying fix (lastBodyRef.current = body) ---');
lastBody = appBody;
console.log('lastBody:', lastBody);

// Simulate the second useEffect running immediately:
console.log('\\n--- Second useEffect runs ---');
if (lastBody !== appBody) {
  console.log('lastBody !== appBody is TRUE! Overwriting editor!');
  lastBody = appBody;
  editor.commands.setContent(appBody);
} else {
  console.log('lastBody === appBody. Skipping overwrite!');
}
console.log('HTML:', editor.getHTML());

// Simulate 500ms later, appBody updates to the new markdown:
console.log('\\n--- 500ms later (App.tsx state updates) ---');
appBody = "```\nJust some text\n```";

// Simulate WorkspaceEditor re-rendering with new appBody:
console.log('\\n--- WorkspaceEditor re-renders (Second useEffect runs again) ---');
if (lastBody !== appBody) {
  console.log('lastBody !== appBody is TRUE! Overwriting editor!');
  lastBody = appBody;
  editor.commands.setContent(appBody);
} else {
  console.log('lastBody === appBody. Skipping overwrite!');
}
console.log('HTML:', editor.getHTML());

