const fs = require('fs');
const lines = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/276cb178-0061-42bc-9442-497e039c40be/.system_generated/logs/transcript.jsonl', 'utf8').split('\n').filter(Boolean);
for(const line of lines) {
    const obj = JSON.parse(line);
    if (obj.type === 'TOOL_RESPONSE' && obj.content && obj.content.includes('capture_workspace_document') && obj.content.includes('#[tauri::command]')) {
        fs.writeFileSync('D:/Phase-3/Second_Brain_Notes/second-brain/scratch/recovered_lib.rs', obj.content);
        console.log("Recovered lib.rs!");
        break;
    }
}
