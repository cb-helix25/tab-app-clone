import React from 'react';
import { mergeStyles } from '@fluentui/react';
import { FaCheckCircle, FaClock, FaTimesCircle, FaChevronDown } from 'react-icons/fa';
import InstructionCard from './InstructionCard';
import { cardStyles } from './componentTokens';
import { ClientInfo } from './JointClientCard';
import '../../app/styles/InstructionDashboard.css';
import '../../app/styles/InstructionCard.css';
import '../../app/styles/InstructionOverview.css';

interface InstructionOverviewProps {
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

const InstructionOverview: React.FC<InstructionOverviewProps> = ({
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

    const containerClass = mergeStyles('instruction-overview', cardStyles.root, expanded && 'expanded', {
        padding: 0,
        overflow: 'hidden',
    });

    const stage = instruction?.Stage ?? 'deal pending';
    const eidStatus = eid?.EIDStatus ?? '-';
    const eidResult = eid?.EIDOverallResult?.toLowerCase();
    const complianceStatus = compliance?.Status ?? '-';

    const proofOfIdComplete = Boolean(
        instruction?.PassportNumber || instruction?.DriversLicenseNumber,
    );
    const paymentStatusRaw = instruction?.PaymentResult?.toLowerCase();
    const paymentComplete = paymentStatusRaw === 'successful';
    const paymentFailed = paymentStatusRaw === 'failed';
    const documentsComplete = documentCount > 0;

    const dealOpen = deals.some((d) => d.Status?.toLowerCase() !== 'closed');

    let idStatus = 'pending';
    const eidVerified = eidResult === 'passed' || eidResult === 'pass' || eidStatus.toLowerCase() === 'verified';
    if (proofOfIdComplete) {
        if (!eid || eidStatus.toLowerCase() === 'pending') idStatus = 'received';
        else if (eidVerified) idStatus = 'verified';
        else idStatus = 'review';
    }

    const summaryData = [
        { key: 'deal', label: 'Deal', status: dealOpen ? 'open' : 'closed' },
        { key: 'id', label: 'Proof of ID', status: idStatus },
        {
            key: 'pay',
            label: 'Pay',
            status: paymentComplete ? 'complete' : paymentFailed ? 'failed' : 'pending',
        },
        { key: 'docs', label: 'Docs', status: documentsComplete ? 'complete' : 'pending' },
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
                    {leadName && <span className="lead-client">{leadName}</span>}
                    <span className="instruction-stage">{stage}</span>
                    <FaChevronDown className="chevron" />
                </div>
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
                        const icon = d.status
                            ? ['complete', 'closed', 'verified', 'approved'].includes(status)
                                ? <FaCheckCircle />
                                : status === 'failed'
                                    ? <FaTimesCircle />
                                    : <FaClock />
                            : null;
                        return (
                            <div key={i} className={`status-item ${d.key}`}>
                                <span className="status-label">{d.label}</span>
                                <span className={`status-value ${status}`}>{icon}</span>
                            </div>
                        );
                    })}
                </div>
            </button>
            {expanded && (
                <InstructionCard
                    instruction={instruction as any}
                    deal={deal}
                    deals={deals}
                    clients={clients}
                    prospectId={prospectId}
                    risk={risk}
                    eid={eid}
                    compliance={compliance}
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

export default InstructionOverview;
