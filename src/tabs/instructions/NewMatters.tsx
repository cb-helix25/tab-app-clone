import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Stack } from '@fluentui/react';
import { POID, TeamData } from '../../app/functionality/types';
import StepHeader from './StepHeader';
import ClientDetails from './ClientDetails';
import ClientHub from './ClientHub';
import '../../app/styles/NewMatters.css';
import {
    practiceAreasByArea,
    getGroupColor,
    stepTitles,
    StepKey,
} from './MatterOpening/config';
// Import local team data
import teamDataJson from '../../../data/team-sql-data.json';

// Components for individual steps
import ClientInfoStep from './MatterOpening/ClientInfoStep';
import PoidSelectionStep from './MatterOpening/PoidSelectionStep';
import AreaOfWorkStep from './MatterOpening/AreaOfWorkStep';
import PracticeAreaStep from './MatterOpening/PracticeAreaStep';
import DescriptionStep from './MatterOpening/DescriptionStep';
import FolderStructureStep from './MatterOpening/FolderStructureStep';
import DisputeValueStep from './MatterOpening/DisputeValueStep';
import SourceStep from './MatterOpening/SourceStep';
import OpponentDetailsStep from './MatterOpening/OpponentDetailsStep';

import ReviewStep from './MatterOpening/ReviewStep';
import { CompletionProvider } from './MatterOpening/CompletionContext';
import idVerifications from '../../localData/localIdVerifications.json';

interface NewMattersProps {
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
    /** Sets the initial client type when launching the workflow */
    initialClientType?: string;
}

