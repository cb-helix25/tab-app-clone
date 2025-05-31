import React from 'react';
import { Stack, Label, TextField, mergeStyles } from '@fluentui/react';
import { Enquiry } from '../../../app/functionality/types';
import DealCaptureForm from './DealCaptureForm';
import { colours } from '../../../app/styles/colours';
import { inputFieldStyle } from '../../../CustomForms/BespokeForms';
import { IDropdownOption } from '@fluentui/react';

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
  const labelStyle = mergeStyles({
    fontWeight: '600',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    paddingBottom: '5px',
  });

  const enquiryNotesBoxStyle = mergeStyles({
    background: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
    borderRadius: 6,
    padding: 12,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    whiteSpace: 'pre-wrap',
    fontSize: 14,
    border: isDarkMode ? `1px solid ${colours.dark.border}` : `1px solid ${colours.light.border}`,
    marginTop: 8,
  });

  return (
    <Stack horizontal tokens={{ childrenGap: 24 }} verticalAlign="start" styles={{
      root: {
        backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
        borderRadius: 12,
        boxShadow: isDarkMode
          ? '0 4px 12px ' + colours.dark.border
          : '0 4px 12px ' + colours.light.border,
        padding: 24,
        width: '100%',
        transition: 'background 0.3s, box-shadow 0.3s',
      }
    }}>
      {/* LEFT SIDE (Details) */}
      <Stack tokens={{ childrenGap: 8 }} styles={{ root: { width: '50%' } }}>
        {/* Row 1: To / CC / BCC */}
        <Stack horizontal tokens={{ childrenGap: 12 }}>
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
        {/* Row 2: Subject */}
        <Stack>
          <Label className={labelStyle}>Subject</Label>
          <TextField
            value={subject}
            onChange={(_, val) => setSubject(val || '')}
            placeholder="Email subject"
            ariaLabel="Subject"
            styles={{ fieldGroup: inputFieldStyle }}
          />
        </Stack>
        {/* Row 3: Enquiry Notes */}
        {enquiry.Initial_first_call_notes && (
          <Stack>
            <Label className={labelStyle}>Enquiry Notes</Label>
            <div className={enquiryNotesBoxStyle}>
              {enquiry.Initial_first_call_notes}
            </div>
          </Stack>
        )}
      </Stack>
      {/* RIGHT SIDE (Deal Form) */}
      <Stack styles={{ root: { width: '50%' } }} verticalAlign="start">
        <DealCaptureForm
          enquiry={enquiry}
          onSubmit={handleDealFormSubmit}
          onCancel={() => {}}
          areaOfWork={enquiry.Area_of_Work}
          enquiryId={enquiry.ID}
          onAmountChange={handleAmountChange}
          onAmountBlur={handleAmountBlur}
        />
      </Stack>
    </Stack>
  );
};

export default PitchHeaderRow;
