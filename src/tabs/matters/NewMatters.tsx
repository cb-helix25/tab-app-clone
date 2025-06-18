import React, { useState, useEffect, useRef } from 'react';
import {
  Stack,
  Text,
  PrimaryButton,
  SearchBox,
  mergeStyles,
  Icon,
  DatePicker,
  Callout,
  TextField,
  Toggle,
  Dropdown,
} from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { POID, TeamData } from '../../app/functionality/types';
import PoidCard from './PoidCard';
import { sharedPrimaryButtonStyles } from '../../app/styles/ButtonStyles';
import { colours } from '../../app/styles/colours';
import POIDPreview from './POIDPreview';
import StepHeader from './StepHeader';
import StepProgress from './StepProgress';
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

// Adjusted shared input field styles: less rounded and taller for single-line inputs.
const sharedInputStyles = {
  root: { width: 400 },
  fieldGroup: {
    borderRadius: '4px',
    height: '40px',
    backgroundColor: '#f3f2f1',
    border: `1px solid ${colours.highlight}`,
    display: 'flex',
    alignItems: 'center',
    padding: '0 10px',
  },
  field: {
    fontSize: '16px',
    lineHeight: '40px',
    padding: 0,
    margin: 0,
  },
};

const sharedMultilineInputStyles = {
  root: { width: 400 },
  fieldGroup: {
    borderRadius: '4px',
    backgroundColor: '#f3f2f1',
    border: `1px solid ${colours.highlight}`,
    padding: '10px',
  },
  field: {
    fontSize: '16px',
    padding: 0,
    margin: 0,
  },
};

// Hard-coded practice areas per Area of Work
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

// For Partner/Originating Solicitor (example)
const partnerOptions = ['Alex', 'Jonathan', 'Luke', 'Kanchel'];

// Helper: Return a color for a given area (used for area-of-work buttons)
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

// Extend StepKey with new steps (referral confirmation is now part of source; opponentDetails and riskAssessment added)
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

// Container styles now defined in NewMatters.css
const completedCollapsedCardStyle = mergeStyles({
  backgroundColor: '#fff',
  border: `2px solid ${colours.green}`,
  boxShadow: 'inset 0 0 5px rgba(16,124,16,0.3)',
  borderRadius: 8,
  padding: 15,
  marginBottom: 20,
});
const collapsedCardStyle = mergeStyles({
  backgroundColor: '#fff',
  border: '1px solid #e1dfdd',
  borderRadius: 8,
  padding: 15,
  marginBottom: 20,
  opacity: 0.7,
});
const gridStyle = mergeStyles({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', // Changed from minmax(200px, 1fr)
  gap: 20,
});
const sidePanelStyle = mergeStyles({
  width: 600,
  maxWidth: 600,
  backgroundColor: '#fff',
  border: '1px solid #e1dfdd',
  borderRadius: 8,
  padding: 20,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  position: 'sticky',
  top: 40,
  maxHeight: '80vh',
  overflowY: 'auto',
});

const formContainerStyle = mergeStyles({
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  padding: 20,
  maxWidth: 520,
  margin: '0 auto',
});

// ----- TagButton & Styles -----
const clientTypeButtonStyle = (active: boolean, customColor?: string) => {
  const mainColor = customColor || colours.highlight;
  return mergeStyles({
    borderRadius: '25px',
    padding: '12px 24px',
    fontSize: '18px',
    fontWeight: 700,
    backgroundColor: '#f3f2f1',
    color: active ? mainColor : '#333',
    border: '1px solid #ccc',
    margin: '5px',
    transition: 'background-color 0.3s, box-shadow 0.3s',
    selectors: {
      ':hover': { backgroundColor: '#e1dfdd' },
      ':active': { backgroundColor: '#d0d0d0', transform: 'none' },
    },
    rootPressed: { transform: 'none', margin: '5px' },
  });
};
const tagButtonStyle = (active: boolean, customColor?: string) => {
  const mainColor = customColor || colours.highlight;
  return mergeStyles({
    borderRadius: '20px',
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: active ? mainColor : '#f3f2f1',
    color: active ? '#fff' : '#333',
    border: `1px solid ${mainColor}`,
    margin: '5px',
    transition: 'background-color 0.3s, box-shadow 0.3s',
    selectors: {
      ':hover': { backgroundColor: active ? mainColor : '#e1dfdd' },
      ':active': { backgroundColor: active ? mainColor : '#d0d0d0', transform: 'none' },
    },
    rootPressed: { transform: 'none', margin: '5px' },
  });
};
const TagButton: React.FC<TagButtonProps> = ({
  label,
  icon,
  active,
  onClick,
  styleVariant = 'option',
  color,
}) => {
  const buttonStyle =
    styleVariant === 'clientType'
      ? clientTypeButtonStyle(active, color)
      : tagButtonStyle(active, color);
  return (
    <PrimaryButton
      text={label}
      iconProps={icon ? { iconName: icon } : undefined}
      onClick={onClick}
      styles={{ root: buttonStyle }}
    />
  );
};

