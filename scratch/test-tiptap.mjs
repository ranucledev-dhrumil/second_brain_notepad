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

const editor = new Editor({
  extensions: [
    StarterKit,
    Markdown,
  ],
  content: '<p>Initial text</p>',
});

console.log('1. Initial HTML:', editor.getHTML());

// Try switching to Code mode by inserting backticks using setContent
const md = editor.storage.markdown.getMarkdown();
console.log('2. Markdown output:', md);

const unwrapped = md.replace(/^```[\w]*\n/, '').replace(/\n```$/, '');
editor.commands.setContent('```\n' + unwrapped + '\n```');
console.log('3. HTML after setContent with backticks:', editor.getHTML());

// Try switching to Code mode using native codeBlock
editor.commands.setContent('<p>Just some text</p>');
editor.chain().selectAll().setCodeBlock().run();
console.log('4. HTML after selectAll().setCodeBlock():', editor.getHTML());

// Try the Link insertion (markdown style)
editor.commands.setContent(''); // clear
editor.chain().focus('end').insertContent('\\n\\n[http://example.com](http://example.com)').run();
console.log('5. HTML after Link insertion (markdown style):', editor.getHTML());

// Let's try native link insertion using HTML
editor.commands.setContent('');
editor.chain().focus('end').insertContent('<p><a href="http://example.com">http://example.com</a></p>').run();
console.log('6. HTML after Link insertion (HTML style):', editor.getHTML());
