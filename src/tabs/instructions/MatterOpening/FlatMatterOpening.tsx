import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stack } from '@fluentui/react';
import { POID, TeamData } from '../../../app/functionality/types';
import ClientDetails from '../ClientDetails';
import ClientHub from '../ClientHub';
import { colours } from '../../../app/styles/colours';
import '../../../app/styles/NewMatters.css';

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

const practiceAreasByArea: { [key: string]: string[] } = {
    Commercial: [
        'Commercial',
        'Director Rights & Dispute Advice',
        'Shareholder Rights & Dispute Advice',
        'Civil/Commercial Fraud Advice',
        'Partnership Advice',
        'Business Contract Dispute',
        'Unpaid Loan Recovery',
        'Contentious Probate',
        'Statutory Demand - Drafting',
        'Statutory Demand - Advising',
        'Winding Up Petition Advice',
        'Bankruptcy Petition Advice',
        'Injunction Advice',
        'Intellectual Property',
        'Professional Negligence',
        'Unpaid Invoice/Debt Dispute',
        'Commercial Contract - Drafting',
        'Company Restoration',
        'Small Claim Advice',
        'Trust Advice',
        'Terms and Conditions - Drafting',
    ],
    Construction: [
        'Final Account Recovery',
        'Retention Recovery Advice',
        'Adjudication Advice & Dispute',
        'Construction Contract Advice',
        'Interim Payment Recovery',
        'Contract Dispute',
    ],
    Property: [
        'Landlord & Tenant – Commercial Dispute',
        'Landlord & Tenant – Residential Dispute',
        'Boundary and Nuisance Advice',
        'Trust of Land (Tolata) Advice',
        'Service Charge Recovery & Dispute Advice',
        'Breach of Lease Advice',
        'Terminal Dilapidations Advice',
        'Investment Sale and Ownership – Advice',
        'Trespass',
        'Right of Way',
    ],
    Employment: [
        'Employment Contract - Drafting',
        'Employment Retainer Instruction',
        'Settlement Agreement - Drafting',
        'Settlement Agreement - Advising',
        'Handbook - Drafting',
        'Policy - Drafting',
        'Redundancy - Advising',
        'Sick Leave - Advising',
        'Disciplinary - Advising',
        'Restrictive Covenant Advice',
        'Post Termination Dispute',
        'Employment Tribunal Claim - Advising',
    ],
};


const getGroupColor = (group: string): string => {
    switch (group) {
        case 'Commercial':
            return colours.highlight;
        case 'Construction':
            return colours.orange;
        case 'Property':
            return colours.green;
        case 'Employment':
            return colours.yellow;
        default:
            return colours.red;
    }
};

interface FlatMatterOpeningProps {
    poidData: POID[];
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

    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const defaultPartnerOptions = ['Alex', 'Jonathan', 'Brendan', 'Laura', 'Sam'];
    const partnerOptions = useMemo(() => {
        if (teamData) {
            const names = teamData
                .filter((t) => (t.Role || '').toLowerCase().includes('partner'))
                .map((t) => t.Nickname || t.First || '')
                .filter(Boolean);
            return names.length ? names : defaultPartnerOptions;
        }
        return defaultPartnerOptions;
    }, [teamData]);

    const teamMemberOptions = useMemo(() => {
        if (teamData) {
            return teamData.map((t) => t.Nickname || t.First || '').filter(Boolean);
        }
        return [] as string[];
    }, [teamData]);

    const defaultTeamMember = useMemo(() => {
        if (teamData) {
            const found = teamData.find(
                (t) => (t.Initials || '').toLowerCase() === userInitials.toLowerCase()
            );
            return found?.Nickname || found?.First || '';
        }
        return '';
    }, [teamData, userInitials]);

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

    const filteredPoidData = poidData.filter((poid) => {
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
                const remaining = poidData.find((p) => selectedPoidIds.includes(p.poid_id) && p.poid_id !== poid.poid_id);
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
                <div className="workflow-main">
                    <div className="steps-column">
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
                            onContinue={() => { }}
                        />
                        <div className="form-separator" />
                        <PoidSelectionStep
                            poidData={poidData}
                            teamData={teamData}
                            filteredPoidData={filteredPoidData}
                            visiblePoidCount={visiblePoidCount}
                            selectedPoidIds={selectedPoidIds}
                            poidSearchTerm={poidSearchTerm}
                            setPoidSearchTerm={setPoidSearchTerm}
                            poidGridRef={poidGridRef}
                            handlePoidClick={handlePoidClick}
                            onConfirm={() => { }}
                        />
                        <div className="form-separator" />
                        <AreaOfWorkStep
                            areaOfWork={areaOfWork}
                            setAreaOfWork={setAreaOfWork}
                            onContinue={() => { }}
                            getGroupColor={getGroupColor}
                        />
                        <div className="form-separator" />
                        <PracticeAreaStep
                            options={areaOfWork && practiceAreasByArea[areaOfWork] ? practiceAreasByArea[areaOfWork] : ['Please select an Area of Work']}
                            practiceArea={practiceArea}
                            setPracticeArea={setPracticeArea}
                            onContinue={() => { } } groupColor={''}                        />
                        <div className="form-separator" />
                        <DescriptionStep
                            description={description}
                            setDescription={setDescription}
                            onContinue={() => { }}
                        />
                        <div className="form-separator" />
                        <FolderStructureStep
                            folderStructure={folderStructure}
                            setFolderStructure={setFolderStructure}
                            onContinue={() => { }}
                            folderOptions={['Default / Commercial', 'Adjudication', 'Residential Possession', 'Employment']}
                        />
                        <div className="form-separator" />
                        <DisputeValueStep
                            disputeValue={disputeValue}
                            setDisputeValue={setDisputeValue}
                            onContinue={() => { }}
                        />
                        <div className="form-separator" />
                        <SourceStep
                            source={source}
                            setSource={setSource}
                            referrerName={referrerName}
                            setReferrerName={setReferrerName}
                            onContinue={() => { }}
                        />
                        <div className="form-separator" />
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
                            onContinue={() => { }}
                        />
                        <div className="form-separator" />
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
                    </div>
                </div>
            </Stack>
        </CompletionProvider>
    );
};

export default FlatMatterOpening;
