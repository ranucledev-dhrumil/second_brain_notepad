const fs = require('fs');
const transcript = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/276cb178-0061-42bc-9442-497e039c40be/.system_generated/logs/transcript_full.jsonl', 'utf8');

const lines = transcript.split('\n').filter(Boolean);
for (const line of lines) {
    const obj = JSON.parse(line);
    if (obj.type === 'PLANNER_RESPONSE' && obj.tool_calls) {
        for (const tc of obj.tool_calls) {
            if (tc.name === 'default_api:run_command' && tc.arguments && tc.arguments.CommandLine && tc.arguments.CommandLine.includes('lib.rs')) {
                console.log("Found run_command for lib.rs. Step index:", obj.step_index);
            }
        }
    }
}
