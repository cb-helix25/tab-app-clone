import React from 'react';
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
    ClientEmail?: string;
    HasSubmitted?: string;
    Lead?: boolean;
    deals?: DealSummary[];
}

interface JointClientCardProps {
    client: ClientInfo;
    animationDelay?: number;
    onOpenInstruction?: (ref: string) => void;
}

const JointClientCard: React.FC<JointClientCardProps> = ({
    client,
    animationDelay = 0,
    onOpenInstruction,
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

    const statusText = client.HasSubmitted ? (client.HasSubmitted === '1' ? 'completed' : 'initialised') : undefined;

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
            {statusText && (
                <Text variant="small" styles={{ root: { color: colours.greyText } }}>
                    {statusText}
                </Text>
            )}
            {client.deals && client.deals.length > 0 && (
                <ul className="detail-list">
                    {client.deals.map((d) => (
                        <li key={d.DealId}>
                            {d.ServiceDescription}{' '}
                            {d.Status && (
                                <span style={{ color: colours.greyText }}>(
                                    {d.Status})
                                </span>
                            )}
                            {d.InstructionRef && onOpenInstruction && (
                                <span
                                    className="instruction-link"
                                    onClick={() => onOpenInstruction(d.InstructionRef!)}
                                >
                                    {' '}- View
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}

        </div>
    );
}; 

export default JointClientCard;
