import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stack } from '@fluentui/react';
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
        if (selectedPoidIds.includes(poid.poid_id)) {
            setSelectedPoidIds((prev) => prev.filter((id) => id !== poid.poid_id));
            if (activePoid && activePoid.poid_id === poid.poid_id) {
                const remaining = effectivePoidData.find((p) => selectedPoidIds.includes(p.poid_id) && p.poid_id !== poid.poid_id);
                setActivePoid(remaining || null);
            }
        } else {
            setSelectedPoidIds((prev) => [...prev, poid.poid_id]);
            setActivePoid(poid);
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
    
    // Try to infer client type from selected POIDs
    useEffect(() => {
        if (selectedPoidIds.length === 1) setPendingClientType('Individual');
        else if (selectedPoidIds.length > 1) setPendingClientType('Multiple Individuals');
        // Could add logic for company/existing client if POID data supports it
    }, [selectedPoidIds]);

    const handleContinueToForm = () => {
        if (selectedPoidIds.length > 0 && pendingClientType) {
            setClientType(pendingClientType);
            setCurrentStep(1);
        }
    };

    const handleGoToReview = () => {
        setCurrentStep(2);
    };

    const handleBackToClients = () => {
        setCurrentStep(0);
    };

    const handleBackToForm = () => {
        setCurrentStep(1);
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
                            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
                                {currentStep === 0 && 'Select Clients'}
                                {currentStep === 1 && 'Matter Details'}
                                {currentStep === 2 && 'Review Summary'}
                            </h3>
                            {/* Navigation breadcrumbs */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#666' }}>
                                <button 
                                    onClick={handleBackToClients}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: currentStep === 0 ? '#0078d4' : '#666',
                                        cursor: 'pointer',
                                        textDecoration: currentStep === 0 ? 'underline' : 'none'
                                    }}
                                >
                                    Clients
                                </button>
                                <span>→</span>
                                <button 
                                    onClick={handleBackToForm}
                                    disabled={currentStep === 0}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: currentStep === 1 ? '#0078d4' : currentStep === 0 ? '#ccc' : '#666',
                                        cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                                        textDecoration: currentStep === 1 ? 'underline' : 'none'
                                    }}
                                >
                                    Form
                                </button>
                                <span>→</span>
                                <span style={{ color: currentStep === 2 ? '#0078d4' : '#ccc' }}>Review</span>
                            </div>
                        </div>
                        <MinimalSearchBox value={poidSearchTerm} onChange={setPoidSearchTerm} />
                    </div>

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
                                    />
                                </div>
                                
                                {/* Continue Button */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                                    <button
                                        style={{ 
                                            fontSize: 20, 
                                            padding: '1em 2em', 
                                            borderRadius: 8, 
                                            background: '#0078d4', 
                                            color: '#fff', 
                                            border: 'none', 
                                            cursor: selectedPoidIds.length === 0 || !pendingClientType ? 'not-allowed' : 'pointer', 
                                            fontWeight: 600 
                                        }}
                                        disabled={selectedPoidIds.length === 0 || !pendingClientType}
                                        onClick={handleContinueToForm}
                                    >
                                        Continue to Form
                                    </button>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                                    <button
                                        style={{ 
                                            fontSize: 16, 
                                            padding: '0.8em 1.5em', 
                                            borderRadius: 8, 
                                            background: '#f3f2f1', 
                                            color: '#323130', 
                                            border: '1px solid #d2d0ce', 
                                            cursor: 'pointer', 
                                            fontWeight: 500 
                                        }}
                                        onClick={handleBackToClients}
                                    >
                                        ← Back to Clients
                                    </button>
                                    <button
                                        style={{ 
                                            fontSize: 16, 
                                            padding: '0.8em 1.5em', 
                                            borderRadius: 8, 
                                            background: '#0078d4', 
                                            color: '#fff', 
                                            border: 'none', 
                                            cursor: 'pointer', 
                                            fontWeight: 600 
                                        }}
                                        onClick={handleGoToReview}
                                    >
                                        Review Summary →
                                    </button>
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
                                    <h4 style={{ margin: '0 0 16px 0', fontWeight: 600 }}>Review Summary</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div><strong>Date:</strong> {selectedDate ? selectedDate.toLocaleDateString() : '-'}</div>
                                        <div><strong>Solicitor:</strong> {teamMember || '-'}</div>
                                        <div><strong>Supervising Partner:</strong> {supervisingPartner || '-'}</div>
                                        <div><strong>Originating Solicitor:</strong> {originatingSolicitor || '-'}</div>
                                        <div><strong>Client Type:</strong> {clientType || '-'}</div>
                                        <div><strong>POID(s):</strong> {selectedPoidIds && selectedPoidIds.length > 0 ? selectedPoidIds.join(', ') : '-'}</div>
                                        <div><strong>Area of Work:</strong> {areaOfWork || '-'}</div>
                                        <div><strong>Practice Area:</strong> {practiceArea || '-'}</div>
                                        <div><strong>Description:</strong> {description || '-'}</div>
                                        <div><strong>Folder Structure:</strong> {folderStructure || '-'}</div>
                                        <div><strong>Dispute Value:</strong> {disputeValue || '-'}</div>
                                        <div><strong>Source:</strong> {source || '-'}{source === 'referral' && referrerName ? ` - ${referrerName}` : ''}</div>
                                        <div><strong>Opponent:</strong> {opponentName || '-'}{opponentEmail ? ` (${opponentEmail})` : ''}</div>
                                        <div><strong>Opponent Solicitor:</strong> {(opponentSolicitorName || '-') + ' - ' + (opponentSolicitorCompany || '-') + (opponentSolicitorEmail ? ` (${opponentSolicitorEmail})` : '')}</div>
                                        <div><strong>No Conflict Confirmed:</strong> {noConflict ? 'Yes' : 'No'}</div>
                                    </div>
                                </div>
                                {/* Navigation buttons for review step */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                                    <button
                                        style={{ 
                                            fontSize: 16, 
                                            padding: '0.8em 1.5em', 
                                            borderRadius: 8, 
                                            background: '#f3f2f1', 
                                            color: '#323130', 
                                            border: '1px solid #d2d0ce', 
                                            cursor: 'pointer', 
                                            fontWeight: 500 
                                        }}
                                        onClick={handleBackToForm}
                                    >
                                        ← Back to Form
                                    </button>
                                    <button
                                        style={{ 
                                            fontSize: 16, 
                                            padding: '0.8em 1.5em', 
                                            borderRadius: 8, 
                                            background: '#107c10', 
                                            color: '#fff', 
                                            border: 'none', 
                                            cursor: 'pointer', 
                                            fontWeight: 600 
                                        }}
                                        onClick={() => {
                                            // Handle form submission here
                                            console.log('Form submitted!');
                                        }}
                                    >
                                        Submit Matter
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CSS for smooth hover effects */}
                    <style>{`
                        .review-summary-hoverable {
                            box-shadow: none;
                        }
                        .review-summary-hoverable:hover {
                            border-color: #3690CE !important;
                        }
                    `}</style>
                </div>
            </Stack>
        </CompletionProvider>
    );
}

export default FlatMatterOpening;
