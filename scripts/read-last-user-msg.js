const fs = require('fs');
const path = require('path');

const logPath = '/Users/akshaydahiya/.gemini/antigravity/brain/5d758699-bb15-413f-b76f-67627c4f7b1f/.system_generated/logs/transcript.jsonl';
if (!fs.existsSync(logPath)) {
  console.log("Log path does not exist");
  process.exit(1);
}

const lines = fs.readFileSync(logPath, 'utf8').split('\n');
console.log("Total lines:", lines.length);

const userInputs = [];
for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i]) continue;
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.source === 'USER_EXPLICIT' && obj.type === 'USER_INPUT') {
      userInputs.push(obj);
      if (userInputs.length >= 10) break;
    }
  } catch (e) {
    // ignore
  }
}

console.log("LAST 10 USER INPUTS:");
userInputs.reverse().forEach((ui, idx) => {
  console.log(`[${idx}] Date: ${ui.created_at} | Step: ${ui.step_index}`);
  console.log(ui.content);
  console.log("=========================================");
});
