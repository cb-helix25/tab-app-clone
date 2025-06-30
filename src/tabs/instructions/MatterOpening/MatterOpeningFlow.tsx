import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Stack } from '@fluentui/react';
import StepHeader from '../StepHeader';
import StepProgress from '../StepProgress';
import StepOverview from '../StepOverview';
import { POID, TeamData } from '../../../app/functionality/types';
import ClientDetails from '../ClientDetails';
import ClientHub from '../ClientHub';
import {
    practiceAreasByArea,
    getGroupColor,
    stepTitles,
    StepKey,
    partnerOptions,
} from './config';

// Import step components
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



const getTeamMemberOptions = (teamData?: TeamData[] | null) => {
    if (teamData) {
        return teamData.map((t) => t.Nickname || t.First || '').filter(Boolean);
    }
    return [] as string[];
};


interface MatterOpeningFlowProps {
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


const MatterOpeningFlow: React.FC<MatterOpeningFlowProps> = ({
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
    const [currentStep, setCurrentStep] = useState<StepKey>('clientInfo');

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

    // Step state definitions (same as in old component)
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [supervisingPartner, setSupervisingPartner] = useState('');
    const [originatingSolicitor, setOriginatingSolicitor] = useState('');
    const [fundsReceived, setFundsReceived] = useState('');
    const [isDateCalloutOpen, setIsDateCalloutOpen] = useState(false);
    const dateButtonRef = useRef<HTMLDivElement | null>(null);
    const teamMemberOptions = useMemo(() => getTeamMemberOptions(teamData), [teamData]);
    const defaultTeamMember = useMemo(() => {
        if (teamData && teamData.length > 0) {
            const found = teamData.find(
                (t) => (t.Initials || '').toLowerCase() === userInitials.toLowerCase()
            );
            if (found) {
                return found.Nickname || found.First || '';
            }
            const first = teamData[0];
            return first.Nickname || first.First || '';
        }
        return '';
    }, [teamData, userInitials]);
    const [teamMember, setTeamMember] = useState(defaultTeamMember);
    useEffect(() => setTeamMember(defaultTeamMember), [defaultTeamMember]);
    const [clientType, setClientType] = useState(initialClientType);
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

    React.useEffect(() => {
        if (currentStep !== 'poidSelection') return;
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
    }, [currentStep, filteredPoidData]);

    // Move to next step in order
    const goToNext = () => {
        const idx = stepsOrder.indexOf(currentStep);
        if (idx < stepsOrder.length - 1) {
            setCurrentStep(stepsOrder[idx + 1]);
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

    // Step render helpers
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
                        partnerOptions={partnerOptions}
                        onContinue={goToNext}
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
                        handlePoidClick={(poid) => {
                            if (selectedPoidIds.includes(poid.poid_id)) {
                                setSelectedPoidIds((prev) => prev.filter((id) => id !== poid.poid_id));
                            } else {
                                setSelectedPoidIds((prev) => [...prev, poid.poid_id]);
                            }
                        }}
                        onConfirm={goToNext}
                    />
                );
            case 'areaOfWork':
                return (
                    <AreaOfWorkStep
                        areaOfWork={areaOfWork}
                        setAreaOfWork={setAreaOfWork}
                        onContinue={goToNext}
                        getGroupColor={getGroupColor}
                    />
                );
            case 'practiceArea':
                return (
                    <PracticeAreaStep
                        options={areaOfWork ? practiceAreasByArea[areaOfWork] : ['Please select an Area of Work']}
                        practiceArea={practiceArea}
                        setPracticeArea={setPracticeArea}
                        onContinue={goToNext}
                        groupColor={getGroupColor(areaOfWork)}
                    />
                );
            case 'description':
                return (
                    <DescriptionStep
                        description={description}
                        setDescription={setDescription}
                        onContinue={goToNext}
                    />
                );
            case 'folderStructure':
                return (
                    <FolderStructureStep
                        folderStructure={folderStructure}
                        setFolderStructure={setFolderStructure}
                        onContinue={goToNext}
                        folderOptions={['Default / Commercial', 'Adjudication', 'Residential Possession', 'Employment']}
                    />
                );
            case 'disputeValue':
                return (
                    <DisputeValueStep
                        disputeValue={disputeValue}
                        setDisputeValue={setDisputeValue}
                        onContinue={goToNext}
                    />
                );
            case 'source':
                return (
                    <SourceStep
                        source={source}
                        setSource={setSource}
                        referrerName={referrerName}
                        setReferrerName={setReferrerName}
                        onContinue={goToNext}
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
                        onContinue={goToNext}
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

    const stepProgressSteps = useMemo(
        () =>
            stepsOrder.map((key) => ({
                key,
                label: stepTitles[key],
                title: stepTitles[key],
            })),
        [stepsOrder]
    );

    const stepDetails = useMemo(() => ({
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
                    <StepProgress steps={stepProgressSteps} current={currentStep} />
                    <div className="steps-column">
                        {stepsOrder.map((stepKey, idx) => {
                            const open = stepKey === currentStep;
                            const locked = stepsOrder.indexOf(currentStep) < idx && !isStepComplete(stepKey);
                            return (
                                <div key={stepKey} className={`step-section${open ? ' active' : ''}`}>
                                    <StepHeader
                                        step={idx + 1}
                                        title={stepTitles[stepKey]}
                                        complete={isStepComplete(stepKey)}
                                        open={open}
                                        hideToggle
                                        onToggle={() => setCurrentStep(stepKey)}
                                        locked={idx > stepsOrder.indexOf(currentStep)}
                                    />
                                    <div className="step-content">
                                        {open && renderStepContent(stepKey)}
                                    </div>
                                    {!open && (
                                        <div className="step-summary">{stepDetails[stepKey]}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <StepOverview
                        steps={stepProgressSteps}
                        current={currentStep}
                        isStepComplete={isStepComplete}
                        details={stepDetails as any}
                        onStepClick={(k: StepKey) => setCurrentStep(k)}
                    />
                </div>
            </Stack>
        </CompletionProvider>
    );
};

export default MatterOpeningFlow;
