import React, { useState, useRef, useLayoutEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  Dropdown,
  IDropdownOption,
  IconButton,
  mergeStyles,
  PrimaryButton,
  DefaultButton,
} from '@fluentui/react';
import { sharedPrimaryButtonStyles, sharedDefaultButtonStyles } from '../../../app/styles/ButtonStyles';
import { inputFieldStyle, dropdownStyle } from '../../../CustomForms/BespokeForms';
import { useTheme } from '../../../app/functionality/ThemeContext';
import { colours } from '../../../app/styles/colours';
import { Enquiry } from '../../../app/functionality/types';

interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface DealCaptureFormProps {
  enquiry: Enquiry;
  onSubmit: (data: {
    serviceDescription: string;
    amount: number;
    isMultiClient: boolean;
    clients: ClientInfo[];
  }) => void;
  onCancel: () => void;
  areaOfWork?: string;
  enquiryId?: string | number;
  dealId?: string | number | null;
  clientIds?: (string | number)[];
  onAmountChange?: (val: string) => void;
  onAmountBlur?: (val: string) => void;
  serviceDescription: string;
  setServiceDescription: (val: string) => void;
  selectedOption: IDropdownOption | undefined;
  setSelectedOption: (opt: IDropdownOption | undefined) => void;
  onDescriptionHeightChange?: (height: number) => void;
}

// Service options, 'Other' triggers bespoke input
const SERVICE_OPTIONS: IDropdownOption[] = [
  { key: 'Shareholder Dispute', text: 'Shareholder Dispute' },
  { key: 'Debt Recovery', text: 'Debt Recovery' },
  { key: 'Commercial Contract', text: 'Commercial Contract' },
  { key: 'Other', text: 'Other (bespoke)' },
];

