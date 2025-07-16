// server/utils/wordGenerator.js
const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const createReport = require('docx-templates');

async function generateWordFromJson(json, outPath) {
    try {
        const template = readFileSync(path.join(process.cwd(), 'templates', 'cclTemplate.docx'));
        const buf = await createReport({ template, data: json, cmdDelimiter: ['{{', '}}'] });
        writeFileSync(outPath, buf);
    } catch {
        writeFileSync(outPath, Buffer.from('CCL'));
    }
}

module.exports = { generateWordFromJson };