import React from 'react';
// invisible change 2.1
//
import '../../app/styles/StepProgress.css';

// Make generic on T extends string
interface StepProgressProps<T extends string> {
    steps: { key: T; label: string }[];
    current: T;
    onStepClick?: (key: T) => void;
}

function StepProgress<T extends string>({ steps, current, onStepClick }: StepProgressProps<T>) {
    const indexOf = (key: T) => steps.findIndex(s => s.key === key);
    const currentIndex = indexOf(current);
    return (
        <ul className="step-progress">
            {steps.map((step, idx) => {
                const done = idx < currentIndex;
                const isCurrent = idx === currentIndex;
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

export default StepProgress;