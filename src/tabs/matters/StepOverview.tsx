import React from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { FaEdit } from 'react-icons/fa';
import '../../app/styles/StepOverview.css';

interface StepOverviewProps<T extends string> {
    steps: { key: T; label: string }[];
    current: T;
    isComplete: (key: T) => boolean;
    details?: Partial<Record<T, React.ReactNode>>;
    onStepClick?: (key: T) => void;
}

function StepOverview<T extends string>({ steps, current, isComplete, details, onStepClick }: StepOverviewProps<T>) {
    const [openMap, setOpenMap] = React.useState<Record<T, boolean>>(() => {
        const obj: Record<string, boolean> = {};
        steps.forEach(s => { obj[s.key] = false; });
        return obj as Record<T, boolean>;
    });

    const toggle = (key: T) => {
        setOpenMap(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <ul className="step-overview">
            {steps.map((step, idx) => {
                const done = isComplete(step.key);
                const isCurrent = current === step.key;
                const className = `${done ? 'done' : ''} ${isCurrent ? 'current' : ''}`.trim();
                const open = openMap[step.key];
                return (
                    <li key={step.key} className={className}>
                        <button
                            type="button"
                            className="overview-header"
                            onClick={() => toggle(step.key)}
                            aria-expanded={open}
                        >
                            <span className="step-marker">{done ? '✔' : idx + 1}</span>
                            <span className="step-label">{step.label}</span>
                            <span className="chevron">{open ? <FiChevronUp /> : <FiChevronDown />}</span>
                        </button>
                        <div
                            className={`overview-content${open ? ' open' : ''}`}
                            aria-hidden={open ? undefined : true}
                        >
                            {details?.[step.key] ?? null}
                            {done && onStepClick && (
                                <button
                                    type="button"
                                    className="edit-btn"
                                    onClick={() => onStepClick(step.key)}
                                >
                                    <FaEdit /> Edit
                                </button>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

export default StepOverview;