import React from 'react';
import { mergeStyles } from '@fluentui/react';
import { FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import { cardStyles } from './componentTokens';
import { ClientInfo } from './JointClientCard';
import '../../app/styles/InstructionDashboard.css';

interface InstructionDashboardProps {
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
    onOpenInstruction?: (ref: string) => void;
}

const InstructionDashboard: React.FC<InstructionDashboardProps> = ({
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
    onOpenInstruction,
}) => {
    const style: React.CSSProperties = {
        '--animation-delay': `${animationDelay}s`,
    } as React.CSSProperties;

    const cardClass = mergeStyles('instruction-dashboard', cardStyles.root, {
        borderRadius: 0,
        boxShadow: 'none',
        border: '1px solid #ccc',
    });

    const stage = instruction?.Stage ?? 'deal pending';
    const riskStatus = risk?.RiskAssessmentResult ?? '-';
    const eidStatus = eid?.EIDStatus ?? '-';
    const complianceStatus = compliance?.Status ?? '-';

    const proofOfIdComplete = Boolean(
        instruction?.PassportNumber || instruction?.DriversLicenseNumber
    );
    const paymentStatusRaw = instruction?.PaymentResult?.toLowerCase();
    const paymentComplete = paymentStatusRaw === 'successful';
    const paymentFailed = paymentStatusRaw === 'failed';
    const documentsComplete = documentCount > 0;

    const dealOpen = deals.some((d) => d.Status?.toLowerCase() !== 'closed');
    const uniqueClients = Array.from(new Set(clients.map((c) => c.ClientEmail))).length;

    // Individual completion flags used for separate status clocks
    const idComplete = proofOfIdComplete;
    const payComplete = paymentComplete && !paymentFailed;
    const docsComplete = documentsComplete;
    const eidComplete = eidStatus.toLowerCase() === 'verified';
    const compComplete = complianceStatus.toLowerCase() === 'pass';


    const summaryData = [
        { key: 'deal', label: 'Deal', status: dealOpen ? 'open' : 'closed' },
        { key: 'clients', label: 'Clients', value: uniqueClients },
        { key: 'id', label: 'ID', status: idComplete ? 'complete' : 'pending' },
        { key: 'pay', label: 'Pay', status: payComplete ? 'complete' : paymentFailed ? 'failed' : 'pending' },
        { key: 'docs', label: 'Docs', status: docsComplete ? 'complete' : 'pending' },
        { key: 'eid', label: 'EID', status: eidComplete ? 'complete' : 'pending' },
        { key: 'comp', label: 'Comp.', status: compComplete ? 'complete' : 'pending' },
        { key: 'risk', label: 'Risk', value: riskStatus },
    ];

    const primaryDeal = deal ?? deals[0];
    const leadName = instruction
        ? (instruction.FirstName || instruction.LastName)
            ? `${instruction.FirstName ?? ''} ${instruction.LastName ?? ''}`.trim()
            : instruction.CompanyName ?? clients.find(c => c.Lead)?.ClientEmail ?? ''
        : primaryDeal?.ServiceDescription ?? '';

    return (
        <div className={cardClass} style={style}>
            <header
                className="dashboard-header"
                onClick={instruction ? () => onOpenInstruction?.(instruction.InstructionRef) : undefined}
                style={{ cursor: instruction && onOpenInstruction ? 'pointer' : 'default' }}
            >
                {instruction ? instruction.InstructionRef : 'Deal Pending'}
                <span className="instruction-stage">{stage}</span>
            </header>
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
        </div>
    );
}; 

export default InstructionDashboard;