// ----- Main NewMatters Component -----
interface NewMattersProps {
  poidData: POID[];
  setPoidData: React.Dispatch<React.SetStateAction<POID[]>>;
  teamData?: TeamData[] | null; // <-- Added teamData prop
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
  const { isDarkMode } = useTheme();

  // Header (client details) state
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [supervisingPartner, setSupervisingPartner] = useState<string>('');
  const [originatingSolicitor, setOriginatingSolicitor] = useState<string>('');
  const [fundsReceived, setFundsReceived] = useState<string>('');

  // State for Date Callout
  const [isDateCalloutOpen, setIsDateCalloutOpen] = useState<boolean>(false);
  const dateButtonRef = useRef<HTMLDivElement | null>(null);

  // Workflow state
  const [currentStep, setCurrentStep] = useState<StepKey>('clientInfo');
  const [clientType, setClientType] = useState<string>('');
  const [selectedPoidIds, setSelectedPoidIds] = useState<string[]>([]);
  const [areaOfWork, setAreaOfWork] = useState<string>('');
  const [practiceArea, setPracticeArea] = useState<string>('');

  // New state variables for additional steps
  const [description, setDescription] = useState<string>('');
  const [folderStructure, setFolderStructure] = useState<string>('');
  const [disputeValue, setDisputeValue] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [referrerName, setReferrerName] = useState<string>('');

  // Opponent details state
  const [opponentName, setOpponentName] = useState<string>('');
  const [opponentEmail, setOpponentEmail] = useState<string>('');
  const [opponentSolicitorName, setOpponentSolicitorName] = useState<string>('');
  const [opponentSolicitorCompany, setOpponentSolicitorCompany] = useState<string>('');
  const [opponentSolicitorEmail, setOpponentSolicitorEmail] = useState<string>('');
  const [noConflict, setNoConflict] = useState<boolean>(false);

  // Risk Assessment state
  const [riskCore, setRiskCore] = useState<RiskCore>({
    clientType: '',
    destinationOfFunds: '',
    fundsType: '',
    clientIntroduced: '',
    limitation: '',
    sourceOfFunds: '',
    valueOfInstruction: '',
  });
  const [consideredClientRisk, setConsideredClientRisk] = useState<boolean>(false);
  const [consideredTransactionRisk, setConsideredTransactionRisk] = useState<boolean>(false);
  const [transactionRiskLevel, setTransactionRiskLevel] = useState<string>('');
  const [consideredFirmWideSanctions, setConsideredFirmWideSanctions] = useState<boolean>(false);
  const [consideredFirmWideAML, setConsideredFirmWideAML] = useState<boolean>(false);
  const [riskDocPreview, setRiskDocPreview] = useState<string | null>(null);
  const riskDocRef = useRef<HTMLDivElement | null>(null);

  // For POID grid lazy loading + search
  const [visiblePoidCount, setVisiblePoidCount] = useState<number>(12);
  const [poidSearchTerm, setPoidSearchTerm] = useState('');
  const poidGridRef = useRef<HTMLDivElement | null>(null);

  const filteredPoidData = poidData.filter((poid) => {
    const term = poidSearchTerm.toLowerCase();
    return (
      poid.poid_id.toLowerCase().includes(term) ||
      (poid.first && poid.first.toLowerCase().includes(term)) ||
      (poid.last && poid.last.toLowerCase().includes(term))
    );
  });

  // Active POID for preview
  const [activePoid, setActivePoid] = useState<POID | null>(null);

