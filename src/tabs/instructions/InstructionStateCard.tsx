import React from 'react';
// invisible change 2
//
import { mergeStyles } from '@fluentui/react';
import { FaCheckCircle, FaClock, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import { cardStyles } from './componentTokens';
import '../../app/styles/InstructionDashboard.css';

export interface InstructionStateData {
    scenario: string;
    deal: string;
    id: string;
    pay: string;
    docs: string;
    risk: string;
    openMatter?: boolean;
    notes?: string;
}

const iconForStatus = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (['complete', 'closed', 'verified', 'approved', '✓'].includes(s)) {
        return <FaCheckCircle />;
    }
    if (['failed', '✗'].includes(s)) {
        return <FaTimesCircle />;
    }
    if (s === 'flagged') {
        return <FaExclamationTriangle />;
    }
    if (s === 'disabled' || s === 'optional') {
        return null;
    }
    return <FaClock />;
};

const InstructionStateCard: React.FC<{ data: InstructionStateData }> = ({ data }) => {
    const summaryData = [
        { key: 'deal', label: 'Deal', status: data.deal },
        { key: 'id', label: 'ID', status: data.id },
        { key: 'pay', label: 'Pay', status: data.pay },
        { key: 'docs', label: 'Docs', status: data.docs },
        { key: 'risk', label: 'Risk', status: data.risk },
    ];

    return (
        <div className={mergeStyles('instruction-dashboard', cardStyles.root)}>
            <header className="dashboard-header">{data.scenario}</header>
            <div className="status-row">
                {summaryData.map((d, i) => (
                    <div key={i} className={`status-item ${d.key}`}>
                        <span className="status-label">{d.label}</span>
                        <span className={`status-value ${(d.status || '').toLowerCase()}`}>{iconForStatus(d.status)}</span>
                    </div>
                ))}
            </div>
            {data.notes && <p className="placeholder">{data.notes}</p>}
        </div>
    );
};

export default InstructionStateCard;
