import React from 'react';
// invisible change 2.1
//
import { Text } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';
import { useTheme } from '../../app/functionality/ThemeContext';
import '../../app/styles/JointClientCard.css';

export interface DealSummary {
    DealId?: number;
    InstructionRef?: string | null;
    ServiceDescription?: string;
    Status?: string;
}


export interface ClientInfo {
    [key: string]: any;
}

interface InstructionSummary {
    InstructionRef: string;
    Email?: string;
    Stage?: string;
    [key: string]: any;
}

interface JointClientCardProps {
    client: ClientInfo;
    animationDelay?: number;
    onOpenInstruction?: (ref: string) => void;
    allInstructions?: InstructionSummary[];
}

const JointClientCard: React.FC<JointClientCardProps> = ({
    client,
    animationDelay = 0,
    onOpenInstruction,
    allInstructions = [],
}) => {
    const { isDarkMode } = useTheme();

    const cardClass = mergeStyles('jointClientCard', {
        backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
        color: isDarkMode ? colours.dark.text : colours.light.text,
        padding: componentTokens.card.base.padding,
        borderRadius: componentTokens.card.base.borderRadius,
        boxShadow: componentTokens.card.base.boxShadow,
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        selectors: {
            ':hover': {
                boxShadow: componentTokens.card.hover.boxShadow,
                transform: componentTokens.card.hover.transform,
            },
        },
    });

    const style: React.CSSProperties = { '--animation-delay': `${animationDelay}s` } as React.CSSProperties;


    // Find instruction for this client email
    const matchingInstruction = allInstructions.find(
        (inst) => inst.Email && inst.Email.toLowerCase() === String(client.ClientEmail).toLowerCase()
    );
    const statusText = matchingInstruction
        ? matchingInstruction.Stage || 'Found'
        : (client.HasSubmitted ? (client.HasSubmitted === '1' ? 'completed' : 'initialised') : undefined);

    return (
        <div className={cardClass} style={style}>
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                {client.ClientEmail}
            </Text>
            {client.Lead && (
                <Text variant="small" styles={{ root: { color: colours.blue } }}>
                    Lead Client
                </Text>
            )}
            {matchingInstruction ? (
                <Text
                    variant="small"
                    styles={{ root: { color: colours.cta, cursor: 'pointer', textDecoration: 'underline' } }}
                    onClick={() => onOpenInstruction && onOpenInstruction(matchingInstruction.InstructionRef)}
                    title="Click to view instruction"
                >
                    {matchingInstruction.Stage || 'Found'}
                </Text>
            ) : (
                <span title="No instruction found for this client">
                    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: 'middle', marginRight: 4 }}>
                        <circle cx="12" cy="12" r="10" fill="#fdeaea" stroke="#e74c3c" strokeWidth="2" />
                        <circle cx="12" cy="16" r="1.5" fill="#e74c3c" />
                        <rect x="11" y="7" width="2" height="6" rx="1" fill="#e74c3c" />
                    </svg>
                    <Text variant="small" styles={{ root: { color: colours.cta, display: 'inline' } }}>
                        Pending
                    </Text>
                </span>
            )}
            <dl className="data-grid">
                {Object.entries(client).map(([k, v]) => (
                    <React.Fragment key={k}>
                        <dt>{k}</dt>
                        <dd>
                            {Array.isArray(v) || typeof v === 'object'
                                ? JSON.stringify(v)
                                : String(v)}
                        </dd>
                    </React.Fragment>
                ))}
            </dl>
        </div>
    );
}; 

export default JointClientCard;
