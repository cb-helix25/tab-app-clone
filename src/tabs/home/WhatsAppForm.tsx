import React, { useCallback, useMemo, useState } from 'react';
import { PrimaryButton, Stack, Text, TextField } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';

const WhatsAppForm: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const containerStyles = useMemo(
    () => ({
      root: {
        maxWidth: 520,
        margin: '0 auto',
        padding: 24,
        borderRadius: 10,
        background: '#ffffff',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
      },
    }),
    [],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedName = name.trim();
      const trimmedPhone = phoneNumber.trim();

      if (!trimmedName || !trimmedPhone) {
        setStatusMessage('Please provide both your name and phone number to continue.');
        return;
      }

      setStatusMessage(
        `Submitted contact details for ${trimmedName} with phone number ${trimmedPhone}. We will reach out soon!`,
      );
      setName('');
      setPhoneNumber('');
    },
    [name, phoneNumber],
  );

  return (
    <Stack tokens={{ childrenGap: 20 }} styles={containerStyles}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xLarge">Share your contact details</Text>
        <PrimaryButton text="Back to home" onClick={() => navigate('/')} />
      </Stack>

      <Text>Send us your name and number so we can WhatsApp you with next steps.</Text>

      <form onSubmit={handleSubmit}>
        <Stack tokens={{ childrenGap: 16 }}>
          <TextField
            label="Name"
            required
            placeholder="Enter your full name"
            value={name}
            onChange={(_event, newValue) => setName(newValue ?? '')}
          />
          <TextField
            label="Phone number"
            required
            placeholder="Include country code"
            value={phoneNumber}
            onChange={(_event, newValue) => setPhoneNumber(newValue ?? '')}
          />
          <PrimaryButton type="submit" text="Send via WhatsApp" />
          {statusMessage && (
            <Text variant="small" styles={{ root: { color: '#106ebe' } }}>
              {statusMessage}
            </Text>
          )}
        </Stack>
      </form>
    </Stack>
  );
};

export default WhatsAppForm;