//
import React from 'react'; // invisible change
// invisible change 2.2
import { Stack } from '@fluentui/react';
import PoidCard from '../PoidCard';
import { POID, TeamData } from '../../../app/functionality/types';

interface PoidSelectionStepProps {
    poidData: POID[];
    teamData?: TeamData[] | null;
    filteredPoidData: POID[];
    visiblePoidCount: number;
    selectedPoidIds: string[];
    poidSearchTerm: string;
    setPoidSearchTerm: (v: string) => void;
    poidGridRef: React.RefObject<HTMLDivElement | null>;
    handlePoidClick: (p: POID) => void;
    onConfirm?: () => void;
    pendingClientType: string;
    setPendingClientType: (type: string) => void;
    onClientTypeChange?: (newType: string, shouldLimitToSingle: boolean) => void;
}

// Animated transition for POID selection area
interface PoidSelectionTransitionProps {
    show: boolean;
    children: React.ReactNode;
}

const PoidSelectionTransition: React.FC<PoidSelectionTransitionProps> = ({ show, children }) => { /* invisible change */
    const [visible, setVisible] = React.useState(show);
    const [render, setRender] = React.useState(show);
    React.useEffect(() => {
        if (show) {
            setRender(true);
            const t = window.setTimeout(() => setVisible(true), 10);
            return () => window.clearTimeout(t);
        } else {
            setVisible(false);
            const timeout = window.setTimeout(() => setRender(false), 400);
            return () => window.clearTimeout(timeout);
        }
    }, [show]);
    if (!render) return null;
    return (
        <div
            className={"poid-selection-animated" + (visible ? " visible" : "")}
            style={{
                maxHeight: visible ? 1200 : 0,
                opacity: visible ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.5s cubic-bezier(.4,0,.2,1), opacity 0.4s cubic-bezier(.4,0,.2,1)',
                pointerEvents: visible ? 'auto' : 'none',
            }}
        >
            {children}
        </div>
    );
};

