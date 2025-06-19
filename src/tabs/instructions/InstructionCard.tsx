import React from 'react';
import { Text, mergeStyles } from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';
import '../../app/styles/InstructionCard.css';

interface InstructionInfo {
    InstructionRef: string;
    Stage?: string;
    FirstName?: string;
    LastName?: string;
    CompanyName?: string;
    Email?: string;
}

interface InstructionCardProps {
    instruction: InstructionInfo;
    animationDelay?: number;
}

const InstructionCard: React.FC<InstructionCardProps> = ({ instruction, animationDelay = 0 }) => {
    const cardClass = mergeStyles('instructionCard', {
        backgroundColor: colours.light.sectionBackground,
        borderRadius: componentTokens.card.base.borderRadius,
        padding: componentTokens.card.base.padding,
        boxShadow: componentTokens.card.base.boxShadow,
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        selectors: {
            ':hover': {
                boxShadow: componentTokens.card.hover.boxShadow,
                transform: componentTokens.card.hover.transform,
            },
        },
    });

    const style: React.CSSProperties = {
        '--animation-delay': `${animationDelay}s`,
    } as React.CSSProperties;

    return (
        <div className={cardClass} style={style}>
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                {instruction.InstructionRef}
            </Text>
            {instruction.Stage && <Text>Status: {instruction.Stage}</Text>}
            {instruction.FirstName && instruction.LastName && (
                <Text>Client: {instruction.FirstName} {instruction.LastName}</Text>
            )}
            {instruction.CompanyName && <Text>Company: {instruction.CompanyName}</Text>}
            {instruction.Email && <Text>{instruction.Email}</Text>}
        </div>
    );
};

export default InstructionCard;