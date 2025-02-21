// src/tabs/matters/NewMatters.tsx
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
} from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { POID } from '../../app/functionality/types';
import PoidCard from './PoidCard';
import { sharedPrimaryButtonStyles } from '../../app/styles/ButtonStyles';
import { colours } from '../../app/styles/colours'; // <-- Import your colours file

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
      // previously #0078d4, now using highlight
      return colours.highlight;
    case 'Construction':
      // previously #ff8c00 → colours.orange
      return colours.orange;
    case 'Property':
      // previously #107c10 → colours.green
      return colours.green;
    case 'Employment':
      // previously #ffb900 → use colours.yellow (#ffd54f)
      return colours.yellow;
    default:
      // previously #d13438 → use colours.red
      return colours.red;
  }
};

// Step keys
type StepKey = 'clientInfo' | 'clientType' | 'poidSelection' | 'areaOfWork' | 'practiceArea' | 'review';
const stepTitles: { [key in StepKey]: string } = {
  clientInfo: 'Main Details',
  clientType: 'Select Client Type',
  poidSelection: 'Choose Proof of Identity',
  areaOfWork: 'Select Area of Work',
  practiceArea: 'Select Practice Area',
  review: 'Review & Build Matter',
};

// Container styles
const containerStyle = mergeStyles({
  padding: '40px',
  backgroundColor: '#f5f5f5',
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
// For completed (collapsed) steps, give a "pressed" look
const completedCollapsedCardStyle = mergeStyles({
  backgroundColor: '#fff',
  border: `2px solid ${colours.green}`, // green highlight if you want, or keep #107c10
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

// Grid style for POID cards
const gridStyle = mergeStyles({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 20,
});

// Increase side preview panel width
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

// ----- TagButton & Styles -----
interface TagButtonProps {
  label: string;
  icon?: string;
  active: boolean;
  onClick: () => void;
  styleVariant?: 'clientType' | 'option';
  color?: string;
}

// For big "clientType" buttons
const clientTypeButtonStyle = (active: boolean, customColor?: string) => {
  const mainColor = customColor || colours.highlight; // fallback to highlight
  return mergeStyles({
    borderRadius: '25px',
    padding: '12px 24px',
    fontSize: '18px',
    fontWeight: 700,
    backgroundColor: '#f3f2f1',
    color: active ? mainColor : '#333',
    border: '1px solid #ccc',
    margin: '0 10px 10px 0',
    transition: 'background-color 0.3s, box-shadow 0.3s',
    selectors: {
      ':hover': {
        backgroundColor: '#e1dfdd',
      },
      ':active': {
        backgroundColor: '#d0d0d0',
      },
    },
  });
};

// For normal "option" style tag buttons
const tagButtonStyle = (active: boolean, customColor?: string) => {
  const mainColor = customColor || colours.highlight; // fallback to highlight
  return mergeStyles({
    borderRadius: '20px',
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: active ? mainColor : '#f3f2f1',
    color: active ? '#fff' : '#333',
    border: `1px solid ${mainColor}`,
    margin: '0 10px 10px 0',
    transition: 'background-color 0.3s, box-shadow 0.3s',
    selectors: {
      ':hover': {
        backgroundColor: active ? mainColor : '#e1dfdd',
      },
      // Using the same highlight for pressed state. If you want a darker color,
      // define it in colours.ts (e.g., colours.light.hoverBackground) and use that.
      ':active': {
        backgroundColor: active ? mainColor : '#d0d0d0',
      },
    },
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

// ----- POIDPreview Component -----
interface POIDPreviewProps {
  poid: POID;
}
const fieldTagStyle = mergeStyles({
  backgroundColor: '#f3f2f1',
  border: '1px solid #e1dfdd',
  borderRadius: '12px',
  padding: '4px 8px',
  display: 'inline-flex',
  alignItems: 'center',
  marginRight: '6px',
  marginBottom: '6px',
});
const fieldLabelStyle = mergeStyles({
  fontWeight: 600,
  marginRight: '4px',
});
const fieldValueStyle = mergeStyles({
  color: '#333',
  wordBreak: 'break-word',
  maxWidth: '100%',
});

const POIDPreview: React.FC<POIDPreviewProps> = ({ poid }) => {
  const sections = [
    {
      title: 'Identity Info',
      fields: [
        { key: 'poid_id', label: 'POID ID' },
        { key: 'type', label: 'Type' },
        { key: 'terms_acceptance', label: 'Terms' },
        { key: 'check_result', label: 'Result' },
        { key: 'check_id', label: 'Check ID' },
        { key: 'stage', label: 'Stage' },
      ],
    },
    {
      title: 'Personal Info',
      fields: [
        { key: 'prefix', label: 'Prefix' },
        { key: 'first', label: 'First Name' },
        { key: 'last', label: 'Last Name' },
        { key: 'gender', label: 'Gender' },
        { key: 'date_of_birth', label: 'DOB' },
        { key: 'nationality', label: 'Nationality' },
        { key: 'nationality_iso', label: 'ISO' },
      ],
    },
    {
      title: 'Contact Info',
      fields: [
        { key: 'best_number', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'poc', label: 'POC' },
      ],
    },
    {
      title: 'Document Info',
      fields: [
        { key: 'submission_url', label: 'Submission URL' },
        { key: 'submission_date', label: 'Submission Date' },
        { key: 'id_docs_folder', label: 'Docs Folder' },
        { key: 'additional_id_submission_id', label: 'Addl ID' },
        { key: 'additional_id_submission_url', label: 'Addl URL' },
        { key: 'additional_id_submission_date', label: 'Addl Date' },
      ],
    },
    {
      title: 'Address',
      fields: [
        { key: 'house_building_number', label: 'House/Building' },
        { key: 'street', label: 'Street' },
        { key: 'city', label: 'City' },
        { key: 'county', label: 'County' },
        { key: 'post_code', label: 'Post Code' },
        { key: 'country', label: 'Country' },
        { key: 'country_code', label: 'Country Code' },
      ],
    },
    {
      title: 'Company Info',
      fields: [
        { key: 'company_name', label: 'Company Name' },
        { key: 'company_number', label: 'Company Number' },
        { key: 'company_house_building_number', label: 'Building' },
        { key: 'company_street', label: 'Street' },
        { key: 'company_city', label: 'City' },
        { key: 'company_county', label: 'County' },
        { key: 'company_post_code', label: 'Post Code' },
        { key: 'company_country', label: 'Country' },
        { key: 'company_country_code', label: 'Code' },
      ],
    },
    {
      title: 'Other Info',
      fields: [
        { key: 'client_id', label: 'Client ID' },
        { key: 'related_client_id', label: 'Related Client' },
        { key: 'matter_id', label: 'Matter ID' },
        { key: 'risk_assessor', label: 'Risk Assessor' },
        { key: 'risk_assessment_date', label: 'Risk Date' },
      ],
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xLarge" styles={{ root: { marginBottom: 10 } }}>Preview</Text>
      {sections.map((section) => (
        <Stack key={section.title} tokens={{ childrenGap: 8 }}>
          <Text
            variant="mediumPlus"
            styles={{ root: { fontWeight: 600, borderBottom: '1px solid #e1dfdd', paddingBottom: 4 } }}
          >
            {section.title}
          </Text>
          <Stack tokens={{ childrenGap: 4 }} horizontal wrap>
            {section.fields.map(({ key, label }) => {
              const value = poid[key as keyof POID];
              if (!value) return null;
              return (
                <div key={key} className={fieldTagStyle}>
                  <span className={fieldLabelStyle}>{label}:</span>
                  <span className={fieldValueStyle}>{String(value)}</span>
                </div>
              );
            })}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
};

// ----- Main NewMatters Component -----
interface NewMattersProps {
  poidData: POID[];
  setPoidData: React.Dispatch<React.SetStateAction<POID[]>>;
}

const NewMatters: React.FC<NewMattersProps> = ({ poidData }) => {
  const { isDarkMode } = useTheme();

  // Header (client details) state
  // Prefill the date to current day
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

  // Active POID for preview (if multiple selected, they're stacked)
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
        const remaining = poidData.find(
          (p) => selectedPoidIds.includes(p.poid_id) && p.poid_id !== poid.poid_id
        );
        setActivePoid(remaining || null);
      }
    } else {
      setSelectedPoidIds((prev) => [...prev, poid.poid_id]);
      setActivePoid(poid);
    }
  };

  // ----- [1] Client Info Step -----
  const renderClientInfoStep = () => {
    return (
      <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <Text variant="xLarge">{stepTitles.clientInfo}</Text>

        {/* Date selection as a tag-like button + Callout */}
        <div ref={dateButtonRef} style={{ display: 'inline-block' }}>
          <PrimaryButton
            text={
              selectedDate
                ? `Date: ${selectedDate.toLocaleDateString()}`
                : 'Select Date'
            }
            onClick={() => setIsDateCalloutOpen(!isDateCalloutOpen)}
            styles={{ root: tagButtonStyle(!!selectedDate, colours.highlight) }}
          />
          {isDateCalloutOpen && (
            <Callout
              target={dateButtonRef.current}
              onDismiss={() => setIsDateCalloutOpen(false)}
              setInitialFocus
            >
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

        {/* Supervising Partner */}
        <Stack>
          <Text variant="mediumPlus" style={{ marginBottom: 6 }}>Select Supervising Partner</Text>
          <Stack horizontal wrap tokens={{ childrenGap: 10 }}>
            {partnerOptions.map((name) => (
              <TagButton
                key={name}
                label={name}
                active={supervisingPartner === name}
                onClick={() => setSupervisingPartner(name)}
                color={colours.highlight}
              />
            ))}
          </Stack>
        </Stack>

        {/* Originating Solicitor */}
        <Stack>
          <Text variant="mediumPlus" style={{ marginBottom: 6 }}>Select Originating Solicitor</Text>
          <Stack horizontal wrap tokens={{ childrenGap: 10 }}>
            {partnerOptions.map((name) => (
              <TagButton
                key={name}
                label={name}
                active={originatingSolicitor === name}
                onClick={() => setOriginatingSolicitor(name)}
                color={colours.highlight}
              />
            ))}
          </Stack>
        </Stack>

        {/* Funds Received */}
        <Stack>
          <Text variant="mediumPlus" style={{ marginBottom: 6 }}>Have funds on account been received?</Text>
          <Stack horizontal wrap tokens={{ childrenGap: 10 }}>
            {['Yes', 'No', 'Not Required'].map((option) => (
              <TagButton
                key={option}
                label={option}
                active={fundsReceived === option}
                onClick={() => setFundsReceived(option)}
                color={colours.highlight}
              />
            ))}
          </Stack>
        </Stack>

        {/* Continue Button */}
        <PrimaryButton
          text="Continue"
          onClick={() => setCurrentStep('clientType')}
          styles={sharedPrimaryButtonStyles}
        />
      </Stack>
    );
  };

  // ----- Collapsed Step Summary -----
  const renderCollapsedStep = (step: StepKey) => {
    let summary = 'Not selected';
    let completed = false;

    if (step === 'clientInfo') {
      if (selectedDate && supervisingPartner && originatingSolicitor) {
        summary =
          `${selectedDate.toLocaleDateString()} | ` +
          `${supervisingPartner} | ` +
          `${originatingSolicitor} | ` +
          `Funds: ${fundsReceived || 'N/A'}`;
        completed = true;
      }
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
    if (step === 'review') {
      summary = 'Review selections';
      completed = true;
    }

    return (
      <Stack
        tokens={{ childrenGap: 8 }}
        className={completed ? completedCollapsedCardStyle : collapsedCardStyle}
        key={step}
      >
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <Text variant="large">{stepTitles[step]}</Text>
          <PrimaryButton
            text="Edit"
            onClick={() => setCurrentStep(step)}
            styles={sharedPrimaryButtonStyles}
          />
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
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
            <Text variant="xLarge">{stepTitles.clientType}</Text>
            <Stack horizontal wrap tokens={{ childrenGap: 20 }} horizontalAlign="center">
              {[
                { label: 'Individual', icon: 'Contact' },
                { label: 'Company', icon: 'Office' },
                { label: 'Multiple Individuals', icon: 'People' },
                { label: 'Existing Client', icon: 'CRMCustomerInsights' },
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
          <Stack tokens={{ childrenGap: 20 }}>
            <Text variant="xLarge">{stepTitles.poidSelection}</Text>
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
                      <div
                        key={poid.poid_id}
                        style={{
                          borderBottom: '1px solid #e1dfdd',
                          paddingBottom: 8,
                          marginBottom: 8,
                        }}
                      >
                        <POIDPreview poid={poid} />
                      </div>
                    ))
                )}
                <PrimaryButton
                  text="Confirm POID Selection"
                  onClick={() => setCurrentStep('areaOfWork')}
                  styles={{
                    root: {
                      ...(sharedPrimaryButtonStyles.root as any),
                      height: 36,
                      padding: '0 12px',
                      fontSize: 14,
                    },
                  }}
                />
              </Stack>
            </Stack>
          </Stack>
        );

      case 'areaOfWork':
        return (
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
            <Text variant="xLarge">{stepTitles.areaOfWork}</Text>
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
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
            <Text variant="xLarge">{stepTitles.practiceArea}</Text>
            <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
              {options.map((pa) => (
                <TagButton
                  key={pa}
                  label={pa}
                  active={practiceArea === pa}
                  onClick={() => {
                    setPracticeArea(pa);
                    setCurrentStep('review');
                  }}
                  color={getGroupColor(areaOfWork)}
                />
              ))}
            </Stack>
          </Stack>
        );
      }

      case 'review':
        return (
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
            <Text variant="xLarge">{stepTitles.review}</Text>
            <Text variant="medium">
              <strong>Client Details</strong>:<br />
              Date: {selectedDate?.toLocaleDateString() || 'N/A'} <br />
              Supervising Partner: {supervisingPartner || 'N/A'} <br />
              Originating Solicitor: {originatingSolicitor || 'N/A'} <br />
              Funds: {fundsReceived || 'N/A'}
              <br />
              <br />
              <strong>Client Type</strong>: {clientType || 'N/A'} <br />
              <strong>POID(s)</strong>: {selectedPoidIds.join(', ') || 'None'} <br />
              <strong>Area of Work</strong>: {areaOfWork || 'N/A'} <br />
              <strong>Practice Area</strong>: {practiceArea || 'N/A'}
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
                  fundsReceived,
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

  // Render main
  const stepsOrder: StepKey[] = [
    'clientInfo',
    'clientType',
    'poidSelection',
    'areaOfWork',
    'practiceArea',
    'review',
  ];
  const stepOrderIndex = (step: StepKey): number => stepsOrder.indexOf(step);

  return (
    <Stack className={containerStyle}>
      {stepsOrder.map((step) =>
        stepOrderIndex(step) < stepOrderIndex(currentStep)
          ? renderCollapsedStep(step)
          : step === currentStep
          ? <div key={step} className={expandedCardStyle}>{renderExpandedStep(step)}</div>
          : null
      )}
    </Stack>
  );
};

export default NewMatters;
