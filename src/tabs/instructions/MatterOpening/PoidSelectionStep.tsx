//
import React from 'react'; // invisible change
// invisible change 2.2
import { Stack } from '@fluentui/react';
import { useTheme } from '../../../app/functionality/ThemeContext';
import PoidCard from '../PoidCard';
import { POID, TeamData } from '../../../app/functionality/types';
import helixLogo from '../../../assets/dark blue mark.svg';

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
        const s = (v || '').toLowerCase().trim();
        if (!s) return '';
        if (s.startsWith('pass')) return 'passed';
        if (s.startsWith('rev')) return 'review';
        if (s.startsWith('fail') || s.startsWith('rej')) return 'failed';
        if (s.startsWith('pend')) return 'pending';
        // Handle some other possible values
        if (s === 'approved') return 'passed';
        if (s === 'manual review' || s === 'manual_review') return 'review';
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
        const selectedPoid = selectedPoids[0];
        
        return (
            <div
                className="instruction-card-banner"
                style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: '16px 20px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
                    color: '#061733',
                    marginBottom: 16
                }}
            >
                {/* Main client header - compact */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: selectedPoids.length > 0 ? 16 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
                        <div style={{ 
                            background: '#F4F4F6', // Helix grey
                            border: '1px solid #E5E7EB',
                            borderRadius: 10,
                            padding: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2,
                            width: 42,
                            height: 42,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                        }}>
                            <img 
                                src={helixLogo} 
                                alt="Helix" 
                                style={{ 
                                    width: 28, 
                                    height: 28,
                                    objectFit: 'contain'
                                }} 
                            />
                        </div>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                                fontWeight: 700, 
                                fontSize: 16, 
                                lineHeight: 1.3, 
                                color: '#061733',
                                marginBottom: 2
                            }}>
                                {bannerTitle}
                            </div>
                            {bannerSubtitle && (
                                <div style={{ 
                                    fontSize: 13, 
                                    color: '#6B7280', 
                                    lineHeight: 1.3,
                                    marginBottom: 8
                                }}>
                                    {bannerSubtitle}
                                </div>
                            )}
                            
                            {/* Contact details */}
                            {selectedPoid && (
                                <div style={{ 
                                    display: 'flex', 
                                    gap: 16, 
                                    flexWrap: 'wrap', 
                                    fontSize: 13, 
                                    color: '#4B5563',
                                    marginBottom: 8
                                }}>
                                    {selectedPoid.email && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <i className="ms-Icon ms-Icon--Mail" style={{ fontSize: 12, color: '#6B7280' }} />
                                            <span>{selectedPoid.email}</span>
                                        </div>
                                    )}
                                    {selectedPoid.best_number && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <i className="ms-Icon ms-Icon--Phone" style={{ fontSize: 12, color: '#6B7280' }} />
                                            <span>{selectedPoid.best_number}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Address - separate line with pin icon */}
                            {selectedPoid && (selectedPoid.house_building_number || selectedPoid.street || selectedPoid.city || selectedPoid.post_code) && (
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'flex-start', 
                                    gap: 6,
                                    fontSize: 13, 
                                    color: '#4B5563',
                                    marginBottom: 8
                                }}>
                                    <i className="ms-Icon ms-Icon--POI" style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }} />
                                    <span>{[
                                        selectedPoid.house_building_number,
                                        selectedPoid.street,
                                        selectedPoid.city,
                                        selectedPoid.county,
                                        selectedPoid.post_code,
                                        selectedPoid.country
                                    ].filter(Boolean).join(', ')}</span>
                                </div>
                            )}
                            
                            {/* Additional personal details */}
                            {selectedPoid && (
                                <div style={{ 
                                    display: 'flex', 
                                    gap: 16, 
                                    flexWrap: 'wrap', 
                                    fontSize: 12, 
                                    color: '#6B7280',
                                    marginTop: 4
                                }}>
                                    {selectedPoid.date_of_birth && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <i className="ms-Icon ms-Icon--Calendar" style={{ fontSize: 11, color: '#9CA3AF' }} />
                                            <span>DOB: {new Date(selectedPoid.date_of_birth).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                        </div>
                                    )}
                                    {selectedPoid.gender && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <i className="ms-Icon ms-Icon--Contact" style={{ fontSize: 11, color: '#9CA3AF' }} />
                                            <span>{selectedPoid.gender}</span>
                                        </div>
                                    )}
                                    {selectedPoid.nationality && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <i className="ms-Icon ms-Icon--Globe" style={{ fontSize: 11, color: '#9CA3AF' }} />
                                            <span>{selectedPoid.nationality}</span>
                                        </div>
                                    )}
                                    {selectedPoid.passport_number && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <i className="ms-Icon ms-Icon--Passport" style={{ fontSize: 11, color: '#9CA3AF' }} />
                                            <span>Passport: {selectedPoid.passport_number}</span>
                                        </div>
                                    )}
                                    {selectedPoid.drivers_license_number && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <i className="ms-Icon ms-Icon--Car" style={{ fontSize: 11, color: '#9CA3AF' }} />
                                            <span>DL: {selectedPoid.drivers_license_number}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Company details and address for company clients */}
                            {selectedPoid && (selectedPoid.company_name || selectedPoid.company_number) && (
                                <div style={{ 
                                    fontSize: 13, 
                                    color: '#4B5563',
                                    marginTop: 8,
                                    marginBottom: 8
                                }}>
                                    {/* Company name and number */}
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 6,
                                        marginBottom: 6
                                    }}>
                                        <i className="ms-Icon ms-Icon--BuildingRegular" style={{ fontSize: 12, color: '#6B7280' }} />
                                        <span style={{ fontWeight: 600 }}>
                                            {selectedPoid.company_name}
                                            {selectedPoid.company_number && ` (${selectedPoid.company_number})`}
                                        </span>
                                    </div>
                                    
                                    {/* Company address if different from personal address */}
                                    {(selectedPoid.company_house_building_number || selectedPoid.company_street || selectedPoid.company_city || selectedPoid.company_post_code) && (
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'flex-start', 
                                            gap: 6,
                                            fontSize: 12,
                                            color: '#6B7280'
                                        }}>
                                            <i className="ms-Icon ms-Icon--POI" style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }} />
                                            <span>{[
                                                selectedPoid.company_house_building_number,
                                                selectedPoid.company_street,
                                                selectedPoid.company_city,
                                                selectedPoid.company_county,
                                                selectedPoid.company_post_code,
                                                selectedPoid.company_country
                                            ].filter(Boolean).join(', ')}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Instruction ref - top right, no label */}
                    {instructionRef && (
                        <div style={{ 
                            fontSize: 12, 
                            color: '#6B7280',
                            fontWeight: 600,
                            flexShrink: 0,
                            textAlign: 'right'
                        }}>
                            {instructionRef}
                        </div>
                    )}
                </div>

                {/* Remove the old reference info section since it's now moved to top right */}

                {/* Verification status - clear visual hierarchy */}
                {selectedPoids.length > 0 && (
                    <div style={{
                        borderTop: '1px solid #E5E7EB',
                        paddingTop: 16,
                        background: 'rgba(248, 250, 252, 0.5)',
                        margin: '0 -20px -16px -20px',
                        padding: '16px 20px',
                        borderRadius: '0 0 12px 12px'
                    }}>
                        {/* Overall status indicator */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: 12
                        }}>
                            <div style={{ 
                                fontSize: 12, 
                                fontWeight: 700, 
                                color: '#374151',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Verification Status
                            </div>
                        </div>
                        
                        {/* Individual verification chips - ID is overall, others are sub-results */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {/* ID is the OVERALL result - make it prominent */}
                            <span style={{
                                ...chipStyle(aggId),
                                padding: '8px 14px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                minWidth: 'auto',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <i className="ms-Icon ms-Icon--Shield" style={{ fontSize: 13 }} /> 
                                ID: {aggId || 'pending'}
                            </span>
                            {/* PEP and Address are sub-results - smaller */}
                            <span style={{
                                ...chipStyle(aggPep),
                                padding: '6px 10px',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                minWidth: 'auto',
                                opacity: 0.8
                            }}>
                                <i className="ms-Icon ms-Icon--PageShield" style={{ fontSize: 10 }} /> 
                                PEP: {aggPep || 'pending'}
                            </span>
                            <span style={{
                                ...chipStyle(aggAddr),
                                padding: '6px 10px',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                minWidth: 'auto',
                                opacity: 0.8
                            }}>
                                <i className="ms-Icon ms-Icon--POI" style={{ fontSize: 10 }} /> 
                                Address: {aggAddr || 'pending'}
                            </span>
                        </div>
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
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 12 
                }}>
                    <i className="ms-Icon ms-Icon--Contact" style={{ 
                        fontSize: 16, 
                        color: '#3690CE' 
                    }} />
                    <span style={{ 
                        fontSize: 16, 
                        fontWeight: 600, 
                        color: '#0F172A' 
                    }}>
                        What type of client is this matter for?
                    </span>
                </div>
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
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '12px 14px',
                                    border: `1px solid ${isActive ? '#3690CE' : '#E2E8F0'}`,
                                    borderRadius: '8px',
                                    background: isActive 
                                        ? 'linear-gradient(135deg, #3690CE15 0%, #3690CE08 100%)' 
                                        : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    minHeight: '70px',
                                    minWidth: '120px',
                                    boxShadow: isActive 
                                        ? '0 3px 10px rgba(54, 144, 206, 0.15), 0 1px 2px rgba(0,0,0,0.03)' 
                                        : '0 1px 3px rgba(0,0,0,0.03)',
                                    outline: 'none',
                                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)';
                                        e.currentTarget.style.borderColor = '#3690CE';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.06)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)';
                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                                    }
                                }}
                            >
                                <i 
                                    className={`ms-Icon ms-Icon--${icon}`} 
                                    style={{ 
                                        fontSize: 24, 
                                        color: isActive ? '#3690CE' : '#64748B',
                                        marginBottom: 6,
                                        transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }} 
                                />
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: isActive ? '#3690CE' : '#64748B',
                                        textAlign: 'center',
                                        lineHeight: 1.2,
                                        transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    {type}
                                </span>
                            </button>
                        );
                    })}
                </div>
                
                {/* Removed helper text for selection rules for cleaner UI */}
                
            {/* POID list section */}
            {/* Unified Client Selection section: header with chevron + collapsible content */}
                <div style={{ marginTop: 32 }}>
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
                                padding: '0 14px 0 0',
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