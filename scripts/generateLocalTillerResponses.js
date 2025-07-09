const fs = require('fs');
// invisible change 2
const path = require('path');

const inputPath = path.join(__dirname, '..', 'src', 'localData', 'localInstructionData.json');
const outputPath = path.join(__dirname, '..', 'src', 'localData', 'localTillerResponses.json');

const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
if (!Array.isArray(data) || !data.length) {
    console.error('localInstructionData.json is empty or malformed');
    process.exit(1);
}

const instructions = (data[0].instructions || []).map(i => i.InstructionRef).filter(Boolean);

const results = ['pass', 'fail', 'pending'];
const statuses = ['complete', 'error'];

const responses = [];

instructions.forEach((ref, idx) => {
    [1, 2, 3].forEach(check => {
        responses.push({
            matterRef: ref,
            checkTypeId: check,
            result: results[(idx + check) % results.length],
            status: statuses[(idx + check) % statuses.length]
        });
    });
});

fs.writeFileSync(outputPath, JSON.stringify(responses, null, 2));
console.log(`localTillerResponses.json generated with ${responses.length} records`);