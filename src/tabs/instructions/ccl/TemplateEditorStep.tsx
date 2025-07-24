import React from 'react';
import { Stack } from '@fluentui/react';

interface Step2Props {
    currentStep: number;
    questionBannerStyle: React.CSSProperties;
    renderFieldsOnlyView: () => JSX.Element;
    renderEditableTemplateContent: (content: string) => JSX.Element | string;
    documentContent: string;
    isFieldsOnlyView: boolean;
    setIsFieldsOnlyView: (val: boolean) => void;
    navigationStyle: React.CSSProperties;
    goToPreviousStep: () => void;
    canProceedToStep3: boolean;
    goToNextStep: () => void;
}

const Step2: React.FC<Step2Props> = (props) => {
    const {
        currentStep,
        questionBannerStyle,
        renderFieldsOnlyView,
        renderEditableTemplateContent,
        documentContent,
        isFieldsOnlyView,
        setIsFieldsOnlyView,
        navigationStyle,
        goToPreviousStep,
        canProceedToStep3,
        goToNextStep
    } = props;

    if (currentStep !== 2) return null;

    return (
        <div className="matter-opening-card" style={{
            opacity: 1,
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
            <Stack tokens={{ childrenGap: 20 }}>
                <div>
                    <div style={{
                        display: 'flex',
                        gap: '20px',
                        flexDirection: 'row'
                    }}>
                        {/* Interactive Template Editor Section */}
                        <div style={{
                            flex: '1',
                            minWidth: '0'
                        }}>
                            <div style={{
                                ...questionBannerStyle,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>Interactive Template Editor</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                                    <button
                                        onClick={() => setIsFieldsOnlyView(false)}
                                        style={{
                                            padding: '8px 16px',
                                            border: '1px solid #CCCCCC',
                                            backgroundColor: !isFieldsOnlyView ? '#3690CE' : '#FFFFFF',
                                            color: !isFieldsOnlyView ? '#FFFFFF' : '#061733',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                            borderRight: 'none',
                                            minWidth: '80px'
                                        }}
                                    >
                                        Editor
                                    </button>
                                    <button
                                        onClick={() => setIsFieldsOnlyView(true)}
                                        style={{
                                            padding: '8px 16px',
                                            border: '1px solid #CCCCCC',
                                            backgroundColor: isFieldsOnlyView ? '#3690CE' : '#FFFFFF',
                                            color: isFieldsOnlyView ? '#FFFFFF' : '#061733',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                            minWidth: '80px'
                                        }}
                                    >
                                        Fields
                                    </button>
                                </div>
                            </div>

                            {isFieldsOnlyView ? (
                                <div style={{
                                    border: '1px solid #e1e5e9',
                                    borderRadius: '4px',
                                    padding: '16px',
                                    minHeight: '300px',
                                    fontFamily: 'Raleway, sans-serif',
                                    fontSize: '14px',
                                    backgroundColor: '#fff'
                                }}>
                                    {renderFieldsOnlyView()}
                                </div>
                            ) : (
                                <div style={{
                                    border: '1px solid #e1e5e9',
                                    borderRadius: '4px',
                                    padding: '16px',
                                    minHeight: '300px',
                                    fontFamily: 'Raleway, sans-serif',
                                    fontSize: '14px',
                                    lineHeight: '1.3',
                                    whiteSpace: 'pre-wrap',
                                    backgroundColor: '#fff',
                                    cursor: 'text'
                                }}>
                                    {renderEditableTemplateContent(documentContent)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Stack>

            {/* Navigation Below Content */}
            <div style={navigationStyle}>
                <div
                    className="nav-button back-button"
                    onClick={goToPreviousStep}
                    tabIndex={0}
                    style={{
                        background: '#f4f4f6',
                        border: '2px solid #e1dfdd',
                        borderRadius: '0px',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ffefed';
                        e.currentTarget.style.border = '2px solid #D65541';
                        e.currentTarget.style.borderRadius = '0px';
                        e.currentTarget.style.width = '140px';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(214,85,65,0.08)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f4f4f6';
                        e.currentTarget.style.border = '2px solid #e1dfdd';
                        e.currentTarget.style.borderRadius = '0px';
                        e.currentTarget.style.width = '48px';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(6,23,51,0.04)';
                    }}
                >
                    {/* Arrow Icon */}
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                            transition: 'color 0.3s, opacity 0.3s',
                            color: '#D65541',
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%) rotate(180deg)',
                        }}
                    >
                        <path
                            d="M5 12h14M12 5l7 7-7 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    {/* Expandable Text */}
                    <span
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#D65541',
                            opacity: 0,
                            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            whiteSpace: 'nowrap',
                        }}
                        className="nav-text"
                    >
                        Back to Selection
                    </span>
                </div>
                <div
                    className="nav-button forward-button"
                    onClick={canProceedToStep3 ? goToNextStep : undefined}
                    aria-disabled={!canProceedToStep3}
                    tabIndex={canProceedToStep3 ? 0 : -1}
                    style={{
                        background: '#f4f4f6',
                        border: '2px solid #e1dfdd',
                        borderRadius: '0px',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: canProceedToStep3 ? 'pointer' : 'not-allowed',
                        opacity: canProceedToStep3 ? 1 : 0.5,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                        position: 'relative',
                        overflow: 'hidden',
                        pointerEvents: canProceedToStep3 ? 'auto' : 'none',
                    }}
                    onMouseEnter={canProceedToStep3 ? (e) => {
                        e.currentTarget.style.background = '#ffefed';
                        e.currentTarget.style.border = '2px solid #D65541';
                        e.currentTarget.style.borderRadius = '0px';
                        e.currentTarget.style.width = '160px';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(214,85,65,0.08)';
                    } : undefined}
                    onMouseLeave={canProceedToStep3 ? (e) => {
                        e.currentTarget.style.background = '#f4f4f6';
                        e.currentTarget.style.border = '2px solid #e1dfdd';
                        e.currentTarget.style.borderRadius = '0px';
                        e.currentTarget.style.width = '48px';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(6,23,51,0.04)';
                    } : undefined}
                >
                    {/* Arrow Icon */}
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                            transition: 'color 0.3s, opacity 0.3s',
                            color: canProceedToStep3 ? '#D65541' : '#999',
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <path
                            d="M5 12h14M12 5l7 7-7 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    {/* Expandable Text */}
                    <span
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#D65541',
                            opacity: 0,
                            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            whiteSpace: 'nowrap',
                        }}
                        className="nav-text"
                    >
                        Continue to Preview
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Step2;
