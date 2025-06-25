import React, { useState } from 'react';
import '../../app/styles/StepOverview.css';
import { componentTokens } from '../../app/styles/componentTokens';

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
    const baseStyle: React.CSSProperties = {
        backgroundColor: componentTokens.summaryPane.base.backgroundColor,
        borderRadius: componentTokens.summaryPane.base.borderRadius,
        border: `1px solid ${componentTokens.summaryPane.base.borderColor}`,
        boxShadow: componentTokens.summaryPane.base.boxShadow,
        padding: componentTokens.summaryPane.base.padding,
    };
    const collapsedStyle: React.CSSProperties = !open
        ? {
            backgroundColor: componentTokens.summaryPane.collapsed.backgroundColor,
            borderColor: componentTokens.summaryPane.collapsed.borderColor,
            padding: componentTokens.summaryPane.collapsed.padding,
        }
        : {};
    return (
        <div className="overview-column" style={{ ...baseStyle, ...collapsedStyle }}>
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
                                className={`overview-section${active ? ' active' : ''}${complete ? ' complete' : ''}`}
                                onClick={() => onStepClick?.(step.key)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="step-row">
                                    <span className="step-marker">
                                        {complete ? '✔' : steps.findIndex(s => s.key === step.key) + 1}
                                    </span>
                                    <span className="step-label">{step.title}</span>
                                </div>
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