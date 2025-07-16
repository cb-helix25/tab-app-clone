const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');
const path = require('path');

async function generateCCLDocument(matterId, data) {
    const doc = new Document();
    doc.addSection({
        children: [
            new Paragraph({
                children: [new TextRun({ text: 'Client Care Letter', bold: true })]
            }),
            new Paragraph(JSON.stringify(data, null, 2))
        ]
    });
    const buffer = await Packer.toBuffer(doc);
    const outDir = path.join(__dirname, '..', '..', 'public', 'ccls');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const filePath = path.join(outDir, `${matterId}.docx`);
    fs.writeFileSync(filePath, buffer);
    const url = `/ccls/${matterId}.docx`;
    return url;
}

module.exports = { generateCCLDocument };