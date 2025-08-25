// src/CustomForms/NotableCaseInfoForm.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  PrimaryButton,
  DefaultButton,
  MessageBar,
  MessageBarType,
  ComboBox,
  IComboBoxOption,
  Toggle,
  Dropdown,
  IDropdownOption,
} from '@fluentui/react';
import { mergeStyles } from '@fluentui/react';
import { colours } from '../app/styles/colours';
import { componentTokens } from '../app/styles/componentTokens';
import { getProxyBaseUrl } from '../utils/getProxyBaseUrl';
import {
  sharedPrimaryButtonStyles,
  sharedDefaultButtonStyles,
} from '../app/styles/ButtonStyles';
import { NormalizedMatter, UserData } from '../app/functionality/types';
import { useTheme } from '../app/functionality/ThemeContext';

interface NotableCaseInfoFormProps {
  users?: UserData[];
  matters: NormalizedMatter[];
  onBack?: () => void;
  onSubmitSuccess?: (message: string) => void;
  onSubmitError?: (error: string) => void;
}

interface FormData {
  initials: string;
  display_number: string;
  summary: string;
  value_in_dispute: string;
  c_reference_status: boolean;
  counsel_instructed: boolean;
  counsel_name: string;
}

const formHeaderStyle = (isDarkMode: boolean) => mergeStyles({
  fontSize: '24px',
  fontWeight: '600',
  color: isDarkMode ? colours.dark.text : colours.light.text,
  margin: '0 0 8px 0',
  fontFamily: 'Segoe UI, sans-serif',
});

