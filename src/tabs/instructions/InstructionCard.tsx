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
    HelixContact?: string;
    SubmissionDate?: string;
}

interface DealInfo {
    ServiceDescription?: string;
    Amount?: number;
    AreaOfWork?: string;
}

interface InstructionCardProps {
    instruction: InstructionInfo;
    deal?: DealInfo;
    prospectId?: number;
    animationDelay?: number;
}

const InstructionCard: React.FC<InstructionCardProps> = ({ instruction, deal, prospectId, animationDelay = 0 }) => {
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

    const formattedDate = instruction.SubmissionDate
        ? new Date(instruction.SubmissionDate).toLocaleDateString()
        : undefined;

    return (
        <div className={cardClass} style={style}>
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                {instruction.InstructionRef}
            </Text>
            {prospectId !== undefined && (
                <Text variant="small">Prospect ID: {prospectId}</Text>
            )}
            {instruction.Stage && <Text>Status: {instruction.Stage}</Text>}
            {deal?.ServiceDescription && (
                <Text>Service: {deal.ServiceDescription}</Text>
            )}
            {deal?.AreaOfWork && <Text>Area: {deal.AreaOfWork}</Text>}
            {deal?.Amount !== undefined && <Text>Amount: £{deal.Amount}</Text>}
            {formattedDate && <Text>Submitted: {formattedDate}</Text>}
            {instruction.HelixContact && (
                <Text>Contact: {instruction.HelixContact}</Text>
            )}
            {instruction.FirstName && instruction.LastName && (
                <Text>Client: {instruction.FirstName} {instruction.LastName}</Text>
            )}
            {instruction.CompanyName && <Text>Company: {instruction.CompanyName}</Text>}
            {instruction.Email && <Text>{instruction.Email}</Text>}
        </div>
    );
};

export default InstructionCard;