import React, { useState, useCallback, useEffect } from 'react';
import { Modal, TextField, PrimaryButton, DefaultButton, Text, IconButton, MessageBar, MessageBarType } from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { Enquiry } from '../../app/functionality/types';

interface EditEnquiryModalProps {
  isOpen: boolean;
  enquiry: Enquiry | null;
  userEmail: string;
  onClose: () => void;
  onSave: (enquiryId: string, updates: Partial<Enquiry>) => Promise<void>;
}

/**
 * EditEnquiryModal
 * Modal for editing claimed enquiry details - only owner can edit
 */
const EditEnquiryModal: React.FC<EditEnquiryModalProps> = ({
  isOpen,
  enquiry,
  userEmail,
  onClose,
  onSave
}) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    First_Name: '',
    Last_Name: '',
    Email: '',
    Value: '',
    Initial_first_call_notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if current user owns this enquiry
  const isOwner = enquiry?.Point_of_Contact?.toLowerCase() === userEmail.toLowerCase();

  // Reset form when enquiry changes
  useEffect(() => {
    if (enquiry) {
      setFormData({
        First_Name: enquiry.First_Name || '',
        Last_Name: enquiry.Last_Name || '',
        Email: enquiry.Email || '',
        Value: enquiry.Value || '',
        Initial_first_call_notes: enquiry.Initial_first_call_notes || ''
      });
    }
    setError(null);
    setSuccess(null);
  }, [enquiry]);

  const handleFieldChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error when user starts typing
  }, []);

  const handleSave = useCallback(async () => {
    if (!enquiry || !isOwner) return;

    // Basic validation
    if (!formData.First_Name.trim() || !formData.Last_Name.trim()) {
      setError('First name and last name are required');
      return;
    }

    if (!formData.Email.trim()) {
      setError('Email is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.Email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Prepare updates - only include changed fields
      const updates: Partial<Enquiry> = {};
      if (formData.First_Name !== enquiry.First_Name) updates.First_Name = formData.First_Name.trim();
      if (formData.Last_Name !== enquiry.Last_Name) updates.Last_Name = formData.Last_Name.trim();
      if (formData.Email !== enquiry.Email) updates.Email = formData.Email.trim();
      if (formData.Value !== enquiry.Value) updates.Value = formData.Value.trim();
      if (formData.Initial_first_call_notes !== enquiry.Initial_first_call_notes) {
        updates.Initial_first_call_notes = formData.Initial_first_call_notes.trim();
      }

      if (Object.keys(updates).length === 0) {
        setError('No changes detected');
        return;
      }

      await onSave(enquiry.ID, updates);
      setSuccess('Enquiry updated successfully');
      
      // Close modal after brief success message
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Failed to save enquiry:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [enquiry, isOwner, formData, onSave, onClose]);

  if (!enquiry) return null;

  const modalStyles = {
    main: {
      background: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
      borderRadius: 12,
      border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
      boxShadow: isDarkMode 
        ? '0 20px 40px rgba(0,0,0,0.6)' 
        : '0 20px 40px rgba(0,0,0,0.15)',
      padding: 0,
      maxWidth: 500,
      width: '90vw'
    }
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 16px 24px',
    borderBottom: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    background: isDarkMode 
      ? 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)'
      : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
  };

  const contentStyle = {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20
  };

  const buttonRowStyle = {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    paddingTop: 8
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onClose}
      isBlocking={isSaving}
      styles={{ main: modalStyles.main }}
    >
      <div style={headerStyle}>
        <Text variant="large" styles={{ 
          root: { 
            fontWeight: 600, 
            color: isDarkMode ? colours.dark.text : colours.light.text 
          } 
        }}>
          Edit Enquiry
        </Text>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          onClick={onClose}
          styles={{
            root: {
              color: isDarkMode ? colours.dark.subText : colours.light.subText,
            }
          }}
        />
      </div>

      <div style={contentStyle}>
        {!isOwner && (
          <MessageBar messageBarType={MessageBarType.warning}>
            You can only edit enquiries that you have claimed.
          </MessageBar>
        )}

        {error && (
          <MessageBar messageBarType={MessageBarType.error}>
            {error}
          </MessageBar>
        )}

        {success && (
          <MessageBar messageBarType={MessageBarType.success}>
            {success}
          </MessageBar>
        )}

        <Text variant="medium" styles={{ 
          root: { 
            color: isDarkMode ? colours.dark.subText : colours.light.subText,
            marginBottom: 4
          } 
        }}>
          Enquiry ID: {enquiry.ID} • Claimed by: {enquiry.Point_of_Contact}
        </Text>

        <div style={{ display: 'flex', gap: 12 }}>
          <TextField
            label="First Name"
            value={formData.First_Name}
            onChange={(_, value) => handleFieldChange('First_Name', value || '')}
            disabled={!isOwner || isSaving}
            required
            styles={{
              root: { flex: 1 },
              fieldGroup: {
                borderColor: isDarkMode ? colours.dark.border : colours.light.border,
                background: isDarkMode ? colours.dark.inputBackground : colours.light.inputBackground
              }
            }}
          />
          <TextField
            label="Last Name"
            value={formData.Last_Name}
            onChange={(_, value) => handleFieldChange('Last_Name', value || '')}
            disabled={!isOwner || isSaving}
            required
            styles={{
              root: { flex: 1 },
              fieldGroup: {
                borderColor: isDarkMode ? colours.dark.border : colours.light.border,
                background: isDarkMode ? colours.dark.inputBackground : colours.light.inputBackground
              }
            }}
          />
        </div>

        <TextField
          label="Email"
          value={formData.Email}
          onChange={(_, value) => handleFieldChange('Email', value || '')}
          disabled={!isOwner || isSaving}
          required
          type="email"
          styles={{
            fieldGroup: {
              borderColor: isDarkMode ? colours.dark.border : colours.light.border,
              background: isDarkMode ? colours.dark.inputBackground : colours.light.inputBackground
            }
          }}
        />

        <TextField
          label="Value"
          value={formData.Value}
          onChange={(_, value) => handleFieldChange('Value', value || '')}
          disabled={!isOwner || isSaving}
          placeholder="e.g. £10,000, $50k, etc."
          styles={{
            fieldGroup: {
              borderColor: isDarkMode ? colours.dark.border : colours.light.border,
              background: isDarkMode ? colours.dark.inputBackground : colours.light.inputBackground
            }
          }}
        />

        <TextField
          label="Notes"
          value={formData.Initial_first_call_notes}
          onChange={(_, value) => handleFieldChange('Initial_first_call_notes', value || '')}
          disabled={!isOwner || isSaving}
          multiline
          rows={4}
          placeholder="Initial call notes..."
          styles={{
            fieldGroup: {
              borderColor: isDarkMode ? colours.dark.border : colours.light.border,
              background: isDarkMode ? colours.dark.inputBackground : colours.light.inputBackground
            }
          }}
        />

        <div style={buttonRowStyle}>
          <DefaultButton
            text="Cancel"
            onClick={onClose}
            disabled={isSaving}
          />
          <PrimaryButton
            text={isSaving ? 'Saving...' : 'Save Changes'}
            onClick={handleSave}
            disabled={!isOwner || isSaving}
          />
        </div>
      </div>
    </Modal>
  );
};

export default EditEnquiryModal;
