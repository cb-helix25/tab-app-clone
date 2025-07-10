import React from 'react';
// invisible change 2.1
//
import '../../app/styles/NewMatters.css';
import { componentTokens } from '../../app/styles/componentTokens';

interface StepHeaderProps {
    step: number;
    title: string;
    complete?: boolean;
    open: boolean;
    onToggle: () => void;
    locked?: boolean;
    onEdit?: () => void;
    editable?: boolean;
    allowToggleWhenLocked?: boolean;
    dimOnLock?: boolean;
    summary?: React.ReactNode;
    /** Hide the plus/minus toggle icon for a cleaner checkout style */
    hideToggle?: boolean;
}

const StepHeader: React.FC<StepHeaderProps> = ({
    step,
    title,
    complete = false,
    open,
    onToggle,
    locked = false,
    onEdit,
    editable = true,
    allowToggleWhenLocked = false,
    dimOnLock = true,
    summary,
    hideToggle = false,
}) => {
    const baseStyle: React.CSSProperties = {
        backgroundColor: componentTokens.stepHeader.base.backgroundColor,
        color: componentTokens.stepHeader.base.textColor,
        borderRadius: componentTokens.stepHeader.base.borderRadius,
        boxShadow: componentTokens.stepHeader.base.boxShadow,
    };

    const activeStyle: React.CSSProperties = open
        ? {
            backgroundColor: componentTokens.stepHeader.active.backgroundColor,
            border: `1px solid ${componentTokens.stepHeader.active.borderColor}`,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            color: componentTokens.stepHeader.active.textColor,
        }
        : {};

    const lockedStyle: React.CSSProperties = locked
        ? { cursor: allowToggleWhenLocked ? 'pointer' : 'not-allowed', opacity: dimOnLock ? componentTokens.stepHeader.lockedOpacity : 1 }
        : {};

    const handleClick = () => {
        if (!locked || allowToggleWhenLocked) {
            onToggle();
        }
    };

    const showEdit = editable && !open && !locked && complete;

    return (
        <>
            <div
                className={`step-header${open ? ' active' : ''}${complete ? ' completed' : ''}`}
                onClick={handleClick}
                role="button"
                tabIndex={locked && !allowToggleWhenLocked ? -1 : 0}
                aria-expanded={open}
                aria-disabled={locked && !allowToggleWhenLocked}
                style={{ ...baseStyle, ...activeStyle, ...lockedStyle }}
            >
                <div className="step-number">{step}</div>
                <h2 className="step-title">
                    {title}
                    {complete && (
                        <span className="completion-check visible">
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
                {showEdit && (
                    <span
                        className="edit-step"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.();
                            onToggle();
                        }}
                    >
                        ✎

                    </span>
                )}
                {!hideToggle && (
                    <span className="toggle-icon">{open ? '−' : '+'}</span>
                )}

            </div>
            {summary && !open && (
                <div className="step-summary">
                    {summary}
                </div>
            )}
        </>
    );
};

export default StepHeader;
