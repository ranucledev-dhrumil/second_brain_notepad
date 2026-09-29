const fs = require('fs');
const transcript = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/276cb178-0061-42bc-9442-497e039c40be/.system_generated/logs/transcript_full.jsonl', 'utf8');

const regex = /"content":"Created At:[\\s\\S]*?#\\[tauri::command\\]\\nfn create_workspace_document[\\s\\S]*?expect\(\\"error while running tauri application\\"\);\\n\\}"/;
const match = transcript.match(regex);
if (match) {
    let libCode = match[0].substring(11, match[0].length - 1); // remove "content":" and ending "
    
    // Parse json string back to normal text
    libCode = JSON.parse('"' + libCode + '"');
    
    // strip tool output preamble if any
    const preambleMatch = libCode.match(/Output:\n([\s\S]*)$/);
    if (preambleMatch) {
        libCode = preambleMatch[1];
    }
    
    // The match might not cover the start of the file.
    // We should extract the whole TOOL_RESPONSE that contains it.
}

// better way:
const lines = transcript.split('\n').filter(Boolean);
for (const line of lines) {
    const obj = JSON.parse(line);
    if (obj.type === 'PLANNER_RESPONSE' && obj.tool_calls) {
        // wait, view_file results are in TOOL_RESPONSE
    }
    if (obj.type === 'TOOL_RESPONSE' && obj.content && obj.content.includes('fn capture_workspace_document')) {
        let content = obj.content;
        const preambleMatch = content.match(/Output:\n([\s\S]*)$/);
        if (preambleMatch) {
            content = preambleMatch[1];
        }
        fs.writeFileSync('D:/Phase-3/Second_Brain_Notes/second-brain/scratch/recovered_lib_full.rs', content);
        console.log("Recovered full!");
        break;
    }
}
