export interface ParsedLine {
    bullet?: string;
    text?: string;
}

export interface Section {
    number: string;
    heading: string;
    lines: ParsedLine[];
}

export function parseTemplate(template: string): Section[] {
    const lines = template.split(/\r?\n/);
    const sections: Section[] = [];
    let current: Section | null = null;

    lines.forEach(line => {
        const match = line.match(/^(\d+)\s+(.*)/);
        if (match) {
            if (current) sections.push(current);
            current = { number: match[1], heading: match[2], lines: [] };
        } else if (current) {
            if (line.trim().startsWith('—')) {
                current.lines.push({ bullet: line.replace(/^—\s*/, '') });
            } else if (line.trim()) {
                current.lines.push({ text: line });
            }
        }
    });
    if (current) sections.push(current);
    return sections;
}