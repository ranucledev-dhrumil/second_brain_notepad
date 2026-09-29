const fs = require('fs');

let configStr = fs.readFileSync('src-tauri/tauri.conf.json', 'utf8');

// Replace withGlobalTauri
configStr = configStr.replace(/"withGlobalTauri": true/, '"withGlobalTauri": false');

// Replace csp
configStr = configStr.replace(/"csp": null/, `"csp": "default-src 'self'; img-src 'self' data:; connect-src 'self' ipc: http://ipc.localhost; style-src 'self' 'unsafe-inline';",
      "devCsp": "default-src 'self' 'unsafe-inline' 'unsafe-eval' ws: http: data: ipc:;"`);

fs.writeFileSync('src-tauri/tauri.conf.json', configStr);
