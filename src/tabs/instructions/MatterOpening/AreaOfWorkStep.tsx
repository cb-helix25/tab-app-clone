// invisible change 3
import React from 'react'; // invisible change // invisible change 2
// invisible change 2.2
import { Stack, Text, Icon } from '@fluentui/react';
import '../../../app/styles/MultiSelect.css';
import { colours } from '../../../app/styles/colours';

interface AreaOfWorkStepProps {
    areaOfWork: string;
    setAreaOfWork: (v: string) => void;
    onContinue: () => void;
    getGroupColor: (area: string) => string;
}

const areaColors: Record<string, string> = { /* invisible change */
    Commercial: colours.blue,
    Property: colours.green,
    Construction: colours.orange,
    Employment: colours.yellow,
};

const options = [
    { type: 'Commercial', icon: 'KnowledgeArticle' },
    { type: 'Property', icon: 'CityNext' },
    { type: 'Construction', icon: 'ConstructionCone' },
    { type: 'Employment', icon: 'People' },
];

const AreaOfWorkStep: React.FC<AreaOfWorkStepProps> = ({ areaOfWork, setAreaOfWork, onContinue, getGroupColor }) => (
    <Stack tokens={{ childrenGap: 12 }}>
        <div className="area-of-work-selection">
            <div className="question-banner">Select Area of Work</div>
            <div className="client-details-contact-bigrow" style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                {options.map(({ type, icon }) => {
                    const isActive = areaOfWork === type;
                    // Set CSS variables for hover/press color per button
                    const buttonStyle: React.CSSProperties = {
                        flex: 1,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '14.4px 8px',
                        border: `1px solid ${isActive ? areaColors[type] : '#e0e0e0'}`,
                        borderRadius: '0px',
                        background: isActive ? `${areaColors[type]}22` : '#f8f8f8',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minHeight: '76.8px',
                        boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                        // Set CSS variables for hover/press
                        ['--area-hover-bg' as any]: `${areaColors[type]}22`,
                        ['--area-hover-color' as any]: areaColors[type],
                        ['--area-press-bg' as any]: `${areaColors[type]}44`, // 44 = ~27% opacity
                        ['--area-press-color' as any]: areaColors[type],
                    };
                    return (
                        <button
                            key={type}
                            className={`client-type-icon-btn${isActive ? ' active' : ''}`}
                            onClick={() => {
                                setAreaOfWork(type);
                                onContinue();
                            }}
                            style={buttonStyle}
                        >
                            <div
                                className="client-type-icon"
                                style={{
                                    fontSize: '24px',
                                    color: isActive ? areaColors[type] : '#555',
                                    opacity: isActive ? 0 : 1,
                                    position: 'absolute',
                                    transition: 'opacity 0.3s ease',
                                    pointerEvents: 'none',
                                }}
                            >
                                <Icon iconName={icon} />
                            </div>
                            <div
                                className="client-type-label"
                                style={{
                                    fontSize: '16px',
                                    fontWeight: isActive ? 500 : 400,
                                    color: isActive ? areaColors[type] : '#333',
                                    textAlign: 'center',
                                    opacity: isActive ? 1 : 0,
                                    transform: `translateY(${isActive ? 0 : '10px'})`,
                                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                                    pointerEvents: 'none',
                                }}
                            >
                                {type}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
        <style>{`
            .area-of-work-selection .client-type-icon-btn .client-type-label,
            .area-of-work-selection .client-type-icon-btn .client-type-icon {
                pointer-events: none;
            }
            .area-of-work-selection .client-type-icon-btn:not(.active):not(.pressed):not(:active):hover {
                /* Use area color for hover background and border */
                background: var(--area-hover-bg, #e3f0fc) !important;
                border-color: var(--area-hover-color, #3690CE) !important;
            }
            .area-of-work-selection .client-type-icon-btn:not(.active):not(.pressed):not(:active):hover .client-type-icon {
                opacity: 0 !important;
            }
            .area-of-work-selection .client-type-icon-btn:not(.active):not(.pressed):not(:active):hover .client-type-label {
                opacity: 1 !important;
                transform: translateY(0) !important;
                color: var(--area-hover-color, #3690CE) !important;
            }
            .area-of-work-selection .client-type-icon-btn.pressed,
            .area-of-work-selection .client-type-icon-btn:active {
                background: var(--area-press-bg, #b3d3f7) !important;
                border-color: var(--area-press-color, #1565c0) !important;
            }
            .area-of-work-selection .client-type-icon-btn.active .client-type-icon {
                opacity: 0 !important;
            }
            .area-of-work-selection .client-type-icon-btn.active .client-type-label {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        `}</style>
    </Stack>
);

export default AreaOfWorkStep;