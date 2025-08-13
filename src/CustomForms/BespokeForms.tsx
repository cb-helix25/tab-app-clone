// src/CustomForms/BespokeForms.tsx
// invisible change

import React from 'react';
import {
  Stack,
  Toggle,
  PrimaryButton,
  DefaultButton,
  ComboBox,
  IComboBoxOption,
} from '@fluentui/react';
import { mergeStyles } from '@fluentui/react';
import { colours } from '../app/styles/colours';
import { componentTokens } from '../app/styles/componentTokens';
import {
  sharedPrimaryButtonStyles,
  sharedDefaultButtonStyles,
} from '../app/styles/ButtonStyles';
import { NormalizedMatter } from '../app/functionality/types';
import '../app/styles/MultiSelect.css';

export const INPUT_HEIGHT = 40;

export const formContainerStyle = mergeStyles({
  marginTop: '10px',
  padding: '20px',
  backgroundColor: colours.light.sectionBackground,
  borderRadius: componentTokens.stepHeader.base.borderRadius,
  border: `1px solid ${componentTokens.stepContent.borderColor}`,
  boxShadow: componentTokens.stepContent.boxShadow,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const inputFieldStyle = mergeStyles({
  height: `${INPUT_HEIGHT}px`,
  padding: '5px',
  border: `1px solid ${colours.highlight}`,
  borderRadius: 0,
  backgroundColor: colours.light.sectionBackground,
  boxSizing: 'border-box',
  selectors: {
    ':hover': {
      borderColor: colours.highlight,
    },
    ':focus': {
      borderColor: colours.highlight,
    },
    input: {
      padding: '0 5px',
    },
  },
});

export const dropdownStyle = mergeStyles({
  width: '100%',
  height: `${INPUT_HEIGHT}px`,
  border: `1px solid ${colours.highlight}`,
  borderRadius: 0,
  backgroundColor: '#fff',
  display: 'flex',
  alignItems: 'center',
  padding: '0 5px',
  boxSizing: 'border-box',
  selectors: {
    ':hover': {
      borderColor: colours.highlight,
    },
    ':focus-within': {
      borderColor: colours.highlight,
    },
    '.ms-Dropdown-title': {
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none',
      padding: '0 5px',
      height: '100%',
      lineHeight: `${INPUT_HEIGHT}px`,
    },
    '.ms-Dropdown-caretDown': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
    },
    '.ms-ComboBox-CaretDown-button': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      border: 'none',
      backgroundColor: 'transparent',
    },
  },
});

export const amountContainerStyle = mergeStyles({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: `${INPUT_HEIGHT}px`,
});

export const prefixStyle = mergeStyles({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '50px',
  height: '100%',
  backgroundColor: colours.light.sectionBackground,
  border: `1px solid ${colours.highlight}`,
  borderRight: 'none',
  fontWeight: 'bold',
  padding: '0 5px',
});

export const amountInputStyle = (hasPrefix: boolean) =>
  mergeStyles({
    flexGrow: 1,
    width: '100%',
    height: '100%',
    border: `1px solid ${colours.highlight}`,
    borderRadius: 0,
    padding: '5px',
    backgroundColor: colours.light.sectionBackground,
    boxSizing: 'border-box',
    appearance: 'textfield',
    selectors: {
      ':hover': {
        borderColor: colours.highlight,
      },
      ':focus': {
        borderColor: colours.highlight,
      },
      '::-webkit-inner-spin-button, ::-webkit-outer-spin-button': {
        appearance: 'none',
        margin: 0,
      },
      input: {
        padding: '0 5px',
      },
    },
  });

export const toggleStyle = mergeStyles({
  height: `${INPUT_HEIGHT}px`,
  backgroundColor: componentTokens.toggleButton.base.backgroundColor,
  color: componentTokens.toggleButton.base.color,
  border: componentTokens.toggleButton.base.border,
  borderRadius: componentTokens.toggleButton.base.borderRadius,
  padding: componentTokens.toggleButton.base.padding,
  selectors: {
    ':hover': {
      backgroundColor: componentTokens.toggleButton.hover.backgroundColor,
    },
  },
});
  
  // One-off info-box styles for CHAPS guide & >£50k message
  export const infoBoxStyle = mergeStyles({
    backgroundColor: colours.light.sectionBackground,
    borderLeft: `4px solid ${colours.light.cta}`,
    padding: '10px 15px',
    margin: '5px 0 15px',
    borderRadius: '2px',
  });
  export const infoLinkStyle = mergeStyles({
    color: colours.light.cta,
    textDecoration: 'underline',
  });

