const fs = require('fs');
const path = require('path');

const libRs = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

// 1. Find all #[tauri::command] definitions
const definedCommands = new Set();
const definedRegex = /#\[tauri::command\]\s*(?:async\s+)?fn\s+([a-zA-Z0-9_]+)/g;
let match;
while ((match = definedRegex.exec(libRs)) !== null) {
    definedCommands.add(match[1]);
}

// 2. Find all commands in generate_handler!
const generateHandlerMatch = libRs.match(/generate_handler!\[([\s\S]*?)\]/);
const registeredCommands = new Set();
if (generateHandlerMatch) {
    const cmds = generateHandlerMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    cmds.forEach(cmd => registeredCommands.add(cmd));
}

// 3. Find all invoke('...') in frontend
const invokedCommands = new Set();
function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const invokeRegex = /invoke(?:<[^>]*>)?\(['"]([a-zA-Z0-9_]+)['"]/g;
            let m;
            while ((m = invokeRegex.exec(content)) !== null) {
                invokedCommands.add(m[1]);
            }
        }
    }
}
scanDir('src');

const allCommands = new Set([...definedCommands, ...registeredCommands, ...invokedCommands]);
const table = [];
for (const cmd of allCommands) {
    const invoked = invokedCommands.has(cmd) ? 'yes' : 'no';
    const defined = definedCommands.has(cmd) ? 'yes' : 'no';
    const registered = registeredCommands.has(cmd) ? 'yes' : 'no';
    const flag = (invoked === 'no' || defined === 'no' || registered === 'no') ? 'FLAG' : '';
    table.push(`| ${cmd} | ${invoked} | ${defined} | ${registered} | ${flag} |`);
}

console.log('| Command | Invoked? | Defined? | Registered? | Flag |');
console.log('|---|---|---|---|---|');
console.log(table.join('\n'));
