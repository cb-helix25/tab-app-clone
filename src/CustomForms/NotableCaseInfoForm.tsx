// src/CustomForms/NotableCaseInfoForm.tsx

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  Icon,
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

// Add spinning animation CSS
const spinKeyframes = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;

// Inject the keyframes into the document head
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = spinKeyframes;
    document.head.appendChild(style);
}

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

// Premium styling inspired by the bundle form
const premiumContainerStyle: React.CSSProperties = {
  background: 'transparent',
  padding: '1rem',
  paddingTop: '4rem',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  maxHeight: 'calc(100vh - 60px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingBottom: '4rem',
  boxSizing: 'border-box',
};

const premiumCardStyle: React.CSSProperties = {
  background: 'transparent',
  borderRadius: '16px',
  border: '1px solid rgba(229, 231, 235, 0.3)',
  overflow: 'hidden',
  maxWidth: '900px',
  margin: '0 auto',
};

const premiumHeaderStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#374151',
  padding: '1rem 1.5rem',
  borderBottom: '1px solid rgba(229, 231, 235, 0.3)',
};

const premiumContentStyle: React.CSSProperties = {
  padding: '1.5rem',
  paddingTop: '2rem',
};

const premiumSectionStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.7)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  borderRadius: '12px',
  padding: '1.25rem',
  marginBottom: '1.25rem',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
  backdropFilter: 'blur(8px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

const premiumBannerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(54, 144, 206, 0.06) 0%, rgba(6, 23, 51, 0.06) 100%)',
  color: '#374151',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  fontWeight: '600',
  fontSize: '0.875rem',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  border: '1px solid rgba(229, 231, 235, 0.4)',
};

