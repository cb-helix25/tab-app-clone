import React, { useState } from 'react';
import '../../app/styles/StepOverview.css';

interface StepInfo<T extends string> {
    key: T;
    title: string;
}

interface StepOverviewProps<T extends string> {
    steps: StepInfo<T>[];
    current: T;
    isStepComplete: (key: T) => boolean;
    details: Record<T, React.ReactNode>;
    onStepClick?: (key: T) => void;
}

function StepOverview<T extends string>({
    steps,
    current,
    isStepComplete,
    details,
    onStepClick,
}: StepOverviewProps<T>) {
    const [open, setOpen] = useState(true);
    return (
        <div className="overview-column">
            <button
                type="button"
                className="summary-header"
                onClick={() => setOpen(!open)}
            >
                <span className="summary-title">Workflow Summary</span>
                <div className="summary-labels">
                    {steps.map((s) => (
                        <span key={s.key} className="summary-label">
                            {s.title}
                        </span>
                    ))}
                </div>
                <span className="summary-toggle">{open ? '−' : '+'}</span>
            </button>
            {open && (
                <div className="overview-body">
                    {steps.map((step) => {
                        const complete = isStepComplete(step.key);
                        const active = step.key === current;
                        return (
                            <div
                                key={step.key}
                                className={`overview-section${active ? ' active' : ''}${complete ? ' complete' : ''
                                    }`}
                                onClick={() => onStepClick?.(step.key)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="overview-content">
                                    {details[step.key]}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
}

export default StepOverview;
