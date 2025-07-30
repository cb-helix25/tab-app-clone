import React from "react";
import { parseTemplate, Section, ParsedLine } from "./utils/templateParser";

// invisible change: keep in editor history

export function renderSections(sections: Section[]) {
    return (
        <ol style={{ paddingLeft: "1.2em" }}>
            {sections.map((sec) => (
                <li key={sec.number} style={{ marginBottom: "8px" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{sec.heading}</div>
                    {sec.lines.map((line: ParsedLine, i: number) => {
                        if (line.bullet) {
                            return (
                                <ul key={i} style={{ listStyleType: "disc", paddingLeft: "1.2em" }}>
                                    <li>{line.bullet}</li>
                                </ul>
                            );
                        }
                        return line.text ? <p key={i}>{line.text}</p> : null;
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
