import { Document, Packer, Paragraph, TextRun } from 'docx';
import fs from 'fs';
import path from 'path';

export async function generateCCLDocument(matterId: string, data: any): Promise<string> {
    const doc = new Document({
        sections: [
            {
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Client Care Letter', bold: true })
                        ]
                    }),
                    new Paragraph(JSON.stringify(data, null, 2))
                ]
            }
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