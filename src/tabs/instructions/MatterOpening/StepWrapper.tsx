import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

interface StepWrapperProps {
    stepNumber: number;
    title: string;
    isCompleted?: boolean;
    isActive?: boolean;
    children: React.ReactNode;
}

const StepWrapper: React.FC<StepWrapperProps> = ({ 
    stepNumber, 
    title, 
    isCompleted = false, 
    isActive = false, 
    children 
}) => {
    return (
        <div className="step-section">
            <div className={`step-header ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                <div className="step-number">{stepNumber}</div>
                <h3 className="step-title">{title}</h3>
                <div className={`completion-check ${isCompleted ? 'visible' : ''}`}>
                    <FaCheckCircle />
                </div>
            </div>
            <div className="step-content">
                {children}
            </div>
        </div>
    );
};

export default StepWrapper;
