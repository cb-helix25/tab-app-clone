import React, { useState } from 'react';
import {
  Stack,
  Text,
  Toggle,
  PrimaryButton,
  DefaultButton,
  IconButton,
  mergeStyles,
} from '@fluentui/react';
import BubbleTextField from '../../../app/styles/BubbleTextField';
import { TextField } from '@fluentui/react';
import { useTheme } from '../../../app/functionality/ThemeContext';
import { Enquiry } from '../../../app/functionality/types';
import { colours } from '../../../app/styles/colours';
import {
  sharedPrimaryButtonStyles,
  sharedDefaultButtonStyles,
} from '../../../app/styles/ButtonStyles';
import {
  amountContainerStyle,
  amountInputStyle,
  prefixStyle,
  toggleStyle,
} from '../../../CustomForms/BespokeForms';

interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface DealCaptureFormProps {
  enquiry: Enquiry;
  onSubmit: (data: {
    serviceDescription: string;
    amount: number;
    isMultiClient: boolean;
    clients: ClientInfo[];
  }) => void;
  onCancel: () => void;
}

const DealCaptureForm: React.FC<DealCaptureFormProps> = ({ enquiry, onSubmit, onCancel }) => {
  const { isDarkMode } = useTheme();
  const [serviceDescription, setServiceDescription] = useState(enquiry.Type_of_Work || '');
  const [amount, setAmount] = useState('');
  const [isMultiClient, setIsMultiClient] = useState(false);
  const [clients, setClients] = useState<ClientInfo[]>([{ firstName: '', lastName: '', email: '' }]);
  const [error, setError] = useState<string | null>(null);

  const cardStyle = mergeStyles({
    background: isDarkMode
      ? `linear-gradient(135deg, ${colours.dark.cardBackground}, ${colours.dark.sectionBackground})`
      : `linear-gradient(135deg, ${colours.light.cardBackground}, ${colours.light.sectionBackground})`,
    borderRadius: '12px',
    boxShadow: isDarkMode
      ? '0 4px 12px rgba(255, 255, 255, 0.1)'
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
    padding: '20px',
  });

  const handleAmountChange = (_: any, value?: string) => {
    const numeric = value ? value.replace(/[^0-9]/g, '') : '';
    const num = numeric ? parseInt(numeric, 10) : 0;
    const rounded = Math.round(num / 50) * 50;
    const formatted = rounded ? `£${rounded.toLocaleString('en-GB')}` : '';
    setAmount(formatted);
  };

  const addClient = () => {
    setClients((prev) => [...prev, { firstName: '', lastName: '', email: '' }]);
  };

  const handleClientChange = (index: number, field: keyof ClientInfo, value: string) => {
    setClients((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const handleConfirm = () => {
    if (!serviceDescription || !amount) {
      setError('Service description and amount are required');
      return;
    }
    const numeric = amount.replace(/[^0-9]/g, '');
    const parsed = parseFloat(numeric);
    if (isNaN(parsed)) {
      setError('Amount must be a number');
      return;
    }
    setError(null);
    onSubmit({ serviceDescription, amount: parsed, isMultiClient, clients });
  };

  return (
    <div className={cardStyle}>
      <Stack tokens={{ childrenGap: 12 }}>
        {error && <Text style={{ color: 'red' }}>{error}</Text>}
        <Text>Area of Work: {enquiry.Area_of_Work}</Text>
        <Text>Prospect ID: {enquiry.ID}</Text>
        <BubbleTextField
          value={serviceDescription}
          onChange={(_, v) => setServiceDescription(v || '')}
          placeholder="Service Description"
          ariaLabel="Service Description"
          isDarkMode={isDarkMode || false}
          multiline
        />
        <div className={amountContainerStyle}>
          <span className={prefixStyle}>£</span>
          <TextField
            value={amount.replace(/^£/, '')}
            onChange={handleAmountChange}
            type="text"
            styles={{ fieldGroup: amountInputStyle(true) }}
          />
        </div>
        <Toggle
          label="Multiple Clients"
          checked={isMultiClient}
          onText="Yes"
          offText="No"
          onChange={(_, checked) => setIsMultiClient(!!checked)}
          styles={{ root: toggleStyle }}
        />
        {isMultiClient && (
          <Stack tokens={{ childrenGap: 8 }}>
            {clients.map((client, idx) => (
              <Stack horizontal tokens={{ childrenGap: 8 }} key={idx}>
                <BubbleTextField
                  value={client.firstName}
                  onChange={(_, v) => handleClientChange(idx, 'firstName', v || '')}
                  placeholder="First Name"
                  ariaLabel="First Name"
                  isDarkMode={isDarkMode}
                  style={{ flex: 1 }}
                />
                <BubbleTextField
                  value={client.lastName}
                  onChange={(_, v) => handleClientChange(idx, 'lastName', v || '')}
                  placeholder="Last Name"
                  ariaLabel="Last Name"
                  isDarkMode={isDarkMode}
                  style={{ flex: 1 }}
                />
                <BubbleTextField
                  value={client.email}
                  onChange={(_, v) => handleClientChange(idx, 'email', v || '')}
                  placeholder="Email"
                  ariaLabel="Email"
                  isDarkMode={isDarkMode}
                  style={{ flex: 1 }}
                />
              </Stack>
            ))}
            <IconButton
              iconProps={{ iconName: 'Add' }}
              onClick={addClient}
              title="Add Client"
              ariaLabel="Add Client"
            />
          </Stack>
        )}
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <PrimaryButton text="Confirm & Save" onClick={handleConfirm} styles={sharedPrimaryButtonStyles} />
          <DefaultButton text="Cancel" onClick={onCancel} styles={sharedDefaultButtonStyles} />
        </Stack>
      </Stack>
    </div>
  );
};

export default DealCaptureForm;