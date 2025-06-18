import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Stack,
  Text,
  PrimaryButton,
  SearchBox,
  DatePicker,
  Callout,
  TextField,
  Toggle,
  Dropdown,
} from '@fluentui/react';
import { POID, TeamData } from '../../app/functionality/types';
import PoidCard from './PoidCard';
import POIDPreview from './POIDPreview';
import StepHeader from './StepHeader';
import StepProgress from './StepProgress';
import ClientDetails from './ClientDetails';
import ClientHub from './ClientHub';
import { colours } from '../../app/styles/colours';
import { sharedPrimaryButtonStyles } from '../../app/styles/ButtonStyles';
import '../../app/styles/NewMatters.css';

// Components for individual steps
import TagButton from './MatterOpening/TagButton';
import ClientInfoStep from './MatterOpening/ClientInfoStep';
import ClientTypeStep from './MatterOpening/ClientTypeStep';
import PoidSelectionStep from './MatterOpening/PoidSelectionStep';
import AreaOfWorkStep from './MatterOpening/AreaOfWorkStep';
import PracticeAreaStep from './MatterOpening/PracticeAreaStep';
import DescriptionStep from './MatterOpening/DescriptionStep';
import FolderStructureStep from './MatterOpening/FolderStructureStep';
import DisputeValueStep from './MatterOpening/DisputeValueStep';
import SourceStep from './MatterOpening/SourceStep';
import OpponentDetailsStep from './MatterOpening/OpponentDetailsStep';
import RiskAssessmentStep from './MatterOpening/RiskAssessmentStep';
import ReviewStep from './MatterOpening/ReviewStep';

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

const partnerOptions = ['Alex', 'Jonathan', 'Luke', 'Kanchel'];

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

type StepKey =
  | 'clientInfo'
  | 'clientType'
  | 'poidSelection'
  | 'areaOfWork'
  | 'practiceArea'
  | 'description'
  | 'folderStructure'
  | 'disputeValue'
  | 'source'
  | 'opponentDetails'
  | 'riskAssessment'
  | 'review';

const stepTitles: { [key in StepKey]: string } = {
  clientInfo: 'Main Details',
  clientType: 'Select Client Type',
  poidSelection: 'Choose Proof of Identity',
  areaOfWork: 'Select Area of Work',
  practiceArea: 'Select Practice Area',
  description: 'Enter Description',
  folderStructure: 'Select NetDocuments Folder Structure',
  disputeValue: 'Select Value of the Dispute',
  source: 'Select Source & Confirm Referrer (if applicable)',
  opponentDetails: 'Confirm Opponent Details',
  riskAssessment: 'Risk Assessment',
  review: 'Review & Build Matter',
};

interface NewMattersProps {
  poidData: POID[];
  setPoidData: React.Dispatch<React.SetStateAction<POID[]>>;
  teamData?: TeamData[] | null;
}

interface RiskCore {
  clientType: string;
  destinationOfFunds: string;
  fundsType: string;
  clientIntroduced: string;
  limitation: string;
  sourceOfFunds: string;
  valueOfInstruction: string;
}

