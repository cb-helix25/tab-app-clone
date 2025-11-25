import React, { useCallback, useMemo, useState } from 'react';
import { Dropdown, IDropdownOption, PrimaryButton, Stack, Text, TextField } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';

const WhatsAppForm: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [worktype, setWorktype] = useState('construction');
  const [statusMessage, setStatusMessage] = useState('');

    const worktypeOptions: IDropdownOption[] = useMemo(
    () => [
      { key: 'construction', text: 'Construction' },
      { key: 'commercial', text: 'Commercial' },
      { key: 'property', text: 'Property' },
      { key: 'employment', text: 'Employment' },
    ],
    [],
  );


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
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedName = name.trim();
      const trimmedPhone = phoneNumber.trim();

      if (!trimmedName || !trimmedPhone) {
        setStatusMessage('Please provide both your name and phone number to continue.');
        return;
      }

      try {
        setStatusMessage('Sending message...');

        const response = await fetch('/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: trimmedName,
            phone: trimmedPhone,
            worktype,
          }),
        });

        const contentType = response.headers.get('content-type');
        let result;

        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          const text = await response.text();
          console.error('Server returned non-JSON response:', text);
          result = { error: text.substring(0, 100) };
        }

        if (response.ok) {
          setStatusMessage(
            `Success! WhatsApp message sent to ${trimmedPhone} about your ${worktype} enquiry. We'll be in touch soon!`,
          );
          setName('');
          setPhoneNumber('');
          setWorktype(worktypeOptions[0].key as string);
        } else {
          setStatusMessage(`Error: ${result.error || 'Failed to send message'}. Check console for details.`);
        }
      } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        setStatusMessage('Failed to send message. Please check your connection and try again.');
      }
    },
    [name, phoneNumber, worktype, worktypeOptions],
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
          <Dropdown
            label="Work type"
            required
            placeholder="Select work type"
            options={worktypeOptions}
            selectedKey={worktype}
            onChange={(_event, option) => option?.key && setWorktype(option.key.toString())}
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