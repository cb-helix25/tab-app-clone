import React from 'react';
import '../../app/styles/StepOverview.css';

interface StepOverviewProps<T extends string> {
    steps: { key: T; label: string }[];
    current: T;
    isComplete: (key: T) => boolean;
    onStepClick?: (key: T) => void;
}

function StepOverview<T extends string>({ steps, current, isComplete, onStepClick }: StepOverviewProps<T>) {
    return (
        <ul className="step-overview">
            {steps.map((step, idx) => {
                const done = isComplete(step.key);
                const isCurrent = current === step.key;
                const className = `${done ? 'done' : ''} ${isCurrent ? 'current' : ''}`.trim();
                return (
                    <li
                        key={step.key}
                        className={className}
                        onClick={() => onStepClick?.(step.key)}
                        style={{ cursor: onStepClick ? 'pointer' : 'default' }}
                    >
                        <span className="step-marker">{done ? '✔' : idx + 1}</span>
                        <span className="step-label">{step.label}</span>
                    </li>
                );
            })}
        </ul>
    );
}

export default StepOverview;