const NewMatters: React.FC<NewMattersProps> = ({ poidData, setPoidData, teamData }) => {
  const [openStep, setOpenStep] = useState<number>(0);

  // Client info
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [supervisingPartner, setSupervisingPartner] = useState('');
  const [originatingSolicitor, setOriginatingSolicitor] = useState('');
  const [fundsReceived, setFundsReceived] = useState('');
  const [isDateCalloutOpen, setIsDateCalloutOpen] = useState(false);
  const dateButtonRef = useRef<HTMLDivElement | null>(null);

  // Workflow
  const [clientType, setClientType] = useState('');
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

  const [riskCore, setRiskCore] = useState<RiskCore>({
    clientType: '',
    destinationOfFunds: '',
    fundsType: '',
    clientIntroduced: '',
    limitation: '',
    sourceOfFunds: '',
    valueOfInstruction: '',
  });
  const [consideredClientRisk, setConsideredClientRisk] = useState(false);
  const [consideredTransactionRisk, setConsideredTransactionRisk] = useState(false);
  const [transactionRiskLevel, setTransactionRiskLevel] = useState('');
  const [consideredFirmWideSanctions, setConsideredFirmWideSanctions] = useState(false);
  const [consideredFirmWideAML, setConsideredFirmWideAML] = useState(false);

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
    if (openStep !== 2) return;
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
  }, [openStep, filteredPoidData]);

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

  const isStepComplete = (step: StepKey): boolean => {
    switch (step) {
      case 'clientInfo':
        return !!(selectedDate && supervisingPartner && originatingSolicitor);
      case 'clientType':
        return !!clientType;
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
      case 'riskAssessment':
        return (
          Object.values(riskCore).every((v) => v !== '') &&
          consideredClientRisk &&
          consideredTransactionRisk &&
          transactionRiskLevel !== '' &&
          consideredFirmWideSanctions &&
          consideredFirmWideAML
        );
      case 'review':
        return false;
      default:
        return false;
    }
  };

  const stepsOrder: StepKey[] = [
    'clientInfo',
    'clientType',
    'poidSelection',
    'areaOfWork',
    'practiceArea',
    'description',
    'folderStructure',
    'disputeValue',
    'source',
    'opponentDetails',
    'riskAssessment',
    'review',
  ];

  const stepProgressSteps = stepsOrder.map((key) => ({ key, label: stepTitles[key] }));

  const stepDetails = React.useMemo(() => ({
    clientInfo: (
      <div>
        <div>Date: {selectedDate ? selectedDate.toLocaleDateString() : '-'}</div>
        <div>Supervising: {supervisingPartner || '-'}</div>
        <div>Originating: {originatingSolicitor || '-'}</div>
        <div>Funds: {fundsReceived || '-'}</div>
      </div>
    ),
    clientType: <div>Type: {clientType || '-'}</div>,
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
    riskAssessment: <div>Risk: {transactionRiskLevel || '-'}</div>,
    review: null,
  }), [
    selectedDate,
    supervisingPartner,
    originatingSolicitor,
    fundsReceived,
    clientType,
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
    transactionRiskLevel,
  ]);

  const renderStepContent = (step: StepKey) => {

    switch (step) {
      case 'clientInfo':
        return (
          <ClientInfoStep
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
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
            onContinue={() => setOpenStep(1)}
          />
        );
      case 'clientType':
        return (
          <ClientTypeStep
            clientType={clientType}
            setClientType={setClientType}
            onContinue={() => setOpenStep(2)}
          />
        );
      case 'poidSelection':
        return (
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
            onConfirm={() => setOpenStep(3)}
          />
        );
      case 'areaOfWork':
        return (
          <AreaOfWorkStep
            areaOfWork={areaOfWork}
            setAreaOfWork={setAreaOfWork}
            onContinue={() => setOpenStep(4)}
            getGroupColor={getGroupColor}
          />
        );
      case 'practiceArea':
        return (
          <PracticeAreaStep
            options={areaOfWork && practiceAreasByArea[areaOfWork] ? practiceAreasByArea[areaOfWork] : ['Please select an Area of Work']}
            practiceArea={practiceArea}
            setPracticeArea={setPracticeArea}
            onContinue={() => setOpenStep(5)}
            groupColor={getGroupColor(areaOfWork)}
          />
        );
      case 'description':
        return (
          <DescriptionStep
            description={description}
            setDescription={setDescription}
            onContinue={() => setOpenStep(6)}
          />
        );
      case 'folderStructure':
        return (
          <FolderStructureStep
            folderStructure={folderStructure}
            setFolderStructure={setFolderStructure}
            onContinue={() => setOpenStep(7)}
            folderOptions={['Default / Commercial', 'Adjudication', 'Residential Possession', 'Employment']}
          />
        );
      case 'disputeValue':
        return (
          <DisputeValueStep
            disputeValue={disputeValue}
            setDisputeValue={setDisputeValue}
            onContinue={() => setOpenStep(8)}
          />
        );
      case 'source':
        return (
          <SourceStep
            source={source}
            setSource={setSource}
            referrerName={referrerName}
            setReferrerName={setReferrerName}
            onContinue={() => setOpenStep(9)}
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
            onContinue={() => setOpenStep(10)}
          />
        );
      case 'riskAssessment':
        return (
          <RiskAssessmentStep
            riskCore={riskCore}
            setRiskCore={setRiskCore}
            consideredClientRisk={consideredClientRisk}
            setConsideredClientRisk={setConsideredClientRisk}
            consideredTransactionRisk={consideredTransactionRisk}
            setConsideredTransactionRisk={setConsideredTransactionRisk}
            transactionRiskLevel={transactionRiskLevel}
            setTransactionRiskLevel={setTransactionRiskLevel}
            consideredFirmWideSanctions={consideredFirmWideSanctions}
            setConsideredFirmWideSanctions={setConsideredFirmWideSanctions}
            consideredFirmWideAML={consideredFirmWideAML}
            setConsideredFirmWideAML={setConsideredFirmWideAML}
            onContinue={() => setOpenStep(11)}
            isStepComplete={() => isStepComplete('riskAssessment')}
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
            riskCore={riskCore}
            consideredClientRisk={consideredClientRisk}
            consideredTransactionRisk={consideredTransactionRisk}
            transactionRiskLevel={transactionRiskLevel}
            consideredFirmWideSanctions={consideredFirmWideSanctions}
            consideredFirmWideAML={consideredFirmWideAML}
            onBuild={() => console.log('Matter built')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Stack className="workflow-container">
      <StepProgress
        steps={stepProgressSteps}
        current={stepsOrder[openStep]}
        onStepClick={(key) => setOpenStep(stepsOrder.indexOf(key))}
      />
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
    </Stack>
  );
};

export default NewMatters;