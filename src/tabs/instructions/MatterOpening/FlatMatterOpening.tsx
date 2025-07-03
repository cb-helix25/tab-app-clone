import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stack } from '@fluentui/react';
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

import ClientInfoStep from './ClientInfoStep';
import PoidSelectionStep from './PoidSelectionStep';
import AreaOfWorkStep from './AreaOfWorkStep';
import PracticeAreaStep from './PracticeAreaStep';
import DescriptionStep from './DescriptionStep';
import FolderStructureStep from './FolderStructureStep';
import DisputeValueStep from './DisputeValueStep';
import SourceStep from './SourceStep';
import OpponentDetailsStep from './OpponentDetailsStep';
import ReviewStep from './ReviewStep';
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
                company_name: v.CompanyName,
                company_number: v.CompanyNumber,
                company_house_building_number: v.CompanyHouseNumber,
                company_street: v.CompanyStreet,
                company_city: v.CompanyCity,
                company_county: v.CompanyCounty,
                company_post_code: v.CompanyPostcode,
                company_country: v.CompanyCountry,
                company_country_code: v.CompanyCountryCode,
                // Electronic ID verification fields
                stage: v.stage,
                check_result: v.EIDOverallResult,
                pep_sanctions_result: v.PEPAndSanctionsCheckResult,
                address_verification_result: v.AddressVerificationResult,
                check_expiry: v.CheckExpiry,
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
        
    // Debug log to see what POID data is being used
    console.log('Default POID data length:', defaultPoidData.length);
    console.log('Valid POID data length:', validPoidData.length);
    console.log('Filtered out', defaultPoidData.length - validPoidData.length, 'invalid POID entries');
    
    // Log details of any filtered out entries
    if (defaultPoidData.length !== validPoidData.length) {
        const invalidPoids = defaultPoidData.filter(poid => 
            !poid || !poid.first || !poid.last || 
            !isNaN(Number(poid.first)) || !isNaN(Number(poid.last))
        );
        console.log('Invalid POID entries:', invalidPoids);
    }
    
    console.log('Passed POID data length:', poidData?.length || 0);
    console.log('Effective POID data length:', effectivePoidData.length);

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
    const [fundsReceived, setFundsReceived] = useState('');
    const [isDateCalloutOpen, setIsDateCalloutOpen] = useState(false);
    const dateButtonRef = useRef<HTMLDivElement | null>(null);

    const [clientType, setClientType] = useState(initialClientType);
    useEffect(() => setClientType(initialClientType), [initialClientType]);

    const [selectedPoidIds, setSelectedPoidIds] = useState<string[]>([]);
    const [areaOfWork, setAreaOfWork] = useState('');
    const [practiceArea, setPracticeArea] = useState('');
    const [description, setDescription] = useState('');
    const [folderStructure, setFolderStructure] = useState('');
    const [disputeValue, setDisputeValue] = useState('');
    const [source, setSource] = useState('');
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
                <div className="workflow-main matter-opening-card">
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
                            partnerOptions={partnerOptionsList}
                            source={source}
                            setSource={setSource}
                            referrerName={referrerName}
                            setReferrerName={setReferrerName}
                        />
                    </StepWrapper>
                    {showPoidSelection && (
                        <StepWrapper stepNumber={2} title="Select Clients">
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
                                fundsReceived={fundsReceived}
                                setFundsReceived={setFundsReceived}
                            />
                        </StepWrapper>
                    )}
                    <StepWrapper stepNumber={showPoidSelection ? 3 : 2} title="Matter Details">
                        <Stack tokens={{ childrenGap: 24 }}>
                            <AreaOfWorkStep
                                areaOfWork={areaOfWork}
                                setAreaOfWork={setAreaOfWork}
                                getGroupColor={getGroupColor}
                                onContinue={function (): void {}}
                            />
                            <PracticeAreaStep
                                options={areaOfWork && practiceAreasByArea[areaOfWork] ? practiceAreasByArea[areaOfWork] : ['Please select an Area of Work']}
                                practiceArea={practiceArea}
                                setPracticeArea={setPracticeArea}
                                groupColor={''}
                                onContinue={function (): void {}}
                            />
                            <DescriptionStep
                                description={description}
                                setDescription={setDescription}
                            />
                            <FolderStructureStep
                                folderStructure={folderStructure}
                                setFolderStructure={setFolderStructure}
                                folderOptions={['Default / Commercial', 'Adjudication', 'Residential Possession', 'Employment']}
                                onContinue={function (): void {}}
                            />
                        </Stack>
                    </StepWrapper>
                    {/* Removed Description and Folder Structure as separate steps; now included in Matter Details */}
                    {/* Dispute Value moved to Opponent Details */}
                    {/* Source moved to Solicitor and Source Details */}
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
                    <StepWrapper stepNumber={showPoidSelection ? 5 : 4} title="Review" isCompleted={true}>
                        <ReviewStep
                            selectedDate={selectedDate}
                            supervisingPartner={supervisingPartner}
                            originatingSolicitor={originatingSolicitor}
                            fundsReceived={fundsReceived}
                            clientType={clientType}
                            selectedPoidIds={selectedPoidIds}
                            areaOfWork={areaOfWork}
                            practiceArea={practiceArea}
                            description={description}
                            folderStructure={folderStructure}
                            disputeValue={disputeValue}
                            source={source}
                            referrerName={referrerName}
                            opponentName={opponentName}
                            opponentEmail={opponentEmail}
                            opponentSolicitorName={opponentSolicitorName}
                            opponentSolicitorCompany={opponentSolicitorCompany}
                            opponentSolicitorEmail={opponentSolicitorEmail}
                            noConflict={noConflict}
                        />
                    </StepWrapper>
                </div>
            </Stack>
        </CompletionProvider>
    );
};

export default FlatMatterOpening;
