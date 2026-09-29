const fs = require('fs');
const transcript = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/276cb178-0061-42bc-9442-497e039c40be/.system_generated/logs/transcript_full.jsonl', 'utf8');

const match = transcript.match(/fn capture_workspace_document[\s\S]{1,5000}/);
if (match) {
    fs.writeFileSync('D:/Phase-3/Second_Brain_Notes/second-brain/scratch/found.txt', match[0]);
    console.log("Found something!");
} else {
    console.log("Not found.");
}
