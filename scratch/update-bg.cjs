const fs = require('fs');

let str = fs.readFileSync('D:/Phase-3/Second_Brain_Notes/second-brain-extension/background.js', 'utf8');

str = str.replace(
  /message: "Second Brain desktop app is not running or unreachable\.",/,
  `message: "Second Brain isn't running. Nothing was saved. Open the app and try again.",`
);

fs.writeFileSync('D:/Phase-3/Second_Brain_Notes/second-brain-extension/background.js', str);
