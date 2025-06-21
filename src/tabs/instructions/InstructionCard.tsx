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
    risk?: {
        RiskAssessmentResult?: string;
        RiskScore?: number;
    } | null;
    eid?: {
        EIDStatus?: string;
    } | null;
    animationDelay?: number;
    onOpenMatter?: () => void;
    onRiskAssessment?: () => void;
    onEIDCheck?: () => void;
}

const InstructionCard: React.FC<InstructionCardProps> = ({
    instruction,
    deal,
    prospectId,
    risk,
    eid,
    animationDelay = 0,
    onOpenMatter,
    onRiskAssessment,
    onEIDCheck,
}) => {
    const cardClass = mergeStyles('instructionCard', {
        backgroundColor: colours.light.sectionBackground,
        borderRadius: componentTokens.card.base.borderRadius,
        padding: componentTokens.card.base.padding,
        boxShadow: componentTokens.card.base.boxShadow,
        color: colours.light.text,
        height: '100%',
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

    const openDisabled =
        !risk?.RiskAssessmentResult || eid?.EIDStatus?.toLowerCase() !== 'verified';

    return (
        <div className={cardClass} style={style}>
            <div className="vertical-tabs">
                <button className="vertical-tab" onClick={onRiskAssessment}>
                    Risk
                </button>
                <button className="vertical-tab" onClick={onEIDCheck}>
                    ID Check
                </button>
                <button
                    className="vertical-tab"
                    onClick={onOpenMatter}
                    disabled={openDisabled}
                >
                    Open Matter
                </button>
            </div>
            <Text
                variant="mediumPlus"
                styles={{ root: { fontWeight: 600, marginBottom: 4 } }}
            >
                {instruction.InstructionRef}
            </Text>
            <div className="instruction-details">
                <ul className="detail-list">
                    {prospectId !== undefined && (
                        <li>
                            <strong>Prospect ID:</strong> {prospectId}
                        </li>
                    )}
                    {instruction.Stage && (
                        <li>
                            <strong>Status:</strong> {instruction.Stage}
                        </li>
                    )}
                    {deal?.ServiceDescription && (
                        <li>
                            <strong>Service:</strong> {deal.ServiceDescription}
                        </li>
                    )}
                    {deal?.AreaOfWork && (
                        <li>
                            <strong>Area:</strong> {deal.AreaOfWork}
                        </li>
                    )}
                    {deal?.Amount !== undefined && (
                        <li>
                            <strong>Amount:</strong> £{deal.Amount}
                        </li>
                    )}
                    {formattedDate && (
                        <li>
                            <strong>Submitted:</strong> {formattedDate}
                        </li>
                    )}
                    {instruction.HelixContact && (
                        <li>
                            <strong>Contact:</strong> {instruction.HelixContact}
                        </li>
                    )}
                    {instruction.FirstName && instruction.LastName && (
                        <li>
                            <strong>Client:</strong> {instruction.FirstName}{' '}
                            {instruction.LastName}
                        </li>
                    )}
                    {instruction.CompanyName && (
                        <li>
                            <strong>Company:</strong> {instruction.CompanyName}
                        </li>
                    )}
                    {instruction.Email && <li>{instruction.Email}</li>}
                </ul>

            </div>
            <div className="instruction-actions">
                <Text variant="small" styles={{ root: { fontWeight: 600 } }}>
                    Action Points
                </Text>
                <ul className="action-list">
                    <li>
                        ID Check:{' '}
                        {eid?.EIDStatus ? eid.EIDStatus : 'Pending'}
                    </li>
                    <li>
                        Risk:{' '}
                        {risk?.RiskAssessmentResult
                            ? risk.RiskAssessmentResult
                            : 'Pending'}
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default InstructionCard;