const premiumInputStyle = {
  fieldGroup: {
    borderRadius: '8px',
    border: '1px solid rgba(229, 231, 235, 0.4)',
    background: 'transparent',
    minHeight: '48px',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    selectors: {
      ':hover': {
        borderColor: 'rgba(229, 231, 235, 0.6)',
        background: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  fieldGroupFocused: {
    borderColor: '#3690CE',
    background: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 0 0 3px rgba(54, 144, 206, 0.1)',
  },
  field: {
    background: 'transparent',
    color: '#374151',
    fontSize: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  label: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#374151',
    marginBottom: '6px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

const premiumDropdownStyle = {
  dropdown: {
    borderRadius: '8px',
    border: '1px solid rgba(229, 231, 235, 0.4)',
    background: 'transparent',
    minHeight: '48px',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    selectors: {
      ':hover': {
        borderColor: 'rgba(229, 231, 235, 0.6)',
        background: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  title: {
    background: 'transparent',
    color: '#374151',
    fontSize: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: '48px',
  },
  label: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#374151',
    marginBottom: '6px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  callout: {
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(229, 231, 235, 0.6)',
    borderRadius: '8px',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
  },
};

const premiumTextAreaStyle: React.CSSProperties = {
  borderRadius: '8px',
  border: '1px solid rgba(229, 231, 235, 0.4)',
  background: 'transparent',
  padding: '12px 16px',
  fontSize: '16px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: '#374151',
  resize: 'vertical',
  minHeight: '120px',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease',
  outline: 'none',
};

const premiumToggleStyle = {
  root: { marginBottom: '0' },
  label: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#374151',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

const premiumButtonStyle = {
  root: {
    borderRadius: '8px',
    minHeight: '48px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    transition: 'all 0.2s ease',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  rootPressed: {
    transform: 'translateY(1px)',
  },
};

const premiumPrimaryButtonStyle = {
  ...premiumButtonStyle,
  root: {
    ...premiumButtonStyle.root,
    background: 'linear-gradient(135deg, #3690CE 0%, #2563eb 100%)',
    color: 'white',
    selectors: {
      ':hover': {
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        transform: 'translateY(-1px)',
        boxShadow: '0 8px 25px rgba(54, 144, 206, 0.3)',
      },
      ':active': {
        transform: 'translateY(1px)',
      },
    },
  },
};

const premiumSecondaryButtonStyle = {
  ...premiumButtonStyle,
  root: {
    ...premiumButtonStyle.root,
    background: 'rgba(255, 255, 255, 0.7)',
    color: '#374151',
    border: '1px solid rgba(229, 231, 235, 0.4)',
    selectors: {
      ':hover': {
        background: 'rgba(255, 255, 255, 0.9)',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      ':active': {
        transform: 'translateY(1px)',
      },
    },
  },
};

const helpTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  fontStyle: 'italic',
  marginTop: '4px',
  lineHeight: '1.4',
};

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
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [matterDropdownOpen, setMatterDropdownOpen] = useState(false);
  const [matterSearchTerm, setMatterSearchTerm] = useState('');
  const [valueDropdownOpen, setValueDropdownOpen] = useState(false);
  const matterFieldRef = useRef<HTMLDivElement>(null);
  const valueFieldRef = useRef<HTMLDivElement>(null);

  // Set user initials automatically
  useEffect(() => {
    if (users && users.length > 0 && users[0]) {
      setFormData(prev => ({
        ...prev,
        initials: users[0].Initials || '',
      }));
    }
  }, [users]);

  // Filter matters based on search term
  const filteredMatters = useMemo(() => {
    if (!matters || matters.length === 0) return [];
    
    if (!matterSearchTerm.trim()) return matters.slice(0, 50);
    
    const searchLower = matterSearchTerm.toLowerCase();
    return matters.filter((matter: any) => {
      const displayNumber = matter.displayNumber || '';
      const clientName = matter.clientName || '';
      const description = matter.description || '';
      
      return displayNumber.toLowerCase().includes(searchLower) ||
             clientName.toLowerCase().includes(searchLower) ||
             description.toLowerCase().includes(searchLower);
    }).slice(0, 20);
  }, [matters, matterSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (matterFieldRef.current && !matterFieldRef.current.contains(event.target as Node)) {
        setMatterDropdownOpen(false);
      }
      if (valueFieldRef.current && !valueFieldRef.current.contains(event.target as Node)) {
        setValueDropdownOpen(false);
      }
    };

    if (matterDropdownOpen || valueDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [matterDropdownOpen, valueDropdownOpen]);

  // Handle matter selection from dropdown
  const handleMatterSelect = (matter: any) => {
    const displayNumber = matter.displayNumber || '';
    setFormData(prev => ({ ...prev, display_number: displayNumber }));
    setMatterSearchTerm(displayNumber);
    setMatterDropdownOpen(false);
  };

  // Handle value selection from dropdown
  const handleValueSelect = (value: string) => {
    setFormData(prev => ({ ...prev, value_in_dispute: value }));
    setValueDropdownOpen(false);
  };

  // Value in dispute options
  const valueDisputeOptions = [
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

  const validateForm = useCallback((): string[] => {
    const errors: string[] = [];
    
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
      setSubmitStatus('error');
      setSubmitMessage('Please fix the validation errors above');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('submitting');
    setSubmitMessage('Submitting case information and sending email...');
    setValidationErrors([]);

    try {
      // Prepare the payload for the Azure Function
      const payload = {
        initials: users?.[0]?.Initials || '',
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
      
      setSubmitStatus('success');
      setSubmitMessage(`Notable case information submitted successfully. ${result.emailSent ? 'Notification email sent to lz@helix-law.com.' : 'Note: Email notification failed.'}`);
      
      onSubmitSuccess?.(`Notable case information submitted successfully. ${result.emailSent ? 'Notification email sent.' : 'Note: Email notification failed.'}`);
      
      // Reset form after showing success message
      setTimeout(() => {
        setFormData({
          initials: users?.[0]?.Initials || '',
          display_number: '',
          summary: '',
          value_in_dispute: '',
          c_reference_status: false,
          counsel_instructed: false,
          counsel_name: '',
        });
        setMatterSearchTerm('');
        setSubmitStatus('idle');
        setSubmitMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting notable case info:', error);
      const errorMessage = `Failed to submit notable case information: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setSubmitStatus('error');
      setSubmitMessage(errorMessage);
      onSubmitError?.(errorMessage);
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
    setMatterSearchTerm('');
    setValidationErrors([]);
  }, [users]);

  return (
    <div style={premiumContainerStyle}>
      <div style={premiumCardStyle}>
        {/* Premium Header */}
        <div style={premiumHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Icon iconName="DocumentSearch" style={{ fontSize: '1.25rem', color: '#6b7280' }} />
            <div>
              <Text variant="large" style={{ color: '#6b7280', fontWeight: '700', margin: 0, lineHeight: '1.2' }}>
                Notable Case Information
              </Text>
              <Text variant="small" style={{ color: '#6b7280', margin: 0, lineHeight: '1.4' }}>
                Submit important case details for legal directories
              </Text>
            </div>
          </div>
        </div>

        {/* Premium Content */}
        <div style={premiumContentStyle}>
          {validationErrors.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <MessageBar 
                messageBarType={MessageBarType.error}
                styles={{
                  root: {
                    backgroundColor: '#fed9cc',
                    color: '#a80000',
                    borderRadius: '8px',
                  }
                }}
              >
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </MessageBar>
            </div>
          )}

          {/* Case Details Section */}
          <div style={premiumSectionStyle}>
            <div style={premiumBannerStyle}>
              <Icon iconName="Contact" style={{ fontSize: '1rem' }} />
              Case Details
            </div>
            <Stack tokens={{ childrenGap: 20 }}>
              {/* Matter Reference Field */}
              <div ref={matterFieldRef} style={{ position: 'relative', width: '100%' }}>
                <label style={{
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#374151',
                  marginBottom: '6px',
                  display: 'block',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                  File Reference *
                </label>
                <div style={{
                  borderRadius: '8px',
                  border: '1px solid rgba(229, 231, 235, 0.4)',
                  background: 'transparent',
                  minHeight: '48px',
                  fontSize: '16px',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}>
                  <input
                    type="text"
                    value={matterSearchTerm}
                    onChange={(e) => {
                      setMatterSearchTerm(e.target.value);
                      setFormData(prev => ({ ...prev, display_number: e.target.value }));
                      setMatterDropdownOpen(true);
                    }}
                    onFocus={() => setMatterDropdownOpen(true)}
                    placeholder="Search and select a matter..."
                    style={{
                      width: '100%',
                      height: '48px',
                      border: 'none',
                      background: 'transparent',
                      padding: '0 16px',
                      fontSize: '16px',
                      color: '#374151',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      outline: 'none',
                    }}
                  />
                </div>
                
                {/* Custom Dropdown */}
                {matterDropdownOpen && filteredMatters.length > 0 && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(229, 231, 235, 0.6)',
                    borderRadius: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
                    marginTop: '4px',
                  }}>
                    {filteredMatters.map((matter: any, index: number) => {
                      const displayNumber = matter.displayNumber || '';
                      const clientName = matter.clientName || '';
                      const description = matter.description || '';
                      
                      return (
                        <div
                          key={displayNumber + index}
                          onClick={() => handleMatterSelect(matter)}
                          style={{
                            padding: '12px',
                            cursor: 'pointer',
                            borderBottom: index < filteredMatters.length - 1 ? '1px solid rgba(229, 231, 235, 0.3)' : 'none',
                            transition: 'background-color 0.1s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(54, 144, 206, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>
                            {displayNumber}
                          </div>
                          {clientName && (
                            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                              {clientName}
                            </div>
                          )}
                          {description && (
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                              {description}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Summary Field */}
              <div>
                <label style={{
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#374151',
                  marginBottom: '6px',
                  display: 'block',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                  Brief Summary of Case *
                </label>
                <textarea
                  style={premiumTextAreaStyle}
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  placeholder="Provide a brief summary of the case"
                  rows={4}
                  disabled={isSubmitting}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.6)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.4)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                  onFocus={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.borderColor = '#3690CE';
                    }
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(54, 144, 206, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.4)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </Stack>
          </div>

          {/* Case Valuation Section */}
          <div style={premiumSectionStyle}>
            <div style={premiumBannerStyle}>
              <Icon iconName="Money" style={{ fontSize: '1rem' }} />
              Case Valuation
            </div>
            
            {/* Custom Value Dropdown */}
            <div ref={valueFieldRef} style={{ position: 'relative', width: '100%' }}>
              <label style={{
                fontWeight: '600',
                fontSize: '14px',
                color: '#374151',
                marginBottom: '6px',
                display: 'block',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}>
                Indication of Value
              </label>
              <div style={{
                borderRadius: '8px',
                border: '1px solid rgba(229, 231, 235, 0.4)',
                background: 'transparent',
                minHeight: '48px',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                position: 'relative',
                cursor: 'pointer',
              }}
              onClick={() => setValueDropdownOpen(!valueDropdownOpen)}
              >
                <div style={{
                  width: '100%',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  fontSize: '16px',
                  color: formData.value_in_dispute ? '#374151' : '#9ca3af',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                  {formData.value_in_dispute || 'Choose one...'}
                </div>
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  transition: 'transform 0.2s ease',
                  transformOrigin: 'center',
                  ...(valueDropdownOpen && { transform: 'translateY(-50%) rotate(180deg)' }),
                }}>
                  ▼
                </div>
              </div>
              
              {/* Custom Dropdown */}
              {valueDropdownOpen && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(229, 231, 235, 0.6)',
                  borderRadius: '8px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
                  marginTop: '4px',
                }}>
                  {valueDisputeOptions.filter(option => option.key !== '').map((option, index) => (
                    <div
                      key={option.key}
                      onClick={() => handleValueSelect(option.key)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: index < valueDisputeOptions.length - 2 ? '1px solid rgba(229, 231, 235, 0.3)' : 'none',
                        transition: 'background-color 0.1s ease',
                        fontSize: '16px',
                        color: '#374151',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(54, 144, 206, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {option.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Information Section */}
          <div style={premiumSectionStyle}>
            <div style={premiumBannerStyle}>
              <Icon iconName="Info" style={{ fontSize: '1rem' }} />
              Additional Information
            </div>
            <Stack tokens={{ childrenGap: 20 }}>
              <div>
                <Toggle
                  label="Is Client Prepared to Provide a Reference?"
                  checked={formData.c_reference_status}
                  onChange={(_, checked) => handleInputChange('c_reference_status', checked || false)}
                  disabled={isSubmitting}
                  styles={premiumToggleStyle}
                />
                <div style={helpTextStyle}>
                  Indicates this case is suitable for inclusion in legal directories and professional publications
                </div>
              </div>

              <div>
                <Toggle
                  label="Is Counsel Instructed?"
                  checked={formData.counsel_instructed}
                  onChange={(_, checked) => handleInputChange('counsel_instructed', checked || false)}
                  disabled={isSubmitting}
                  styles={premiumToggleStyle}
                />
              </div>

              {formData.counsel_instructed && (
                <TextField
                  label="Counsel Name"
                  value={formData.counsel_name}
                  onChange={(_, value) => handleInputChange('counsel_name', value || '')}
                  placeholder="Enter counsel name"
                  disabled={isSubmitting}
                  styles={premiumInputStyle}
                />
              )}
            </Stack>
          </div>

          {/* Status Feedback Section */}
          {submitStatus !== 'idle' && (
            <div style={{
              background: submitStatus === 'success' ? 'rgba(34, 197, 94, 0.1)' : 
                         submitStatus === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                         'rgba(59, 130, 246, 0.1)',
              border: `1px solid ${submitStatus === 'success' ? 'rgba(34, 197, 94, 0.3)' : 
                                  submitStatus === 'error' ? 'rgba(239, 68, 68, 0.3)' : 
                                  'rgba(59, 130, 246, 0.3)'}`,
              borderRadius: '12px',
              padding: '1.25rem',
              marginTop: '1.25rem',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: submitStatus === 'success' ? '#16a34a' : 
                       submitStatus === 'error' ? '#dc2626' : 
                       '#2563eb',
              }}>
                {submitStatus === 'submitting' && (
                  <Icon iconName="More" style={{ fontSize: '1.25rem', animation: 'spin 1s linear infinite' }} />
                )}
                {submitStatus === 'success' && (
                  <Icon iconName="CheckMark" style={{ fontSize: '1.25rem' }} />
                )}
                {submitStatus === 'error' && (
                  <Icon iconName="ErrorBadge" style={{ fontSize: '1.25rem' }} />
                )}
                <Text variant="medium" style={{ fontWeight: '600' }}>
                  {submitMessage}
                </Text>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
            border: '1px solid rgba(229, 231, 235, 0.6)',
            borderTop: '2px solid rgba(54, 144, 206, 0.1)',
            borderRadius: '0 0 12px 12px',
            padding: '1.25rem',
            marginTop: '1.25rem',
            marginLeft: '-1.5rem',
            marginRight: '-1.5rem',
            marginBottom: '-1.5rem',
          }}>
            <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon iconName="Contact" style={{ fontSize: '1rem', color: '#6b7280' }} />
                <Text variant="small" style={{ color: '#374151', fontWeight: '600' }}>
                  {(() => {
                    if (users && users.length > 0) {
                      const currentUser = users[0];
                      const fullName = (currentUser as any)["Full Name"] || currentUser.FullName || `${currentUser.First || ''} ${currentUser.Last || ''}`.trim();
                      return fullName.split(' ')[0];
                    }
                    return 'User';
                  })()}
                </Text>
              </div>
              <Stack horizontal tokens={{ childrenGap: 12 }}>
                {onBack && (
                  <DefaultButton
                    text="Cancel"
                    onClick={onBack}
                    styles={premiumSecondaryButtonStyle}
                    iconProps={{ iconName: 'Cancel' }}
                  />
                )}
                <DefaultButton
                  text="Reset"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  styles={premiumSecondaryButtonStyle}
                  iconProps={{ iconName: 'Refresh' }}
                />
                <PrimaryButton
                  text={isSubmitting ? 'Submitting...' : submitStatus === 'success' ? 'Submitted!' : 'Submit Case Info'}
                  onClick={handleSubmit}
                  disabled={isSubmitting || submitStatus === 'success'}
                  styles={premiumPrimaryButtonStyle}
                  iconProps={
                    isSubmitting ? { iconName: 'More', style: { animation: 'spin 1s linear infinite' } } :
                    submitStatus === 'success' ? { iconName: 'CheckMark' } :
                    { iconName: 'DocumentSearch' }
                  }
                />
              </Stack>
            </Stack>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotableCaseInfoForm;
