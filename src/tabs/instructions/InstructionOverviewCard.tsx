import React from 'react';
// invisible change 2.1
//
import { mergeStyles } from '@fluentui/react';
import { cardStyles } from './componentTokens';
import { ClientInfo } from './JointClientCard';
import '../../app/styles/InstructionOverviewCard.css';

interface OverviewCardProps {
    instruction: any;
    deals: any[];
    clients: ClientInfo[];
    risk?: any;
    eid?: any;
    compliance?: any;
    prospectId?: number;
    animationDelay?: number;
}

const InstructionOverviewCard: React.FC<OverviewCardProps> = ({
    instruction,
    deals,
    clients,
    risk,
    eid,
    compliance,
    animationDelay = 0,
}) => {
    const style: React.CSSProperties = {
        '--animation-delay': `${animationDelay}s`,
    } as React.CSSProperties;

    const cardClass = mergeStyles('overview-card', cardStyles.root);

    const riskStatus = risk?.RiskAssessmentResult || '-';
    const eidStatus = eid?.EIDStatus || '-';
    const complianceStatus = compliance?.Status || '-';

    return (
        <div className={cardClass} style={style}>
            <div className="overview-header">{instruction.InstructionRef}</div>
            <div className="summary-row">
                <div className="summary-item">
                    <span className="summary-label">Deals</span>
                    <span className="summary-value">{deals.length || '-'}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Clients</span>
                    <span className="summary-value">{clients.length || '-'}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">EID</span>
                    <span className="summary-value">{eidStatus}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Risk</span>
                    <span className="summary-value">{riskStatus}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Compliance</span>
                    <span className="summary-value">{complianceStatus}</span>
                </div>
            </div>
        </div>
      );
};

export default InstructionOverviewCard;
