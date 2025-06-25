import React from 'react';
import { Stack } from '@fluentui/react';
import InstructionCard from './InstructionCard';
import DealCard from './DealCard';
import JointClientCard, { ClientInfo } from './JointClientCard';
import RiskCard from './RiskCard';
import ComplianceCard from './ComplianceCard';
import { cardTokens } from './componentTokens';

interface OverviewCardProps {
    instruction: any;
    deals: any[];
    clients: ClientInfo[];
    risk?: any;
    compliance?: any;
    prospectId?: number;
    animationDelay?: number;
    onOpenMatter?: () => void;
    onRiskAssessment?: () => void;
    onEIDCheck?: () => void;
}

const InstructionOverviewCard: React.FC<OverviewCardProps> = ({
    instruction,
    deals,
    clients,
    risk,
    compliance,
    prospectId,
    animationDelay = 0,
    onOpenMatter,
    onRiskAssessment,
    onEIDCheck,
}) => {
    const style: React.CSSProperties = {
        '--animation-delay': `${animationDelay}s`,
    } as React.CSSProperties;
    return (
        <Stack tokens={cardTokens} style={style}>
            {deals.map((d, idx) => (
                <DealCard key={idx} deal={d} onOpenInstruction={() => { }} />
            ))}
            <InstructionCard
                instruction={instruction}
                deal={deals[0]}
                prospectId={prospectId}
                risk={risk}
                documentCount={instruction.documentCount}
                onOpenMatter={onOpenMatter}
                onRiskAssessment={onRiskAssessment}
                onEIDCheck={onEIDCheck}
            />
            {clients.map((c, idx) => (
                <JointClientCard key={idx} client={c} />
            ))}
            {risk && <RiskCard data={risk} />}
            {compliance && <ComplianceCard data={compliance} />}
        </Stack>
    );
};

export default InstructionOverviewCard;
