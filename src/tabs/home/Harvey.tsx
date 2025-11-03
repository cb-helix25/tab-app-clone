import React, { useCallback, useMemo, useState } from 'react';
import {
  DefaultButton,
  PrimaryButton,
  Stack,
  Text,
  TextField,
} from '@fluentui/react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';

interface HarveyFormData {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  companyAddress: string;
  internalMatterReference: string;
  date: string;
  matterTitle: string;
}

const initialFormData: HarveyFormData = {
  firstName: '',
  lastName: '',
  email: '',
  companyName: '',
  companyAddress: '',
  internalMatterReference: '',
  date: '',
  matterTitle: '',
};

const Harvey: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState<HarveyFormData>(initialFormData);

  const sectionStyles = useMemo(
    () => ({
      root: {
        backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
        borderRadius: 12,
        padding: 24,
        boxShadow: isDarkMode
          ? '0 4px 14px rgba(0, 0, 0, 0.35)'
          : '0 4px 14px rgba(6, 23, 51, 0.12)',
      },
    }),
    [isDarkMode],
  );

  const handleFieldChange = useCallback(
    (field: keyof HarveyFormData) =>
      (_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setFormData((current) => ({
          ...current,
          [field]: newValue ?? '',
        }));
      },
    [],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // Placeholder for future submission handling logic
      // eslint-disable-next-line no-console
      console.log('Harvey form submitted', formData);
    },
    [formData],
  );

  const handleReset = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormData({ ...initialFormData });
  }, []);

  return (
    <Stack tokens={{ childrenGap: 24 }}>
      <DefaultButton
        text="Back to Home"
        onClick={() => navigate('/')}
        styles={{
          root: {
            alignSelf: 'flex-start',
            backgroundColor: isDarkMode ? colours.dark.buttonBackground : colours.light.buttonBackground,
            color: isDarkMode ? colours.dark.buttonText : colours.light.buttonText,
            borderColor: 'transparent',
          },
          rootHovered: {
            backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.hoverBackground,
            color: isDarkMode ? colours.dark.buttonText : colours.light.buttonText,
          },
          rootPressed: {
            backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.hoverBackground,
            color: isDarkMode ? colours.dark.buttonText : colours.light.buttonText,
          },
        }}
      />

      <Stack styles={sectionStyles} tokens={{ childrenGap: 16 }}>
        <Text variant="xLarge">Introduction</Text>
        <form onSubmit={handleSubmit} onReset={handleReset} style={{ display: 'contents' }}>
          <Stack tokens={{ childrenGap: 16 }}>
            <Stack tokens={{ childrenGap: 12 }}>
              <Text variant="large">Client Details</Text>
              <Stack tokens={{ childrenGap: 12 }}>
                <TextField
                  label="First name"
                  value={formData.firstName}
                  onChange={handleFieldChange('firstName')}
                  required
                />
                <TextField
                  label="Last name"
                  value={formData.lastName}
                  onChange={handleFieldChange('lastName')}
                  required
                />
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleFieldChange('email')}
                  required
                />
                <TextField
                  label="Company name"
                  value={formData.companyName}
                  onChange={handleFieldChange('companyName')}
                />
                <TextField
                  label="Company address"
                  value={formData.companyAddress}
                  onChange={handleFieldChange('companyAddress')}
                  multiline
                  autoAdjustHeight
                />
              </Stack>
            </Stack>

            <TextField
              label="Internal matter reference"
              value={formData.internalMatterReference}
              onChange={handleFieldChange('internalMatterReference')}
            />

            <Stack horizontal tokens={{ childrenGap: 12 }} wrap>
              <TextField
                label="Date"
                type="date"
                value={formData.date}
                onChange={handleFieldChange('date')}
                styles={{ root: { minWidth: 200 } }}
              />
              <TextField
                label="Matter title/subject"
                value={formData.matterTitle}
                onChange={handleFieldChange('matterTitle')}
                styles={{ root: { minWidth: 280 } }}
              />
            </Stack>

            <Stack horizontal tokens={{ childrenGap: 12 }}>
              <PrimaryButton type="submit" text="Submit" />
              <DefaultButton type="reset" text="Reset" />
            </Stack>
          </Stack>
        </form>
      </Stack>
    </Stack>
  );
};

export default Harvey;