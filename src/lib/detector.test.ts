import { describe, it, expect } from 'vitest';
import { detectContentType } from './detector';

describe('detectContentType', () => {
  // ── Link cases ──────────────────────────────────────────────────────────
  describe('Link', () => {
    it('https URL', () => {
      expect(detectContentType('https://example.com')).toBe('link');
    });

    it('http URL with path', () => {
      expect(detectContentType('http://github.com/user/repo')).toBe('link');
    });

    it('www prefix', () => {
      expect(detectContentType('www.google.com')).toBe('link');
    });

    it('domain with path', () => {
      expect(detectContentType('github.com/openai/openai-python')).toBe('link');
    });

    it('URL with query string', () => {
      expect(detectContentType('https://site.io/search?q=foo&page=2')).toBe('link');
    });

    // Negative: prose containing URL is NOT a Link
    it('prose + URL → note', () => {
      expect(detectContentType('Check this out https://example.com wow')).toBe('note');
    });
  });

  // ── CodeSnippet cases ────────────────────────────────────────────────────
  describe('CodeSnippet', () => {
    it('JS function', () => {
      expect(
        detectContentType(
          `function greet(name) {\n  return 'Hello ' + name;\n}`
        )
      ).toBe('codeSnippet');
    });

    it('Python def', () => {
      expect(
        detectContentType(
          `def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)`
        )
      ).toBe('codeSnippet');
    });

    it('Rust struct', () => {
      expect(
        detectContentType(
          `pub struct Config {\n    pub name: String,\n    pub value: u32,\n}`
        )
      ).toBe('codeSnippet');
    });

    it('TS const + arrow', () => {
      expect(
        detectContentType(`const add = (a: number, b: number): number => a + b;`)
      ).toBe('codeSnippet');
    });

    it('C #include', () => {
      expect(
        detectContentType(
          `#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`
        )
      ).toBe('codeSnippet');
    });

    it('shell command (// comment)', () => {
      expect(detectContentType(`// Run this\nconsole.log("hello");`)).toBe(
        'codeSnippet'
      );
    });
  });

  // ── Note cases ──────────────────────────────────────────────────────────
  describe('Note', () => {
    it('plain prose', () => {
      expect(
        detectContentType('This is just a regular note about my meeting.')
      ).toBe('note');
    });

    it('empty string', () => {
      expect(detectContentType('')).toBe('note');
    });

    it('whitespace only', () => {
      expect(detectContentType('   \n  ')).toBe('note');
    });

    it('sentence with semicolon', () => {
      expect(detectContentType('Buy milk; also eggs.')).toBe('note');
    });

    it('multiline prose', () => {
      expect(
        detectContentType(
          `Today I met with the team.\nWe discussed the roadmap for next quarter.\nAction items: follow up with design.`
        )
      ).toBe('note');
    });

    // Ambiguous — single word, not URL, not code → Note (no crash)
    it('single word', () => {
      expect(detectContentType('hello')).toBe('note');
    });

    it('number', () => {
      expect(detectContentType('42')).toBe('note');
    });
  });
});