export interface FormField {
  label: string;
  name: string;
  type:
    | 'number'
    | 'text'
    | 'textarea'
    | 'dropdown'
    | 'toggle'
    | 'currency-picker'
    | 'file'
    | 'message'
    | 'date'
    | 'time';
  options?: string[];
  step?: number;
  min?: number;
  max?: number;
  editable?: boolean;
  required?: boolean;
  defaultValue?: boolean | string | number | File;
  prefix?: string;
  helpText?: string;
  placeholder?: string;
  group?: string;
  styles?: { [key: string]: any };
  onText?: string;
  offText?: string;
  style?: React.CSSProperties;
  showIf?: { field: string; equals: any };
}

export interface BespokeFormProps {
  fields: FormField[];
  onSubmit: (values: { [key: string]: any }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  matters: NormalizedMatter[];
  onChange?: (values: { [key: string]: any }) => void;
  submitDisabled?: boolean;
  conflict?: boolean;
}

interface MatterReferenceDropdownProps {
  field: FormField;
  matters: NormalizedMatter[];
  handleInputChange: (fieldName: string, value: any) => void;
  isSubmitting: boolean;
  value: string;
}

const MatterReferenceDropdown: React.FC<MatterReferenceDropdownProps> = ({
  field,
  matters,
  handleInputChange,
  isSubmitting,
  value,
}) => {
  // Create clean options from matters data
  const options = React.useMemo<IComboBoxOption[]>(() => {
    if (!matters || matters.length === 0) {
      return [];
    }

    return matters
      .filter(m => m && (m.displayNumber || m.matterId))
      .sort((a, b) => {
        const dateA = new Date(a.openDate || '').getTime();
        const dateB = new Date(b.openDate || '').getTime();
        return dateB - dateA; // Most recent first
      })
      .map((m) => {
        const displayNum = m.displayNumber || m.matterId || '';
        const desc = m.description || '';
        return {
          key: displayNum,
          text: desc ? `${displayNum} - ${desc}` : displayNum,
        };
      });
  }, [matters]);

  return (
    <div>
      <div className="question-banner">{field.label}</div>
      <ComboBox
        placeholder="Select or enter Matter Reference"
        required={field.required}
        options={options}
        allowFreeform={true}
        autoComplete="on"
        selectedKey={value || undefined}
        text={value || ''}
        onChange={(_, option, __, inputValue) => {
          const newValue = option ? option.key as string : inputValue || '';
          handleInputChange(field.name, newValue);
        }}
        disabled={isSubmitting}
        styles={{
          root: { 
            width: '100%',
            height: `${INPUT_HEIGHT}px`,
          },
          input: {
            height: `${INPUT_HEIGHT}px`,
            lineHeight: `${INPUT_HEIGHT}px`,
            padding: '0 12px',
            border: `1px solid ${colours.highlight}`,
            borderRadius: 0,
            fontSize: '14px',
          },
          callout: {
            maxHeight: 280,
            minWidth: 400,
            zIndex: 1100,
          },
          optionsContainer: {
            maxHeight: 280,
            selectors: {
              '.ms-ComboBox-option': {
                minHeight: '36px !important',
                padding: '8px 12px !important',
                fontSize: '14px !important',
                lineHeight: '1.3 !important',
              },
            },
          },
        }}
      />
    </div>
  );
};

const BespokeForm: React.FC<BespokeFormProps> = ({
  fields,
  onSubmit,
  onCancel,
  isSubmitting = false,
  onChange,
  style,
  children,
  matters,
  conflict = false,
  submitDisabled = false,
}) => {
  const [formValues, setFormValues] = React.useState<{ [key: string]: any }>(
    fields.reduce((acc, field) => {
      if (field.defaultValue !== undefined) {
        acc[field.name] = field.defaultValue;
      }
      return acc;
    }, {} as { [key: string]: any })
  );

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('FileReader result was not a string'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormValues((prev) => {
      const newValues = { ...prev, [fieldName]: value };
      if (onChange) {
        onChange(newValues);
      }
      return newValues;
    });
  };

  const handleFileChange = async (fieldName: string, file: File | null) => {
    if (!file) return;
    try {
      const base64 = await convertFileToBase64(file);
      handleInputChange(fieldName, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        base64: base64,
      });
    } catch (err) {
      console.error('File read error:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formValues);
  };

  const handleClear = () => {
    setFormValues({});
  };

  return (
    <form onSubmit={handleSubmit} style={style}>
      <div className={formContainerStyle}>
        <Stack tokens={{ childrenGap: 12 }}>
          {fields.map((field, index) => {
            if (
              field.label === 'Matter Reference' ||
              field.label === 'Matter Reference (if applicable)' ||
              field.label === 'File/ Matter Reference'
            ) {
              return (
                <MatterReferenceDropdown
                  key={index}
                  field={field}
                  matters={matters}
                  handleInputChange={handleInputChange}
                  isSubmitting={isSubmitting}
                  value={formValues[field.name]?.toString() || ''}
                />
              );
            }

            if (field.showIf) {
              const controllingValue = formValues[field.showIf.field];
              if (controllingValue !== field.showIf.equals) {
                return null;
              }
            }

            const questionBanner = (
              <div className="question-banner">
                {field.label}
                {field.required ? ' *' : ''}
              </div>
            );

            switch (field.type) {
              case 'dropdown':
                return (
                  <div key={index}>
                    {questionBanner}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: `${INPUT_HEIGHT}px`,
                        border: `1px solid ${colours.highlight}`,
                        background: '#fff',
                        overflow: 'hidden',
                      }}
                    >
                      <select
                        value={formValues[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        required={field.required}
                        disabled={isSubmitting}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          background: 'transparent',
                          padding: '0 40px 0 16px',
                          fontSize: '16px',
                          appearance: 'none',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="" disabled>
                          Select {field.label}
                        </option>
                        {(field.options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <div
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: colours.highlight,
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M6 9l6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                    {field.name === 'Payment Type' &&
                      formValues['Payment Type'] === 'CHAPS (same day over £1m)' && (
                        <div className={infoBoxStyle}>
                          For accounts/ whoever making payment – please refer to this{' '}
                          <a
                            href="https://app.nuclino.com/Helix-Law-Limited/Team-Helix/CHAPS-Same-Day-Purpose-Codes-bc03cd9f-117c-4061-83a1-bdf18bd88072"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={infoLinkStyle}
                          >
                            guide
                          </a>.
                        </div>
                      )}
                  </div>
                );

              case 'toggle':
                return (
                  <div key={index}>
                    {questionBanner}
                    <Toggle
                      checked={Boolean(formValues[field.name] ?? field.defaultValue)}
                      onText={field.onText}
                      offText={field.offText}
                      onChange={(_, checked) => handleInputChange(field.name, !!checked)}
                      disabled={isSubmitting}
                      styles={{ root: toggleStyle }}
                    />
                    {field.name === 'Is the amount you are sending over £50,000?' &&
                      formValues[field.name] === true && (
                        <div className={infoBoxStyle}>
                          Please note we will need to perform an extra verification check. Accounts will send a small random amount and a small random reference to the payee. You will need to ask them to confirm the amount and reference used before accounts can make the remaining balancing payment.
                        </div>
                      )}
                  </div>
                );

              case 'textarea':
                return (
                  <div key={index}>
                    {questionBanner}
                    <textarea
                      required={field.required}
                      value={formValues[field.name]?.toString() || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        border: `1px solid ${colours.highlight}`,
                        borderRadius: 0,
                        padding: '8px',
                        boxSizing: 'border-box',
                      }}
                    />
                    {field.helpText && (
                      <span
                        style={{
                          color: colours.greyText,
                          fontSize: '12px',
                          marginTop: '4px',
                          display: 'block',
                        }}
                      >
                        {field.helpText}
                      </span>
                    )}
                  </div>
                );

              case 'date':
              case 'time':
                return (
                  <div key={index}>
                    {questionBanner}
                    <input
                      type={field.type}
                      required={field.required}
                      value={formValues[field.name]?.toString() || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      disabled={isSubmitting}
                      step={field.step}
                      min={field.min}
                      max={field.max}
                      placeholder={field.placeholder}
                      style={{
                        width: '100%',
                        height: `${INPUT_HEIGHT}px`,
                        border: `1px solid ${colours.highlight}`,
                        borderRadius: 0,
                        padding: '0 10px',
                        boxSizing: 'border-box',
                      }}
                    />
                    {field.helpText && (
                      <span
                        style={{
                          color: colours.greyText,
                          fontSize: '12px',
                          marginTop: '4px',
                          display: 'block',
                        }}
                      >
                        {field.helpText}
                      </span>
                    )}
                  </div>
                );

              case 'number':
              case 'currency-picker':
              case 'text':
                return (
                  <div key={index} style={field.style}>
                    {questionBanner}
                    {field.prefix ? (
                      <div className={amountContainerStyle}>
                        <span className={prefixStyle}>{field.prefix}</span>
                        <input
                          type="number"
                          required={field.required}
                          value={formValues[field.name]?.toString() || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          disabled={isSubmitting}
                          step={field.step}
                          min={field.min}
                          max={field.max}
                          style={{
                            width: '100%',
                            height: '100%',
                            border: `1px solid ${colours.highlight}`,
                            borderRadius: 0,
                            padding: '0 10px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    ) : (
                      <input
                        type={field.type === 'number' || field.type === 'currency-picker' ? 'number' : 'text'}
                        required={field.required}
                        value={formValues[field.name]?.toString() || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        disabled={isSubmitting}
                        step={field.step}
                        min={field.min}
                        max={field.max}
                        style={{
                          width: '100%',
                          height: `${INPUT_HEIGHT}px`,
                          border: `1px solid ${colours.highlight}`,
                          borderRadius: 0,
                          padding: '0 10px',
                          boxSizing: 'border-box',
                        }}
                      />
                    )}
                    {field.helpText && (
                      <span
                        style={{
                          color: colours.greyText,
                          fontSize: '12px',
                          marginTop: '4px',
                          display: 'block',
                        }}
                      >
                        {field.helpText}
                      </span>
                    )}
                  </div>
                );

              case 'file':
                const fileValue = formValues[field.name];
                return (
                  <div key={index}>
                    {questionBanner}
                    <PrimaryButton
                      text="Upload File"
                      iconProps={{ iconName: 'Upload' }}
                      onClick={() => {
                        const fileInput = document.getElementById(
                          `file-input-${index}`
                        );
                        fileInput?.click();
                      }}
                      styles={sharedPrimaryButtonStyles}
                      disabled={isSubmitting}
                    />
                    <input
                      id={`file-input-${index}`}
                      type="file"
                      required={field.required}
                      onChange={(e) =>
                        handleFileChange(
                          field.name,
                          e.target.files ? e.target.files[0] : null
                        )
                      }
                      style={{ display: 'none' }}
                    />
                    {fileValue?.fileName && (
                      <span
                        style={{
                          marginTop: '10px',
                          display: 'block',
                          fontSize: '14px',
                        }}
                      >
                        Selected File: {fileValue.fileName}
                      </span>
                    )}
                    <span
                      style={{
                        color: colours.greyText,
                        fontSize: '12px',
                        marginTop: '10px',
                        display: 'block',
                      }}
                    >
                      Drag and drop a file or click to select one.
                    </span>
                    {field.helpText && (
                      <span
                        style={{
                          color: colours.greyText,
                          fontSize: '12px',
                          display: 'block',
                          marginTop: '5px',
                        }}
                      >
                        {field.helpText}
                      </span>
                    )}
                  </div>
                );
              default:
                return null;
            }
          })}
          {children}
          <Stack horizontal tokens={{ childrenGap: 10 }}>
            <PrimaryButton
              type="submit"
              text={isSubmitting ? 'Submitted' : 'Submit'}
              iconProps={conflict ? { iconName: 'Lock' } : undefined}
              styles={
                conflict ? sharedDefaultButtonStyles : sharedPrimaryButtonStyles
              }
              disabled={isSubmitting || conflict}
            />
            <DefaultButton
              type="button"
              text="Clear"
              onClick={handleClear}
              styles={sharedDefaultButtonStyles}
              disabled={isSubmitting}
            />
            <DefaultButton
              type="button"
              text="Cancel"
              onClick={onCancel}
              styles={sharedDefaultButtonStyles}
              disabled={isSubmitting}
            />
          </Stack>
        </Stack>
      </div>
    </form>
  );
};

export default BespokeForm;