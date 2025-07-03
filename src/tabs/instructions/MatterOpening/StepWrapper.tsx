import React, { useState, useEffect, Children, cloneElement, isValidElement, ReactElement } from 'react';
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
    const [hasPrefilledValues, setHasPrefilledValues] = useState(false);
    
    // Use the prop if provided, otherwise use internal state
    const effectivelyActive = onToggle ? isActive : internalActive;
    
    // Check children for prefilled values on mount
    useEffect(() => {
        // Check if any of the form fields have values
        const checkForPrefilledValues = () => {
            let hasPrefilled = false;
            
            // Recursively check child props for non-empty values
            const checkProps = (child: React.ReactNode): boolean => {
                if (!isValidElement(child)) return false;
                
                const childElement = child as ReactElement;
                
                // Check common form field props that might indicate prefilled values
                const propsToCheck = [
                    'value', 'selectedDate', 'teamMember', 'supervisingPartner', 
                    'originatingSolicitor', 'clientType', 'selectedPoidIds', 
                    'areaOfWork', 'practiceArea', 'description', 'folderStructure', 
                    'disputeValue', 'source', 'referrerName', 'opponentName'
                ];
                
                for (const propName of propsToCheck) {
                    const propValue = (childElement.props as any)[propName];
                    if (propValue !== undefined && 
                        propValue !== null && 
                        propValue !== '' && 
                        !(Array.isArray(propValue) && propValue.length === 0)) {
                        return true;
                    }
                }
                
                // Check children of this element
                if (childElement.props.children) {
                    if (Array.isArray(childElement.props.children)) {
                        return childElement.props.children.some(checkProps);
                    } else {
                        return checkProps(childElement.props.children);
                    }
                }
                
                return false;
            };
            
            hasPrefilled = checkProps(children);
            setHasPrefilledValues(hasPrefilled);
        };
        
        checkForPrefilledValues();
    }, [children]);
    
    const handleToggle = () => {
        if (onToggle) {
            onToggle();
        } else {
            setInternalActive(!internalActive);
        }
    };
    
    // Consider a step completed if it's explicitly marked as completed or has prefilled values
    const effectivelyCompleted = isCompleted || hasPrefilledValues;
    
    return (
        <div className={`step-section ${effectivelyActive ? 'active' : ''}`}>
            <div 
                className={`step-header ${effectivelyCompleted ? 'completed' : ''} ${effectivelyActive ? 'active' : ''}`}
                onClick={handleToggle}
            >
                <div className="step-number">{stepNumber}</div>
                <h3 className="step-title">{title}</h3>
                {effectivelyCompleted && (
                    <div className={`completion-check ${effectivelyCompleted ? 'visible' : ''}`}>
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
