import React, { useState, useRef, useLayoutEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  Dropdown,
  IDropdownOption,
  IconButton,
  Icon,
  mergeStyles,
  PrimaryButton,
  Label,
} from '@fluentui/react';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';
import { inputFieldStyle, dropdownStyle } from '../../../CustomForms/BespokeForms';
import { useTheme } from '../../../app/functionality/ThemeContext';
import { colours } from '../../../app/styles/colours';
import { Enquiry } from '../../../app/functionality/types';

const poundPrefixBox = {
  background: '#ffffff',
  border: `1px solid ${colours.light.border}`,
  borderRadius: '6px',
  padding: '2px 8px',
  marginRight: 8,
  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
  transform: 'translateY(-6px)',
};


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
  onToggleTopChange?: (top: number) => void;
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
  onToggleTopChange,
}) => {
  const { isDarkMode } = useTheme();
  const [useBespoke, setUseBespoke] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>();
  const [isMultiClient, setIsMultiClient] = useState(false);
  const [clients, setClients] = useState<ClientInfo[]>([{ firstName: '', lastName: '', email: '' }]);
  const [error, setError] = useState<string | null>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

  // Service description area height callback for parent
  useLayoutEffect(() => {
    if (descRef.current) {
      onDescriptionHeightChange?.(descRef.current.getBoundingClientRect().height);
    }
  }, [onDescriptionHeightChange, useBespoke, serviceDescription, selectedOption]);

  useLayoutEffect(() => {
    if (toggleRef.current) {
      onToggleTopChange?.(toggleRef.current.getBoundingClientRect().top);
    }
  }, [onToggleTopChange, isMultiClient, amount, amountError, serviceDescription, selectedOption]);

  const vat = amount ? parseFloat(amount.replace(/,/g, '')) * 0.2 : 0;
  const total = amount ? parseFloat(amount.replace(/,/g, '')) + vat : 0;
  const showPaymentInfo =
    !amountError &&
    !!amount &&
    !isNaN(Number(amount.replace(/,/g, ''))) &&
    Number(amount.replace(/,/g, '')) > 0;

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
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: 4,
    backgroundColor: colours.tagBackground,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    fontSize: 12,
    fontWeight: 600,
    marginRight: 8,
    marginBottom: 4,
  });

  const labelStyle = mergeStyles({
    fontWeight: '600',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    paddingBottom: '5px',
  });

  const intakeContainer = mergeStyles({
    border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    borderRadius: 4,
    overflow: 'hidden',
  });

  const intakeHeader = mergeStyles({
    background: colours.darkBlue,
    color: '#fff',
    padding: '4px 8px',
    fontWeight: 600,
    fontSize: 13,
  });

  const toggleContainer = mergeStyles({
    display: 'flex',
    border: `2px solid ${colours.darkBlue}`,
    borderRadius: 4,
    overflow: 'hidden',
    minHeight: 64,
    width: 'fit-content',
    cursor: 'pointer',
    marginTop: 8,
    marginBottom: 8,
  });

const toggleHalf = (selected: boolean) =>
  mergeStyles({
    padding: '10px 16px',
    backgroundColor: selected
      ? colours.darkBlue
      : isDarkMode
      ? colours.dark.inputBackground
      : colours.light.inputBackground,
    color: selected ? '#fff' : isDarkMode ? colours.dark.text : colours.light.text,
    fontWeight: selected ? 600 : 400,
    fontSize: 13,
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s, color 0.2s',
    boxShadow: selected ? `inset 0 0 0 2px ${colours.darkBlue}` : 'none',
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
      background: isDarkMode ? colours.dark.cardBackground : colours.grey,
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

  const rootStackStyle = mergeStyles({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  });

  return (
    <Stack tokens={{ childrenGap: 14 }} className={rootStackStyle}>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}

      {/* Service Description */}
      <Stack>
        <div ref={descRef}>
          {!useBespoke ? (
            <Stack tokens={{ childrenGap: 6 }}>
              <div className={intakeContainer}>
                <div className={intakeHeader}>Service Description</div>
                <Dropdown
                  options={SERVICE_OPTIONS}
                  styles={{ dropdown: [dropdownStyle, { border: 'none', borderRadius: 0 }] }}
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
              </div>
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
            </Stack>
          ) : (
            <Stack>
              <div className={intakeContainer}>
                <div className={intakeHeader}>Freehand Description</div>
                <TextField
                  multiline
                  required
                  value={serviceDescription}
                  onChange={(_, v) => setServiceDescription((v || '').slice(0, 200))}
                  styles={{
                    fieldGroup: [inputFieldStyle, { border: 'none', borderRadius: 0 }],
                    prefix: { paddingBottom: 0, paddingLeft: 4, display: 'flex', alignItems: 'center' },
                  }}
                  maxLength={200}
                />
              </div>
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
      <div>
        <Stack styles={{ root: { width: '50%' } }}>
          <div className={intakeContainer}>
            <div className={intakeHeader}>Amount (ex. VAT)</div>
          <TextField
            required
            prefix="£"
            type="text"
            value={amount}
            onChange={handleAmountChange}
            onBlur={handleAmountBlur}
            styles={{
              fieldGroup: [inputFieldStyle, { border: 'none', borderRadius: 0 }],
              prefix: poundPrefixBox,
              field: { marginTop: 6 },
            }}
            errorMessage={amountError}
            inputMode="decimal"
          />
        </div>

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
      </div>

      <Stack>
        <div ref={toggleRef} className={toggleContainer} aria-label="Select ID type">
          <div
            className={toggleHalf(!isMultiClient)}
            onClick={() => setIsMultiClient(false)}
          >
            <Icon iconName="Contact" styles={{ root: { marginRight: 6 } }} />
            Individual
          </div>
          <div
            className={toggleHalf(isMultiClient)}
            onClick={() => setIsMultiClient(true)}
          >
            <Icon iconName="ContactGroup" styles={{ root: { marginRight: 6 } }} />
            Multiple Clients
          </div>
        </div>
      </Stack>
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
        styles={{ root: { marginTop: 'auto' } }}
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
        </Stack>
      </Stack>
    </Stack>
  );
};

export default DealCaptureForm;
