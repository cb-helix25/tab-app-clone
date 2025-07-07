//
import React, { useState } from 'react'; // invisible change
import { FaCheckCircle } from 'react-icons/fa';
import './StepWrapper.css';

interface StepWrapperProps {
    stepNumber: number;
    title: string;
    isCompleted?: boolean;
    isActive?: boolean;
    children: React.ReactNode;
    onToggle?: () => void;
}

const StepWrapper: React.FC<StepWrapperProps> = ({ 
    stepNumber, 
    title, 
    isCompleted = false, 
    isActive = false, 
    children,
    onToggle 
}) => {
    // Allow component to manage its own state if no external control is provided
    const [internalActive, setInternalActive] = useState(isActive);
    
    // Use the prop if provided, otherwise use internal state
    const effectivelyActive = onToggle ? isActive : internalActive;
    
    const handleToggle = () => {
        if (onToggle) {
            onToggle();
        } else {
            setInternalActive(!internalActive);
        }
    };
    return (
        <div className={`step-section ${effectivelyActive ? 'active' : ''}`}>
            <div 
                className={`step-header ${isCompleted ? 'completed' : ''} ${effectivelyActive ? 'active' : ''}`}
                onClick={handleToggle}
            >
                <div className="step-number">{stepNumber}</div>
                <h3 className="step-title">{title}</h3>
                {isCompleted && (
                    <div className={`completion-check ${isCompleted ? 'visible' : ''}`}>
                        <FaCheckCircle />
                    </div>
                )}
                <span className="toggle-icon">{effectivelyActive ? '−' : '+'}</span>
            </div>
            <div className={`step-content ${effectivelyActive ? 'active' : ''}`}>
                {children}
            </div>
        </div>
    );
};

export default StepWrapper;
