import React, { useState } from 'react';
import {
  Stack,
  Text,
  Toggle,
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
  onSubmit: (data: { serviceDescription: string; amount: number; isMultiClient: boolean; clients: ClientInfo[] }) => void;
  onCancel: () => void;
}

// Service options, 'Other' triggers bespoke input
const SERVICE_OPTIONS: IDropdownOption[] = [
  { key: 'Shareholder Dispute', text: 'Shareholder Dispute' },
  { key: 'Debt Recovery', text: 'Debt Recovery' },
  { key: 'Commercial Contract', text: 'Commercial Contract' },
  { key: 'Other', text: 'Other (bespoke)' },
];

const DealCaptureForm: React.FC<DealCaptureFormProps> = ({ enquiry, onSubmit, onCancel }) => {
  const { isDarkMode } = useTheme();
  const [useBespoke, setUseBespoke] = useState(false);
  const [serviceDescription, setServiceDescription] = useState(enquiry.Type_of_Work || '');
  const [selectedOption, setSelectedOption] = useState<IDropdownOption | undefined>(
    SERVICE_OPTIONS.find(opt => opt.text === enquiry.Type_of_Work)
  );
  const [amount, setAmount] = useState('');
  const [isMultiClient, setIsMultiClient] = useState(false);
  const [clients, setClients] = useState<ClientInfo[]>([{ firstName: '', lastName: '', email: '' }]);
  const [error, setError] = useState<string | null>(null);

  const vat = amount ? parseFloat(amount) * 0.2 : 0;
  const total = amount ? parseFloat(amount) + vat : 0;

  const handleConfirm = () => {
    if (!serviceDescription || !amount) {
      setError('Service description and amount are required');
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) {
      setError('Amount must be a number');
      return;
    }
    setError(null);
    onSubmit({ serviceDescription, amount: parsed, isMultiClient, clients });
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

  const addClientStyle = mergeStyles({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 14px 2px 7px',
    borderRadius: '18px',
    border: `1px dotted ${colours.greyText}`,
    color: colours.greyText,
    background: isDarkMode ? colours.dark.background : colours.light.background,
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '6px',
    marginBottom: 0,
    transition: 'background 0.15s',
    userSelect: 'none',
    ':hover': {
      background: isDarkMode ? '#222' : '#f3f3f3',
      color: colours.highlight,
      borderColor: colours.highlight,
    }
  });

  return (
    <Stack tokens={{ childrenGap: 14 }}>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Stack horizontal tokens={{ childrenGap: 8 }}>
        <span className={tagStyle}>{enquiry.Area_of_Work}</span>
        <span className={tagStyle}>ID {enquiry.ID}</span>
      </Stack>

      {/* Service Description */}
      <Stack>
        {!useBespoke ? (
          <Dropdown
            label="Service Description"
            options={SERVICE_OPTIONS}
            styles={{ dropdown: dropdownStyle }}
            selectedKey={selectedOption?.key}
            onChange={(_, option) => {
              if (option?.key === 'Other') {
                setUseBespoke(true);
                setServiceDescription('');
              } else {
                setSelectedOption(option);
                setServiceDescription(option?.text || '');
              }
            }}
            required
          />
        ) : (
          <Stack>
            <TextField
              label="Bespoke Description"
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
              ← Back to standard options
            </span>
          </Stack>
        )}
      </Stack>

      {/* Amount */}
      <Stack styles={{ root: { width: '50%' } }}>
        <TextField
          label="Amount (ex. VAT)"
          required
          prefix="£"
          type="number"
          step={50}
          value={amount}
          onChange={(_, v) => setAmount(v || '')}
          styles={{ fieldGroup: inputFieldStyle }}
        />
        {/* Tooltip-like info below the field */}
{!!amount && (
  <Text
    variant="small"
    styles={{
      root: {
        color: colours.greyText,
        marginTop: 4,
        marginLeft: 2,
        padding: '4px 0 0 2px',
        background: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
        borderRadius: 4,
        display: 'inline-block',
        fontSize: 13,
      },
    }}
  >
    {(clients[0].firstName ? clients[0].firstName : "The client")} will be asked to pay £{total.toFixed(2)} on account
  </Text>
)}
      </Stack>

      <Toggle
        label="Proof of ID for multiple clients"
        checked={isMultiClient}
        onText="Yes"
        offText="No"
        onChange={(_, checked) => setIsMultiClient(!!checked)}
        styles={{
          root: { marginTop: 2, marginBottom: 6 }
        }}
      />
      {isMultiClient && (
        <Stack tokens={{ childrenGap: 8 }}>
          {clients.map((client, index) => (
            <Stack horizontal tokens={{ childrenGap: 10 }} key={index} verticalAlign="end">
              <Stack styles={{ root: { width: '25%' } }}>
                <TextField
                  label="First Name"
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
                  label="Last Name"
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
                  label="Email"
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
            onClick={() => setClients([...clients, { firstName: '', lastName: '', email: '' }])}
            tabIndex={0}
            role="button"
            aria-label="Add client"
          >
            <span style={{ fontSize: 20, marginRight: 4, fontWeight: 400, marginTop: -2 }}>+</span>
            Add Client
          </span>
        </Stack>
      )}
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
  );
};

export default DealCaptureForm;
