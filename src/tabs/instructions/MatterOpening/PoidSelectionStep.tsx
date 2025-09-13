//
import React from 'react'; // invisible change
// invisible change 2.2
import { Stack } from '@fluentui/react';
import { useTheme } from '../../../app/functionality/ThemeContext';
import PoidCard from '../PoidCard';
import { POID, TeamData } from '../../../app/functionality/types';

interface PoidSelectionStepProps {
    poidData: POID[];
    teamData?: TeamData[] | null;
    filteredPoidData: POID[];
    visiblePoidCount: number;
    selectedPoidIds: string[];
    preselectedPoidIds?: string[];
    poidSearchTerm: string;
    setPoidSearchTerm: (v: string) => void;
    poidGridRef: React.RefObject<HTMLDivElement | null>;
    handlePoidClick: (p: POID) => void;
    onConfirm?: () => void;
    pendingClientType: string;
    setPendingClientType: (type: string) => void;
    onClientTypeChange?: (newType: string, shouldLimitToSingle: boolean) => void;
    clientAsOnFile: string;
    setClientAsOnFile: (v: string) => void;
    /** When true (instruction entry), hide the Select Client section entirely */
    hideClientSections?: boolean;
    /** Optional identifiers to show in banner when context is instruction/matter */
    instructionRef?: string;
    matterRef?: string;
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
    preselectedPoidIds = [],
    poidSearchTerm,
    setPoidSearchTerm,
    poidGridRef,
    handlePoidClick,
    onConfirm,
    pendingClientType,
    setPendingClientType,
    onClientTypeChange,
    clientAsOnFile,
    setClientAsOnFile,
    hideClientSections = false,
    instructionRef,
    matterRef
}) => {
    // Build selection context (selected ids, selected POIDs, inferred company/individuals)
    const { isDarkMode } = useTheme();
    const selectedIds = (selectedPoidIds && selectedPoidIds.length > 0)
        ? selectedPoidIds
        : (preselectedPoidIds || []);
    const byId = (id: string) => poidData.find(p => p.poid_id === id) || filteredPoidData.find(p => p.poid_id === id);
    const baseSelectedPoids = selectedIds.map(byId).filter(Boolean) as POID[];
    // Fallback: if no explicit selection but we have an instructionRef, try to resolve matching POIDs by reference
    const instructionMatchedPoids = React.useMemo(() => {
        if (!instructionRef) return [] as POID[];
        const matches = (poidData || []).filter((p: any) => (p?.InstructionRef || p?.instruction_ref) === instructionRef);
        if (matches.length > 0) return matches as POID[];
        const alt = (filteredPoidData || []).filter((p: any) => (p?.InstructionRef || p?.instruction_ref) === instructionRef);
        return alt as POID[];
    }, [poidData, filteredPoidData, instructionRef]);
    const selectedPoids = (baseSelectedPoids.length > 0 ? baseSelectedPoids : instructionMatchedPoids) as POID[];
    const companyPoid = selectedPoids.find(p => !!(p.company_name || p.company_number));
    const individualPoids = selectedPoids.filter(p => !(p.company_name || p.company_number));

    const inferredType = (() => {
        if (pendingClientType) return pendingClientType;
        if (companyPoid) return 'Company';
        if (selectedPoids.length > 1) return 'Multiple Individuals';
        if (selectedPoids.length === 1) return 'Individual';
        return '';
    })();

    const formatName = (p: POID) => `${p.first || ''} ${p.last || ''}`.trim();
    const formatPeopleList = (people: POID[], max = 2) => {
        if (people.length === 0) return '';
        const names = people.map(formatName).filter(Boolean);
        const head = names.slice(0, max).join(', ');
        const remaining = names.length - max;
        return remaining > 0 ? `${head} +${remaining} more` : head;
    };

    const bannerTitle = (() => {
        if (companyPoid) return companyPoid.company_name || 'Company';
        if (individualPoids.length > 0) return formatPeopleList(individualPoids, 2);
        return 'Select Client';
    })();

    const bannerSubtitle = (() => {
        if (companyPoid) {
            const parts: string[] = [];
            if (companyPoid.company_number) parts.push(`Company No: ${companyPoid.company_number}`);
            if (individualPoids.length > 0) parts.push(`Directors: ${formatPeopleList(individualPoids, 3)}`);
            return parts.join(' • ');
        }
        if (individualPoids.length > 0 && inferredType === 'Multiple Individuals') {
            return `Clients: ${formatPeopleList(individualPoids, 3)}`;
        }
        return inferredType || undefined;
    })();

    // Meta chips for context
    const meta: string[] = [];
    if (instructionRef) meta.push(`Instruction: ${instructionRef}`);
    if (matterRef) meta.push(`Matter: ${matterRef}`);

    // Aggregate verification results from selected POIDs
    type Verif = 'passed' | 'review' | 'failed' | 'pending' | '';
    const norm = (v?: string): Verif => {
        const s = (v || '').toLowerCase();
        if (s.startsWith('pass')) return 'passed';
        if (s.startsWith('rev')) return 'review';
        if (s.startsWith('fail') || s.startsWith('rej')) return 'failed';
        if (s.startsWith('pend')) return 'pending';
        return '';
    };
    const getFor = (p: POID) => ({
        id: norm((p as any).check_result || (p as any).EIDOverallResult || (p as any).EIDStatus),
        pep: norm((p as any).pep_sanctions_result || (p as any).PEPAndSanctionsCheckResult),
        addr: norm((p as any).address_verification_result || (p as any).AddressVerificationResult),
    });
    const selectedVerifs = selectedPoids.map(getFor);
    const agg = (key: 'id'|'pep'|'addr'): Verif => {
        if (selectedVerifs.some(v => v[key] === 'failed')) return 'failed';
        if (selectedVerifs.some(v => v[key] === 'review')) return 'review';
        if (selectedVerifs.length > 0 && selectedVerifs.every(v => v[key] === 'passed')) return 'passed';
        if (selectedVerifs.some(v => v[key] === 'pending')) return 'pending';
        return '';
    };
    const aggId = agg('id');
    const aggPep = agg('pep');
    const aggAddr = agg('addr');
    const chipStyle = (state: Verif): React.CSSProperties => {
        const map: Record<Verif, { bg: string; text: string; brd: string }> = {
            passed: { bg: '#e6f4ea', text: '#107C10', brd: '#107C10' },
            review: { bg: '#fffbe6', text: '#b88600', brd: '#FFB900' },
            failed: { bg: '#fde7e9', text: '#d13438', brd: '#d13438' },
            pending: { bg: '#f4f4f6', text: '#666', brd: '#e1dfdd' },
            '': { bg: '#f4f4f6', text: '#666', brd: '#e1dfdd' },
        };
        const c = map[state];
        return {
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 8px', border: `1px solid ${c.brd}66`, borderRadius: 6,
            background: c.bg, color: c.text, fontSize: 12, fontWeight: 700,
        };
    };

    // Collapsible state for unified Client Selection section - must be before any early returns
    const [isClientSectionOpen, setIsClientSectionOpen] = React.useState<boolean>(!!pendingClientType);
    React.useEffect(() => {
        // When a client type is chosen, auto-open the section
        if (pendingClientType) setIsClientSectionOpen(true);
    }, [pendingClientType]);

    const renderSelectionSummary = () => {
        return (
            <div
                className="instruction-card-banner"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 12,
                    padding: '8px 0',
                    border: 'none',
                    borderRadius: 0,
                    background: 'transparent',
                    boxShadow: 'none',
                    color: '#061733',
                    flexWrap: 'wrap'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <i className={`ms-Icon ${companyPoid ? 'ms-Icon--CityNext' : 'ms-Icon--People'}`} style={{ fontSize: 18, color: '#3690CE' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{bannerTitle}</div>
                        {bannerSubtitle && (
                            <div style={{ fontSize: 12, color: '#6B6B6B', lineHeight: 1.2 }}>{bannerSubtitle}</div>
                        )}
                    </div>
                </div>
                {(meta.length > 0 || selectedPoids.length > 0) && (
                    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {instructionRef && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '4px 8px', border: '1px solid #e1e5ea', borderRadius: 6,
                                background: '#F4F6F9', color: '#425466', fontSize: 12, fontWeight: 600
                            }}>
                                <i className="ms-Icon ms-Icon--TextDocument" style={{ fontSize: 12, color: '#6B7280' }} />
                                Instruction: {instructionRef}
                            </span>
                        )}
                        {matterRef && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '4px 8px', border: '1px solid #e1e5ea', borderRadius: 6,
                                background: '#F4F6F9', color: '#425466', fontSize: 12, fontWeight: 600
                            }}>
                                <i className="ms-Icon ms-Icon--FabricFolder" style={{ fontSize: 12, color: '#6B7280' }} />
                                Matter: {matterRef}
                            </span>
                        )}
                        {/* Aggregated verification chips when selection exists */}
                        {selectedPoids.length > 0 && (
                            <>
                                <span style={chipStyle(aggId)}>
                                    <i className="ms-Icon ms-Icon--Shield" style={{ fontSize: 12 }} /> ID: {aggId || 'n/a'}
                                </span>
                                <span style={chipStyle(aggPep)}>
                                    <i className="ms-Icon ms-Icon--PageShield" style={{ fontSize: 12 }} /> PEP: {aggPep || 'n/a'}
                                </span>
                                <span style={chipStyle(aggAddr)}>
                                    <i className="ms-Icon ms-Icon--POI" style={{ fontSize: 12 }} /> Address: {aggAddr || 'n/a'}
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // If instructed to hide selection UI, show banner only
    if (hideClientSections) {
        return (
            <Stack tokens={{ childrenGap: 16 }}>
                {renderSelectionSummary()}
            </Stack>
        );
    }
    const onlyShowPreselected = preselectedPoidIds?.length === 1 && filteredPoidData.length === 1;
    const displayPoidData = filteredPoidData;

    return (
        <Stack tokens={{ childrenGap: 16 }}>
            {/* Client Type Question Section */}
            <div className="client-type-selection" style={{ width: '100%', margin: 0, padding: 0, border: 'none', boxShadow: 'none', background: 'transparent' }}>
            <div style={{ padding: 4, background: 'transparent' }}>
                <div className="question-banner" style={{ width: '100%', boxSizing: 'border-box' }}>What type of client is this matter for?</div>
                <div className="client-details-contact-bigrow" style={{ margin: '8px 0 12px 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
                                        // Multiple Individuals and Company allow unlimited selections, others are more restrictive
                                        const allowsUnlimitedSelections = type === 'Multiple Individuals' || type === 'Company';
                                        setPendingClientType(type);
                                        if (onClientTypeChange) {
                                            onClientTypeChange(type, !allowsUnlimitedSelections);
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
                
                {/* Removed helper text for selection rules for cleaner UI */}
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
        
        /* Compact animation for selected cards */
        @keyframes compactScale {
            from {
                transform: scale(1);
            }
            to {
                transform: scale(0.9);
            }
        }
        
        /* POID grid container animation */
        .poid-grid {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }                        /* Ensure all POID cards have consistent dimensions */
                        .poid-grid {
                            display: grid;
                            grid-template-columns: repeat(2, minmax(250px, 1fr));
                            gap: 28px;
                            grid-auto-rows: auto; /* Allow rows to adjust to content height */
                            align-items: start; /* Align items to start to prevent stretching */
                        }
                        
                        .poid-grid > div {
                            min-height: 180px;
                            display: flex;
                            flex-direction: column;
                            /* Remove max-height constraint to allow expansion */
                        }
        
        .poid-grid > div > * {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        /* Stagger animation for cards */
        .poid-grid > div:nth-child(1) { animation-delay: 0ms; }
        .poid-grid > div:nth-child(2) { animation-delay: 100ms; }
        .poid-grid > div:nth-child(3) { animation-delay: 200ms; }
        .poid-grid > div:nth-child(4) { animation-delay: 300ms; }
        .poid-grid > div:nth-child(5) { animation-delay: 400ms; }
        .poid-grid > div:nth-child(6) { animation-delay: 500ms; }
    `}</style>
                {/* Removed preselected client type hints for a cleaner UI */
                }
            {/* Unified Client Selection section: header with chevron + collapsible content */}
                <div style={{ marginTop: 16 }}>
                    <div
                        style={{
                            border: '1px solid #e1e5ea',
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                            boxShadow: isDarkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.07)'
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setIsClientSectionOpen(o => !o)}
                            aria-expanded={isClientSectionOpen}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                padding: '12px 14px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {renderSelectionSummary()}
                            </div>
                            <i
                                className="ms-Icon ms-Icon--ChevronDown"
                                style={{
                                    fontSize: 14,
                                    color: '#3690CE',
                                    transition: 'transform 0.2s ease',
                                    transform: isClientSectionOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                }}
                            />
                        </button>

                        <PoidSelectionTransition show={!!pendingClientType && isClientSectionOpen}>
                            <div style={{ padding: '0 14px 14px 14px' }}>
                                {pendingClientType === 'Multiple Individuals' && (
                                    <div style={{ margin: '8px 0' }}>
                                        <div className="question-banner">Confirm Client as on File</div>
                                        <input
                                            type="text"
                                            value={clientAsOnFile}
                                            onChange={e => setClientAsOnFile(e.target.value)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px 12px', 
                                                height: '38px',
                                                boxSizing: 'border-box',
                                                background: clientAsOnFile ? "#3690CE22" : "#fff",
                                                color: "#061733",
                                                border: clientAsOnFile ? "1px solid #3690CE" : "1px solid #e3e8ef",
                                                borderRadius: 0,
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                                transition: "background 0.2s, color 0.2s, border 0.2s",
                                                outline: "none",
                                                fontSize: "14px"
                                            }}
                                            placeholder="Enter client name as on file"
                                        />
                                    </div>
                                )}

                                {/* Show POID selection only after client type is chosen */}
                                <PoidSelectionTransition show={!!pendingClientType}>
                                    {pendingClientType && (
                                        <>
                                            {/* POID Grid - Compact layout when selections are made */}
                                            <div 
                                                style={{ 
                                                    width: '100%',
                                                    overflow: 'visible',
                                                    border: '1px solid #e3e8ef',
                                                    borderRadius: '4px',
                                                    background: '#fafafa',
                                                    transition: 'all 0.4s ease-out',
                                                    padding: '16px',
                                                }} 
                                                className="poid-grid" 
                                                ref={poidGridRef as any}
                                            >
                                                {(() => {
                                                    const hasSelection = selectedPoidIds.length > 0;
                                                    
                                                    // Filter POIDs based on client type
                                                    const filteredData = displayPoidData.filter((poid) => {
                                                        const isCompany = !!(
                                                            poid.company_name ||
                                                            poid.company_number
                                                        );
                                                        if (pendingClientType === 'Individual') {
                                                            return !isCompany;
                                                        } else if (pendingClientType === 'Company') {
                                                            // Two-stage selection for Company type
                                                            const currentSelectedPoids = selectedPoidIds.map(id => 
                                                                displayPoidData.find(p => p.poid_id === id)
                                                            ).filter(Boolean);
                                                            
                                                            const hasCompanySelected = currentSelectedPoids.some(p => 
                                                                p && !!(p.company_name || p.company_number)
                                                            );
                                                            
                                                            if (!hasCompanySelected) {
                                                                // Stage 1: Show only companies until one is selected
                                                                return isCompany;
                                                            } else {
                                                                // Stage 2: Show only individuals for director selection
                                                                return !isCompany;
                                                            }
                                                        } else if (pendingClientType === 'Multiple Individuals') {
                                                            // Show only individuals for multiple selection
                                                            return !isCompany;
                                                        }
                                                        return true; // Existing Client shows all
                                                    });

                                                    // Special handling for Company type two-stage selection
                                                    let cardsToShow;
                                                    if (pendingClientType === 'Company') {
                                                        const currentSelectedPoids = selectedPoidIds.map(id => 
                                                            displayPoidData.find(p => p.poid_id === id)
                                                        ).filter(Boolean);
                                                        
                                                        const hasCompanySelected2 = currentSelectedPoids.some(p => 
                                                            p && !!(p.company_name || p.company_number)
                                                        );
                                                        
                                                        if (hasCompanySelected2) {
                                                            // Stage 2: Show only available directors (hide the selected company from this view)
                                                            cardsToShow = filteredData.slice(0, visiblePoidCount);
                                                        } else {
                                                            // Stage 1: Show only available companies
                                                            cardsToShow = filteredData.slice(0, visiblePoidCount);
                                                        }
                                                    } else {
                                                        // For other client types, use different logic based on whether multiple selection is allowed
                                                        if (pendingClientType === 'Multiple Individuals') {
                                                            // Always show all available options for multiple selection
                                                            cardsToShow = filteredData.slice(0, visiblePoidCount);
                                                        } else {
                                                            // Single selection types: show only selected when there's a selection
                                                            cardsToShow = hasSelection 
                                                                ? filteredData.filter(poid => selectedPoidIds.includes(poid.poid_id))
                                                                : filteredData.slice(0, visiblePoidCount);
                                                        }
                                                    }

                                                    return cardsToShow.map((poid) => {
                                                        const isSelected = selectedPoidIds.includes(poid.poid_id);
                                                        const singlePreselected = onlyShowPreselected && displayPoidData.length === 1;
                                                        
                                                        return (
                                                            <div 
                                                                key={poid.poid_id} 
                                                                onClick={() => handlePoidClick(poid)} 
                                                                role="button" 
                                                                tabIndex={0}
                                                                style={{
                                                                    opacity: 1, // Always full opacity for visible cards
                                                                    transform: 'translateY(0)',
                                                                    transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
                                                                    animation: 'fadeInUp 0.4s ease-out',
                                                                    pointerEvents: 'auto',
                                                                    filter: 'none',
                                                                    gridColumn: singlePreselected ? 'span 2' : undefined,
                                                                }}
                                                            >
                                                                <PoidCard 
                                                                    poid={poid} 
                                                                    selected={isSelected} 
                                                                    onClick={() => handlePoidClick(poid)} 
                                                                    teamData={teamData}
                                                                    instructionRefOverride={instructionRef}
                                                                    matterRefOverride={matterRef}
                                                                    companyName={(() => {
                                                                        if (pendingClientType === 'Company') {
                                                                            if (poid.company_name) return poid.company_name;
                                                                            return '';
                                                                        }
                                                                        return undefined;
                                                                    })()}
                                                                />
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </>
                                    )}
                                </PoidSelectionTransition>
                            </div>
                        </PoidSelectionTransition>
                    </div>
                </div>
            </div>
        </div>
        
    </Stack>
    );
};

export default PoidSelectionStep;