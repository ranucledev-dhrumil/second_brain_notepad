const fs = require('fs');
let text = fs.readFileSync('D:/Phase-3/Second_Brain_Notes/second-brain/scratch/found_full.txt', 'utf8');

// The text is something like: fn capture_workspace_document\n177: ...
text = text.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
fs.writeFileSync('D:/Phase-3/Second_Brain_Notes/second-brain/scratch/decoded.txt', text);
