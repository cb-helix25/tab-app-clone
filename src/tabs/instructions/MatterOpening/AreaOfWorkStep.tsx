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

const AreaOfWorkStep: React.FC<AreaOfWorkStepProps> = ({ areaOfWork, setAreaOfWork, onContinue, getGroupColor }) => {
    // Professional theme colors
    const colours = {
        bg: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        border: '#E2E8F0',
        text: '#0F172A',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
    };

    return (
        <div style={{
            background: colours.bg,
            border: `1px solid ${colours.border}`,
            borderRadius: 12,
            padding: 20,
            boxShadow: colours.shadow,
            boxSizing: 'border-box'
        }}>
            <Stack tokens={{ childrenGap: 16 }}>
                {/* Professional header with icon */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 4 
                }}>
                    <i className="ms-Icon ms-Icon--WorkItem" style={{ 
                        fontSize: 16, 
                        color: '#3690CE' 
                    }} />
                    <span style={{ 
                        fontSize: 16, 
                        fontWeight: 600, 
                        color: colours.text 
                    }}>
                        Select Area of Work
                    </span>
                </div>
                
                <div className="area-of-work-selection">
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                        gap: '12px'
                    }}>
                        {options.map(({ type, icon }) => {
                            const isActive = areaOfWork === type;
                            const areaColor = areaColors[type];
                            
                            return (
                                <button
                                    key={type}
                                    className={`client-type-icon-btn${isActive ? ' active' : ''}`}
                                    onClick={() => {
                                        setAreaOfWork(type);
                                        onContinue();
                                    }}
                                    style={{
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '18px 16px',
                                        border: `2px solid ${isActive ? areaColor : colours.border}`,
                                        borderRadius: '12px',
                                        background: isActive 
                                            ? `linear-gradient(135deg, ${areaColor}15 0%, ${areaColor}08 100%)` 
                                            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        minHeight: '90px',
                                        boxShadow: isActive 
                                            ? `0 6px 20px ${areaColor}25, 0 2px 4px rgba(0,0,0,0.05)` 
                                            : '0 2px 8px rgba(0,0,0,0.05)',
                                        // CSS vars for hover/press
                                        ['--area-hover-bg' as any]: `linear-gradient(135deg, ${areaColor}12 0%, ${areaColor}06 100%)`,
                                        ['--area-hover-color' as any]: areaColor,
                                        ['--area-press-bg' as any]: `linear-gradient(135deg, ${areaColor}25 0%, ${areaColor}15 100%)`,
                                        ['--area-press-color' as any]: areaColor,
                                        transform: isActive ? 'translateY(-3px)' : 'translateY(0)',
                                    }}
                                >
                                    <div
                                        className="client-type-icon"
                                        style={{
                                            fontSize: '26px',
                                            color: isActive ? areaColor : '#64748B',
                                            marginBottom: '8px',
                                            opacity: 1,
                                            transition: 'all 0.2s ease',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        <Icon iconName={icon} />
                                    </div>
                                    <div
                                        className="client-type-label"
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: isActive ? 600 : 500,
                                            color: isActive ? areaColor : colours.text,
                                            textAlign: 'center',
                                            opacity: 1,
                                            transform: 'translateY(0)',
                                            transition: 'all 0.2s ease',
                                            pointerEvents: 'none',
                                            lineHeight: 1.3
                                        }}
                                    >
                                        {type}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Stack>
            <style>{`
                .area-of-work-selection .client-type-icon-btn .client-type-label,
                .area-of-work-selection .client-type-icon-btn .client-type-icon {
                    pointer-events: none;
                }
                .area-of-work-selection .client-type-icon-btn:not(.active):hover {
                    background: var(--area-hover-bg, linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)) !important;
                    border-color: var(--area-hover-color, #3690CE) !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06) !important;
                }
                .area-of-work-selection .client-type-icon-btn:not(.active):hover .client-type-icon {
                    color: var(--area-hover-color, #3690CE) !important;
                    transform: scale(1.1) !important;
                }
                .area-of-work-selection .client-type-icon-btn:not(.active):hover .client-type-label {
                    color: var(--area-hover-color, #3690CE) !important;
                    font-weight: 600 !important;
                }
                .area-of-work-selection .client-type-icon-btn:active {
                    background: var(--area-press-bg, linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)) !important;
                    border-color: var(--area-press-color, #1565c0) !important;
                    transform: translateY(-1px) !important;
                }
                .area-of-work-selection .client-type-icon-btn.active .client-type-icon {
                    transform: scale(1.05) !important;
                }
                .area-of-work-selection .client-type-icon-btn.active .client-type-label {
                    font-weight: 700 !important;
                }
            `}</style>
        </div>
    );
};

export default AreaOfWorkStep;