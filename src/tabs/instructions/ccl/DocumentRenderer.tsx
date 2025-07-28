import React from "react";
import { colours } from "../../../app/styles/colours";

export interface Section {
    heading: string;
    lines: string[];
}

export function parseTemplate(template: string): Section[] {
    const lines = template.split(/\r?\n/);
    const sections: Section[] = [];
    let current: Section | null = null;

    lines.forEach(line => {
        const match = line.match(/^(\d+)\s+(.*)/);
        if (match) {
            if (current) sections.push(current);
            current = { heading: match[2], lines: [] };
        } else {
            if (!current) {
                current = { heading: "", lines: [] };
            }
            current.lines.push(line);
        }
    });
    if (current) sections.push(current);
    return sections;
}

export function renderSections(sections: Section[]) {
    return (
        <ol style={{ paddingLeft: "1.2em" }}>
            {sections.map((sec, idx) => (
                <li key={idx} style={{ marginBottom: "8px" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{sec.heading}</div>
                    {sec.lines.map((line, i) => {
                        if (line.trim().startsWith("—")) {
                            return (
                                <ul key={i} style={{ listStyleType: "disc", paddingLeft: "1.2em" }}>
                                    <li>{line.replace(/^—\s*/, "")}</li>
                                </ul>
                            );
                        }
                        return line.trim() ? <p key={i}>{line}</p> : null;
                    })}
                </li>
            ))}
        </ol>
    );
}

export const DocumentRenderer = ({ template }: { template: string }) => {
    const sections = parseTemplate(template);
    return <div>{renderSections(sections)}</div>;
};
