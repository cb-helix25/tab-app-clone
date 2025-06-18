import React, { useState, useEffect, useRef } from 'react';
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
  mergeStyles,
} from '@fluentui/react';
import { POID, TeamData } from '../../app/functionality/types';
import PoidCard from './PoidCard';
import POIDPreview from './POIDPreview';
import StepHeader from './StepHeader';
import StepProgress from './StepProgress';
import { colours } from '../../app/styles/colours';
import { sharedPrimaryButtonStyles } from '../../app/styles/ButtonStyles';
import '../../app/styles/NewMatters.css';

// Export (or define) TagButtonProps at the top so it’s available.
export interface TagButtonProps {
  label: string;
  icon?: string;
  active: boolean;
  onClick: () => void;
  styleVariant?: 'clientType' | 'option';
  color?: string;
}

const clientTypeButtonStyle = (active: boolean, customColor?: string) => ({
  borderRadius: '25px',
  padding: '12px 24px',
  fontSize: '18px',
  fontWeight: 700,
  backgroundColor: '#f3f2f1',
  color: active ? customColor || colours.highlight : '#333',
  border: '1px solid #ccc',
  margin: '5px',
});

const tagButtonStyle = (active: boolean, customColor?: string) => ({
  borderRadius: '20px',
  padding: '10px 20px',
  fontSize: '16px',
  fontWeight: 600,
  backgroundColor: active ? customColor || colours.highlight : '#f3f2f1',
  color: active ? '#fff' : '#333',
  border: `1px solid ${customColor || colours.highlight}`,
  margin: '5px',
});

const TagButton: React.FC<TagButtonProps> = ({
  label,
  icon,
  active,
  onClick,
  styleVariant = 'option',
  color,
}) => {
  const style = styleVariant === 'clientType'
    ? clientTypeButtonStyle(active, color)
    : tagButtonStyle(active, color);
  return (
    <PrimaryButton
      text={label}
      iconProps={icon ? { iconName: icon } : undefined}
      onClick={onClick}
      styles={{ root: style as any }}
    />
  );
};

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

