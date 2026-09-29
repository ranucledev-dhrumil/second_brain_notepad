const fs = require('fs');
const transcript = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/276cb178-0061-42bc-9442-497e039c40be/.system_generated/logs/transcript_full.jsonl', 'utf8');

const lines = transcript.split('\n').filter(Boolean);
let found = false;
for (const line of lines) {
    const obj = JSON.parse(line);
    if (obj.type === 'TOOL_RESPONSE' && obj.content && obj.content.includes('fn create_workspace_document')) {
        let content = obj.content;
        const preambleMatch = content.match(/Output:\n([\s\S]*)$/);
        if (preambleMatch) {
            content = preambleMatch[1];
        }
        fs.writeFileSync('D:/Phase-3/Second_Brain_Notes/second-brain/scratch/recovered_lib_full.rs', content);
        console.log("Recovered full!");
        found = true;
        break;
    }
}
if (!found) {
    console.log("Still not found");
}
