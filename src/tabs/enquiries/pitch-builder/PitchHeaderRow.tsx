import React, { useState, useRef, useEffect } from "react";
import {
  Stack,
  TextField,
  mergeStyles,
  IconButton,
  Separator,
  Text,
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
    borderRadius: 0,
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
    fontFamily: 'monospace',
    fontSize: 14,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    width: '100%',
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

  const [showCc, setShowCc] = useState(!!cc);
  const [showBcc, setShowBcc] = useState(!!bcc);
  const toCcBccRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);
  const [descHeight, setDescHeight] = useState(0);
  const rowSpacing = 12; // simple consistent spacing
  // Static spacing below the enquiry notes
  const notesSpacing = 8;
  const [dealFormSaved, setDealFormSaved] = useState(false);

  // Previously aligned the subject field with the amount input using
  // calculated spacing. With the simplified layout we use static spacing
  // so this effect is no longer required.

    useEffect(() => {
    if (cc && !showCc) {
      setShowCc(true);
    }
  }, [cc, showCc]);

  useEffect(() => {
    if (bcc && !showBcc) {
      setShowBcc(true);
    }
  }, [bcc, showBcc]);


  const sideContainerStyle = mergeStyles({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: 8,
  });

  const dealSideContainerStyle = (saved: boolean) =>
    mergeStyles(sideContainerStyle, {
      border: saved ? `2px solid ${colours.green}` : 'none',
      opacity: saved ? 0.6 : 1,
    });

  const verticalSeparatorStyle = mergeStyles({
    margin: '0',
    alignSelf: 'stretch',
    display: 'none',
    '@media (min-width: 768px)': {
      display: 'block',
    },
    selectors: {
      '::before': {
        backgroundColor: isDarkMode ? colours.dark.border : colours.light.border,
        width: 2,
      },
    },
  });

  return (
    <Stack
      tokens={{ childrenGap: 16 }}
      styles={{
        root: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: 16,
          '@media (min-width: 768px)': {
            flexDirection: 'row',
          },
        },
      }}
    >
        {/* LEFT SIDE (Details) */}
      <Stack className={sideContainerStyle}>
        {/* Row 1: Enquiry Details */}
        <Stack
          style={{
            marginBottom: notesSpacing,
            transition: "margin 0.2s ease",
          }}
        >
          <div className={enquiryNotesContainer}>
            <div className={enquiryNotesHeader}>Enquiry Details</div>
            <Stack className={enquiryNotesContent}>
              <Text>
                {enquiry.First_Name} {enquiry.Last_Name}
              </Text>
              {enquiry.Email && <Text>Email: {enquiry.Email}</Text>}
              {enquiry.Phone_Number && (
                <Text>Phone: {enquiry.Phone_Number}</Text>
              )}
              {enquiry.Secondary_Phone && (
                <Text>Alt Phone: {enquiry.Secondary_Phone}</Text>
              )}
            </Stack>
          </div>
        </Stack>

        {enquiry.Initial_first_call_notes && (
          <div className={notesContainerStyle} style={{ marginBottom: notesSpacing }}>
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
              Initial Notes
            </Text>
            <Text styles={{ root: { whiteSpace: 'pre-wrap' } }}>
              {enquiry.Initial_first_call_notes}
            </Text>
          </div>
        )}

        {/* Row 2: Email Details */}
        <div ref={toCcBccRef} style={{ marginBottom: rowSpacing }}>
          <div className={enquiryNotesContainer}>
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
        </Stack>
        <Separator vertical className={verticalSeparatorStyle} />
        {/* RIGHT SIDE (Deal Form) */}
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
  </Stack>
  );
};

export default PitchHeaderRow;