// Container styles
const containerStyle = mergeStyles({
  padding: '40px',
  backgroundColor: colours.grey,
  minHeight: '100vh',
  transition: 'background-color 0.3s',
});
const expandedCardStyle = mergeStyles({
  background: 'linear-gradient(135deg, #ffffff 0%, #f3f2f1 100%)',
  border: '1px solid #e1dfdd',
  borderRadius: 8,
  padding: 30,
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s, box-shadow 0.3s',
  marginBottom: 30,
});
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

  const renderClientInfo = () => (
    <Stack tokens={{ childrenGap: 20 }}>
      <div ref={dateButtonRef}>

        <PrimaryButton
          text={selectedDate ? `Date: ${selectedDate.toLocaleDateString()}` : 'Select Date'}
          onClick={() => setIsDateCalloutOpen(!isDateCalloutOpen)}
          styles={{ root: tagButtonStyle(!!selectedDate, colours.highlight) as any }}
        />
        {isDateCalloutOpen && (
          <Callout target={dateButtonRef.current} onDismiss={() => setIsDateCalloutOpen(false)} setInitialFocus>
            <DatePicker
              value={selectedDate || undefined}
              onSelectDate={(date) => {
                if (date) setSelectedDate(date);
                setIsDateCalloutOpen(false);
              }}
              styles={{ root: { margin: 8, width: 200 } }}
            />
          </Callout>
        )}
      </div>
      <Stack>
        <Text variant="mediumPlus" style={{ marginBottom: 6 }}>Select Supervising Partner</Text>
        <Stack horizontal wrap tokens={{ childrenGap: 10 }}>
          {partnerOptions.map((name) => (
            <TagButton key={name} label={name} active={supervisingPartner === name} onClick={() => setSupervisingPartner(name)} color={colours.highlight} />
          ))}
        </Stack>
      </Stack>
      <Stack>
        <Text variant="mediumPlus" style={{ marginBottom: 6 }}>Select Originating Solicitor</Text>
        <Stack horizontal wrap tokens={{ childrenGap: 10 }}>
          {partnerOptions.map((name) => (
            <TagButton key={name} label={name} active={originatingSolicitor === name} onClick={() => setOriginatingSolicitor(name)} color={colours.highlight} />
          ))}
        </Stack>
      </Stack>
      <Stack>
        <Text variant="mediumPlus" style={{ marginBottom: 6 }}>Have funds on account been received?</Text>
        <Stack horizontal wrap tokens={{ childrenGap: 10 }}>
          {['Yes', 'No', 'Not Required'].map((option) => (
            <TagButton key={option} label={option} active={fundsReceived === option} onClick={() => setFundsReceived(option)} color={colours.highlight} />
          ))}
        </Stack>
      </Stack>
      <PrimaryButton text="Continue" onClick={() => setOpenStep(1)} styles={sharedPrimaryButtonStyles} />
    </Stack>
  );

  const renderClientType = () => (
    <Stack tokens={{ childrenGap: 20 }}>
      <Stack horizontal wrap tokens={{ childrenGap: 20 }} horizontalAlign="center">
        {[
          { label: 'Individual', icon: 'Contact' },
          { label: 'Company', icon: 'CityNext' },
          { label: 'Multiple Individuals', icon: 'People' },
          { label: 'Existing Client', icon: 'Folder' },
        ].map((opt) => (
          <TagButton
            key={opt.label}
            label={opt.label}
            icon={opt.icon}
            active={clientType === opt.label}
            onClick={() => { setClientType(opt.label); setOpenStep(2); }}
            styleVariant="clientType"
            color={colours.highlight}
          />
        ))}
      </Stack>
    </Stack>
  );

  const renderPoidSelection = () => (
    <Stack tokens={{ childrenGap: 20 }}>
      <SearchBox
        placeholder="Search by name or ID..."
        value={poidSearchTerm}
        onChange={(_, newValue) => setPoidSearchTerm(newValue || '')}
        styles={{ root: { width: 400, marginBottom: 20 } }}
      />
      <Stack horizontal tokens={{ childrenGap: 20 }}>
        <div style={{ flex: 1 }} className="grid" ref={poidGridRef as any}>
          {filteredPoidData.slice(0, visiblePoidCount).map((poid) => (
            <div key={poid.poid_id} onClick={() => handlePoidClick(poid)} role="button" tabIndex={0}>
              <PoidCard poid={poid} selected={selectedPoidIds.includes(poid.poid_id)} onClick={() => handlePoidClick(poid)} teamData={teamData} />
            </div>
          ))}
        </div>
        <Stack tokens={{ childrenGap: 8 }} styles={{ root: { width: 260 } }}>
          <Text variant="mediumPlus" styles={{ root: { marginBottom: 10 } }}>Preview</Text>
          {selectedPoidIds.length === 0 ? (
            <Text variant="small">No POIDs selected.</Text>
          ) : (
            filteredPoidData
              .filter((poid) => selectedPoidIds.includes(poid.poid_id))
              .map((poid) => (
                <div key={poid.poid_id} style={{ borderBottom: '1px solid #e1dfdd', paddingBottom: 8, marginBottom: 8 }}>
                  <POIDPreview poid={poid} />
                </div>
              ))
          )}
          <PrimaryButton text="Confirm POID Selection" onClick={() => setOpenStep(3)} styles={{ root: { ...(sharedPrimaryButtonStyles.root as any), height: 36, padding: '0 12px', fontSize: 14 } }} />
        </Stack>
      </Stack>
    </Stack>
  );

  const renderAreaOfWork = () => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
      <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
        {['Commercial', 'Property', 'Construction', 'Employment'].map((area) => (
          <TagButton
            key={area}
            label={area}
            active={areaOfWork === area}
            onClick={() => { setAreaOfWork(area); setOpenStep(4); }}
            color={getGroupColor(area)}
          />
        ))}
      </Stack>
    </Stack>
  );

  const renderPracticeArea = () => {
    const options = areaOfWork && practiceAreasByArea[areaOfWork] ? practiceAreasByArea[areaOfWork] : ['Please select an Area of Work'];
    return (
      <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
          {options.map((pa) => (
            <TagButton
              key={pa}
              label={pa}
              active={practiceArea === pa}
              onClick={() => { setPracticeArea(pa); setOpenStep(5); }}
              color={getGroupColor(areaOfWork)}
            />
          ))}
        </Stack>
      </Stack>
    );
  };

  const renderDescription = () => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
      <TextField
        multiline
        rows={4}
        placeholder="Enter matter description..."
        value={description}
        onChange={(_, newVal) => setDescription(newVal || '')}
        styles={{ root: { width: 400 } }}
      />
      <PrimaryButton text="Continue" onClick={() => setOpenStep(6)} styles={sharedPrimaryButtonStyles} />
    </Stack>
  );

  const renderFolderStructure = () => {
    const folderOptions = ['Default / Commercial', 'Adjudication', 'Residential Possession', 'Employment'];
    return (
      <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
          {folderOptions.map((option) => (
            <TagButton
              key={option}
              label={option}
              active={folderStructure === option}
              onClick={() => { setFolderStructure(option); setOpenStep(7); }}
              color={colours.highlight}
            />
          ))}
        </Stack>
      </Stack>
    );
  };

  const renderDisputeValue = () => {
    const disputeValueOptions = ['Less than £10k', '£10k - £500k', '£500k - £1m', '£1m - £5m', '£5 - £20m', '£20m+'];
    return (
      <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
          {disputeValueOptions.map((option) => (
            <TagButton
              key={option}
              label={option}
              active={disputeValue === option}
              onClick={() => { setDisputeValue(option); setOpenStep(8); }}
              color={colours.highlight}
            />
          ))}
        </Stack>
      </Stack>
    );
  };

  const renderSource = () => {
    const sourceOptions = ['referral', 'organic search', 'paid search', 'your following', 'tbc'];
    return (
      <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
          {sourceOptions.map((option) => (
            <TagButton
              key={option}
              label={option}
              active={source === option}
              onClick={() => {
                setSource(option);
                if (option !== 'referral') setReferrerName('');
              }}
              color={colours.highlight}
            />
          ))}
        </Stack>
        {source === 'referral' && (
          <TextField
            placeholder="Enter referrer's name"
            value={referrerName}
            onChange={(_, newVal) => setReferrerName(newVal || '')}
            styles={{ root: { width: 400 } }}
          />
        )}
        <PrimaryButton
          text="Continue"
          onClick={() => setOpenStep(9)}
          disabled={source === 'referral' && !referrerName.trim()}
          styles={sharedPrimaryButtonStyles}
        />
      </Stack>
    );
  };

  const renderOpponentDetails = () => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
      <TextField placeholder="Opponent Name" value={opponentName} onChange={(_, v) => setOpponentName(v || '')} styles={{ root: { width: 400 } }} />
      <TextField placeholder="Opponent Email" value={opponentEmail} onChange={(_, v) => setOpponentEmail(v || '')} styles={{ root: { width: 400 } }} />
      <TextField placeholder="Opponent Solicitor" value={opponentSolicitorName} onChange={(_, v) => setOpponentSolicitorName(v || '')} styles={{ root: { width: 400 } }} />
      <TextField placeholder="Solicitor Company" value={opponentSolicitorCompany} onChange={(_, v) => setOpponentSolicitorCompany(v || '')} styles={{ root: { width: 400 } }} />
      <TextField placeholder="Solicitor Email" value={opponentSolicitorEmail} onChange={(_, v) => setOpponentSolicitorEmail(v || '')} styles={{ root: { width: 400 } }} />
      <Toggle label="No Conflict of Interest" checked={noConflict} onChange={(_, val) => setNoConflict(!!val)} />
      <PrimaryButton text="Continue" onClick={() => setOpenStep(10)} disabled={!noConflict} styles={sharedPrimaryButtonStyles} />
    </Stack>
  );

  const riskOptions = [
    { key: 'Low', text: 'Low' },
    { key: 'Medium', text: 'Medium' },
    { key: 'High', text: 'High' },
  ];

  const renderRiskAssessment = () => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
      <Stack horizontal tokens={{ childrenGap: 40 }}>
        <Stack tokens={{ childrenGap: 15 }} styles={{ root: { width: 300 } }}>
          <Dropdown label="Client Type" placeholder="Select option" options={riskOptions} selectedKey={riskCore.clientType} onChange={(_, o) => setRiskCore({ ...riskCore, clientType: o?.key as string })} />
          <Dropdown label="Destination of Funds" placeholder="Select option" options={riskOptions} selectedKey={riskCore.destinationOfFunds} onChange={(_, o) => setRiskCore({ ...riskCore, destinationOfFunds: o?.key as string })} />
          <Dropdown label="Funds Type" placeholder="Select option" options={riskOptions} selectedKey={riskCore.fundsType} onChange={(_, o) => setRiskCore({ ...riskCore, fundsType: o?.key as string })} />
          <Dropdown label="How was Client Introduced?" placeholder="Select option" options={riskOptions} selectedKey={riskCore.clientIntroduced} onChange={(_, o) => setRiskCore({ ...riskCore, clientIntroduced: o?.key as string })} />
          <Dropdown label="Limitation" placeholder="Select option" options={riskOptions} selectedKey={riskCore.limitation} onChange={(_, o) => setRiskCore({ ...riskCore, limitation: o?.key as string })} />
          <Dropdown label="Source of Funds" placeholder="Select option" options={riskOptions} selectedKey={riskCore.sourceOfFunds} onChange={(_, o) => setRiskCore({ ...riskCore, sourceOfFunds: o?.key as string })} />
          <Dropdown label="Value of Instruction" placeholder="Select option" options={riskOptions} selectedKey={riskCore.valueOfInstruction} onChange={(_, o) => setRiskCore({ ...riskCore, valueOfInstruction: o?.key as string })} />
        </Stack>
        <Stack tokens={{ childrenGap: 15 }} styles={{ root: { width: 300 } }}>
          <Toggle label="I have considered client risk factors" checked={consideredClientRisk} onChange={(_, c) => setConsideredClientRisk(!!c)} />
          <Toggle label="I have considered transaction risk factors" checked={consideredTransactionRisk} onChange={(_, c) => setConsideredTransactionRisk(!!c)} />
          {consideredTransactionRisk && (
            <Dropdown
              label="Transaction Risk Level"
              placeholder="Select risk level"
              options={[{ key: 'Low Risk', text: 'Low Risk' }, { key: 'Medium Risk', text: 'Medium Risk' }, { key: 'High Risk', text: 'High Risk' }]}
              selectedKey={transactionRiskLevel}
              onChange={(_, o) => setTransactionRiskLevel(o?.key as string)}
            />
          )}
          <Toggle label="I have considered the Firm Wide Sanctions Risk Assessment" checked={consideredFirmWideSanctions} onChange={(_, c) => setConsideredFirmWideSanctions(!!c)} />
          <Toggle label="I have considered the Firm Wide AML policy" checked={consideredFirmWideAML} onChange={(_, c) => setConsideredFirmWideAML(!!c)} />
        </Stack>
      </Stack>
      <PrimaryButton text="Continue" onClick={() => setOpenStep(11)} disabled={!isStepComplete('riskAssessment')} styles={sharedPrimaryButtonStyles} />
    </Stack>
  );

  const renderReview = () => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
      <Text variant="medium">
        <strong>Client Details</strong>:<br />
        Date: {selectedDate?.toLocaleDateString() || 'N/A'} <br />
        Supervising Partner: {supervisingPartner || 'N/A'} <br />
        Originating Solicitor: {originatingSolicitor || 'N/A'} <br />
        Funds: {fundsReceived || 'N/A'}<br /><br />
        <strong>Client Type</strong>: {clientType || 'N/A'} <br />
        <strong>POID(s)</strong>: {selectedPoidIds.join(', ') || 'None'} <br />
        <strong>Area of Work</strong>: {areaOfWork || 'N/A'} <br />
        <strong>Practice Area</strong>: {practiceArea || 'N/A'} <br />
        <strong>Description</strong>: {description || 'N/A'} <br />
        <strong>Folder Structure</strong>: {folderStructure || 'N/A'} <br />
        <strong>Dispute Value</strong>: {disputeValue || 'N/A'} <br />
        <strong>Source</strong>: {source || 'N/A'} <br />
        {source === 'referral' && <><strong>Referrer's Name</strong>: {referrerName || 'N/A'} <br /></>}
        <strong>Opponent Details</strong>: <br />
        Opponent: {opponentName || 'N/A'} ({opponentEmail || 'N/A'}) <br />
        Opponent Solicitor: {opponentSolicitorName || 'N/A'} - {opponentSolicitorCompany || 'N/A'} ({opponentSolicitorEmail || 'N/A'}) <br />
        <strong>Conflict of Interest</strong>: {noConflict ? 'There is no Conflict of Interest' : 'There is a Conflict of Interest'} <br /><br />
        <strong>Risk Assessment</strong>:<br />
        Core Risk Factors: {JSON.stringify(riskCore)} <br />
        Client Risk: {consideredClientRisk ? 'Yes' : 'No'} <br />
        Transaction Risk: {consideredTransactionRisk ? transactionRiskLevel : 'No'} <br />
        Firm Wide Sanctions: {consideredFirmWideSanctions ? 'Yes' : 'No'}<br />
        AML: {consideredFirmWideAML ? 'Yes' : 'No'} <br />
      </Text>
      <PrimaryButton text="Build Matter" onClick={() => console.log('Matter built')} styles={sharedPrimaryButtonStyles} />
    </Stack>
  );

  const renderStepContent = (step: StepKey) => {

    switch (step) {
      case 'clientInfo':
        return renderClientInfo();
      case 'clientType':
        return renderClientType();
      case 'poidSelection':
        return renderPoidSelection();
      case 'areaOfWork':
        return renderAreaOfWork();
      case 'practiceArea':
        return renderPracticeArea();
      case 'description':
        return renderDescription();
      case 'folderStructure':
        return renderFolderStructure();
      case 'disputeValue':
        return renderDisputeValue();
      case 'source':
        return renderSource();
      case 'opponentDetails':
        return renderOpponentDetails();
      case 'riskAssessment':
        return renderRiskAssessment();
      case 'review':
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <Stack className={containerStyle}>
      <StepProgress steps={stepProgressSteps} current={stepsOrder[openStep]} onStepClick={(key) => setOpenStep(stepsOrder.indexOf(key))} />
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