const NewMatters: React.FC<NewMattersProps> = ({
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
    const [openStep, setOpenStep] = useState<number>(0);

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
            })) as POID[],
        []
    );
    const effectivePoidData: POID[] =
        poidData && poidData.length > 0 ? poidData : defaultPoidData;

    const idExpiry = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('en-GB');
    }, []);

    // Client info
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [supervisingPartner, setSupervisingPartner] = useState('');
    const [originatingSolicitor, setOriginatingSolicitor] = useState('');
    const [fundsReceived, setFundsReceived] = useState('');
    const [isDateCalloutOpen, setIsDateCalloutOpen] = useState(false);
    const dateButtonRef = useRef<HTMLDivElement | null>(null);
    // Use local team data with fallback to props. Include the whole team
    const localTeamData = useMemo(() => {
        return teamDataJson; // no filtering so all members are available
    }, []);

    const teamMemberOptions = useMemo(() => {
        const activeTeam = teamData || localTeamData;
        const options = activeTeam
            .map((member: any) =>
                member['Full Name'] || `${member.First || ''} ${member.Last || ''}`.trim(),
            )
            .filter(Boolean);
        
        // Debug logging
        console.log('Active team data:', activeTeam);
        console.log('Team member options:', options);
        
        return options;
    }, [teamData, localTeamData]);

    // Create combined options for both partner and solicitor dropdowns
    const partnerAndSolicitorOptions = useMemo(() => {
        const activeTeam = teamData || localTeamData;
        return activeTeam
            .filter((member: any) =>
                ['Partner', 'Associate Solicitor', 'Solicitor'].includes(member.Role)
            )
            .map((member: any) =>
                member['Full Name'] || `${member.First || ''} ${member.Last || ''}`.trim(),
            )
            .filter(Boolean);
    }, [teamData, localTeamData]);

    const defaultTeamMember = useMemo(() => {
        const activeTeam = teamData || localTeamData;
        if (activeTeam) {
            const found = activeTeam.find((member: any) =>
                (member.Initials || '').toLowerCase() === userInitials.toLowerCase()
            );
            if (found) {
                return (
                    found['Full Name'] ||
                    `${found.First || ''} ${found.Last || ''}`.trim()
                );
            }
        }
        return '';
    }, [teamData, localTeamData, userInitials]);

    // Update partner options from local data
    const supervisingPartnerOptions = useMemo(() => {
        const activeTeam = teamData || localTeamData;
        return activeTeam
            .filter((member: any) => member.Role === 'Partner')
            .map((member: any) =>
                member['Full Name'] || `${member.First || ''} ${member.Last || ''}`.trim(),
            )
            .filter(Boolean);
    }, [teamData, localTeamData]);

    const originatingSolicitorOptions = useMemo(() => {
        const activeTeam = teamData || localTeamData;
        return activeTeam
            .filter((member: any) =>
                ['Partner', 'Associate Solicitor', 'Solicitor'].includes(member.Role)
            )
            .map((member: any) =>
                member['Full Name'] || `${member.First || ''} ${member.Last || ''}`.trim(),
            )
            .filter(Boolean);
    }, [teamData, localTeamData]);

    const [teamMember, setTeamMember] = useState(defaultTeamMember);
    useEffect(() => setTeamMember(defaultTeamMember), [defaultTeamMember]);

    // Workflow
    const [clientType, setClientType] = useState(initialClientType);

    useEffect(() => {
        setClientType(initialClientType);
    }, [initialClientType]);
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

    const stepsOrder: StepKey[] = useMemo(() => {
        const order: StepKey[] = ['clientInfo'];
        if (!instructionRef) {
            order.push('poidSelection');
        }
        order.push(
            'areaOfWork',
            'practiceArea',
            'description',
            'folderStructure',
            'disputeValue',
            'source',
            'opponentDetails',
            'review'
        );
        return order;
    }, [instructionRef]);

    const filteredPoidData = effectivePoidData.filter((poid) => {
        const term = poidSearchTerm.toLowerCase();
        return (
            poid.poid_id.toLowerCase().includes(term) ||
            (poid.first && poid.first.toLowerCase().includes(term)) ||
            (poid.last && poid.last.toLowerCase().includes(term))
        );
    });

    useEffect(() => {
        const poidIndex = stepsOrder.indexOf('poidSelection');
        if (poidIndex === -1 || openStep !== poidIndex) return;
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
    }, [openStep, filteredPoidData, stepsOrder]);

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

    const isStepComplete = (step: StepKey): boolean => {
        switch (step) {
            case 'clientInfo':
                return !!(selectedDate && supervisingPartner && originatingSolicitor);
            case 'poidSelection':
                return selectedPoidIds.length > 0;
            case 'areaOfWork':
                return !!areaOfWork;
            case 'practiceArea':
                return !!practiceArea;
            case 'description':
                return !!description;
            case 'folderStructure':
                return !!folderStructure;
            case 'disputeValue':
                return !!disputeValue;
            case 'source':
                return !!source && (source !== 'referral' || !!referrerName);
            case 'opponentDetails':
                return Boolean(
                    opponentName &&
                    opponentEmail &&
                    opponentSolicitorName &&
                    opponentSolicitorCompany &&
                    opponentSolicitorEmail &&
                    noConflict
                );
            case 'review':
                return false;
            default:
                return false;
        }
    };

    const stepProgressSteps = useMemo(
        () =>
            stepsOrder.map((key) => ({
                key,
                label: stepTitles[key],
                title: stepTitles[key],
            })),
        [stepsOrder]
    );

    const stepDetails = React.useMemo(() => ({
        clientInfo: (
            <div>
                <div>Date: {selectedDate ? selectedDate.toLocaleDateString() : '-'}</div>
                <div>Supervising: {supervisingPartner || '-'}</div>
                <div>Originating: {originatingSolicitor || '-'}</div>
                <div>Funds: {fundsReceived || '-'}</div>
            </div>
        ),
        poidSelection: <div>IDs: {selectedPoidIds.join(', ') || '-'}</div>,
        areaOfWork: <div>{areaOfWork || '-'}</div>,
        practiceArea: <div>{practiceArea || '-'}</div>,
        description: <div>{description || '-'}</div>,
        folderStructure: <div>{folderStructure || '-'}</div>,
        disputeValue: <div>{disputeValue || '-'}</div>,
        source: (
            <div>
                {source || '-'}
                {source === 'referral' && referrerName ? ` - ${referrerName}` : ''}
            </div>
        ),
        opponentDetails: (
            <div>
                <div>Opponent: {opponentName || '-'}</div>
                <div>Solicitor: {opponentSolicitorName || '-'}</div>
            </div>
        ),
        review: null,
    }), [
        selectedDate,
        supervisingPartner,
        originatingSolicitor,
        fundsReceived,
        selectedPoidIds,
        areaOfWork,
        practiceArea,
        description,
        folderStructure,
        disputeValue,
        source,
        referrerName,
        opponentName,
        opponentSolicitorName,
    ]);

    const renderStepContent = (step: StepKey) => {
        switch (step) {
            case 'clientInfo':
                return (
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
                        fundsReceived={fundsReceived}
                        setFundsReceived={setFundsReceived}
                        isDateCalloutOpen={isDateCalloutOpen}
                        setIsDateCalloutOpen={setIsDateCalloutOpen}
                        dateButtonRef={dateButtonRef}
                        partnerOptions={partnerAndSolicitorOptions}
                        onContinue={() =>
                            setOpenStep(
                                stepsOrder.indexOf('clientInfo') + 1
                            )
                        }
                    />
                );
            case 'poidSelection':
                return (
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
                        onConfirm={() =>
                            setOpenStep(stepsOrder.indexOf('poidSelection') + 1)
                        }
                    />
                );
            case 'areaOfWork':
                return (
                    <AreaOfWorkStep
                        areaOfWork={areaOfWork}
                        setAreaOfWork={setAreaOfWork}
                        onContinue={() =>
                            setOpenStep(stepsOrder.indexOf('areaOfWork') + 1)
                        }
                        getGroupColor={getGroupColor}
                    />
                );
            case 'practiceArea':
                return (
                    <PracticeAreaStep
                        options={areaOfWork && practiceAreasByArea[areaOfWork] ? practiceAreasByArea[areaOfWork] : ['Please select an Area of Work']}
                        practiceArea={practiceArea}
                        setPracticeArea={setPracticeArea}
                        onContinue={() =>
                            setOpenStep(stepsOrder.indexOf('practiceArea') + 1)
                        }
                        groupColor={getGroupColor(areaOfWork)}
                    />
                );
            case 'description':
                return (
                    <DescriptionStep
                        description={description}
                        setDescription={setDescription}
                        onContinue={() =>
                            setOpenStep(stepsOrder.indexOf('description') + 1)
                        }
                    />
                );
            case 'folderStructure':
                return (
                    <FolderStructureStep
                        folderStructure={folderStructure}
                        setFolderStructure={setFolderStructure}
                        onContinue={() =>
                            setOpenStep(stepsOrder.indexOf('folderStructure') + 1)
                        }
                        folderOptions={['Default / Commercial', 'Adjudication', 'Residential Possession', 'Employment']}
                    />
                );
            case 'disputeValue':
                return (
                    <DisputeValueStep
                        disputeValue={disputeValue}
                        setDisputeValue={setDisputeValue}
                        onContinue={() =>
                            setOpenStep(stepsOrder.indexOf('disputeValue') + 1)
                        }
                    />
                );
            case 'source':
                return (
                    <SourceStep
                        source={source}
                        setSource={setSource}
                        referrerName={referrerName}
                        setReferrerName={setReferrerName}
                        onContinue={() =>
                            setOpenStep(stepsOrder.indexOf('source') + 1)
                        }
                    />
                );
            case 'opponentDetails':
                return (
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
                        onContinue={() =>
                            setOpenStep(stepsOrder.indexOf('opponentDetails') + 1)
                        }
                    />
                );
            case 'review':
                return (
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
                        onBuild={() => { }}
                    />
                );
            default:
                return null;
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
            <div className="workflow-main">
                <div className="steps-column">
                    {stepsOrder.map((stepKey, idx) => (
                        <div key={stepKey} className={`step-section${openStep === idx ? ' active' : ''}`}>
                            <StepHeader
                                step={idx + 1}
                                title={stepTitles[stepKey]}
                                complete={isStepComplete(stepKey)}
                                open={openStep === idx}
                                onToggle={() => setOpenStep(openStep === idx ? -1 : idx)}
                            />
                            <div className="step-content">
                                {openStep === idx && renderStepContent(stepKey)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Stack>
        </CompletionProvider>
    );
};

export default NewMatters;
