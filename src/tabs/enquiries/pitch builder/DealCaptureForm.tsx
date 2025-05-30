import React, { useState } from 'react';
import { Panel, PanelType, PrimaryButton, DefaultButton, Stack, Text, Toggle } from '@fluentui/react';
import BubbleTextField from '../../../app/styles/BubbleTextField';
import { useTheme } from '../../../app/functionality/ThemeContext';
import { Enquiry } from '../../../app/functionality/types';

interface DealCaptureFormProps {
  isOpen: boolean;
  onDismiss: () => void;
  enquiry: Enquiry;
  userInitials: string;
  onSubmit: (data: { serviceDescription: string; amount: number; isMultiClient: boolean; }) => void;
}

const DealCaptureForm: React.FC<DealCaptureFormProps> = ({ isOpen, onDismiss, enquiry, userInitials, onSubmit }) => {
  const { isDarkMode } = useTheme();
  const [serviceDescription, setServiceDescription] = useState(enquiry.Type_of_Work || '');
  const [amount, setAmount] = useState('');
  const [isMultiClient, setIsMultiClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    <Panel
      isOpen={isOpen}
      onDismiss={onDismiss}
      type={PanelType.smallFixedFar}
      headerText="Confirm Deal Details"
    >
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
        <BubbleTextField
          value={amount}
          onChange={(_, v) => setAmount(v || '')}
          placeholder="Amount"
          ariaLabel="Amount"
          isDarkMode={isDarkMode || false}
          type="number"
        />
        <Toggle
          label="Proof of ID for multiple clients"
          checked={isMultiClient}
          onText="Yes"
          offText="No"
          onChange={(_, checked) => setIsMultiClient(!!checked)}
        />
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <PrimaryButton text="Confirm & Save" onClick={handleConfirm} />
          <DefaultButton text="Cancel" onClick={onDismiss} />
        </Stack>
      </Stack>
    </Panel>
  );
};

export default DealCaptureForm;
