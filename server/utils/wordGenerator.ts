import { readFileSync, writeFileSync } from 'fs';
import createReport from 'docx-templates';

export async function generateWordFromJson(json: any, outPath: string): Promise<void> {
    const template = readFileSync('templates/cclTemplate.docx');
    const buf = await createReport({ template, data: json, cmdDelimiter: ['{{', '}}'] });
    writeFileSync(outPath, buf);
}