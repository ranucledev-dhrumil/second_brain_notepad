const fs = require('fs');
const transcript = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/276cb178-0061-42bc-9442-497e039c40be/.system_generated/logs/transcript_full.jsonl', 'utf8');

const lines = transcript.split('\n').filter(Boolean);
for (const line of lines) {
    const obj = JSON.parse(line);
    // looking for tool action view_file on lib.rs
    if (obj.type === 'PLANNER_RESPONSE' && obj.tool_calls) {
        for (const tc of obj.tool_calls) {
            if (tc.name === 'default_api:view_file' && tc.arguments && tc.arguments.AbsolutePath && tc.arguments.AbsolutePath.endsWith('lib.rs')) {
                console.log("Found tool call for lib.rs. Step index:", obj.step_index);
            }
        }
    }
}
