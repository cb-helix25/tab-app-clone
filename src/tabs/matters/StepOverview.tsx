import React from 'react';
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
    return (
        <div className="overview-column">
            {steps.map((step) => {
                const complete = isStepComplete(step.key);
                const active = step.key === current;
                return (
                    <section
                        key={step.key}
                        className={`overview-section${active ? ' active' : ''}${complete ? ' complete' : ''
                            }`}
                    >
                        <button
                            type="button"
                            className="overview-header"
                            onClick={() => onStepClick?.(step.key)}
                        >
                            <span className="overview-title">{step.title}</span>
                            {complete && (
                                <span className="overview-tick" aria-hidden="true">
                                    <svg viewBox="0 0 24 24">
                                        <polyline
                                            points="5,13 10,18 19,7"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </span>
                            )}
                        </button>
                        <div className="overview-content">{details[step.key]}</div>
                    </section>
                );
            })}
        </div>
    );
}

export default StepOverview;
