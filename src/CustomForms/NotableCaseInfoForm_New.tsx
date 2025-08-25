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
} from '@fluentui/react';
import { mergeStyles } from '@fluentui/react';
import { colours } from '../app/styles/colours';
import {
  sharedPrimaryButtonStyles,
  sharedDefaultButtonStyles,
} from '../app/styles/ButtonStyles';
import { NormalizedMatter, UserData } from '../app/functionality/types';

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

const formContainerStyle = mergeStyles({
  padding: '20px',
  backgroundColor: colours.light.sectionBackground,
  borderRadius: '8px',
  border: `1px solid ${colours.highlight}`,
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  maxHeight: 'none',
  overflow: 'visible',
});

const labelStyle = mergeStyles({
  fontWeight: '600',
  marginBottom: '5px',
  color: colours.light.text,
});

const textAreaStyle = mergeStyles({
  minHeight: '80px',
  padding: '8px',
  border: `1px solid ${colours.highlight}`,
  borderRadius: '4px',
  backgroundColor: colours.light.sectionBackground,
  fontFamily: 'inherit',
  resize: 'vertical',
  boxSizing: 'border-box',
  selectors: {
    ':hover': {
      borderColor: colours.highlight,
    },
    ':focus': {
      borderColor: colours.highlight,
      outline: 'none',
    },
  },
});

const NotableCaseInfoForm: React.FC<NotableCaseInfoFormProps> = ({
  users,
  matters,
  onBack,
  onSubmitSuccess,
  onSubmitError,
}) => {
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSubmitSuccess?.('Notable case information submitted successfully');
      
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
      onSubmitError?.('Failed to submit notable case information');
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
    <div style={{ padding: '20px', maxHeight: 'none', overflow: 'visible' }}>
      <div className={formContainerStyle}>
        <Stack tokens={{ childrenGap: 15 }}>
          <Text variant="large" style={{ fontWeight: '600', marginBottom: '10px' }}>
            Notable Case Information
          </Text>

          {validationErrors.length > 0 && (
            <MessageBar messageBarType={MessageBarType.error}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </MessageBar>
          )}

          <Stack>
            <Text className={labelStyle}>FE (User Initials) *</Text>
            <TextField
              value={formData.initials}
              onChange={(_, value) => handleInputChange('initials', value || '')}
              styles={{ fieldGroup: { border: `1px solid ${colours.highlight}` } }}
              disabled
            />
          </Stack>

          <Stack>
            <Text className={labelStyle}>File Reference *</Text>
            <ComboBox
              placeholder="Search and select a matter..."
              options={matterOptions}
              onChange={(_, option) => handleMatterSelection(option)}
              text={formData.display_number}
              onInputValueChange={(value) => handleInputChange('display_number', value || '')}
              allowFreeInput
              autoComplete="on"
            />
          </Stack>

          <Stack>
            <Text className={labelStyle}>Summary *</Text>
            <textarea
              className={textAreaStyle}
              value={formData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              placeholder="Provide a summary of the case"
              rows={4}
            />
          </Stack>

          <Stack>
            <Text className={labelStyle}>Value in Dispute</Text>
            <TextField
              value={formData.value_in_dispute}
              onChange={(_, value) => handleInputChange('value_in_dispute', value || '')}
              placeholder="Enter monetary value"
              styles={{ fieldGroup: { border: `1px solid ${colours.highlight}` } }}
            />
          </Stack>

          <Stack>
            <Toggle
              label="C Reference Status"
              checked={formData.c_reference_status}
              onChange={(_, checked) => handleInputChange('c_reference_status', checked || false)}
            />
          </Stack>

          <Stack>
            <Toggle
              label="Counsel Instructed"
              checked={formData.counsel_instructed}
              onChange={(_, checked) => handleInputChange('counsel_instructed', checked || false)}
            />
          </Stack>

          {formData.counsel_instructed && (
            <Stack>
              <Text className={labelStyle}>Counsel Name</Text>
              <TextField
                value={formData.counsel_name}
                onChange={(_, value) => handleInputChange('counsel_name', value || '')}
                placeholder="Enter counsel name"
                styles={{ fieldGroup: { border: `1px solid ${colours.highlight}` } }}
              />
            </Stack>
          )}

          <Stack horizontal tokens={{ childrenGap: 10 }} style={{ marginTop: '20px' }}>
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
          </Stack>
        </Stack>
      </div>
    </div>
  );
};

export default NotableCaseInfoForm;
