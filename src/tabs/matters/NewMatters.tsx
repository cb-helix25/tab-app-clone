import React, { useState } from 'react';
import {
  Stack,
  Text,
  PrimaryButton,
  Icon,
  mergeStyles,
  TextField,
} from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';

// Dummy data for proof-of-ID submissions
const dummyIndividuals = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Alice Johnson' },
];

const dummyDirectors = [
  { id: 'd1', name: 'Director One' },
  { id: 'd2', name: 'Director Two' },
  { id: 'd3', name: 'Director Three' },
];

const dummyExistingClients = [
  { id: 'e1', name: 'Existing Client 1' },
  { id: 'e2', name: 'Existing Client 2' },
];

// Style for the big buttons
const buttonStyle = mergeStyles({
  backgroundColor: '#f3f2f1',
  borderRadius: '8px',
  padding: '20px',
  width: '200px',
  height: '150px',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  selectors: {
    ':hover': {
      backgroundColor: '#e1dfdd',
    },
  },
});

// Style for the icons (subtle grey)
const iconStyle = mergeStyles({
  fontSize: '40px',
  color: '#888',
});

const NewMatters: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [clientType, setClientType] = useState<string | null>(null);
  const [existingClientSelection, setExistingClientSelection] = useState<string | null>(null);
  const [clientNameConfirmation, setClientNameConfirmation] = useState<string>('');

  // Render the initial four big buttons
  const renderInitialSelection = () => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
      <Text variant="xLarge">Select Client Type:</Text>
      <Stack horizontal tokens={{ childrenGap: 20 }}>
        <div className={buttonStyle} onClick={() => setClientType('Individual')}>
          <Icon iconName="Contact" className={iconStyle} />
          <Text variant="large">Individual</Text>
        </div>
        <div className={buttonStyle} onClick={() => setClientType('Company')}>
          <Icon iconName="Office" className={iconStyle} />
          <Text variant="large">Company</Text>
        </div>
        <div className={buttonStyle} onClick={() => setClientType('Multiple Individuals')}>
          <Icon iconName="People" className={iconStyle} />
          <Text variant="large">Multiple Individuals</Text>
        </div>
        <div className={buttonStyle} onClick={() => setClientType('Existing Client')}>
          <Icon iconName="CRMCustomerInsights" className={iconStyle} />
          <Text variant="large">Existing Client</Text>
        </div>
      </Stack>
    </Stack>
  );

  // Render dummy data for Individual type
  const renderIndividual = () => (
    <Stack tokens={{ childrenGap: 20 }}>
      <Text variant="xLarge">Proof of ID Submissions (Individual)</Text>
      {dummyIndividuals.map((item) => (
        <div
          key={item.id}
          className={mergeStyles({
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            marginBottom: '10px',
          })}
        >
          <Text>{item.name} – Proof of ID submission</Text>
        </div>
      ))}
      <PrimaryButton text="Back" onClick={() => setClientType(null)} />
    </Stack>
  );

  // Render dummy data for Company type (directors)
  const renderCompany = () => (
    <Stack tokens={{ childrenGap: 20 }}>
      <Text variant="xLarge">Proof of ID Submissions (Company Directors)</Text>
      {dummyDirectors.map((item) => (
        <div
          key={item.id}
          className={mergeStyles({
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            marginBottom: '10px',
          })}
        >
          <Text>{item.name} – Proof of ID submission</Text>
        </div>
      ))}
      <PrimaryButton text="Back" onClick={() => setClientType(null)} />
    </Stack>
  );

  // Render dummy data for Multiple Individuals type with an extra text field
  const renderMultipleIndividuals = () => (
    <Stack tokens={{ childrenGap: 20 }}>
      <Text variant="xLarge">Proof of ID Submissions (Multiple Individuals)</Text>
      {dummyIndividuals.map((item) => (
        <div
          key={item.id}
          className={mergeStyles({
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            marginBottom: '10px',
          })}
        >
          <Text>{item.name} – Proof of ID submission</Text>
        </div>
      ))}
      <TextField
        label="Client name as on file"
        value={clientNameConfirmation}
        onChange={(_, newValue) => setClientNameConfirmation(newValue || '')}
      />
      <PrimaryButton text="Back" onClick={() => setClientType(null)} />
    </Stack>
  );

  // Render dummy data for Existing Client type with an extra selection step
  const renderExistingClient = () => (
    <Stack tokens={{ childrenGap: 20 }}>
      <Text variant="xLarge">Select Existing Client Type:</Text>
      <Stack horizontal tokens={{ childrenGap: 20 }}>
        <PrimaryButton text="Individual" onClick={() => setExistingClientSelection('Individual')} />
        <PrimaryButton text="Company" onClick={() => setExistingClientSelection('Company')} />
      </Stack>
      {existingClientSelection && (
        <>
          <Text variant="xLarge">
            Proof of ID Submissions ({existingClientSelection})
          </Text>
          {dummyExistingClients.map((item) => (
            <div
              key={item.id}
              className={mergeStyles({
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                marginBottom: '10px',
              })}
            >
              <Text>{item.name} – Proof of ID submission</Text>
            </div>
          ))}
        </>
      )}
      <PrimaryButton
        text="Back"
        onClick={() => {
          setClientType(null);
          setExistingClientSelection(null);
        }}
      />
    </Stack>
  );

  // Decide what to render based on the selected client type
  const renderContent = () => {
    switch (clientType) {
      case 'Individual':
        return renderIndividual();
      case 'Company':
        return renderCompany();
      case 'Multiple Individuals':
        return renderMultipleIndividuals();
      case 'Existing Client':
        return renderExistingClient();
      default:
        return renderInitialSelection();
    }
  };

  return (
    <Stack
      tokens={{ childrenGap: 30 }}
      horizontalAlign="center"
      styles={{ root: { padding: '40px', backgroundColor: '#f5f5f5', minHeight: '100vh' } }}
    >
      {renderContent()}
    </Stack>
  );
};

export default NewMatters;