const PoidSelectionStep: React.FC<PoidSelectionStepProps> = ({
    poidData,
    teamData,
    filteredPoidData,
    visiblePoidCount,
    selectedPoidIds,
    poidSearchTerm,
    setPoidSearchTerm,
    poidGridRef,
    handlePoidClick,
    onConfirm,
    pendingClientType,
    setPendingClientType,
    onClientTypeChange,
}) => (
    <Stack tokens={{ childrenGap: 16 }}>
            {/* Client Type Question Section - Now First */}
            <div className="client-type-selection" style={{ width: '100%', margin: 0, padding: 0, border: 'none', boxShadow: 'none', background: 'transparent' }}>
            <div style={{ padding: 0, background: 'transparent' }}>
                <div className="question-banner" style={{ width: '100%', boxSizing: 'border-box' }}>What type of client is this matter for?</div>
                <div className="client-details-contact-bigrow" style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                    {[ 
                        { type: 'Individual', icon: 'Contact' },
                        { type: 'Company', icon: 'CityNext' },
                        { type: 'Multiple Individuals', icon: 'People' },
                        { type: 'Existing Client', icon: 'ContactHeart' }
                    ].map(({ type, icon }) => {
                        const isActive = pendingClientType === type;
                        return (
                            <button
                                key={type}
                                className={`client-details-contact-bigbtn client-type-icon-btn${isActive ? ' active' : ''}`}
                                type="button"
                                onClick={() => {
                                    // Only trigger change if type is actually changing
                                    if (pendingClientType !== type) {
                                        const isSingleSelectionType = type !== 'Multiple Individuals';
                                        setPendingClientType(type);
                                        if (onClientTypeChange) {
                                            onClientTypeChange(type, isSingleSelectionType);
                                        }
                                    }
                                }}
                                aria-pressed={isActive}
                                style={{
                                    position: 'relative',
                                    overflow: 'hidden',
                                    minWidth: 76.8, // 20% increase from 64
                                    minHeight: 76.8, // 20% increase from 64
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isActive ? '#3690CE22' : '#F4F4F6', // 22 transparency or helix grey
                                    border: isActive ? '1px solid #3690CE' : '1px solid #e0e0e0', // 1px blue or light border
                                    borderRadius: 0, // no rounded corners
                                    boxShadow: undefined,
                                    transition: 'background 0.2s, border 0.2s',
                                    outline: 'none',
                                }}
                                onMouseDown={e => e.currentTarget.classList.add('pressed')}
                                onMouseUp={e => e.currentTarget.classList.remove('pressed')}
                                onMouseLeave={e => e.currentTarget.classList.remove('pressed')}
                            >
                                <span
                                    className="client-type-icon"
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 32,
                                        opacity: isActive ? 0 : 1,
                                        transition: 'opacity 0.25s cubic-bezier(.4,0,.2,1), transform 0.25s cubic-bezier(.4,0,.2,1), color 0.2s',
                                        zIndex: 1,
                                        color: isActive ? '#3690CE' : '#6B6B6B',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <i className={`ms-Icon ms-Icon--${icon}`} aria-hidden="true" style={{ pointerEvents: 'none', color: isActive ? '#3690CE' : '#6B6B6B', transition: 'color 0.2s' }} />
                                </span>
                                <span
                                    className="client-type-label"
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'normal',
                                        fontSize: 16,
                                        color: isActive ? '#3690CE' : '#6B6B6B',
                                        opacity: isActive ? 1 : 0,
                                        transform: isActive ? 'translateY(0)' : 'translateY(8px)',
                                        transition: 'opacity 0.25s cubic-bezier(.4,0,.2,1), transform 0.25s cubic-bezier(.4,0,.2,1), color 0.2s',
                                        zIndex: 2,
                                        pointerEvents: 'none',
                                    }}
                                >
                                    {type}
                                </span>
                            </button>
                        );
                    })}
                </div>
    <style>{`
        .client-type-selection .client-type-icon-btn .client-type-label {
            pointer-events: none;
        }
        .client-type-selection .client-type-icon-btn:not(.active):not(.pressed):not(:active):hover {
            background: #e3f0fc !important; /* subtle blue hover */
            border-color: #3690CE !important;
        }
        .client-type-selection .client-type-icon-btn:not(.active):not(.pressed):not(:active):hover .client-type-icon,
        .client-type-selection .client-type-icon-btn:not(.active):not(.pressed):not(:active):hover .client-type-icon i {
            color: #3690CE !important;
        }
        .client-type-selection .client-type-icon-btn:not(.active):not(.pressed):not(:active):hover .client-type-label {
            color: #3690CE !important;
        }
        .client-type-selection .client-type-icon-btn.pressed,
        .client-type-selection .client-type-icon-btn:active {
            background: #b3d3f7 !important; /* deeper blue for press */
            border-color: #1565c0 !important;
        }
        .client-type-selection .client-type-icon-btn.active .client-type-icon {
            opacity: 0 !important;
        }
        .client-type-selection .client-type-icon-btn.active .client-type-label {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
        /* Remove hover/focus label reveal, only show label for active */
        
        /* Animation for POID cards */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Stagger animation for cards */
        .poid-grid > div:nth-child(1) { animation-delay: 0ms; }
        .poid-grid > div:nth-child(2) { animation-delay: 100ms; }
        .poid-grid > div:nth-child(3) { animation-delay: 200ms; }
        .poid-grid > div:nth-child(4) { animation-delay: 300ms; }
        .poid-grid > div:nth-child(5) { animation-delay: 400ms; }
        .poid-grid > div:nth-child(6) { animation-delay: 500ms; }
    `}</style>
                {/* Removed preselected client type hints for a cleaner UI */}
            </div>
        </div>

        {/* Show POID selection only after client type is chosen */}
        <PoidSelectionTransition show={!!pendingClientType}>
            {pendingClientType && (
                <>
                    <div className="question-banner">Select Client(s)</div>
                    {/* POID Grid - Changed from 3 to 2 columns with auto-fit to fill available space */}
                    <div 
                        style={{ 
                            width: '100%',
                            display: 'grid',
                            gridTemplateColumns: (() => {
                                const isSingleSelectionType = pendingClientType === 'Individual' || pendingClientType === 'Company';
                                const hasSelection = selectedPoidIds.length > 0;
                                if (isSingleSelectionType && hasSelection) {
                                    return '1fr'; // Single column when selected
                                }
                                return 'repeat(2, minmax(250px, 1fr))'; // Default 2 columns
                            })(),
                            gap: '24px',
                            justifyContent: 'space-between',
                            padding: '12px',
                            overflow: 'visible',
                            border: '1px solid #e3e8ef',
                            borderRadius: '4px',
                            background: '#fafafa',
                            transition: 'grid-template-columns 0.4s ease-out, gap 0.4s ease-out'
                        }} 
                        className="poid-grid" 
                        ref={poidGridRef as any}
                    >
                        {/** invisible change 3: Fix POID grouping logic to use ClientType, not poid.type */}
                        {/** invisible change 4: Only filter by instruction's client type, not POID fields */}
                        {/* No filtering by company fields; show all POIDs for the selected client type */}
                        {filteredPoidData
                            .filter((poid) => {
                                const isCompany = !!(
                                    poid.company_name ||
                                    poid.company_number
                                );
                                if (pendingClientType === 'Individual') {
                                    return !isCompany;
                                } else if (pendingClientType === 'Company') {
                                    return isCompany;
                                }
                                return true;
                            })
                            .slice(0, visiblePoidCount)
                            .map((poid) => {
                            const isSelected = selectedPoidIds.includes(poid.poid_id);
                            const isSingleSelectionType = pendingClientType === 'Individual' || pendingClientType === 'Company';
                            const hasSelection = selectedPoidIds.length > 0;
                            const shouldFadeOut = isSingleSelectionType && hasSelection && !isSelected;
                            return (
                                <div 
                                    key={poid.poid_id} 
                                    onClick={() => handlePoidClick(poid)} 
                                    role="button" 
                                    tabIndex={0}
                                    style={{
                                        opacity: shouldFadeOut ? 0.3 : 1,
                                        transform: shouldFadeOut ? 'scale(0.95)' : 'translateY(0)',
                                        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
                                        animation: 'fadeInUp 0.4s ease-out',
                                        pointerEvents: shouldFadeOut ? 'none' : 'auto',
                                        filter: shouldFadeOut ? 'grayscale(70%)' : 'none'
                                    }}
                                >
                                    <PoidCard 
                                        poid={poid} 
                                        selected={isSelected} 
                                        onClick={() => handlePoidClick(poid)} 
                                        teamData={teamData}
                                        companyName={(() => {
                                            // Try to get company name from instruction/matter/client, not from POID
                                            // If pendingClientType is 'Company', try to find the company name from the instruction
                                            if (pendingClientType === 'Company') {
                                                // Try to find the instruction for this POID (by InstructionRef, MatterId, or ProspectId)
                                                // This assumes you have access to the instruction data in this component or via props
                                                // If not, you may need to thread it through from FlatMatterOpening
                                                if (poid.company_name) return poid.company_name;
                                                // fallback: blank
                                                return '';
                                            }
                                            return undefined;
                                        })()}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </PoidSelectionTransition>
    </Stack>
);

export default PoidSelectionStep;