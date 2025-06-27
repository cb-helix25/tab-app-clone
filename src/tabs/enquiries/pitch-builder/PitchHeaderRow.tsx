import React, { useState, useRef, useEffect } from "react";
import {
  Stack,
  TextField,
  mergeStyles,
  IconButton,
  Text,
  MessageBar,
  MessageBarType,
} from "@fluentui/react";
import { Enquiry } from "../../../app/functionality/types";
import DealCaptureForm from "./DealCaptureForm";
import { colours } from "../../../app/styles/colours";
import { inputFieldStyle } from "../../../CustomForms/BespokeForms";
import { IDropdownOption } from "@fluentui/react";

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
    dealExpiry: string;
    isMultiClient: boolean;
    clients: { firstName: string; lastName: string; email: string }[];
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

  const labelColour = isDarkMode ? '#fff' : colours.darkBlue;

  const sectionStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
    padding: 16,           // more padding
    gap: 8,                // consistent gap
    border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    borderRadius: 4,       // slight rounding
    backgroundColor: isDarkMode
      ? colours.dark.sectionBackground
      : colours.light.sectionBackground,
  };;

  const enquiryNotesContainer = mergeStyles(sectionStyle);

  const enquiryNotesHeader = mergeStyles({
    color: labelColour,
    fontWeight: 600,
    fontSize: 13,
    lineHeight: 1.2,
    marginBottom: 8,    // ↑ more breathing room under the title
  });

  const enquiryNotesContent = mergeStyles({
    whiteSpace: 'pre-wrap',
    fontSize: 14,
    color: labelColour,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  });

  const notesContainerStyle = mergeStyles({
    background: '#ffffff',
    border: `1px solid ${colours.light.border}`,
    borderRadius: 0,
    padding: 12,
    fontSize: 14,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    width: '100%',
  });

  const notesTextStyle = mergeStyles({
    fontFamily: 'Raleway',
  });

  const intakeContainer = mergeStyles(sectionStyle);

  const intakeHeader = mergeStyles({
    color: labelColour,
    fontWeight: 600,
    fontSize: 13,
    marginBottom: 8,    // ↑ match the enquiry title spacing
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  });

  const toggleCcBccStyle = mergeStyles({
    color: colours.greyText,
    cursor: 'pointer',
    fontSize: 12,
    marginTop: 6,
    selectors: {
      ':hover': { color: labelColour },

    },
  });

  const detailRowStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
  });

  const detailLabelStyle = mergeStyles({ fontWeight: 600 });

  const detailValueStyle = mergeStyles({ flexGrow: 1, overflowWrap: 'anywhere' });

  const copyBtnStyle = mergeStyles({
    background: 'none',
    border: 'none',
    color: colours.highlight,
    cursor: 'pointer',
    padding: 0,
    fontSize: 12,
    selectors: { ':hover': { textDecoration: 'underline' } },
  });

  const [showCc, setShowCc] = useState(!!cc);
  const [showBcc, setShowBcc] = useState(false);
  const toCcBccRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);
  const [descHeight, setDescHeight] = useState(0);
  // Static spacing below the enquiry notes
  const notesSpacing = 8;
  const [dealFormSaved, setDealFormSaved] = useState(false);

  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const copy = (text?: string) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(null), 2000);
      })
      .catch((err) => console.error('Failed to copy: ', err));
  };

  // Previously aligned the subject field with the amount input using
  // calculated spacing. With the simplified layout we use static spacing
  // so this effect is no longer required.

  useEffect(() => {
    if (cc && !showCc) {
      setShowCc(true);
    }
  }, [cc, showCc]);



  const headerRowStyle = mergeStyles({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: 16,
    '@media (min-width: 768px)': {
      flexDirection: 'row',
    },
  });

  const dealSideContainerStyle = (saved: boolean) =>
    mergeStyles({
      width: '100%',
      border: saved ? `2px solid ${colours.green}` : 'none',
      opacity: saved ? 0.6 : 1,
    });

  return (
    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { width: '100%' } }}>
      <div className={headerRowStyle}>
        {/* Enquiry Details */}
        <div className={enquiryNotesContainer}>
          <div className={enquiryNotesHeader}>Enquiry Details</div>
          <Stack className={enquiryNotesContent}>
            <div className={detailRowStyle}>
              <span className={detailLabelStyle}>Name:</span>
              <span className={detailValueStyle}>
                {enquiry.First_Name} {enquiry.Last_Name}
              </span>
              <IconButton
                iconProps={{ iconName: 'Copy' }}
                styles={{ root: { background: 'none', padding: 0 } }}
                ariaLabel="Copy Name"
                onClick={() =>
                  copy(`${enquiry.First_Name ?? ''} ${enquiry.Last_Name ?? ''}`.trim())
                }
              />
            </div>
            {enquiry.Email && (
              <div className={detailRowStyle}>
                <span className={detailLabelStyle}>Email:</span>
                <span className={detailValueStyle}>{enquiry.Email}</span>
                <IconButton
                  iconProps={{ iconName: 'Copy' }}
                  styles={{ root: { background: 'none', padding: 0 } }}
                  ariaLabel="Copy Email"
                  onClick={() => copy(enquiry.Email!)}
                />
              </div>
            )}
            {enquiry.Phone_Number && (
              <div className={detailRowStyle}>
                <span className={detailLabelStyle}>Phone:</span>
                <span className={detailValueStyle}>{enquiry.Phone_Number}</span>
                <IconButton
                  iconProps={{ iconName: 'Copy' }}
                  styles={{ root: { background: 'none', padding: 0 } }}
                  ariaLabel="Copy Phone"
                  onClick={() => copy(enquiry.Phone_Number!)}
                />
              </div>
            )}
            {enquiry.Secondary_Phone && (
              <Text>Alt Phone: {enquiry.Secondary_Phone}</Text>
            )}
          </Stack>
          {enquiry.Initial_first_call_notes && (
            <div className={notesContainerStyle} style={{ marginTop: 12 }}>
              <div className={enquiryNotesHeader}>Initial Notes</div>
              <Text
                className={notesTextStyle}
                styles={{ root: { whiteSpace: 'pre-wrap' } }}
              >
                {enquiry.Initial_first_call_notes}
              </Text>
            </div>
          )}
        </div>

        {/* Email Details */}
        <div ref={toCcBccRef} className={enquiryNotesContainer}>
          <div className={enquiryNotesHeader}>Email Details</div>
          <div className={enquiryNotesContent}>
            <Stack tokens={{ childrenGap: 6 }}>
              <Stack
                horizontal
                wrap
                  tokens={{ childrenGap: 12 }}
                  verticalAlign="end"
                  styles={{ root: { width: '100%' } }}
                >
                  <Stack.Item grow styles={{ root: { minWidth: 250 } }}>
                    <div className={intakeContainer}>
                      <div className={intakeHeader}>To</div>
                      <TextField
                        value={to}
                        onChange={(_, val) => setTo(val || "")}
                        placeholder="Recipient email"
                        ariaLabel="To"
                        styles={{
                          root: { margin: 0 },
                          fieldGroup: [
                            inputFieldStyle,
                            { border: "none", borderRadius: 0 },
                          ],
                        }}
                      />
                    </div>
                  </Stack.Item>
                  {showCc && (
                    <Stack.Item grow styles={{ root: { minWidth: 250 } }}>
                      <div className={intakeContainer}>
                        <div className={intakeHeader}>
                          CC
                          <IconButton
                            iconProps={{ iconName: "Cancel" }}
                            ariaLabel="Hide CC"
                            onClick={() => setShowCc(false)}
                            styles={{
                              root: {
                                backgroundColor: "transparent",
                                padding: 0,
                                marginLeft: 4,
                                height: 16,
                                width: 16,
                              },
                              rootHovered: {
                                backgroundColor: "transparent",
                                color: colours.highlight,
                              },
                              icon: { fontSize: 12, color: labelColour },
                            }}
                          />
                        </div>
                        <TextField
                          value={cc}
                          onChange={(_, val) => setCc(val || "")}
                          placeholder="CC emails"
                          ariaLabel="CC"
                          styles={{
                            fieldGroup: [
                              inputFieldStyle,
                              { border: "none", borderRadius: 0 },
                            ],
                          }}
                        />
                      </div>
                    </Stack.Item>
                  )}
                  {showBcc && (
                    <Stack.Item grow styles={{ root: { minWidth: 250 } }}>
                      <div className={intakeContainer}>
                        <div className={intakeHeader}>
                          BCC
                          <IconButton
                            iconProps={{ iconName: "Cancel" }}
                            ariaLabel="Hide BCC"
                            onClick={() => setShowBcc(false)}
                            styles={{
                              root: {
                                backgroundColor: "transparent",
                                padding: 0,
                                marginLeft: 4,
                                height: 16,
                                width: 16,
                              },
                              rootHovered: {
                                backgroundColor: "transparent",
                                color: colours.highlight,
                              },
                              icon: { fontSize: 12, color: labelColour },
                            }}
                          />
                        </div>
                        <TextField
                          value={bcc}
                          onChange={(_, val) => setBcc(val || "")}
                          placeholder="BCC emails"
                          ariaLabel="BCC"
                          styles={{
                            fieldGroup: [
                              inputFieldStyle,
                              { border: "none", borderRadius: 0 },
                            ],
                          }}
                        />
                      </div>
                    </Stack.Item>
                  )}
                </Stack>
                {(!showCc || !showBcc) && (
                  <Stack horizontal tokens={{ childrenGap: 8 }}>
                    {!showCc && (
                      <span
                        className={toggleCcBccStyle}
                        onClick={() => setShowCc(true)}
                      >
                        CC
                      </span>
                    )}
                    {!showBcc && (
                      <span
                        className={toggleCcBccStyle}
                        onClick={() => setShowBcc(true)}
                      >
                        BCC
                      </span>
                    )}
                  </Stack>
                )}
                <Stack>
                  <div ref={subjectRef} className={intakeContainer}>
                    <div className={intakeHeader}>Subject</div>
                    <TextField
                      value={subject}
                      onChange={(_, val) => setSubject(val || "")}
                      placeholder="Email subject"
                      ariaLabel="Subject"
                      styles={{
                        root: { margin: 0 },
                        fieldGroup: [
                          inputFieldStyle,
                          { border: "none", borderRadius: 0 },
                        ],
                      }}
                    />
                  </div>
                </Stack>
              </Stack>
            </div>
          </div>

        </div>

      {/* Deal Capture Form */}
      <Stack verticalAlign="stretch" className={dealSideContainerStyle(dealFormSaved)}>
        <DealCaptureForm
          enquiry={enquiry}
          onSubmit={handleDealFormSubmit}
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
          onSavedChange={setDealFormSaved}
        />
      </Stack>
      {copySuccess && (
        <MessageBar
          messageBarType={MessageBarType.success}
          isMultiline={false}
          onDismiss={() => setCopySuccess(null)}
          dismissButtonAriaLabel="Close"
          styles={{
            root: {
              position: 'fixed',
              bottom: 20,
              right: 20,
              maxWidth: '300px',
              zIndex: 1000,
              borderRadius: 0,
              backgroundColor: colours.green,
              color: 'white',
            },
          }}
        >
          {copySuccess}
        </MessageBar>
      )}
    </Stack>
  );
};

export default PitchHeaderRow;