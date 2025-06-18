import React from 'react';
import '../../app/styles/NewMatters.css';

interface StepHeaderProps {
    step: number;
    title: string;
    complete?: boolean;
    open: boolean;
    onToggle: () => void;
}

const StepHeader: React.FC<StepHeaderProps> = ({
    step,
    title,
    complete = false,
    open,
    onToggle,
}) => (
    <div
        className={`step-header${open ? ' active' : ''}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
    >
        <div className="step-number">{step}</div>
        <h2>
            {title}
            {complete && (
                <span className="completion-tick visible">
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
        </h2>
        <span className="toggle-icon">{open ? '−' : '+'}</span>
    </div>
);

export default StepHeader;
