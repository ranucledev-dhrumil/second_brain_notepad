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
import { Link } from '@tiptap/extension-link';

const editor = new Editor({
  extensions: [
    StarterKit,
    Markdown,
    Link.configure({ openOnClick: false, HTMLAttributes: { target: null } })
  ],
  content: '<p><a href="https://example.com">example.com</a></p>',
});

console.log(editor.getHTML());
