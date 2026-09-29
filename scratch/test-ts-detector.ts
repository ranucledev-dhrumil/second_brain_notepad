// TS test
import { detectContentType } from '../src/lib/detector.ts';

const inputs = [
  "https://google.com",
  "http://example.com/path",
  "www.example.com",
  "just a normal string",
  "function test() { return 1; }",
  "let x = 10; console.log(x);",
  "SELECT * FROM users WHERE id = 1;",
  "fn main() { println!(\"Hi\"); }",
  "def hello():\n  print('world')",
  "class Example {\n  public void run() {}\n}",
  "<html><body>Hello</body></html>",
  "# Heading\nSome text with a link http://example.com inside.",
  "// just a comment",
  "{\"key\": \"value\"}",
  "12345",
  "",
  "   https://spaced-url.com   "
];

for (const input of inputs) {
  console.log(`INPUT: ${JSON.stringify(input)}`);
  console.log(`TS: ${detectContentType(input)}`);
}
