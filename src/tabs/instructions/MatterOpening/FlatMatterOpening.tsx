import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stack, PrimaryButton } from '@fluentui/react';
import MinimalSearchBox from './MinimalSearchBox';
import { POID, TeamData } from '../../../app/functionality/types';
import ClientDetails from '../ClientDetails';
import ClientHub from '../ClientHub';
import StepWrapper from './StepWrapper';
import '../../../app/styles/NewMatters.css';
import '../../../app/styles/MatterOpeningCard.css';
import {
    practiceAreasByArea,
    getGroupColor,
    partnerOptions as defaultPartners,
} from './config';
import localTeamDataJson from '../../../localData/team-sql-data.json';
import localUserData from '../../../localData/localUserData.json';

import ClientInfoStep from './ClientInfoStep';
import PoidSelectionStep from './PoidSelectionStep';
import AreaOfWorkStep from './AreaOfWorkStep';
import PracticeAreaStep from './PracticeAreaStep';
import DescriptionStep from './DescriptionStep';
import FolderStructureStep from './FolderStructureStep';
import DisputeValueStep from './DisputeValueStep';
import SourceStep from './SourceStep';
import OpponentDetailsStep from './OpponentDetailsStep';

import { CompletionProvider } from './CompletionContext';
import idVerifications from '../../../localData/localIdVerifications.json';
import { sharedPrimaryButtonStyles, sharedDefaultButtonStyles } from '../../../app/styles/ButtonStyles';

interface FlatMatterOpeningProps {
    poidData?: POID[];
    setPoidData: React.Dispatch<React.SetStateAction<POID[]>>;
    teamData?: TeamData[] | null;
    userInitials: string;
    instructionRef?: string;
    clientId?: string;
    feeEarner?: string;
    stage?: string;
    matterRef?: string;
    hideClientSections?: boolean;
    initialClientType?: string;
}

