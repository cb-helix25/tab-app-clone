// src/CustomForms/BespokeForms.tsx

import React from 'react';
import {
  Stack,
  Dropdown,
  Toggle,
  PrimaryButton,
  DefaultButton,
  TextField,
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
import { Matter } from '../app/functionality/types';

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
  gap: '20px',
});

export const inputFieldStyle = mergeStyles({
  height: `${INPUT_HEIGHT}px`,
  padding: '5px',
  border: `1px solid ${colours.light.border}`,
  borderRadius: componentTokens.stepHeader.base.borderRadius,
  backgroundColor: colours.light.inputBackground,
  boxSizing: 'border-box',
  selectors: {
    ':hover': {
      borderColor: colours.light.cta,
    },
    ':focus': {
      borderColor: colours.light.cta,
    },
    input: {
      padding: '0 5px',
    },
  },
});

export const dropdownStyle = mergeStyles({
  width: '300px',
  height: `${INPUT_HEIGHT}px`,
  border: `1px solid ${colours.light.border}`,
  borderRadius: componentTokens.stepHeader.base.borderRadius,
  backgroundColor: colours.light.inputBackground,
  display: 'flex',
  alignItems: 'center',
  padding: '0 5px',
  boxSizing: 'border-box',
  selectors: {
    ':hover': {
      borderColor: colours.light.cta,
    },
    ':focus-within': {
      borderColor: colours.light.cta,
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
  border: `1px solid ${colours.light.border}`,
  borderRight: 'none',
  borderTopLeftRadius: componentTokens.stepHeader.base.borderRadius,
  borderBottomLeftRadius: componentTokens.stepHeader.base.borderRadius,
  fontWeight: 'bold',
  padding: '0 5px',
});

export const amountInputStyle = (hasPrefix: boolean) =>
  mergeStyles({
    flexGrow: 1,
    width: '100%',
    height: '100%',
    border: `1px solid ${colours.light.border}`,
    borderRadius: hasPrefix
      ? `0 ${componentTokens.stepHeader.base.borderRadius} ${componentTokens.stepHeader.base.borderRadius} 0`
      : componentTokens.stepHeader.base.borderRadius,
    padding: '5px',
    backgroundColor: colours.light.inputBackground,
    boxSizing: 'border-box',
    appearance: 'textfield',
    selectors: {
      ':hover': {
        borderColor: colours.light.cta,
      },
      ':focus': {
        borderColor: colours.light.cta,
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
  matters: Matter[];
  onChange?: (values: { [key: string]: any }) => void;
  submitDisabled?: boolean;
  conflict?: boolean;
}

interface MatterReferenceDropdownProps {
  field: FormField;
  matters: Matter[];
  handleInputChange: (fieldName: string, value: any) => void;
  isSubmitting: boolean;
}

const MatterReferenceDropdown: React.FC<MatterReferenceDropdownProps> = ({
  field,
  matters,
  handleInputChange,
  isSubmitting,
}) => {
  const [filter, setFilter] = React.useState<string>('');

  const sortedOptions = React.useMemo<IComboBoxOption[]>(() => {
    return matters
      .slice()
      .sort((a, b) => new Date(b.OpenDate).getTime() - new Date(a.OpenDate).getTime())
      .map((m) => ({
        key: m.DisplayNumber,
        text: m.DisplayNumber,
      }));
  }, [matters]);

  return (
    <ComboBox
      label={field.label}
      placeholder="Select or enter Matter Reference"
      required={field.required}
      options={sortedOptions}
      allowFreeform
      autoComplete="on"
      onInputValueChange={(value: string) => setFilter(value)}
      onChange={(_, option, __, value) => {
        const selectedValue = option ? option.key : value;
        handleInputChange(field.name, selectedValue);
      }}
      onResolveOptions={(): IComboBoxOption[] => {
        if (!filter) return sortedOptions;
        return sortedOptions.filter((opt) =>
          opt.text.toLowerCase().includes(filter.toLowerCase())
        );
      }}
      disabled={isSubmitting}
      styles={{
        root: dropdownStyle,
        input: {
          height: `${INPUT_HEIGHT}px`,
          lineHeight: `${INPUT_HEIGHT}px`,
          padding: '0 5px',
          border: 'none',
        },
        callout: {
          width: '300px',
        },
      }}
    />
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
        <Stack tokens={{ childrenGap: 20 }}>
          {fields.map((field, index) => {
            if (
              field.label === 'Matter Reference' ||
              field.label === 'Matter Reference (if applicable)'
            ) {
              return (
                <MatterReferenceDropdown
                  key={index}
                  field={field}
                  matters={matters}
                  handleInputChange={handleInputChange}
                  isSubmitting={isSubmitting}
                />
              );
            }

            if (field.group === 'dateRange') {
              return (
                <Stack horizontal tokens={{ childrenGap: 10 }} key={index}>
                  <TextField
                    label={field.label}
                    required={field.required}
                    placeholder={field.placeholder}
                    type={field.type}
                    value={formValues[field.name]?.toString() || ''}
                    onChange={(e, value) =>
                      handleInputChange(field.name, value || '')
                    }
                    styles={{
                      fieldGroup: inputFieldStyle,
                      field: { padding: '0 5px' },
                    }}
                  />
                </Stack>
              );
            }

            if (field.showIf) {
              const controllingValue = formValues[field.showIf.field];
              if (controllingValue !== field.showIf.equals) {
                return null;
              }
            }
            switch (field.type) {
              case 'dropdown':
                return (
                  <React.Fragment key={index}>
                    <Dropdown
                      label={field.label}
                      options={(field.options || []).map(opt => ({ key: opt, text: opt }))}
                      onChange={(_, option) => handleInputChange(field.name, option?.key || '')}
                      required={field.required}
                      disabled={isSubmitting}
                      styles={{
                        dropdown: dropdownStyle,
                        callout: { width: '300px' },
                      }}
                    />
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
                  </React.Fragment>
                );
              
              case 'toggle':
                return (
                  <React.Fragment key={index}>
                    <div style={{ marginBottom: '15px' }}>
                      <Toggle
                        label={field.label}
                        checked={Boolean(formValues[field.name] ?? field.defaultValue)}
                        onText={field.onText}
                        offText={field.offText}
                        onChange={(_, checked) => handleInputChange(field.name, !!checked)}
                        disabled={isSubmitting}
                        styles={{ root: toggleStyle }}
                      />
                    </div>
                    {field.name === 'Is the amount you are sending over £50k' &&
                      formValues[field.name] === true && (
                        <div className={infoBoxStyle}>
                          Please note we will need to perform an extra verification check. Accounts will send a small random amount and a small random reference to the payee. You will need to ask them to confirm the amount and reference used before accounts can make the remaining balancing payment.
                        </div>
                    )}
                  </React.Fragment>
                );
                
              case 'textarea':
                return (
                  <TextField
                    key={index}
                    label={field.label}
                    multiline
                    rows={3}
                    required={field.required}
                    value={formValues[field.name]?.toString() || ''}
                    onChange={(e, value) =>
                      handleInputChange(field.name, value || '')
                    }
                    disabled={isSubmitting}
                    styles={{ fieldGroup: inputFieldStyle }}
                  />
                );
              case 'number':
              case 'currency-picker':
                return (
                  <div key={index} style={field.style}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: 600,
                      }}
                    >
                      {field.label}
                      {field.required && ' *'}
                    </label>
                    <div className={amountContainerStyle}>
                      {field.prefix && (
                        <span className={prefixStyle}>{field.prefix}</span>
                      )}
                      <TextField
                        required={field.required}
                        value={formValues[field.name]?.toString() || ''}
                        onChange={(e, value) =>
                          handleInputChange(field.name, value || '')
                        }
                        type="number"
                        disabled={isSubmitting}
                        styles={
                          field.styles || {
                            root: { flexGrow: 1 },
                            fieldGroup: amountInputStyle(!!field.prefix),
                          }
                        }
                        step={field.step}
                        min={field.min}
                        max={field.max}
                        readOnly={field.editable === false}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>
                    {field.helpText && (
                      <span
                        style={{
                          color: colours.greyText,
                          fontSize: '12px',
                          marginTop: '10px',
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
                  <div key={index} style={{ marginBottom: '15px' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: 600,
                      }}
                    >
                      {field.label}
                      {field.required && ' *'}
                    </label>
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
                return (
                  <TextField
                    key={index}
                    label={field.label}
                    required={field.required}
                    value={formValues[field.name]?.toString() || ''}
                    onChange={(e, value) =>
                      handleInputChange(field.name, value || '')
                    }
                    type={field.type}
                    disabled={isSubmitting}
                    styles={{
                      fieldGroup: inputFieldStyle,
                      field: { padding: '0 5px' },
                    }}
                  />
                );
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