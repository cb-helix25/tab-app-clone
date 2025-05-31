import React, { useState } from 'react';
import {
  Stack,
  Text,
  Toggle,
  TextField,
  IconButton,
  PrimaryButton,
  DefaultButton,
} from '@fluentui/react';
import { sharedPrimaryButtonStyles, sharedDefaultButtonStyles } from '../../../app/styles/ButtonStyles';
import { inputFieldStyle } from '../../../CustomForms/BespokeForms';
import { useTheme } from '../../../app/functionality/ThemeContext';
import { Enquiry } from '../../../app/functionality/types';

interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface DealCaptureFormProps {
  enquiry: Enquiry;
  onSubmit: (data: { serviceDescription: string; amount: number; isMultiClient: boolean; clients: ClientInfo[] }) => void;
  onCancel: () => void;
}

const DealCaptureForm: React.FC<DealCaptureFormProps> = ({ enquiry, onSubmit, onCancel }) => {
  const { isDarkMode } = useTheme();
  const [serviceDescription, setServiceDescription] = useState(enquiry.Type_of_Work || '');
  const [amount, setAmount] = useState('');
  const [isMultiClient, setIsMultiClient] = useState(false);
  const [clients, setClients] = useState<ClientInfo[]>([{ firstName: '', lastName: '', email: '' }]);
  const [error, setError] = useState<string | null>(null);

  const vat = amount ? parseFloat(amount) * 0.2 : 0;
  const total = amount ? parseFloat(amount) + vat : 0;

  const handleConfirm = () => {
    if (!serviceDescription || !amount) {
      setError('Service description and amount are required');
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) {
      setError('Amount must be a number');
      return;
    }

    const message = `The client will be asked to pay £${(parsed * 1.2).toFixed(2)} for ${serviceDescription || 'this work'}. Continue?`;
    if (!window.confirm(message)) {
      return;
    }

    setError(null);
    onSubmit({ serviceDescription, amount: parsed, isMultiClient, clients });
  };

  return (
    <Stack tokens={{ childrenGap: 12 }}>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Text variant="small">Fill in the deal details before drafting your pitch email.</Text>
      <Text>Area of Work: {enquiry.Area_of_Work}</Text>
      <Text>Prospect ID: {enquiry.ID}</Text>
      <TextField
        label="Service Description"
        required
        multiline
        value={serviceDescription}
        onChange={(_, v) => setServiceDescription(v || '')}
        styles={{ fieldGroup: inputFieldStyle }}
      />
      <TextField
        label="Amount (ex. VAT)"
        required
        prefix="£"
        type="number"
        step={50}
        value={amount}
        onChange={(_, v) => setAmount(v || '')}
        styles={{ fieldGroup: inputFieldStyle }}
      />
      <TextField label="VAT (20%)" prefix="£" value={vat.toFixed(2)} readOnly styles={{ fieldGroup: inputFieldStyle }} />
      <Toggle
        label="Proof of ID for multiple clients"
        checked={isMultiClient}
        onText="Yes"
        offText="No"
        onChange={(_, checked) => setIsMultiClient(!!checked)}
      />
      {isMultiClient && (
        <Stack tokens={{ childrenGap: 8 }}>
          {clients.map((client, index) => (
            <Stack horizontal tokens={{ childrenGap: 8 }} key={index}>
              <TextField
                label="First Name"
                value={client.firstName}
                onChange={(_, v) => {
                  const updated = [...clients];
                  updated[index].firstName = v || '';
                  setClients(updated);
                }}
                styles={{ fieldGroup: inputFieldStyle }}
              />
              <TextField
                label="Last Name"
                value={client.lastName}
                onChange={(_, v) => {
                  const updated = [...clients];
                  updated[index].lastName = v || '';
                  setClients(updated);
                }}
                styles={{ fieldGroup: inputFieldStyle }}
              />
              <TextField
                label="Email"
                value={client.email}
                onChange={(_, v) => {
                  const updated = [...clients];
                  updated[index].email = v || '';
                  setClients(updated);
                }}
                styles={{ fieldGroup: inputFieldStyle }}
              />
              {clients.length > 1 && (
                <IconButton
                  iconProps={{ iconName: 'Delete' }}
                  onClick={() => {
                    setClients(clients.filter((_, i) => i !== index));
                  }}
                />
              )}
            </Stack>
          ))}
          <PrimaryButton
            text="Add Client"
            styles={sharedPrimaryButtonStyles}
            onClick={() => setClients([...clients, { firstName: '', lastName: '', email: '' }])}
          />
        </Stack>
      )}

      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton text="Confirm & Save" onClick={handleConfirm} styles={sharedPrimaryButtonStyles} />
        <DefaultButton text="Cancel" onClick={onCancel} styles={sharedDefaultButtonStyles} />
      </Stack>
    </Stack>
  );
};

export default DealCaptureForm;
