import React, { useState } from 'react';
import { DefaultButton } from '@fluentui/react';
import { InstructionData } from '../../app/functionality/types';

export interface InstructionSummary {
    id: string;
    clientName: string;
    service: string;
    nextAction: string;
}

export const getActionableInstructions = (
    data: InstructionData[],
): InstructionSummary[] => {
    const summaries: InstructionSummary[] = [];
    data.forEach(item => {
        const instruction = item.instructions && item.instructions[0];
        if (!instruction) return;
        const matterLinked = instruction.MatterId || item.matter;
        if (matterLinked) return; // skip if already linked to a matter

        const clientName = `${instruction.FirstName ?? ''} ${instruction.LastName ?? ''}`.trim();
        const service = item.deals?.[0]?.ServiceDescription || 'New Matter';
        const riskDone = (item.riskAssessments && item.riskAssessments.length > 0) ||
            (item.compliance && item.compliance.length > 0);
        const idDone =
            (item.electronicIDChecks && item.electronicIDChecks.length > 0) ||
            (item.idVerifications && item.idVerifications.length > 0);

        let nextAction = 'Review';
        if (!riskDone) {
            nextAction = 'Assess Risk';
        } else if (!idDone) {
            nextAction = 'Verify ID';
        }

        summaries.push({
            id: instruction.InstructionRef ?? String(item.prospectId),
            clientName: clientName || 'Unknown Client',
            service,
            nextAction,
        });
    });
    return summaries;
};

interface InstructionsPromptProps {
    summaries: InstructionSummary[];
    onDismiss: () => void;
}

const InstructionsPrompt: React.FC<InstructionsPromptProps> = ({ summaries, onDismiss }) => {
    const [expanded, setExpanded] = useState(false);
    if (summaries.length === 0) return null;
    return (
        <div className="instructions-prompt" style={{ padding: 16, border: '1px solid #e1dfdd', marginBottom: 16 }}>
            <p>You’ve received {summaries.length} instruction{summaries.length > 1 ? 's' : ''}. Your next step is required.</p>
            <ul style={{ marginTop: 8, marginBottom: 8 }}>
                {summaries.map(s => (
                    <li key={s.id}>{s.clientName} – {s.service} – Next: {s.nextAction}</li>
                ))}
            </ul>
            {expanded && (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 8 }}>
                    {JSON.stringify(summaries, null, 2)}
                </pre>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
                <DefaultButton onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide Details' : 'View Details'}</DefaultButton>
                <DefaultButton onClick={onDismiss}>Dismiss</DefaultButton>
            </div>
        </div>
    );
};

export default InstructionsPrompt;
