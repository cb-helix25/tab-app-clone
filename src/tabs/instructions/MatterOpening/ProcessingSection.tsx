import React from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react';
import '../../../app/styles/ProcessingSection.css';

export type ProcessingStatus = 'pending' | 'success' | 'error';

export interface ProcessingStep {
    label: string;
    status: ProcessingStatus;
}

interface ProcessingSectionProps {
    steps: ProcessingStep[];
    logs: string[];
}

const iconForStatus = (status: ProcessingStatus) => {
    switch (status) {
        case 'success':
            return <span aria-hidden="true">✔️</span>;
        case 'error':
            return <span aria-hidden="true">❌</span>;
        default:
            return <Spinner size={SpinnerSize.small} />;
    }
};

const ProcessingSection: React.FC<ProcessingSectionProps> = ({ steps, logs }) => (
    <div className="processing-section">
        <h3>Processing</h3>
        <ul className="processing-steps">
            {steps.map((s, idx) => (
                <li key={idx} className={`step-${s.status}`}>
                    {iconForStatus(s.status)}
                    <span className="label">{s.label}</span>
                </li>
            ))}
        </ul>
        {logs.length > 0 && (
            <pre className="processing-logs">{logs.join('\n')}</pre>
        )}
    </div>
);

export default ProcessingSection;