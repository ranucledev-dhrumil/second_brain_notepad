const fs = require('fs');
const path = 'D:\\Phase-3\\Second_Brain_Notes\\second-brain\\src\\App.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /setIsSaving\(false\);\s*await closeTab\(id\);\s*\} catch \(e: unknown\)/g;
content = content.replace(regex, `setIsSaving(false);\n      await closeTab(id, 'saveToVault');\n    } catch (e: unknown)`);

fs.writeFileSync(path, content, 'utf8');
