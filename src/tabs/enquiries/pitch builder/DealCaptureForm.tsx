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
import { useTheme } from '../../../app/functionality/ThemeContext';
import { Enquiry } from '../../../app/functionality/types';

interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface DealCaptureFormProps {
  enquiry: Enquiry;
  onSubmit: (data: { serviceDescription: string; amount: number; isMultiClient: boolean }) => void;
  onCancel: () => void;
}

const DealCaptureForm: React.FC<DealCaptureFormProps> = ({ enquiry, onSubmit, onCancel }) => {
  const { isDarkMode } = useTheme();
  const [serviceDescription, setServiceDescription] = useState(enquiry.Type_of_Work || '');
  const [amount, setAmount] = useState('');
  const [isMultiClient, setIsMultiClient] = useState(false);
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
    setError(null);
    onSubmit({ serviceDescription, amount: parsed, isMultiClient });
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
      />
      <TextField
        label="Amount (ex. VAT)"
        required
        prefix="£"
        type="number"
        step={50}
        value={amount}
        onChange={(_, v) => setAmount(v || '')}
      />
      <TextField label="VAT (20%)" prefix="£" value={vat.toFixed(2)} readOnly />
      <Text block>
        The client will be asked to pay £{total.toFixed(2)} for {serviceDescription || 'this work'}.
        Confirm or revise the deal.
      </Text>
      <Toggle
        label="Proof of ID for multiple clients"
        checked={isMultiClient}
        onText="Yes"
        offText="No"
        onChange={(_, checked) => setIsMultiClient(!!checked)}
      />
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton text="Confirm & Save" onClick={handleConfirm} />
        <DefaultButton text="Cancel" onClick={onCancel} />
      </Stack>
    </Stack>
  );
};

export default DealCaptureForm;
