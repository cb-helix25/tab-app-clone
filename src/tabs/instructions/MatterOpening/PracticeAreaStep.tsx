//
import React from 'react'; // invisible change
import { Stack, Text } from '@fluentui/react';
import '../../../app/styles/MultiSelect.css';
import { colours } from '../../../app/styles/colours';

const areaColors: Record<string, string> = { /* invisible change */
    // Commercial: colours.blue, // Removed Commercial
    Property: colours.green,
    Construction: colours.orange,
    Employment: colours.yellow,
};

interface PracticeAreaStepProps {
    options: string[];
    practiceArea: string;
    setPracticeArea: (v: string) => void;
    onContinue: () => void;
    areaOfWork: string;
}

const PracticeAreaStep: React.FC<PracticeAreaStepProps> = ({ options, practiceArea, setPracticeArea, onContinue, areaOfWork }) => {
    const color = areaColors[areaOfWork] || '#3690CE';
    // Filter out 'Commercial' from the options before rendering
    const filteredOptions = options.filter((pa) => pa !== 'Commercial');
    return (
        <Stack tokens={{ childrenGap: 12 }}>
            <div className="practice-area-selection">
                <div className="question-banner">Select Practice Area</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: 8 }}>
                    {filteredOptions.map((pa) => {
                        const isActive = practiceArea === pa;
                        return (
                            <div
                                key={pa}
                                className={`client-type-icon-btn${isActive ? ' active' : ''}`}
                                onClick={() => {
                                    setPracticeArea(pa);
                                    onContinue();
                                }}
                                style={{
                                    flex: 1,
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '14.4px 8px',
                                    border: `1px solid ${isActive ? color : '#e0e0e0'}`,
                                    borderRadius: '0px',
                                    background: isActive ? `${color}22` : '#f8f8f8',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    minHeight: '76.8px',
                                    boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                    fontSize: '16px',
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? color : '#333',
                                    // CSS vars for hover/press
                                    ['--area-hover-bg' as any]: `${color}22`,
                                    ['--area-hover-color' as any]: color,
                                    ['--area-press-bg' as any]: `${color}44`,
                                    ['--area-press-color' as any]: color,
                                }}
                            >
                                <span className="client-type-label" style={{
                                    opacity: 1,
                                    transform: 'translateY(0)',
                                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                                    pointerEvents: 'none',
                                }}>{pa}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <style>{`
                .practice-area-selection .client-type-icon-btn .client-type-label {
                    pointer-events: none;
                }
                .practice-area-selection .client-type-icon-btn:not(.active):not(.pressed):not(:active):hover {
                    background: var(--area-hover-bg, #e3f0fc) !important;
                    border-color: var(--area-hover-color, #3690CE) !important;
                }
                .practice-area-selection .client-type-icon-btn:not(.active):not(.pressed):not(:active):hover .client-type-label {
                    color: var(--area-hover-color, #3690CE) !important;
                }
                .practice-area-selection .client-type-icon-btn.pressed,
                .practice-area-selection .client-type-icon-btn:active {
                    background: var(--area-press-bg, #b3d3f7) !important;
                    border-color: var(--area-press-color, #1565c0) !important;
                }
                .practice-area-selection .client-type-icon-btn.active .client-type-label {
                    color: ${color} !important;
                }
            `}</style>
            {/* Removed separator for unified workflow appearance */}
        </Stack>
    );
};

export default PracticeAreaStep;