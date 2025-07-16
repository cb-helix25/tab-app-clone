const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const createReport = require('docx-templates').default;

// `json` should already have any nested fields flattened so tokens like
// {{responsibleSolicitor_name}} resolve correctly.

async function generateWordFromJson(json, outPath) {
    const templatePath = path.join(process.cwd(), 'templates', 'cclTemplate.docx');
    const template = readFileSync(templatePath);
    const ctx = new Proxy({}, { get: () => () => '' });
    const buf = await createReport({
        template,
        data: json,
        cmdDelimiter: ['{{', '}}'],
        additionalJsContext: ctx
    });
    writeFileSync(outPath, buf);
}

module.exports = { generateWordFromJson };