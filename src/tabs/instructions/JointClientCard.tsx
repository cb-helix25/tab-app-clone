import React from 'react';
import { Text } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';
import { useTheme } from '../../app/functionality/ThemeContext';
import '../../app/styles/JointClientCard.css';

export interface ClientInfo {
    ClientEmail?: string;
    HasSubmitted?: string;
    Lead?: boolean;
}

interface JointClientCardProps {
    client: ClientInfo;
    animationDelay?: number;
}

const JointClientCard: React.FC<JointClientCardProps> = ({ client, animationDelay = 0 }) => {
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
        </div>
    );
};

export default JointClientCard;