const FlatMatterOpening: React.FC<FlatMatterOpeningProps> = ({
    poidData,
    setPoidData,
    teamData,
    userInitials,
    instructionRef = '',
    clientId = '',
    feeEarner,
    stage = 'New Matter',
    matterRef,
    hideClientSections = false,
    initialClientType = '',
}) => {
    const idExpiry = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('en-GB');
    }, []);

    const showPoidSelection = !instructionRef;
    const defaultPoidData: POID[] = useMemo(
        () =>
            (idVerifications as any[]).map((v) => ({
                poid_id: String(v.InternalId),
                first: v.FirstName,
                last: v.LastName,
                email: v.Email,
                nationality: v.Nationality,
                nationality_iso: v.NationalityAlpha2,
                date_of_birth: v.DOB,
                passport_number: v.PassportNumber,
                drivers_license_number: v.DriversLicenseNumber,
                house_building_number: v.HouseNumber,
                street: v.Street,
                city: v.City,
                county: v.County,
                post_code: v.Postcode,
                country: v.Country,
                country_code: v.CountryCode,
                company_name: v.company_name || v.CompanyName,
                company_number: v.company_number || v.CompanyNumber,
                company_house_building_number: v.company_house_building_number || v.CompanyHouseNumber,
                company_street: v.company_street || v.CompanyStreet,
                company_city: v.company_city || v.CompanyCity,
                company_county: v.company_county || v.CompanyCounty,
                company_post_code: v.company_post_code || v.CompanyPostcode,
                company_country: v.company_country || v.CompanyCountry,
                company_country_code: v.company_country_code || v.CompanyCountryCode,
                // Electronic ID verification fields
                stage: v.stage,
                check_result: v.EIDOverallResult,
                pep_sanctions_result: v.PEPAndSanctionsCheckResult,
                address_verification_result: v.AddressVerificationResult,
                check_expiry: v.CheckExpiry,
                check_id: v.EIDCheckId, // <-- Add this line to map EIDCheckId to check_id
                poc: v.poc,
                prefix: v.prefix,
                type: v.type,
                client_id: v.ClientId,
                matter_id: v.MatterId,
            })) as POID[],
        []
    );
    
    // Filter out any invalid POID entries that might be causing issues
    const validPoidData = useMemo(() => {
        return defaultPoidData.filter(poid => 
            // Ensure each POID has at least first and last name populated
            poid && poid.first && poid.last && 
            // Make sure it's not just a number
            isNaN(Number(poid.first)) && isNaN(Number(poid.last))
        );
    }, [defaultPoidData]);
    
    // Force use of only validated local POID data
    const effectivePoidData: POID[] = validPoidData;
        
    // Debug logging removed

    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const localTeamData = useMemo(() => localTeamDataJson, []);
    const defaultPartnerOptions = defaultPartners;
    const partnerOptionsList = useMemo(() => {
        const activeTeam = teamData || localTeamData;
        if (activeTeam) {
            const names = activeTeam
                .filter((t) => (t.Role || '').toLowerCase().includes('partner'))
                .map((t) => t['Full Name'] || `${t.First || ''} ${t.Last || ''}`.trim())
                .filter(Boolean);
            return names.length ? names : defaultPartnerOptions;
        }
        return defaultPartnerOptions;
    }, [teamData, localTeamData]);
    
    const teamMemberOptions = useMemo(() => {
        const activeTeam = teamData || localTeamData;
        if (activeTeam) {
            return activeTeam
                .map((t) => t['Full Name'] || `${t.First || ''} ${t.Last || ''}`.trim())
                .filter(Boolean);
        }
        return [] as string[];
    }, [teamData, localTeamData]);
    
    const defaultTeamMember = useMemo(() => {
        const activeTeam = teamData || localTeamData;
        if (activeTeam && activeTeam.length > 0) {
            const found = activeTeam.find(
                (t) => (t.Initials || '').toLowerCase() === userInitials.toLowerCase(),
            );
            if (found) {
                return found['Full Name'] || `${found.First || ''} ${found.Last || ''}`.trim();
            }
            const first = activeTeam[0];
            return first['Full Name'] || `${first.First || ''} ${first.Last || ''}`.trim();
        }
        return '';
    }, [teamData, localTeamData, userInitials]);

    const [teamMember, setTeamMember] = useState(defaultTeamMember);
    useEffect(() => setTeamMember(defaultTeamMember), [defaultTeamMember]);
    const [supervisingPartner, setSupervisingPartner] = useState('');
    const [originatingSolicitor, setOriginatingSolicitor] = useState(defaultTeamMember);
    useEffect(() => setOriginatingSolicitor(defaultTeamMember), [defaultTeamMember]);
    // Removed fundsReceived state
    const [isDateCalloutOpen, setIsDateCalloutOpen] = useState(false);
    const dateButtonRef = useRef<HTMLDivElement | null>(null);

    // Client type selection is now a page-level qualifying question
    const clientTypes = [
        'Individual',
        'Company',
        'Multiple Individuals',
        'Existing Client',
    ];
    const [clientType, setClientType] = useState(initialClientType || '');
    useEffect(() => setClientType(initialClientType || ''), [initialClientType]);

    const [selectedPoidIds, setSelectedPoidIds] = useState<string[]>([]);
    const [areaOfWork, setAreaOfWork] = useState('');
    const [practiceArea, setPracticeArea] = useState('');
    const [description, setDescription] = useState('');
    const [folderStructure, setFolderStructure] = useState('');
    const [disputeValue, setDisputeValue] = useState('');
    // Preselect "Search" as the default value for the source field
    const [source, setSource] = useState('search');
    const [referrerName, setReferrerName] = useState('');
    const [opponentName, setOpponentName] = useState('');
    const [opponentEmail, setOpponentEmail] = useState('');
    const [opponentSolicitorName, setOpponentSolicitorName] = useState('');
    const [opponentSolicitorCompany, setOpponentSolicitorCompany] = useState('');
    const [opponentSolicitorEmail, setOpponentSolicitorEmail] = useState('');
    const [noConflict, setNoConflict] = useState(false);

    const [visiblePoidCount, setVisiblePoidCount] = useState(12);
    const [poidSearchTerm, setPoidSearchTerm] = useState('');
    const poidGridRef = useRef<HTMLDivElement | null>(null);
    const [activePoid, setActivePoid] = useState<POID | null>(null);

    const filteredPoidData = effectivePoidData.filter((poid) => {
        const term = poidSearchTerm.toLowerCase();
        return (
            poid.poid_id.toLowerCase().includes(term) ||
            (poid.first && poid.first.toLowerCase().includes(term)) ||
            (poid.last && poid.last.toLowerCase().includes(term))
        );
    });

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisiblePoidCount((prev) => Math.min(prev + 12, filteredPoidData.length));
                }
            },
            { rootMargin: '200px' }
        );
        if (poidGridRef.current) observer.observe(poidGridRef.current);
        return () => observer.disconnect();
    }, [filteredPoidData]);

    const handlePoidClick = (poid: POID) => {
        const isSingleSelectionType = pendingClientType !== 'Multiple Individuals';
        
        if (selectedPoidIds.includes(poid.poid_id)) {
            // Deselecting a POID
            setSelectedPoidIds((prev) => prev.filter((id) => id !== poid.poid_id));
            if (activePoid && activePoid.poid_id === poid.poid_id) {
                const remaining = effectivePoidData.find((p) => selectedPoidIds.includes(p.poid_id) && p.poid_id !== poid.poid_id);
                setActivePoid(remaining || null);
            }
        } else {
            // Selecting a POID
            if (isSingleSelectionType) {
                // For Individual, Company, Existing Client - only allow one selection
                setSelectedPoidIds([poid.poid_id]);
                setActivePoid(poid);
            } else {
                // For Multiple Individuals - allow multiple selections
                setSelectedPoidIds((prev) => [...prev, poid.poid_id]);
                setActivePoid(poid);
            }
        }
    };

    // Helper to get nickname from localUserData
    function getLocalUserNickname(userInitials: string): string {
        if (!userInitials) return '';
        const found = (localUserData as any[]).find(
            (u) => (u.Initials || '').toLowerCase() === userInitials.toLowerCase()
        );
        return found ? found.Nickname || found.First || found['Full Name'] || '' : '';
    }

    // Helper to get nickname from team data
    function getTeamNickname(userInitials: string, teamData: any[]): string {
        if (!userInitials || !teamData) return '';
        const found = teamData.find(
            (u) => (u.Initials || '').toLowerCase() === userInitials.toLowerCase()
        );
        return found ? found.Nickname || found.First || found['Full Name'] || '' : '';
    }

    // Helper to get only first names for partners
    function getPartnerFirstNames(teamData: any[]): string[] {
        if (!teamData) return [];
        return teamData
            .filter((member: any) => member.Role === 'Partner')
            .map((member: any) => member.First || member['First'] || '')
            .filter(Boolean);
    }

    // Determine requesting user nickname based on environment
    const requestingUserNickname =
        process.env.NODE_ENV === 'production'
            ? getTeamNickname(userInitials, teamData || localTeamDataJson)
            : getLocalUserNickname(userInitials);

    // Horizontal sliding carousel approach
    const [currentStep, setCurrentStep] = useState(0); // 0: select, 1: form, 2: review
    const [pendingClientType, setPendingClientType] = useState('');

    // Determine completion status for each step
    const clientsStepComplete = selectedPoidIds.length > 0 && pendingClientType;
    const matterStepComplete = selectedDate && supervisingPartner && originatingSolicitor && areaOfWork && practiceArea && description;
    const reviewStepComplete = false; // Review step doesn't have a "next" - it's the final step

    const handleContinueToForm = () => {
        if (selectedPoidIds.length > 0 && pendingClientType) {
            setClientType(pendingClientType);
            setCurrentStep(1);
            // Scroll to top when changing steps
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleGoToReview = () => {
        setCurrentStep(2);
        // Scroll to top when changing steps
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToClients = () => {
        setCurrentStep(0);
        // Scroll to top when changing steps
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToForm = () => {
        setCurrentStep(1);
        // Scroll to top when changing steps
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleClientTypeChange = (newType: string, shouldLimitToSingle: boolean) => {
        // If switching to a single-selection type and multiple POIDs are selected
        if (shouldLimitToSingle && selectedPoidIds.length > 1) {
            // Keep only the first selected POID
            setSelectedPoidIds([selectedPoidIds[0]]);
        }
    };

    // Render the horizontal sliding carousel
    return (
        <CompletionProvider>
            <Stack className="workflow-container">
                {!hideClientSections && (
                    <>
                        <ClientDetails stage={stage} instructionRef={instructionRef} />
                        <ClientHub
                            instructionRef={instructionRef}
                            clientId={clientId}
                            feeEarner={feeEarner}
                            idExpiry={idExpiry}
                            idVerified={false}
                            matterRef={matterRef}
                        />
                    </>
                )}
                
                {/* Main Container */}
                <div className="workflow-main matter-opening-card">
                    {/* Persistent Header */}
                    <div className="persistent-header" style={{ 
                        padding: '20px 32px',
                        borderBottom: '1px solid #e1e5e9',
                        background: '#fff',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                            {/* Navigation breadcrumbs */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                                <button 
                                    onClick={handleBackToClients}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: currentStep === 0 ? '#3690CE' : '#666',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 12px',
                                        borderRadius: 6,
                                        transition: 'all 0.2s ease',
                                        fontWeight: currentStep === 0 ? 600 : 400,
                                        backgroundColor: currentStep === 0 ? '#e3f0fc' : 'transparent'
                                    }}
                                >
                                    {clientsStepComplete && currentStep !== 0 ? (
                                        <div className="completion-tick visible" style={{ 
                                            marginRight: 4,
                                            width: 16,
                                            height: 16,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            background: '#fff',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                                            color: '#20b26c',
                                            border: '2px solid #f8f8f8'
                                        }}>
                                            <svg width="10" height="8" viewBox="0 0 24 24" fill="none">
                                                <polyline points="5,13 10,18 19,7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                    ) : (
                                        <i className="ms-Icon ms-Icon--People" style={{ fontSize: 16 }} />
                                    )}
                                    Clients
                                </button>
                                
                                {/* Modern connector */}
                                <div style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    margin: '0 4px'
                                }}>
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: '#e0e0e0'
                                    }} />
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: '#e8e8e8'
                                    }} />
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: '#e0e0e0'
                                    }} />
                                </div>
                                
                                <button 
                                    onClick={handleBackToForm}
                                    disabled={currentStep === 0}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: currentStep === 1 ? '#3690CE' : currentStep === 0 ? '#ccc' : '#666',
                                        cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 12px',
                                        borderRadius: 6,
                                        transition: 'all 0.2s ease',
                                        fontWeight: currentStep === 1 ? 600 : 400,
                                        backgroundColor: currentStep === 1 ? '#e3f0fc' : 'transparent'
                                    }}
                                >
                                    {matterStepComplete && currentStep !== 1 ? (
                                        <div className="completion-tick visible" style={{ 
                                            marginRight: 4,
                                            width: 16,
                                            height: 16,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            background: '#fff',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                                            color: '#20b26c',
                                            border: '2px solid #f8f8f8'
                                        }}>
                                            <svg width="10" height="8" viewBox="0 0 24 24" fill="none">
                                                <polyline points="5,13 10,18 19,7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                    ) : (
                                        <i className="ms-Icon ms-Icon--OpenFolderHorizontal" style={{ fontSize: 16 }} />
                                    )}
                                    Matter
                                </button>
                                
                                {/* Modern connector */}
                                <div style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    margin: '0 4px'
                                }}>
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: '#e0e0e0'
                                    }} />
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: '#e8e8e8'
                                    }} />
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: '#e0e0e0'
                                    }} />
                                </div>
                                
                                <div style={{ 
                                    color: currentStep === 2 ? '#3690CE' : '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    fontWeight: currentStep === 2 ? 600 : 400,
                                    backgroundColor: currentStep === 2 ? '#e3f0fc' : 'transparent',
                                    transition: 'all 0.2s ease'
                                }}>
                                    <i className="ms-Icon ms-Icon--CheckboxComposite" style={{ fontSize: 16 }} />
                                    Review
                                </div>
                            </div>
                        </div>
                        <MinimalSearchBox value={poidSearchTerm} onChange={setPoidSearchTerm} />
                    </div>

                    {/* Add CSS animation for completion ticks */}
                    <style>{`
                        @keyframes tickPop {
                            from {
                                opacity: 0;
                                transform: scale(0);
                            }
                            to {
                                opacity: 1;
                                transform: scale(1);
                            }
                        }
                        
                        .completion-tick {
                            animation: tickPop 0.3s ease;
                        }
                        
                        .completion-tick.visible {
                            opacity: 1;
                            transform: scale(1);
                        }
                    `}</style>

                    {/* Sliding Container */}
                    <div style={{ 
                        overflow: 'hidden',
                        position: 'relative',
                        width: '100%',
                        minHeight: '500px'
                    }}>
                        <div style={{ 
                            display: 'flex',
                            width: '300%', // 3 panels * 100% each
                            transform: `translateX(-${currentStep * 33.333}%)`,
                            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            height: '100%'
                        }}>
                            
                            {/* Step 1: Client Selection */}
                            <div style={{ width: '33.333%', padding: '32px', boxSizing: 'border-box' }}>
                                <div style={{ width: '100%', maxWidth: 1080, margin: '0 auto 32px auto' }}>
                                    <PoidSelectionStep
                                        poidData={effectivePoidData}
                                        teamData={teamData}
                                        filteredPoidData={filteredPoidData}
                                        visiblePoidCount={visiblePoidCount}
                                        selectedPoidIds={selectedPoidIds}
                                        poidSearchTerm={poidSearchTerm}
                                        setPoidSearchTerm={setPoidSearchTerm}
                                        poidGridRef={poidGridRef}
                                        handlePoidClick={handlePoidClick}
                                        pendingClientType={pendingClientType}
                                        setPendingClientType={setPendingClientType}
                                        onClientTypeChange={handleClientTypeChange}
                                    />
                                </div>
                                
                                {/* Continue Button */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                                    <div 
                                        className={`continue-button${(selectedPoidIds.length === 0 || !pendingClientType) ? ' disabled' : ''}`}
                                        onClick={(selectedPoidIds.length === 0 || !pendingClientType) ? undefined : handleContinueToForm}
                                        style={{
                                            background: '#f4f4f6',
                                            border: '2px solid #e1dfdd',
                                            borderRadius: '50%',
                                            width: '64px',
                                            height: '64px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: (selectedPoidIds.length === 0 || !pendingClientType) ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            opacity: (selectedPoidIds.length === 0 || !pendingClientType) ? 0.5 : 1,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedPoidIds.length > 0 && pendingClientType) {
                                                e.currentTarget.style.background = '#e7f1ff';
                                                e.currentTarget.style.border = '2px solid #3690CE';
                                                e.currentTarget.style.borderRadius = '32px';
                                                e.currentTarget.style.width = '220px';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(54,144,206,0.08)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedPoidIds.length > 0 && pendingClientType) {
                                                e.currentTarget.style.background = '#f4f4f6';
                                                e.currentTarget.style.border = '2px solid #e1dfdd';
                                                e.currentTarget.style.borderRadius = '50%';
                                                e.currentTarget.style.width = '64px';
                                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(6,23,51,0.04)';
                                            }
                                        }}
                                    >
                                        {/* Arrow Icon */}
                                        <svg 
                                            width="24" 
                                            height="24" 
                                            viewBox="0 0 24 24" 
                                            fill="none"
                                            style={{
                                                transition: 'color 0.3s, opacity 0.3s',
                                                color: (selectedPoidIds.length === 0 || !pendingClientType) ? '#bdbdbd' : '#3690CE',
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            <path 
                                                d="M5 12h14m-7-7l7 7-7 7" 
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
                                                fontSize: '16px',
                                                fontWeight: 600,
                                                color: '#3690CE',
                                                opacity: 0,
                                                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                whiteSpace: 'nowrap',
                                            }}
                                            className="continue-text"
                                        >
                                            Continue to Matter Details
                                        </span>
                                    </div>
                                    
                                    <style>{`
                                        .continue-button:hover .continue-text {
                                            opacity: 1 !important;
                                        }
                                        .continue-button:hover svg {
                                            opacity: 0 !important;
                                        }
                                        .continue-button.disabled:hover .continue-text {
                                            opacity: 0 !important;
                                        }
                                        .continue-button.disabled:hover svg {
                                            opacity: 1 !important;
                                        }
                                    `}</style>
                                </div>
                            </div>

                            {/* Step 2: Matter Form */}
                            <div style={{ width: '33.333%', padding: '32px', boxSizing: 'border-box' }}>
                                <StepWrapper stepNumber={1} title="Solicitor and Source Details" isActive={true}>
                                    <ClientInfoStep
                                        selectedDate={selectedDate}
                                        setSelectedDate={setSelectedDate}
                                        teamMember={teamMember}
                                        setTeamMember={setTeamMember}
                                        teamMemberOptions={teamMemberOptions}
                                        supervisingPartner={supervisingPartner}
                                        setSupervisingPartner={setSupervisingPartner}
                                        originatingSolicitor={originatingSolicitor}
                                        setOriginatingSolicitor={setOriginatingSolicitor}
                                        isDateCalloutOpen={isDateCalloutOpen}
                                        setIsDateCalloutOpen={setIsDateCalloutOpen}
                                        dateButtonRef={dateButtonRef}
                                        partnerOptions={getPartnerFirstNames(teamData || localTeamDataJson)}
                                        source={source}
                                        setSource={setSource}
                                        referrerName={referrerName}
                                        setReferrerName={setReferrerName}
                                        requestingUser={requestingUserNickname}
                                    />
                                </StepWrapper>
                                <StepWrapper stepNumber={2} title="Matter Details">
                                    <Stack tokens={{ childrenGap: 24 }}>
                                        <AreaOfWorkStep
                                            areaOfWork={areaOfWork}
                                            setAreaOfWork={setAreaOfWork}
                                            getGroupColor={getGroupColor}
                                            onContinue={function (): void {} }
                                        />
                                        <PracticeAreaStep
                                            options={areaOfWork && practiceAreasByArea[areaOfWork] ? practiceAreasByArea[areaOfWork] : ['Please select an Area of Work']}
                                            practiceArea={practiceArea}
                                            setPracticeArea={setPracticeArea}
                                            groupColor={''}
                                            onContinue={function (): void {} }
                                        />
                                        <DisputeValueStep
                                            disputeValue={disputeValue}
                                            setDisputeValue={setDisputeValue}
                                            onContinue={() => {}}
                                        />
                                        <DescriptionStep
                                            description={description}
                                            setDescription={setDescription}
                                        />
                                        <FolderStructureStep
                                            folderStructure={folderStructure}
                                            setFolderStructure={setFolderStructure}
                                            folderOptions={['Default / Commercial', 'Adjudication', 'Residential Possession', 'Employment']}
                                            onContinue={function (): void {} }
                                        />
                                    </Stack>
                                </StepWrapper>
                                <StepWrapper stepNumber={showPoidSelection ? 4 : 3} title="Dispute and Opponent Details">
                                    <OpponentDetailsStep
                                        opponentName={opponentName}
                                        setOpponentName={setOpponentName}
                                        opponentEmail={opponentEmail}
                                        setOpponentEmail={setOpponentEmail}
                                        opponentSolicitorName={opponentSolicitorName}
                                        setOpponentSolicitorName={setOpponentSolicitorName}
                                        opponentSolicitorCompany={opponentSolicitorCompany}
                                        setOpponentSolicitorCompany={setOpponentSolicitorCompany}
                                        opponentSolicitorEmail={opponentSolicitorEmail}
                                        setOpponentSolicitorEmail={setOpponentSolicitorEmail}
                                        noConflict={noConflict}
                                        setNoConflict={setNoConflict}
                                        disputeValue={disputeValue}
                                        setDisputeValue={setDisputeValue}
                                    />
                                </StepWrapper>
                                {/* Navigation buttons for form step */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
                                    {/* Back button with smooth expansion */}
                                    <div 
                                        className="nav-button back-button"
                                        onClick={handleBackToClients}
                                        style={{
                                            background: '#f4f4f6',
                                            border: '2px solid #e1dfdd',
                                            borderRadius: '50%',
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
                                            e.currentTarget.style.background = '#e7f1ff';
                                            e.currentTarget.style.border = '2px solid #3690CE';
                                            e.currentTarget.style.borderRadius = '24px';
                                            e.currentTarget.style.width = '160px';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(54,144,206,0.08)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#f4f4f6';
                                            e.currentTarget.style.border = '2px solid #e1dfdd';
                                            e.currentTarget.style.borderRadius = '50%';
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
                                                color: '#3690CE',
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            <path 
                                                d="M19 12h-14m7 7l-7-7 7-7" 
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
                                                color: '#3690CE',
                                                opacity: 0,
                                                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                whiteSpace: 'nowrap',
                                            }}
                                            className="nav-text"
                                        >
                                            Back to Clients
                                        </span>
                                    </div>

                                    {/* Forward button with smooth expansion */}
                                    <div 
                                        className="nav-button forward-button"
                                        onClick={handleGoToReview}
                                        style={{
                                            background: '#f4f4f6',
                                            border: '2px solid #e1dfdd',
                                            borderRadius: '50%',
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
                                            e.currentTarget.style.background = '#e7f1ff';
                                            e.currentTarget.style.border = '2px solid #3690CE';
                                            e.currentTarget.style.borderRadius = '24px';
                                            e.currentTarget.style.width = '160px';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(54,144,206,0.08)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#f4f4f6';
                                            e.currentTarget.style.border = '2px solid #e1dfdd';
                                            e.currentTarget.style.borderRadius = '50%';
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
                                                color: '#3690CE',
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            <path 
                                                d="M5 12h14m-7-7l7 7-7 7" 
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
                                                color: '#3690CE',
                                                opacity: 0,
                                                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                whiteSpace: 'nowrap',
                                            }}
                                            className="nav-text"
                                        >
                                            Review Summary
                                        </span>
                                    </div>
                                    
                                    <style>{`
                                        .nav-button:hover .nav-text {
                                            opacity: 1 !important;
                                        }
                                        .nav-button:hover svg {
                                            opacity: 0 !important;
                                        }
                                    `}</style>
                                </div>
                            </div>

                            {/* Step 3: Review Summary */}
                            <div style={{ width: '33.333%', padding: '32px', boxSizing: 'border-box' }}>
                                <div
                                    className="review-summary-box review-summary-hoverable"
                                    style={{
                                        border: '2px solid #d1d5db',
                                        borderRadius: 8,
                                        background: '#fff',
                                        padding: 24,
                                        margin: '0 0 32px 0',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        transition: 'border-color 0.2s',
                                        cursor: 'default',
                                    }}
                                    tabIndex={-1}
                                >
                                    <h4 style={{ margin: '0 0 24px 0', fontWeight: 600, fontSize: 18, color: '#061733' }}>Review Summary</h4>
                                    
                                    {/* Client Information Section */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 8, 
                                            marginBottom: 12,
                                            paddingBottom: 8,
                                            borderBottom: '1px solid #f0f0f0'
                                        }}>
                                            <i className="ms-Icon ms-Icon--People" style={{ fontSize: 14, color: '#3690CE' }} />
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#3690CE' }}>Client Information</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, paddingLeft: 22 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Type:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{clientType || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Client(s):</span>
                                                <div style={{ textAlign: 'right', maxWidth: '60%' }}>
                                                    {selectedPoidIds && selectedPoidIds.length > 0 ? (
                                                        selectedPoidIds.map((id, index) => {
                                                            const client = effectivePoidData.find(p => p.poid_id === id);
                                                            return (
                                                                <div key={id} style={{ fontSize: 13, fontWeight: 500, marginBottom: index < selectedPoidIds.length - 1 ? 4 : 0 }}>
                                                                    {client ? `${client.first} ${client.last}` : id}
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <span style={{ fontSize: 13, fontWeight: 500 }}>-</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Matter Details Section */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 8, 
                                            marginBottom: 12,
                                            paddingBottom: 8,
                                            borderBottom: '1px solid #f0f0f0'
                                        }}>
                                            <i className="ms-Icon ms-Icon--OpenFolderHorizontal" style={{ fontSize: 14, color: '#3690CE' }} />
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#3690CE' }}>Matter Details</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, paddingLeft: 22 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Area of Work:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>{areaOfWork || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Practice Area:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>{practiceArea || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Description:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right', lineHeight: '1.4' }}>
                                                    {description ? (description.length > 50 ? `${description.substring(0, 50)}...` : description) : '-'}
                                                </span>
                                            </div>
                                            {disputeValue && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: '#666', fontSize: 13 }}>Dispute Value:</span>
                                                    <span style={{ fontWeight: 500, fontSize: 13 }}>{disputeValue}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Team & Management Section */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 8, 
                                            marginBottom: 12,
                                            paddingBottom: 8,
                                            borderBottom: '1px solid #f0f0f0'
                                        }}>
                                            <i className="ms-Icon ms-Icon--ContactCard" style={{ fontSize: 14, color: '#3690CE' }} />
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#3690CE' }}>Team & Management</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, paddingLeft: 22 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Date:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{selectedDate ? selectedDate.toLocaleDateString() : '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Solicitor:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>{teamMember || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Supervising Partner:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>{supervisingPartner || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Originating Solicitor:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>{originatingSolicitor || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Information Section */}
                                    {(source || opponentName || folderStructure) && (
                                        <div style={{ marginBottom: 16 }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 8, 
                                                marginBottom: 12,
                                                paddingBottom: 8,
                                                borderBottom: '1px solid #f0f0f0'
                                            }}>
                                                <i className="ms-Icon ms-Icon--Info" style={{ fontSize: 14, color: '#3690CE' }} />
                                                <span style={{ fontSize: 14, fontWeight: 600, color: '#3690CE' }}>Additional Details</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, paddingLeft: 22 }}>
                                                {source && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ color: '#666', fontSize: 13 }}>Source:</span>
                                                        <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>
                                                            {source}{source === 'referral' && referrerName ? ` - ${referrerName}` : ''}
                                                        </span>
                                                    </div>
                                                )}
                                                {opponentName && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ color: '#666', fontSize: 13 }}>Opponent:</span>
                                                        <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>
                                                            {opponentName}{opponentEmail ? ` (${opponentEmail})` : ''}
                                                        </span>
                                                    </div>
                                                )}
                                                {folderStructure && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ color: '#666', fontSize: 13 }}>Folder Structure:</span>
                                                        <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>{folderStructure}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Conflict Check Status */}
                                    <div style={{ 
                                        marginTop: 16,
                                        padding: 12,
                                        background: noConflict ? '#f0f9f4' : '#fef2f2',
                                        border: `1px solid ${noConflict ? '#d1fae5' : '#fecaca'}`,
                                        borderRadius: 6,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <i className={`ms-Icon ms-Icon--${noConflict ? 'CheckMark' : 'Warning'}`} 
                                           style={{ fontSize: 14, color: noConflict ? '#22c55e' : '#ef4444' }} />
                                        <span style={{ fontSize: 13, fontWeight: 500, color: noConflict ? '#15803d' : '#dc2626' }}>
                                            {noConflict ? 'No conflicts confirmed' : 'Conflict check required'}
                                        </span>
                                    </div>
                                </div>
                                {/* Navigation buttons for review step */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
                                    {/* Back button with smooth expansion */}
                                    <div 
                                        className="nav-button back-button"
                                        onClick={handleBackToForm}
                                        style={{
                                            background: '#f4f4f6',
                                            border: '2px solid #e1dfdd',
                                            borderRadius: '50%',
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
                                            e.currentTarget.style.background = '#e7f1ff';
                                            e.currentTarget.style.border = '2px solid #3690CE';
                                            e.currentTarget.style.borderRadius = '24px';
                                            e.currentTarget.style.width = '140px';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(54,144,206,0.08)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#f4f4f6';
                                            e.currentTarget.style.border = '2px solid #e1dfdd';
                                            e.currentTarget.style.borderRadius = '50%';
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
                                                color: '#3690CE',
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            <path 
                                                d="M19 12h-14m7 7l-7-7 7-7" 
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
                                                color: '#3690CE',
                                                opacity: 0,
                                                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                whiteSpace: 'nowrap',
                                            }}
                                            className="nav-text"
                                        >
                                            Back to Form
                                        </span>
                                    </div>

                                    {/* Submit button with smooth expansion */}
                                    <div 
                                        className="nav-button submit-button"
                                        onClick={() => {
                                            // Handle form submission here
                                            console.log('Form submitted!');
                                        }}
                                        style={{
                                            background: '#f4f4f6',
                                            border: '2px solid #e1dfdd',
                                            borderRadius: '50%',
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
                                            e.currentTarget.style.background = '#e7f1ff';
                                            e.currentTarget.style.border = '2px solid #3690CE';
                                            e.currentTarget.style.borderRadius = '24px';
                                            e.currentTarget.style.width = '160px';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(54,144,206,0.08)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#f4f4f6';
                                            e.currentTarget.style.border = '2px solid #e1dfdd';
                                            e.currentTarget.style.borderRadius = '50%';
                                            e.currentTarget.style.width = '48px';
                                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(6,23,51,0.04)';
                                        }}
                                    >
                                        {/* Check Icon */}
                                        <svg 
                                            width="18" 
                                            height="18" 
                                            viewBox="0 0 24 24" 
                                            fill="none"
                                            style={{
                                                transition: 'color 0.3s, opacity 0.3s',
                                                color: '#3690CE',
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            <polyline 
                                                points="20,6 9,17 4,12" 
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
                                                color: '#3690CE',
                                                opacity: 0,
                                                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                whiteSpace: 'nowrap',
                                            }}
                                            className="nav-text"
                                        >
                                            Submit Matter
                                        </span>
                                    </div>
                                    
                                    <style>{`
                                        .nav-button:hover .nav-text {
                                            opacity: 1 !important;
                                        }
                                        .nav-button:hover svg {
                                            opacity: 0 !important;
                                        }
                                    `}</style>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CSS for smooth hover effects and navigation animations */}
                    <style>{`
                        .review-summary-hoverable {
                            box-shadow: none;
                        }
                        .review-summary-hoverable:hover {
                            border-color: #3690CE !important;
                        }
                        
                        /* Navigation button animations */
                        .nav-button-container:hover .nav-button.back-button {
                            transform: scale(1.1);
                            border-color: #0078d4;
                            box-shadow: 0 4px 12px rgba(0, 120, 212, 0.2);
                        }
                        
                        .nav-button-container:hover .nav-button.forward-button {
                            transform: scale(1.1);
                            box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
                        }
                        
                        .nav-button-container:hover .nav-label {
                            opacity: 1 !important;
                            visibility: visible !important;
                            transform: translateY(-50%) translateX(0) !important;
                        }
                        
                        .nav-button-container:hover .back-label {
                            transform: translateY(-50%) translateX(-8px) !important;
                        }
                        
                        .nav-button-container:hover .forward-label {
                            transform: translateY(-50%) translateX(8px) !important;
                        }
                        
                        .nav-button:active {
                            transform: scale(0.95) !important;
                        }
                        
                        .nav-button-container {
                            animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                        }
                        
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
                    `}</style>
                </div>
            </Stack>
        </CompletionProvider>
    );
}

export default FlatMatterOpening;
