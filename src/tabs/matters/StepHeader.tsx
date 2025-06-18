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
        className={`step-header${open ? ' open' : ''}${complete ? ' completed' : ''}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={open}
    >
        <div className="step-number">{step}</div>
        <div className="step-title">
            {title}
            {complete && <span className="completion-check">✓</span>}
        </div>
        <div className="toggle-icon">{open ? '−' : '+'}</div>
    </div>
);

export default StepHeader;
