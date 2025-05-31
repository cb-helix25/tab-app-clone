import React from 'react';
import { Stack, Separator, Label, TextField, mergeStyles } from '@fluentui/react';
import { Enquiry } from '../../../app/functionality/types';
import DealCaptureForm from './DealCaptureForm';
import { colours } from '../../../app/styles/colours';
import { inputFieldStyle } from '../../../CustomForms/BespokeForms';
import { IDropdownOption, Dropdown } from '@fluentui/react';

interface PitchHeaderRowProps {
  enquiry: Enquiry;
  to: string;
  setTo: (v: string) => void;
  cc: string;
  setCc: (v: string) => void;
  bcc: string;
  setBcc: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  serviceDescription: string;
  setServiceDescription: (v: string) => void;
  selectedOption: IDropdownOption | undefined;
  setSelectedOption: (o: IDropdownOption | undefined) => void;
  SERVICE_OPTIONS: IDropdownOption[];
  amount: string;
  handleAmountChange: (_: any, v?: string) => void;
  handleAmountBlur: () => void;
  handleDealFormSubmit: (data: {
    serviceDescription: string;
    amount: number;
    isMultiClient: boolean;
    clients: { firstName: string; lastName: string; email: string; }[]
  }) => void;
  isDarkMode: boolean;
}

const PitchHeaderRow: React.FC<PitchHeaderRowProps> = ({
  enquiry,
  to,
  setTo,
  cc,
  setCc,
  bcc,
  setBcc,
  subject,
  setSubject,
  serviceDescription,
  setServiceDescription,
  selectedOption,
  setSelectedOption,
  SERVICE_OPTIONS,
  amount,
  handleAmountChange,
  handleAmountBlur,
  handleDealFormSubmit,
  isDarkMode,
}) => {
  const wrapperStyle = {
    root: {
      backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
      borderRadius: 12,
      boxShadow: isDarkMode
        ? '0 4px 12px ' + colours.dark.border
        : '0 4px 12px ' + colours.light.border,
      padding: 24,
      width: '100%',
      position: 'relative' as const,
      transition: 'background 0.3s, box-shadow 0.3s',
    },
  };

  const enquiryDetailsStyle = mergeStyles({
    background: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
    borderRadius: 8,
    padding: 16,
    boxShadow: isDarkMode
      ? `0 0 0 1px ${colours.dark.border}`
      : `0 0 0 1px ${colours.light.border}`,
  });

  const labelStyle = mergeStyles({
    fontWeight: '600',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    paddingTop: '20px',
    paddingBottom: '5px',
  });

  return (
    <Stack horizontal tokens={{ childrenGap: 20 }} styles={wrapperStyle}>
      {/* DETAILS SECTION */}
      <Stack
        grow
        className={enquiryDetailsStyle}
        styles={{ root: { width: '50%', paddingRight: 20 } }}
        tokens={{ childrenGap: 16 }}
      >
        {/* Enquiry Details */}
        <Stack horizontal tokens={{ childrenGap: 16 }}>
          <Stack grow>
            <Label className={labelStyle}>To</Label>
            <TextField
              value={to}
              onChange={(_, val) => setTo(val || '')}
              placeholder="Recipient email"
              ariaLabel="To"
              styles={{ fieldGroup: inputFieldStyle }}
            />
          </Stack>
          <Stack grow>
            <Label className={labelStyle}>CC</Label>
            <TextField
              value={cc}
              onChange={(_, val) => setCc(val || '')}
              placeholder="CC emails"
              ariaLabel="CC"
              styles={{ fieldGroup: inputFieldStyle }}
            />
          </Stack>
          <Stack grow>
            <Label className={labelStyle}>BCC</Label>
            <TextField
              value={bcc}
              onChange={(_, val) => setBcc(val || '')}
              placeholder="BCC emails"
              ariaLabel="BCC"
              styles={{ fieldGroup: inputFieldStyle }}
            />
          </Stack>
        </Stack>

        <Stack horizontal tokens={{ childrenGap: 16 }}>
          <Stack grow>
            <Label className={labelStyle}>Subject</Label>
            <TextField
              value={subject}
              onChange={(_, val) => setSubject(val || '')}
              placeholder="Email subject"
              ariaLabel="Subject"
              styles={{ fieldGroup: inputFieldStyle }}
            />
          </Stack>
        </Stack>

        {enquiry.Initial_first_call_notes && (
          <>
            <Label className={labelStyle}>Enquiry Notes</Label>
            <Stack
              styles={{
                root: {
                  background: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
                  borderRadius: 6,
                  padding: 12,
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  whiteSpace: 'pre-wrap',
                  fontSize: 14,
                },
              }}
            >
              {enquiry.Initial_first_call_notes}
            </Stack>
          </>
        )}
      </Stack>

      {/* VERTICAL SEPARATOR */}
      <Separator vertical styles={{ root: { height: 'auto', alignSelf: 'stretch' } }} />

      {/* DEALS SECTION */}
      <Stack grow styles={{ root: { width: '50%', paddingLeft: 20 } }}>
        <DealCaptureForm
          enquiry={enquiry}
          onSubmit={handleDealFormSubmit}
          onCancel={() => {}}
          areaOfWork={enquiry.Area_of_Work}
          enquiryId={enquiry.ID}
        />
      </Stack>
    </Stack>
  );
};

export default PitchHeaderRow;