const fieldGroupStyle = mergeStyles({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

const labelStyle = (isDarkMode: boolean) => mergeStyles({
  fontSize: '14px',
  fontWeight: '600',
  color: isDarkMode ? colours.dark.text : colours.light.text,
  margin: '0 0 6px 0',
  fontFamily: 'Segoe UI, sans-serif',
});

const helpTextStyle = (isDarkMode: boolean) => mergeStyles({
  fontSize: '12px',
  color: isDarkMode ? colours.dark.subText : colours.light.subText,
  fontStyle: 'italic',
  margin: '4px 0 0 0',
  lineHeight: '1.4',
});

const textAreaStyle = (isDarkMode: boolean) => mergeStyles({
  minHeight: '100px',
  padding: '12px',
  border: `1px solid ${isDarkMode ? colours.dark.borderColor : '#e1e5e9'}`,
  borderRadius: '6px',
  backgroundColor: isDarkMode ? colours.dark.inputBackground : colours.light.sectionBackground,
  color: isDarkMode ? colours.dark.text : colours.light.text,
  fontFamily: 'Segoe UI, sans-serif',
  fontSize: '14px',
  resize: 'vertical',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  selectors: {
    ':hover': {
      borderColor: colours.highlight,
    },
    ':focus': {
      borderColor: colours.highlight,
      outline: 'none',
      boxShadow: `0 0 0 2px rgba(54, 144, 206, 0.2)`,
    },
  },
});

const buttonGroupStyle = mergeStyles({
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-start',
  marginTop: '8px',
});

const NotableCaseInfoForm: React.FC<NotableCaseInfoFormProps> = ({
  users,
  matters,
  onBack,
  onSubmitSuccess,
  onSubmitError,
}) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState<FormData>({
    initials: '',
    display_number: '',
    summary: '',
    value_in_dispute: '',
    c_reference_status: false,
    counsel_instructed: false,
    counsel_name: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Set user initials automatically
  useEffect(() => {
    if (users && users.length > 0 && users[0]) {
      setFormData(prev => ({
        ...prev,
        initials: users[0].Initials || '',
      }));
    }
  }, [users]);

  // Convert matters to ComboBox options
  const matterOptions: IComboBoxOption[] = useMemo(() => {
    if (!matters || matters.length === 0) return [];
    
    return matters.map(matter => ({
      key: matter.displayNumber || matter.matterId || '',
      text: `${matter.displayNumber || 'No Display Number'} - ${matter.clientName || 'Unknown Client'}`,
      data: matter,
    }));
  }, [matters]);

  // Value in dispute options
  const valueDisputeOptions: IDropdownOption[] = [
    { key: '', text: 'Choose one...' },
    { key: '£10,000 or less', text: '£10,000 or less' },
    { key: '£10,001 - £100,000', text: '£10,001 - £100,000' },
    { key: '£100,001 - £500,000', text: '£100,001 - £500,000' },
    { key: '£500,001 or more', text: '£500,001 or more' },
    { key: 'Uncertain', text: 'Uncertain' },
  ];

  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [validationErrors.length]);

  const handleMatterSelection = useCallback((option?: IComboBoxOption) => {
    if (option && option.data) {
      const matter = option.data as NormalizedMatter;
      setFormData(prev => ({
        ...prev,
        display_number: matter.displayNumber || '',
      }));
    }
  }, []);

  const validateForm = useCallback((): string[] => {
    const errors: string[] = [];
    
    if (!formData.initials.trim()) {
      errors.push('Initials are required');
    }
    
    if (!formData.display_number.trim()) {
      errors.push('File Reference is required');
    }
    
    if (!formData.summary.trim()) {
      errors.push('Summary is required');
    }

    return errors;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      // Prepare the payload for the Azure Function
      const payload = {
        initials: formData.initials,
        display_number: formData.display_number,
        summary: formData.summary,
        value_in_dispute: formData.value_in_dispute,
        c_reference_status: formData.c_reference_status,
        counsel_instructed: formData.counsel_instructed,
        counsel_name: formData.counsel_name,
      };

      console.log('Notable Case Info Form Payload:', payload);

      // Call the Azure Function
      const base = getProxyBaseUrl();
      const url = `${base}/${process.env.REACT_APP_INSERT_NOTABLE_CASE_INFO_PATH}?code=${process.env.REACT_APP_INSERT_NOTABLE_CASE_INFO_CODE}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed with status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Insert Notable Case Info Successful:', result);
      
      onSubmitSuccess?.(`Notable case information submitted successfully. ${result.emailSent ? 'Notification email sent.' : 'Note: Email notification failed.'}`);
      
      // Reset form
      setFormData({
        initials: users?.[0]?.Initials || '',
        display_number: '',
        summary: '',
        value_in_dispute: '',
        c_reference_status: false,
        counsel_instructed: false,
        counsel_name: '',
      });
      
    } catch (error) {
      console.error('Error submitting notable case info:', error);
      onSubmitError?.(`Failed to submit notable case information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmitSuccess, onSubmitError, users]);

  const handleReset = useCallback(() => {
    setFormData({
      initials: users?.[0]?.Initials || '',
      display_number: '',
      summary: '',
      value_in_dispute: '',
      c_reference_status: false,
      counsel_instructed: false,
      counsel_name: '',
    });
    setValidationErrors([]);
  }, [users]);

  return (
    <div style={{ 
      padding: '24px', 
    }}>
      <div>
        <Text className={formHeaderStyle(isDarkMode)}>
          Notable Case Information
        </Text>
      </div>

      {validationErrors.length > 0 && (
        <MessageBar 
          messageBarType={MessageBarType.error}
          styles={{
            root: {
              backgroundColor: isDarkMode ? '#442726' : '#fed9cc',
              color: isDarkMode ? '#ff6b6b' : '#a80000',
            }
          }}
        >
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </MessageBar>
      )}

      <Stack tokens={{ childrenGap: 24 }}>
          <div className={fieldGroupStyle}>
            <Text className={labelStyle(isDarkMode)}>FE *</Text>
            <TextField
              value={formData.initials}
              onChange={(_, value) => handleInputChange('initials', value || '')}
              styles={{ 
                fieldGroup: { 
                  border: `1px solid ${isDarkMode ? colours.dark.borderColor : '#e1e5e9'}`,
                  backgroundColor: isDarkMode ? colours.dark.inputBackground : colours.light.sectionBackground,
                  borderRadius: '6px',
                  selectors: {
                    ':hover': {
                      borderColor: colours.highlight,
                    },
                    ':focus-within': {
                      borderColor: colours.highlight,
                      boxShadow: `0 0 0 2px rgba(54, 144, 206, 0.2)`,
                    },
                  },
                },
                field: {
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  backgroundColor: 'transparent',
                }
              }}
              disabled
            />
          </div>

          <div className={fieldGroupStyle}>
            <Text className={labelStyle(isDarkMode)}>File Reference *</Text>
            <ComboBox
              placeholder="Search and select a matter..."
              options={matterOptions}
              onChange={(_, option) => handleMatterSelection(option)}
              text={formData.display_number}
              onInputValueChange={(value) => handleInputChange('display_number', value || '')}
              allowFreeInput
              autoComplete="on"
              styles={{
                root: { width: '100%' },
                input: {
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  backgroundColor: isDarkMode ? colours.dark.inputBackground : colours.light.sectionBackground,
                },
                optionsContainerWrapper: { maxHeight: '200px' },
              }}
            />
          </div>

          <div className={fieldGroupStyle}>
            <Text className={labelStyle(isDarkMode)}>Brief Summary of Case *</Text>
            <textarea
              className={textAreaStyle(isDarkMode)}
              value={formData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              placeholder="Provide a brief summary of the case"
              rows={4}
            />
          </div>

          <div className={fieldGroupStyle}>
            <Text className={labelStyle(isDarkMode)}>Indication of Value</Text>
            <Dropdown
              placeholder="Choose one..."
              options={valueDisputeOptions}
              selectedKey={formData.value_in_dispute}
              onChange={(_, option) => handleInputChange('value_in_dispute', option?.key as string || '')}
              styles={{ 
                dropdown: { 
                  border: `1px solid ${isDarkMode ? colours.dark.borderColor : '#e1e5e9'}`,
                  backgroundColor: isDarkMode ? colours.dark.inputBackground : colours.light.sectionBackground,
                  borderRadius: '6px',
                  selectors: {
                    ':hover': {
                      borderColor: colours.highlight,
                    },
                    ':focus-within': {
                      borderColor: colours.highlight,
                      boxShadow: `0 0 0 2px rgba(54, 144, 206, 0.2)`,
                    },
                  },
                },
                title: {
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  backgroundColor: 'transparent',
                }
              }}
            />
          </div>

          <div className={fieldGroupStyle}>
            <Toggle
              label="Is Client Prepared to Provide a Reference?"
              checked={formData.c_reference_status}
              onChange={(_, checked) => handleInputChange('c_reference_status', checked || false)}
              styles={{
                root: { marginBottom: '0' },
                label: { 
                  fontWeight: '600', 
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  fontSize: '14px',
                  fontFamily: 'Segoe UI, sans-serif',
                },
              }}
            />
            <Text className={helpTextStyle(isDarkMode)}>
              Indicates this case is suitable for inclusion in legal directories and professional publications
            </Text>
          </div>

          <div className={fieldGroupStyle}>
            <Toggle
              label="Is Counsel Instructed?"
              checked={formData.counsel_instructed}
              onChange={(_, checked) => handleInputChange('counsel_instructed', checked || false)}
              styles={{
                root: { marginBottom: '0' },
                label: { 
                  fontWeight: '600', 
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  fontSize: '14px',
                  fontFamily: 'Segoe UI, sans-serif',
                },
              }}
            />
          </div>

          {formData.counsel_instructed && (
            <div className={fieldGroupStyle}>
              <Text className={labelStyle(isDarkMode)}>Counsel Name</Text>
              <TextField
                value={formData.counsel_name}
                onChange={(_, value) => handleInputChange('counsel_name', value || '')}
                placeholder="Enter counsel name"
                styles={{ 
                  fieldGroup: { 
                    border: `1px solid ${isDarkMode ? colours.dark.borderColor : '#e1e5e9'}`,
                    backgroundColor: isDarkMode ? colours.dark.inputBackground : colours.light.sectionBackground,
                    borderRadius: '6px',
                    selectors: {
                      ':hover': {
                        borderColor: colours.highlight,
                      },
                      ':focus-within': {
                        borderColor: colours.highlight,
                        boxShadow: `0 0 0 2px rgba(54, 144, 206, 0.2)`,
                      },
                    },
                  },
                  field: {
                    color: isDarkMode ? colours.dark.text : colours.light.text,
                    backgroundColor: 'transparent',
                  }
                }}
              />
            </div>
          )}

          <div className={buttonGroupStyle}>
            <PrimaryButton
              text={isSubmitting ? 'Submitting...' : 'Submit'}
              onClick={handleSubmit}
              disabled={isSubmitting}
              styles={sharedPrimaryButtonStyles}
            />
            <DefaultButton
              text="Reset"
              onClick={handleReset}
              disabled={isSubmitting}
              styles={sharedDefaultButtonStyles}
            />
          </div>
        </Stack>
    </div>
  );
};

export default NotableCaseInfoForm;