function formatCurrency(val: string | number) {
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
  if (isNaN(num) || num === 0) return '£0.00';
  return num.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

const DealCaptureForm: React.FC<DealCaptureFormProps> = ({
  enquiry,
  onSubmit,
  onCancel,
  areaOfWork,
  enquiryId,
  dealId,
  clientIds,
  onAmountChange,
  onAmountBlur,
  serviceDescription,
  setServiceDescription,
  selectedOption,
  setSelectedOption,
  onDescriptionHeightChange,
}) => {
  const { isDarkMode } = useTheme();
  const [useBespoke, setUseBespoke] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>();
  const [isMultiClient, setIsMultiClient] = useState(false);
  const [clients, setClients] = useState<ClientInfo[]>([{ firstName: '', lastName: '', email: '' }]);
  const [error, setError] = useState<string | null>(null);
  const descRef = useRef<HTMLDivElement>(null);

  // Service description area height callback for parent
  useLayoutEffect(() => {
    if (descRef.current) {
      onDescriptionHeightChange?.(descRef.current.getBoundingClientRect().height);
    }
  }, [onDescriptionHeightChange, useBespoke, serviceDescription, selectedOption]);

  const vat = amount ? parseFloat(amount.replace(/,/g, '')) * 0.2 : 0;
  const total = amount ? parseFloat(amount.replace(/,/g, '')) + vat : 0;

  // Format on blur, accept number while typing
  const handleAmountChange = (_: any, val?: string) => {
    if (!val) {
      setAmount('');
      setAmountError(undefined);
      onAmountChange?.('');
      return;
    }
    // Allow partial valid input while typing (e.g. "4000." or "4,000.5")
    const raw = val.replace(/,/g, '');
    if (raw && !/^\d*\.?\d{0,2}$/.test(raw)) {
      setAmount(val);
      setAmountError('Invalid amount');
      onAmountChange?.(val);
      return;
    }
    setAmount(val);
    setAmountError(undefined);
    onAmountChange?.(val);
  };

  const handleAmountBlur = () => {
    if (!amount) {
      onAmountBlur?.('');
      return;
    }
    const num = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(num) || num <= 0) {
      setAmountError('Amount must be a positive number');
      onAmountBlur?.(amount);
    } else {
      const formatted = num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setAmount(formatted);
      setAmountError(undefined);
      onAmountBlur?.(formatted);
    }
  };

  const handleConfirm = () => {
    const num = parseFloat(amount.replace(/,/g, ''));
    if (!serviceDescription || !amount) {
      setError('Service description and amount are required');
      return;
    }
    if (isNaN(num) || num <= 0) {
      setAmountError('Amount must be a positive number');
      setError('Please enter a valid amount');
      return;
    }
    setError(null);
    onSubmit({ serviceDescription, amount: num, isMultiClient, clients });
  };

  const tagStyle = mergeStyles({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '13px',
    marginRight: '7px',
    marginBottom: '2px',
    fontWeight: 600,
    background: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
    border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    letterSpacing: '0.2px',
  });

  const toggleContainer = mergeStyles({
    display: 'flex',
    border: `1px solid ${colours.highlight}`,
    borderRadius: 4,
    overflow: 'hidden',
    width: 'fit-content',
    cursor: 'pointer',
    marginTop: 8,
    marginBottom: 8,
  });

  const toggleHalf = (selected: boolean) =>
    mergeStyles({
      padding: '6px 14px',
      backgroundColor: selected
        ? '#eef4ff'
        : isDarkMode
        ? colours.dark.background
        : colours.light.background,
      color: isDarkMode ? colours.dark.text : colours.light.text,
      fontWeight: selected ? 600 : 400,
      fontSize: 13,
      userSelect: 'none',
      transition: 'background-color 0.3s, color 0.3s',
    });

  const addClientStyle = mergeStyles({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 14px 2px 7px',
    borderRadius: 18,
    border: `1px dotted ${colours.greyText}`,
    color: colours.greyText,
    background: isDarkMode ? colours.dark.background : colours.light.background,
    fontSize: 13,
    cursor: 'pointer',
    marginTop: 6,
    marginBottom: 0,
    transition: 'background 0.15s',
    userSelect: 'none',
    ':hover': {
      background: isDarkMode ? '#222' : '#f3f3f3',
      color: colours.highlight,
      borderColor: colours.highlight,
    },
  });

  const infoTextClass = (show: boolean) =>
    mergeStyles({
      maxHeight: show ? 32 : 0,
      opacity: show ? 1 : 0,
      overflow: 'hidden',
      transition: 'max-height 0.2s ease, opacity 0.2s ease',
      borderLeft: `3px solid ${colours.highlight}`,
      padding: show ? '6px 8px' : '0 8px',
      marginTop: 4,
      marginBottom: 4,
      background: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
      color: isDarkMode ? colours.dark.text : colours.light.text,
      fontSize: 13,
    });

  const toggleFreehandStyle = mergeStyles({
    color: colours.greyText,
    cursor: 'pointer',
    fontSize: 12,
    marginTop: 6,
    selectors: {
      ':hover': { color: colours.highlight },
    },
  });

  return (
    <Stack tokens={{ childrenGap: 14 }}>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}

      {/* Service Description */}
      <Stack>
        <div ref={descRef}>
          {!useBespoke ? (
            <>
              <Dropdown
                label="Service Description"
                options={SERVICE_OPTIONS}
                styles={{ dropdown: dropdownStyle }}
                selectedKey={selectedOption?.key}
                onChange={(_, option) => {
                  if (option?.key === 'Other') {
                    setUseBespoke(true);
                    setServiceDescription('');
                    setSelectedOption(undefined);
                  } else {
                    setSelectedOption(option);
                    setServiceDescription(option?.text || '');
                  }
                }}
                required
              />
              <span
                className={toggleFreehandStyle}
                onClick={() => {
                  setUseBespoke(true);
                  setServiceDescription('');
                  setSelectedOption(undefined);
                }}
              >
                Use freehand description
              </span>
            </>
          ) : (
            <Stack>
              <TextField
                label="Freehand Description"
                multiline
                required
                value={serviceDescription}
                onChange={(_, v) => setServiceDescription((v || '').slice(0, 200))}
                styles={{ fieldGroup: inputFieldStyle }}
                maxLength={200}
              />
              <Text
                variant="small"
                styles={{ root: { color: colours.greyText, marginTop: 2, marginLeft: 2 } }}
              >
                {serviceDescription.length}/200 characters
              </Text>
              <span
                onClick={() => setUseBespoke(false)}
                style={{
                  color: colours.highlight,
                  cursor: 'pointer',
                  fontSize: 13,
                  marginTop: 6,
                }}
              >
                ← Back to dropdown options
              </span>
            </Stack>
          )}
        </div>
      </Stack>

      {/* Amount */}
      <Stack styles={{ root: { width: '50%' } }}>
        <TextField
          label="Amount (ex. VAT)"
          required
          prefix="£"
          type="text"
          value={amount}
          onChange={handleAmountChange}
          onBlur={handleAmountBlur}
          styles={{ fieldGroup: inputFieldStyle }}
          errorMessage={amountError}
          inputMode="decimal"
        />
        {/* Tooltip-like info below the field */}
        {!amountError &&
          !!amount &&
          !isNaN(Number(amount.replace(/,/g, ''))) &&
          Number(amount.replace(/,/g, '')) > 0 && (
            <Text
              variant="small"
              styles={{
                root: {
                  color: colours.greyText,
                  marginTop: 4,
                  marginLeft: 2,
                  padding: '4px 0 0 2px',
                  background: isDarkMode
                    ? colours.dark.cardBackground
                    : colours.light.cardBackground,
                  borderRadius: 4,
                  display: 'inline-block',
                  fontSize: 13,
                },
              }}
            >
              {(clients[0].firstName || 'The client')} will be asked to pay{' '}
              {formatCurrency(Number(amount.replace(/,/g, '')) * 1.2)} on account
            </Text>
          )}
      </Stack>

      <div className={toggleContainer} aria-label="Select ID type">
        <div
          className={toggleHalf(!isMultiClient)}
          onClick={() => setIsMultiClient(false)}
        >
          Single-client ID
        </div>
        <div
          className={toggleHalf(isMultiClient)}
          onClick={() => setIsMultiClient(true)}
        >
          Multi-client ID
        </div>
      </div>
      <div className={infoTextClass(isMultiClient)}>
        Enter the name and email address of each additional client.
      </div>
      {isMultiClient && (
        <Stack tokens={{ childrenGap: 8 }}>
          {clients.map((client, index) => (
            <Stack horizontal tokens={{ childrenGap: 10 }} key={index} verticalAlign="end">
              <Stack styles={{ root: { width: '25%' } }}>
                <TextField
                  placeholder="First Name"
                  value={client.firstName}
                  onChange={(_, v) => {
                    const updated = [...clients];
                    updated[index].firstName = v || '';
                    setClients(updated);
                  }}
                  styles={{ fieldGroup: inputFieldStyle }}
                />
              </Stack>
              <Stack styles={{ root: { width: '25%' } }}>
                <TextField
                  placeholder="Last Name"
                  value={client.lastName}
                  onChange={(_, v) => {
                    const updated = [...clients];
                    updated[index].lastName = v || '';
                    setClients(updated);
                  }}
                  styles={{ fieldGroup: inputFieldStyle }}
                />
              </Stack>
              <Stack styles={{ root: { width: '50%' } }}>
                <TextField
                  placeholder="Email"
                  value={client.email}
                  onChange={(_, v) => {
                    const updated = [...clients];
                    updated[index].email = v || '';
                    setClients(updated);
                  }}
                  styles={{ fieldGroup: inputFieldStyle }}
                />
              </Stack>
              {clients.length > 1 && (
                <IconButton
                  iconProps={{ iconName: 'Delete' }}
                  styles={{
                    root: {
                      marginBottom: 20,
                      marginLeft: 2,
                      color: '#d13438', // red
                    }
                  }}
                  ariaLabel="Remove client"
                  onClick={() => setClients(clients.filter((_, i) => i !== index))}
                />
              )}
            </Stack>
          ))}
          <span
            className={addClientStyle}
            onClick={() =>
              setClients([...clients, { firstName: '', lastName: '', email: '' }])
            }
            tabIndex={0}
            role="button"
            aria-label="Add client"
          >
            <span style={{ fontSize: 20, marginRight: 4, fontWeight: 400, marginTop: -2 }}>+</span>
            Add Client
          </span>
        </Stack>
      )}
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        tokens={{ childrenGap: 10 }}
      >
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          {areaOfWork && <span className={tagStyle}>{areaOfWork}</span>}
          {enquiryId && <span className={tagStyle}>ID {enquiryId}</span>}
          {dealId && <span className={tagStyle}>Deal {dealId}</span>}
          {clientIds &&
            clientIds.map((id, idx) => (
              <span key={idx} className={tagStyle}>
                Client {id}
              </span>
            ))}
        </Stack>
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <PrimaryButton
            text="Confirm & Save"
            onClick={handleConfirm}
            styles={sharedPrimaryButtonStyles}
          />
          <DefaultButton
            text="Cancel"
            onClick={onCancel}
            styles={sharedDefaultButtonStyles}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default DealCaptureForm;
