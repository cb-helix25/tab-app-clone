import React, { useState, useRef, useLayoutEffect } from 'react';
import { Stack, Label, TextField, mergeStyles, IconButton } from '@fluentui/react';
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
  handleAmountChange: (v?: string) => void;
  handleAmountBlur: () => void;
  handleDealFormSubmit: (data: {
    serviceDescription: string;
    amount: number;
    isMultiClient: boolean;
    clients: { firstName: string; lastName: string; email: string; }[]
  }) => void;
  dealId?: string | number | null;
  clientIds?: (string | number)[];
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
  dealId,
  clientIds,
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

  const toggleCcBccStyle = mergeStyles({
    color: colours.greyText,
    cursor: 'pointer',
    fontSize: 12,
    marginTop: 6,
    selectors: {
      ':hover': { color: colours.darkBlue },
    },
  });

  const [showCcBcc, setShowCcBcc] = useState(false);
  const toCcBccRef = useRef<HTMLDivElement>(null);
  const [descHeight, setDescHeight] = useState(0);
  const [rowSpacing, setRowSpacing] = useState(0);

  useLayoutEffect(() => {
    if (toCcBccRef.current) {
      const leftHeight = toCcBccRef.current.getBoundingClientRect().height;
      // Align the "Subject" field with the "Amount" field. The amount field is
      // spaced 14px below the service description while the left column uses an
      // 8px gap. Always offset by this 6px difference and account for any extra
      // height from the description box.
      const spacing = Math.max(descHeight - leftHeight, 0) + 6;
      setRowSpacing(spacing);
    }
  }, [descHeight, showCcBcc]);

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
        <div ref={toCcBccRef} style={{ marginBottom: rowSpacing }}>
          <Stack tokens={{ childrenGap: 6 }}>
            <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="end">
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
              {showCcBcc && (
                <>
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
                  <IconButton
                    iconProps={{ iconName: 'Cancel' }}
                    ariaLabel="Hide CC/BCC"
                    onClick={() => setShowCcBcc(false)}
                    styles={{
                      root: {
                        marginBottom: 24,
                        marginLeft: 4,
                        backgroundColor: 'transparent',
                      },
                      rootHovered: { backgroundColor: 'transparent', color: colours.highlight },
                    }}
                  />
                </>
              )}
            </Stack>
            {!showCcBcc && (
              <span className={toggleCcBccStyle} onClick={() => setShowCcBcc(true)}>
                Add CC/BCC
              </span>
            )}
          </Stack>
        </div>
        {/* Row 2: Subject */}
        <Stack>
          <div className={intakeContainer}>
            <div className={intakeHeader}>Subject</div>
            <TextField
              value={subject}
              onChange={(_, val) => setSubject(val || '')}
              placeholder="Email subject"
              ariaLabel="Subject"
              styles={{ fieldGroup: [inputFieldStyle, { border: 'none', borderRadius: 0 }] }}
            />
          </div>
        </Stack>
        {/* Row 3: Enquiry Notes */}
        {enquiry.Initial_first_call_notes && (
          <Stack>
            <div className={enquiryNotesBoxStyle}>
              <Label className={labelStyle}>Enquiry Notes</Label>
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
          dealId={dealId}
          clientIds={clientIds}
          onAmountChange={handleAmountChange}
          onAmountBlur={handleAmountBlur}
          serviceDescription={serviceDescription}
          setServiceDescription={setServiceDescription}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          onDescriptionHeightChange={setDescHeight}
        />
      </Stack>
    </Stack>
  );
};

export default PitchHeaderRow;