  useEffect(() => {
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

  // Toggle POID selection
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

  // ----- [1] Client Info Step -----
  const renderClientInfoStep = () => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center" className={formContainerStyle}>
      <StepHeader title={stepTitles.clientInfo} active />
      <div ref={dateButtonRef} style={{ display: 'inline-block' }}>
        <PrimaryButton
          text={selectedDate ? `Date: ${selectedDate.toLocaleDateString()}` : 'Select Date'}
          onClick={() => setIsDateCalloutOpen(!isDateCalloutOpen)}
          styles={{ root: tagButtonStyle(!!selectedDate, colours.highlight) }}
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
      <PrimaryButton text="Continue" onClick={() => setCurrentStep('clientType')} styles={sharedPrimaryButtonStyles} />
    </Stack>
  );

  // ----- Collapsed Step Summary -----
  const renderCollapsedStep = (step: StepKey) => {
    let summary = 'Not selected';
    let completed = false;
    if (step === 'clientInfo' && selectedDate && supervisingPartner && originatingSolicitor) {
      summary = `${selectedDate.toLocaleDateString()} | ${supervisingPartner} | ${originatingSolicitor} | Funds: ${fundsReceived || 'N/A'}`;
      completed = true;
    }
    if (step === 'clientType' && clientType) {
      summary = clientType;
      completed = true;
    }
    if (step === 'poidSelection' && selectedPoidIds.length > 0) {
      summary = `${selectedPoidIds.length} POID(s) selected`;
      completed = true;
    }
    if (step === 'areaOfWork' && areaOfWork) {
      summary = areaOfWork;
      completed = true;
    }
    if (step === 'practiceArea' && practiceArea) {
      summary = practiceArea;
      completed = true;
    }
    if (step === 'description' && description) {
      summary = description.length > 30 ? description.substring(0, 30) + '...' : description;
      completed = true;
    }
    if (step === 'folderStructure' && folderStructure) {
      summary = folderStructure;
      completed = true;
    }
    if (step === 'disputeValue' && disputeValue) {
      summary = disputeValue;
      completed = true;
    }
    if (step === 'source' && source) {
      summary = source;
      if (source === 'referral' && referrerName) {
        summary += ` | Referrer: ${referrerName}`;
      }
      completed = true;
    }
    if (step === 'opponentDetails' && opponentName && opponentEmail && opponentSolicitorName && opponentSolicitorCompany && opponentSolicitorEmail && noConflict) {
      summary = `Opponent: ${opponentName} (${opponentEmail}) | Solicitor: ${opponentSolicitorName}, ${opponentSolicitorCompany} (${opponentSolicitorEmail}) | No Conflict`;
      completed = true;
    }
    if (
      step === 'riskAssessment' &&
      Object.values(riskCore).every(val => val !== '') &&
      consideredClientRisk &&
      consideredTransactionRisk &&
      transactionRiskLevel !== '' &&
      consideredFirmWideSanctions &&
      consideredFirmWideAML
    ) {
      summary = `Risk Factors: ${JSON.stringify(riskCore)}; Client: Yes; Transaction: ${transactionRiskLevel}; Sanctions: Yes; AML: Yes`;
      completed = true;
    }
    if (step === 'review') {
      summary = 'Review selections';
      completed = true;
    }
    return (
      <Stack
        tokens={{ childrenGap: 8 }}
        className={`${completed ? completedCollapsedCardStyle : collapsedCardStyle} step-section`}
        key={step}
      >
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <StepHeader title={stepTitles[step]} />
          <PrimaryButton text="Edit" onClick={() => setCurrentStep(step)} styles={sharedPrimaryButtonStyles} />
        </Stack>
        <Text>{summary}</Text>
      </Stack>
    );
  };

  // ----- Expanded Steps -----
  const renderExpandedStep = (step: StepKey) => {
    switch (step) {
      case 'clientInfo':
        return renderClientInfoStep();
      case 'clientType':
        return (
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center" className={formContainerStyle}>
            <StepHeader title={stepTitles.clientType} active />
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
                  onClick={() => {
                    setClientType(opt.label);
                    setCurrentStep('poidSelection');
                  }}
                  styleVariant="clientType"
                  color={colours.highlight}
                />
              ))}
            </Stack>
          </Stack>
        );
      case 'poidSelection':
        return (
          <Stack tokens={{ childrenGap: 20 }} className={formContainerStyle}>
            <StepHeader title={stepTitles.poidSelection} active />
            <SearchBox
              placeholder="Search by name or ID..."
              value={poidSearchTerm}
              onChange={(_, newValue) => setPoidSearchTerm(newValue || '')}
              styles={{ root: { width: 400, marginBottom: 20 } }}
            />
            <Stack horizontal tokens={{ childrenGap: 20 }}>
              <div className={gridStyle} ref={poidGridRef} style={{ flex: 1 }}>
                {filteredPoidData.slice(0, visiblePoidCount).map((poid) => (
                  <div
                    key={poid.poid_id}
                    onClick={() => handlePoidClick(poid)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && handlePoidClick(poid)}
                  >
                    <PoidCard
                      poid={poid}
                      selected={selectedPoidIds.includes(poid.poid_id)}
                      onClick={() => handlePoidClick(poid)}
                      teamData={teamData}  // Pass down the teamData prop
                    />
                  </div>
                ))}
              </div>
              <Stack className={sidePanelStyle}>
                <Text variant="xLarge" styles={{ root: { marginBottom: 10 } }}>Preview</Text>
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
                <PrimaryButton
                  text="Confirm POID Selection"
                  onClick={() => setCurrentStep('areaOfWork')}
                  styles={{ root: { ...(sharedPrimaryButtonStyles.root as any), height: 36, padding: '0 12px', fontSize: 14 } }}
                />
              </Stack>
            </Stack>
          </Stack>
        );
      case 'areaOfWork':
        return (
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center" className={formContainerStyle}>
            <StepHeader title={stepTitles.areaOfWork} active />
            <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
              {['Commercial', 'Property', 'Construction', 'Employment'].map((area) => (
                <TagButton
                  key={area}
                  label={area}
                  active={areaOfWork === area}
                  onClick={() => {
                    setAreaOfWork(area);
                    setCurrentStep('practiceArea');
                  }}
                  color={getGroupColor(area)}
                />
              ))}
            </Stack>
          </Stack>
        );
      case 'practiceArea': {
        const options =
          areaOfWork && practiceAreasByArea[areaOfWork]
            ? practiceAreasByArea[areaOfWork]
            : ['Please select an Area of Work'];
        return (
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center" className={formContainerStyle}>
            <StepHeader title={stepTitles.practiceArea} active />
            <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
              {options.map((pa) => (
                <TagButton
                  key={pa}
                  label={pa}
                  active={practiceArea === pa}
                  onClick={() => {
                    setPracticeArea(pa);
                    setCurrentStep('description');
                  }}
                  color={getGroupColor(areaOfWork)}
                />
              ))}
            </Stack>
          </Stack>
        );
      }
      case 'description':
        return (
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center" className={formContainerStyle}>
            <StepHeader title={stepTitles.description} active />
            <TextField
              multiline
              rows={4}
              placeholder="Enter matter description..."
              value={description}
              onChange={(_, newVal) => setDescription(newVal || '')}
              styles={sharedMultilineInputStyles}
            />
            <PrimaryButton text="Continue" onClick={() => setCurrentStep('folderStructure')} styles={sharedPrimaryButtonStyles} />
          </Stack>
        );
      case 'folderStructure': {
        const folderOptions = ['Default / Commercial', 'Adjudication', 'Residential Possession', 'Employment'];
        return (
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center" className={formContainerStyle}>
            <StepHeader title={stepTitles.folderStructure} active />
            <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
              {folderOptions.map((option) => (
                <TagButton
                  key={option}
                  label={option}
                  active={folderStructure === option}
                  onClick={() => { setFolderStructure(option); setCurrentStep('disputeValue'); }}
                  color={colours.highlight}
                />
              ))}
            </Stack>
          </Stack>
        );
      }
      case 'disputeValue': {
        const disputeValueOptions = ['Less than £10k', '£10k - £500k', '£500k - £1m', '£1m - £5m', '£5 - £20m', '£20m+'];
        return (
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center" className={formContainerStyle}>
            <StepHeader title={stepTitles.disputeValue} active />
            <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
              {disputeValueOptions.map((option) => (
                <TagButton
                  key={option}
                  label={option}
                  active={disputeValue === option}
                  onClick={() => { setDisputeValue(option); setCurrentStep('source'); }}
                  color={colours.highlight}
                />
              ))}
            </Stack>
          </Stack>
        );
      }
      case 'source': {
        const sourceOptions = ['referral', 'organic search', 'paid search', 'your following', 'tbc'];
        return (
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center" className={formContainerStyle}>
            <StepHeader title={stepTitles.source} active />
            <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
              {sourceOptions.map((option) => (
                <TagButton
                  key={option}
                  label={option}
                  active={source === option}
                  onClick={() => {
                    setSource(option);
                    if (option !== 'referral') {
                      setReferrerName('');
                      setCurrentStep('opponentDetails');
                    }
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
                styles={sharedInputStyles}
              />
            )}
            {source === 'referral' && (
              <PrimaryButton
                text="Continue"
                onClick={() => {
                  if (source === 'referral' && !referrerName.trim()) return;
                  setCurrentStep('opponentDetails');
                }}
                disabled={source === 'referral' && !referrerName.trim()}
                styles={sharedPrimaryButtonStyles}
              />
            )}
          </Stack>
        );
      }
      case 'opponentDetails': {
        const isOpponentDetailsValid =
          opponentName.trim() !== '' &&
          opponentEmail.trim() !== '' &&
          opponentSolicitorName.trim() !== '' &&
          opponentSolicitorCompany.trim() !== '' &&
          opponentSolicitorEmail.trim() !== '' &&
          noConflict;
        return (
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center" className={formContainerStyle}>
            <StepHeader title={stepTitles.opponentDetails} active />
            <Text variant="medium" styles={{ root: { marginBottom: 10 } }}>Opponent Details:</Text>
            <TextField
              placeholder="Opponent's Name (First and Last)"
              value={opponentName}
              onChange={(_, newVal) => setOpponentName(newVal || '')}
              styles={sharedInputStyles}
            />
            <TextField
              placeholder="Opponent's Email"
              value={opponentEmail}
              onChange={(_, newVal) => setOpponentEmail(newVal || '')}
              styles={sharedInputStyles}
            />
            <Text variant="medium" styles={{ root: { marginTop: 20, marginBottom: 10 } }}>Opponent Solicitor Details:</Text>
            <TextField
              placeholder="Solicitor's Name (First and Last)"
              value={opponentSolicitorName}
              onChange={(_, newVal) => setOpponentSolicitorName(newVal || '')}
              styles={sharedInputStyles}
            />
            <TextField
              placeholder="Solicitor's Company Name"
              value={opponentSolicitorCompany}
              onChange={(_, newVal) => setOpponentSolicitorCompany(newVal || '')}
              styles={sharedInputStyles}
            />
            <TextField
              placeholder="Solicitor's Email"
              value={opponentSolicitorEmail}
              onChange={(_, newVal) => setOpponentSolicitorEmail(newVal || '')}
              styles={sharedInputStyles}
            />
            <Toggle
              label="Conflict of Interest"
              onText="There is no Conflict of Interest"
              offText="There is a Conflict of Interest"
              checked={noConflict}
              onChange={(_, checked) => setNoConflict(!!checked)}
            />
            <PrimaryButton text="Continue" onClick={() => setCurrentStep('riskAssessment')} disabled={!isOpponentDetailsValid} styles={sharedPrimaryButtonStyles} />
          </Stack>
        );
      }
      case 'riskAssessment': {
        const riskOptions = [
          { key: '1', text: '1' },
          { key: '2', text: '2' },
          { key: '3', text: '3' },
        ];
        const isRiskAssessmentValid =
          Object.values(riskCore).every(val => val !== '') &&
          consideredClientRisk &&
          consideredTransactionRisk &&
          transactionRiskLevel !== '' &&
          consideredFirmWideSanctions &&
          consideredFirmWideAML;
        return (
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center" className={formContainerStyle}>
            <StepHeader title={stepTitles.riskAssessment} active />
            <Stack horizontal tokens={{ childrenGap: 40 }}>
              {/* Left Column: Core Risk Factors */}
              <Stack tokens={{ childrenGap: 15 }} styles={{ root: { width: 300 } }}>
                <Text variant="mediumPlus">Core Risk Factors</Text>
                <Dropdown
                  label="Client Type"
                  placeholder="Select option"
                  options={riskOptions}
                  selectedKey={riskCore.clientType}
                  onChange={(_, option) => setRiskCore({ ...riskCore, clientType: option?.key as string })}
                />
                <Dropdown
                  label="Destination of Funds"
                  placeholder="Select option"
                  options={riskOptions}
                  selectedKey={riskCore.destinationOfFunds}
                  onChange={(_, option) => setRiskCore({ ...riskCore, destinationOfFunds: option?.key as string })}
                />
                <Dropdown
                  label="Funds Type"
                  placeholder="Select option"
                  options={riskOptions}
                  selectedKey={riskCore.fundsType}
                  onChange={(_, option) => setRiskCore({ ...riskCore, fundsType: option?.key as string })}
                />
                <Dropdown
                  label="How was Client Introduced?"
                  placeholder="Select option"
                  options={riskOptions}
                  selectedKey={riskCore.clientIntroduced}
                  onChange={(_, option) => setRiskCore({ ...riskCore, clientIntroduced: option?.key as string })}
                />
                <Dropdown
                  label="Limitation"
                  placeholder="Select option"
                  options={riskOptions}
                  selectedKey={riskCore.limitation}
                  onChange={(_, option) => setRiskCore({ ...riskCore, limitation: option?.key as string })}
                />
                <Dropdown
                  label="Source of Funds"
                  placeholder="Select option"
                  options={riskOptions}
                  selectedKey={riskCore.sourceOfFunds}
                  onChange={(_, option) => setRiskCore({ ...riskCore, sourceOfFunds: option?.key as string })}
                />
                <Dropdown
                  label="Value of Instruction"
                  placeholder="Select option"
                  options={riskOptions}
                  selectedKey={riskCore.valueOfInstruction}
                  onChange={(_, option) => setRiskCore({ ...riskCore, valueOfInstruction: option?.key as string })}
                />
              </Stack>
              {/* Right Column: Client/Transaction Assessments & AML */}
              <Stack tokens={{ childrenGap: 15 }} styles={{ root: { width: 300 } }}>
                <Text variant="mediumPlus">Client/Transaction Assessments & AML</Text>
                <Toggle
                  label="I have considered client risk factors"
                  checked={consideredClientRisk}
                  onChange={(_, checked) => setConsideredClientRisk(!!checked)}
                />
                {!consideredClientRisk && (
                  <Text
                    variant="small"
                    styles={{ root: { color: colours.highlight, textDecoration: 'underline', cursor: 'pointer' } }}
                    onClick={(e) => { setRiskDocPreview('client'); riskDocRef.current = e.currentTarget as HTMLDivElement; }}
                  >
                    For the Client Risk Assessment, click here.
                  </Text>
                )}
                <Toggle
                  label="I have considered transaction risk factors"
                  checked={consideredTransactionRisk}
                  onChange={(_, checked) => setConsideredTransactionRisk(!!checked)}
                />
                {!consideredTransactionRisk && (
                  <Text
                    variant="small"
                    styles={{ root: { color: colours.highlight, textDecoration: 'underline', cursor: 'pointer' } }}
                    onClick={(e) => { setRiskDocPreview('transaction'); riskDocRef.current = e.currentTarget as HTMLDivElement; }}
                  >
                    For the Transaction Risk Assessment, click here.
                  </Text>
                )}
                {consideredTransactionRisk && (
                  <Dropdown
                    label="Transaction Risk Level"
                    placeholder="Select risk level"
                    options={[
                      { key: 'Low Risk', text: 'Low Risk' },
                      { key: 'Medium Risk', text: 'Medium Risk' },
                      { key: 'High Risk', text: 'High Risk' },
                    ]}
                    selectedKey={transactionRiskLevel}
                    onChange={(_, option) => setTransactionRiskLevel(option?.key as string)}
                  />
                )}
                <Toggle
                  label="I have considered the Firm Wide Sanctions Risk Assessment"
                  checked={consideredFirmWideSanctions}
                  onChange={(_, checked) => setConsideredFirmWideSanctions(!!checked)}
                />
                {!consideredFirmWideSanctions && (
                  <Text
                    variant="small"
                    styles={{ root: { color: colours.highlight, textDecoration: 'underline', cursor: 'pointer' } }}
                    onClick={(e) => { setRiskDocPreview('sanctions'); riskDocRef.current = e.currentTarget as HTMLDivElement; }}
                  >
                    For the Firm Wide Sanctions Risk Assessment, click here.
                  </Text>
                )}
                <Toggle
                  label="I have considered the Firm Wide AML policy"
                  checked={consideredFirmWideAML}
                  onChange={(_, checked) => setConsideredFirmWideAML(!!checked)}
                />
                {!consideredFirmWideAML && (
                  <Text
                    variant="small"
                    styles={{ root: { color: colours.highlight, textDecoration: 'underline', cursor: 'pointer' } }}
                    onClick={(e) => { setRiskDocPreview('aml'); riskDocRef.current = e.currentTarget as HTMLDivElement; }}
                  >
                    For the Firm Wide AML Policy, click here.
                  </Text>
                )}
              </Stack>
            </Stack>
            <PrimaryButton text="Continue" onClick={() => setCurrentStep('review')} disabled={!isRiskAssessmentValid} styles={sharedPrimaryButtonStyles} />
            {riskDocPreview && riskDocRef.current && (
              <Callout target={riskDocRef.current} onDismiss={() => setRiskDocPreview(null)} setInitialFocus>
                <div style={{ padding: 20 }}>
                  <Text variant="medium">
                    {riskDocPreview === 'client' && "Dummy preview for Client Risk Assessment."}
                    {riskDocPreview === 'transaction' && "Dummy preview for Transaction Risk Assessment."}
                    {riskDocPreview === 'sanctions' && "Dummy preview for Firm Wide Sanctions Risk Assessment."}
                    {riskDocPreview === 'aml' && "Dummy preview for Firm Wide AML Policy."}
                  </Text>
                  <PrimaryButton text="Close" onClick={() => setRiskDocPreview(null)} styles={sharedPrimaryButtonStyles} />
                </div>
              </Callout>
            )}
          </Stack>
        );
      }
      case 'review':
        return (
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center" className={formContainerStyle}>
            <StepHeader title={stepTitles.review} active />
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
              {source === 'referral' && (
                <>
                  <strong>Referrer's Name</strong>: {referrerName || 'N/A'} <br />
                </>
              )}
              <strong>Opponent Details</strong>: <br />
              Opponent: {opponentName || 'N/A'} ({opponentEmail || 'N/A'}) <br />
              Opponent Solicitor: {opponentSolicitorName || 'N/A'} - {opponentSolicitorCompany || 'N/A'} ({opponentSolicitorEmail || 'N/A'}) <br />
              <strong>Conflict of Interest</strong>: {noConflict ? 'There is no Conflict of Interest' : 'There is a Conflict of Interest'} <br /><br />
              <strong>Risk Assessment</strong>:<br />
              Core Risk Factors: {JSON.stringify(riskCore)} <br />
              Client Risk: {consideredClientRisk ? 'Yes' : 'No'} <br />
              Transaction Risk: {consideredTransactionRisk ? transactionRiskLevel : 'No'} <br />
              Firm Wide Sanctions: {consideredFirmWideSanctions ? 'Yes' : 'No'} <br />
              AML: {consideredFirmWideAML ? 'Yes' : 'No'} <br />
            </Text>
            <PrimaryButton
              text="Build Matter"
              onClick={() =>
                console.log('Matter built with', {
                  selectedDate,
                  supervisingPartner,
                  originatingSolicitor,
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
                  opponentEmail,
                  opponentSolicitorName,
                  opponentSolicitorCompany,
                  opponentSolicitorEmail,
                  noConflict,
                  fundsReceived,
                  riskCore,
                  consideredClientRisk,
                  consideredTransactionRisk,
                  transactionRiskLevel,
                  consideredFirmWideSanctions,
                  consideredFirmWideAML,
                })
              }
              styles={sharedPrimaryButtonStyles}
            />
          </Stack>
        );
      default:
        return null;
    }
  };

  // Render main with updated steps order including riskAssessment
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
  const stepOrderIndex = (step: StepKey): number => stepsOrder.indexOf(step);

  return (
    <Stack className="new-matter-container">
      <StepProgress
        steps={stepProgressSteps}
        current={currentStep}
        onStepClick={setCurrentStep}
      />
      {stepsOrder.map((step) =>
        stepOrderIndex(step) < stepOrderIndex(currentStep)
          ? renderCollapsedStep(step)
          : step === currentStep
            ? (
              <div key={step} className="step-content">
                {renderExpandedStep(step)}
              </div>
            )
          : null
      )}
    </Stack>
  );
};

export default NewMatters;
