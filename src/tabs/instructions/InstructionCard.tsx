import React, { useState } from 'react';
import { Text, mergeStyles } from '@fluentui/react';
import { FaIdBadge, FaRegIdBadge, FaFileAlt, FaRegFileAlt } from 'react-icons/fa';
import { MdAssessment, MdOutlineAssessment } from 'react-icons/md';
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

const iconMap = {
    eid: { outline: FaRegIdBadge, filled: FaIdBadge },
    risk: { outline: MdOutlineAssessment, filled: MdAssessment },
    matter: { outline: FaRegFileAlt, filled: FaFileAlt },
};

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

    const [activeTab, setActiveTab] = useState<'eid' | 'risk' | 'matter'>('eid');

    return (
        <div className={cardClass} style={style}>
            <div className="instruction-header">{instruction.InstructionRef}</div>
            <div className="bottom-tabs">
                <button
                    type="button"
                    className={`bottom-tab ${activeTab === 'eid' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('eid');
                        onEIDCheck && onEIDCheck();
                    }}
                    aria-label="EID Check"
                >
                    <span className="icon-hover">
                        {React.createElement(iconMap.eid.outline, { className: 'icon-outline' })}
                        {React.createElement(iconMap.eid.filled, { className: 'icon-filled' })}
                    </span>
                    <span>EID Check</span>
                </button>
                <button
                    type="button"
                    className={`bottom-tab ${activeTab === 'risk' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('risk');
                        onRiskAssessment && onRiskAssessment();
                    }}
                    aria-label="Risk"
                >
                    <span className="icon-hover">
                        {React.createElement(iconMap.risk.outline, { className: 'icon-outline' })}
                        {React.createElement(iconMap.risk.filled, { className: 'icon-filled' })}
                    </span>
                    <span>Risk</span>
                </button>
                <button
                    type="button"
                    className={`bottom-tab ${activeTab === 'matter' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('matter');
                        onOpenMatter && onOpenMatter();
                    }}
                    disabled={openDisabled}
                    aria-label="Open Matter"
                >
                    <span className="icon-hover">
                        {React.createElement(iconMap.matter.outline, { className: 'icon-outline' })}
                        {React.createElement(iconMap.matter.filled, { className: 'icon-filled' })}
                    </span>
                    <span>Open Matter</span>
                </button>
            </div>
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
        </div>
    );
};

export default InstructionCard;