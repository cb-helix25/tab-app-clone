import React from 'react';
import { mergeStyles } from '@fluentui/react';
import { FaCheckCircle, FaClock, FaTimesCircle, FaChevronDown } from 'react-icons/fa';
import InstructionCard from './InstructionCard';
import { cardStyles } from './componentTokens';
import { ClientInfo } from './JointClientCard';
import '../../app/styles/InstructionDashboard.css';
import '../../app/styles/InstructionCard.css';
import '../../app/styles/InstructionOverviewItem.css';

interface InstructionOverviewItemProps {
    instruction?: any;
    deal?: any;
    deals: any[];
    clients: ClientInfo[];
    risk?: any;
    eid?: any;
    compliance?: any;
    prospectId?: number;
    passcode?: string;
    documentCount?: number;
    animationDelay?: number;
    expanded: boolean;
    onToggle: () => void;
    onOpenMatter?: () => void;
    onRiskAssessment?: () => void;
    onEIDCheck?: () => void;
}

const InstructionOverviewItem: React.FC<InstructionOverviewItemProps> = ({
    instruction,
    deal,
    deals,
    clients,
    risk,
    eid,
    compliance,
    prospectId,
    passcode,
    documentCount = 0,
    animationDelay = 0,
    expanded,
    onToggle,
    onOpenMatter,
    onRiskAssessment,
    onEIDCheck,
}) => {
    const style: React.CSSProperties = {
        '--animation-delay': `${animationDelay}s`,
    } as React.CSSProperties;

    const containerClass = mergeStyles('overview-item', cardStyles.root, expanded && 'expanded', {
        padding: 0,
        overflow: 'hidden',
    });

    const stage = instruction?.Stage ?? 'deal pending';
    const riskStatus = risk?.RiskAssessmentResult ?? '-';
    const eidStatus = eid?.EIDStatus ?? '-';
    const complianceStatus = compliance?.Status ?? '-';

    const proofOfIdComplete = Boolean(
        instruction?.PassportNumber || instruction?.DriversLicenseNumber,
    );
    const paymentStatusRaw = instruction?.PaymentResult?.toLowerCase();
    const paymentComplete = paymentStatusRaw === 'successful';
    const paymentFailed = paymentStatusRaw === 'failed';
    const documentsComplete = documentCount > 0;

    const dealOpen = deals.some((d) => d.Status?.toLowerCase() !== 'closed');
    const uniqueClients = Array.from(new Set(clients.map((c) => c.ClientEmail))).length;

    const summaryData = [
        { key: 'deal', label: 'Deal', status: dealOpen ? 'open' : 'closed' },
        { key: 'clients', label: 'Clients', value: uniqueClients },
        { key: 'id', label: 'ID', status: proofOfIdComplete ? 'complete' : 'pending' },
        {
            key: 'pay',
            label: 'Pay',
            status: paymentComplete ? 'complete' : paymentFailed ? 'failed' : 'pending',
        },
        { key: 'docs', label: 'Docs', status: documentsComplete ? 'complete' : 'pending' },
        {
            key: 'eid',
            label: 'EID',
            status: eidStatus.toLowerCase() === 'verified' ? 'complete' : 'pending',
        },
        {
            key: 'comp',
            label: 'Comp.',
            status: complianceStatus.toLowerCase() === 'pass' ? 'complete' : 'pending',
        },
        { key: 'risk', label: 'Risk', value: riskStatus },
    ];

    const primaryDeal = deal ?? deals[0];
    const leadName = instruction
        ? (instruction.FirstName || instruction.LastName)
            ? `${instruction.FirstName ?? ''} ${instruction.LastName ?? ''}`.trim()
            : instruction.CompanyName ?? clients.find((c) => c.Lead)?.ClientEmail ?? ''
        : primaryDeal?.ServiceDescription ?? '';

    return (
        <div className={containerClass} style={style}>
            <button type="button" className="overview-toggle" onClick={onToggle}>
                <div className="dashboard-header">
                    {instruction ? instruction.InstructionRef : 'Deal Pending'}
                    <span className="instruction-stage">{stage}</span>
                    <FaChevronDown className="chevron" />
                </div>
                {leadName && <div className="lead-client">{leadName}</div>}
                {!instruction && (prospectId || passcode) && (
                    <div className="lead-client">
                        {prospectId && <>Prospect {prospectId}</>}
                        {prospectId && passcode && ' · '}
                        {passcode && <>Passcode {passcode}</>}
                    </div>
                )}
                <div className="status-row">
                    {summaryData.map((d, i) => {
                        const status = (d.status ?? '').toString().toLowerCase();
                        const value = d.value ?? null;
                        const icon = d.status
                            ? status === 'complete' || status === 'closed'
                                ? <FaCheckCircle />
                                : status === 'failed'
                                    ? <FaTimesCircle />
                                    : <FaClock />
                            : null;
                        return (
                            <div key={i} className={`status-item ${d.key}`}>
                                <span className="status-label">{d.label}</span>
                                {icon ? (
                                    <span className={`status-value ${status}`}>{icon}</span>
                                ) : (
                                    <span className="status-value">{value}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </button>
            {expanded && (
                <InstructionCard
                    instruction={instruction as any}
                    deal={deal}
                    prospectId={prospectId}
                    risk={risk}
                    eid={eid}
                    documentCount={documentCount}
                    expanded
                    onOpenMatter={onOpenMatter}
                    onRiskAssessment={onRiskAssessment}
                    onEIDCheck={onEIDCheck}
                />
            )}
        </div>
    );
};

export default InstructionOverviewItem;
