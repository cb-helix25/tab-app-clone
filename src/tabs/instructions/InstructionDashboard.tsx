import React, { useState } from 'react';
import { mergeStyles } from '@fluentui/react';
import { cardStyles } from './componentTokens';
import { ClientInfo } from './JointClientCard';
import '../../app/styles/InstructionDashboard.css';

interface InstructionDashboardProps {
    instruction: any;
    deals: any[];
    clients: ClientInfo[];
    risk?: any;
    eid?: any;
    compliance?: any;
    documentCount?: number;
    animationDelay?: number;
    onOpenInstruction?: (ref: string) => void;
    onNavigate?: (pivot: 'deals' | 'clients' | 'risk') => void;
}

const InstructionDashboard: React.FC<InstructionDashboardProps> = ({
    instruction,
    deals,
    clients,
    risk,
    eid,
    compliance,
    documentCount = 0,
    animationDelay = 0,
    onOpenInstruction,
    onNavigate,
}) => {
    const style: React.CSSProperties = {
        '--animation-delay': `${animationDelay}s`,
    } as React.CSSProperties;

    const cardClass = mergeStyles('instruction-dashboard', cardStyles.root, {
        borderRadius: 0,
        boxShadow: 'none',
        border: '1px solid #ccc',
    });

    const [activeTab, setActiveTab] = useState<'summary' | 'deals' | 'clients' | 'risk'>('summary');

    const stage = instruction.Stage ?? '-';
    const riskStatus = risk?.RiskAssessmentResult ?? '-';
    const eidStatus = eid?.EIDStatus ?? '-';
    const complianceStatus = compliance?.Status ?? '-';

    const proofOfIdComplete = Boolean(
        instruction.PassportNumber || instruction.DriversLicenseNumber
    );
    const paymentStatusRaw = instruction.PaymentResult?.toLowerCase();
    const paymentComplete = paymentStatusRaw === 'successful';
    const paymentFailed = paymentStatusRaw === 'failed';
    const documentsComplete = documentCount > 0;

    const summaryData = [
        { label: 'Stage', value: stage },
        { label: 'Deals', value: deals.length || '-' },
        { label: 'Clients', value: clients.length || '-' },
        { label: 'ID', value: proofOfIdComplete ? 'complete' : 'pending' },
        {
            label: 'Payment',
            value: paymentComplete ? 'complete' : paymentFailed ? 'failed' : 'pending',
        },
        { label: 'Docs', value: documentsComplete ? 'complete' : 'pending' },
        { label: 'EID', value: eidStatus },
        { label: 'Risk', value: riskStatus },
        { label: 'Compliance', value: complianceStatus },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'deals':
                if (!deals.length)
                    return <div className="placeholder">No deals</div>;
                return (
                    <>
                        <ul className="detail-list">
                            {deals.map((d, i) => (
                                <li key={i}>
                                    {d.ServiceDescription || 'Deal'} – {d.Status || '-'}
                                </li>
                            ))}
                        </ul>
                        {onNavigate && (
                            <div className="jump-link" onClick={() => onNavigate('deals')}>View all deals</div>
                        )}
                    </>
                );
            case 'clients':
                if (!clients.length)
                    return <div className="placeholder">No clients</div>;
                return (
                    <>
                        <ul className="detail-list">
                            {clients.map((c, i) => (
                                <li key={i}>
                                    {c.ClientEmail} –{' '}
                                    {c.HasSubmitted ? 'submitted' : 'pending'}
                                </li>
                            ))}
                        </ul>
                        {onNavigate && (
                            <div className="jump-link" onClick={() => onNavigate('clients')}>View all clients</div>
                        )}
                    </>
                );
            case 'risk':
                return (
                    <>
                        <div className="risk-detail">
                            <div>Risk: {riskStatus}</div>
                            <div>EID: {eidStatus}</div>
                            <div>Compliance: {complianceStatus}</div>
                            {risk?.RiskScore !== undefined && (
                                <div>Score: {risk.RiskScore}</div>
                            )}
                        </div>
                        {onNavigate && (
                            <div className="jump-link" onClick={() => onNavigate('risk')}>View full details</div>
                        )}
                    </>
                );
            default:
                return (
                    <>
                        <ul className="detail-list">
                            {summaryData.map((d, i) => (
                                <li key={i}>
                                    <strong>{d.label}:</strong> {d.value}
                                </li>
                            ))}
                        </ul>
                        {onOpenInstruction && (
                            <div className="jump-link" onClick={() => onOpenInstruction(instruction.InstructionRef)}>
                                Open instruction
                            </div>
                        )}
                    </>
                );
        }
    };

    const tabs: { key: 'summary' | 'deals' | 'clients' | 'risk'; label: string }[] = [
        { key: 'summary', label: 'Summary' },
        { key: 'deals', label: 'Deals' },
        { key: 'clients', label: 'Clients' },
        { key: 'risk', label: 'Risk & Comp.' },
    ];

    return (
        <div className={cardClass} style={style}>
            <header
                className="dashboard-header"
                onClick={() => onOpenInstruction?.(instruction.InstructionRef)}
                style={{ cursor: onOpenInstruction ? 'pointer' : 'default' }}
            >
                {instruction.InstructionRef}
            </header>
            <div className="status-row">
                {summaryData.map((d, i) => {
                    const status = typeof d.value === 'string' ? d.value.toLowerCase() : '';
                    return (
                        <div key={i} className="status-item">
                            <span className="status-label">{d.label}</span>
                            <span className={`status-value ${status}`}>{d.value}</span>
                        </div>
                    );
                })}
            </div>
            <div className="dashboard-tabs">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <div className="tab-content">{renderTabContent()}</div>
        </div>
    );
};

export default InstructionDashboard;
