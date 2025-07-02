const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'src', 'localData', 'localSnippetEdits.json');

const edits = [
    {
        id: 1,
        snippetId: 101,
        blockTitle: 'Intro',
        currentText: 'Current snippet text',
        proposedText: 'Updated snippet text',
        submittedBy: 'Local Tester',
        submittedAt: new Date().toISOString(),
        status: 'pending'
    }
];

fs.writeFileSync(outputPath, JSON.stringify(edits, null, 2));
console.log(`localSnippetEdits.json generated with ${edits.length} records`);