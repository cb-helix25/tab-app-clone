import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
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

  const enquiryNotesContainer = mergeStyles({
    border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    borderRadius: 4,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    width: "100%",
  });

  const enquiryNotesHeader = mergeStyles({
    background: colours.grey,
    color: colours.darkBlue,
    padding: '4px 8px',
    fontWeight: 600,
    fontSize: 13,
  });

  const enquiryNotesContent = mergeStyles({
    background: isDarkMode
      ? colours.dark.sectionBackground
      : colours.light.sectionBackground,
    padding: 12,
    color: colours.darkBlue,
    whiteSpace: "pre-wrap",
    fontSize: 14,
  });

  const intakeContainer = mergeStyles({
    border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    borderRadius: 4,
    overflow: "hidden",
  });

  const intakeHeader = mergeStyles({
    background: colours.darkBlue,
    color: "#fff",
    padding: "4px 8px",
    fontWeight: 600,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  });

  const toggleCcBccStyle = mergeStyles({
    color: colours.greyText,
    cursor: "pointer",
    fontSize: 12,
    marginTop: 6,
    selectors: {
      ":hover": { color: colours.darkBlue },

    },
  });

  const [showCc, setShowCc] = useState(!!cc);
  const [showBcc, setShowBcc] = useState(!!bcc);
  const toCcBccRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);
  const [descHeight, setDescHeight] = useState(0);
  const [rowSpacing, setRowSpacing] = useState(0);
  // Static spacing below the enquiry notes
  const notesSpacing = 8;
  const [dealFormSaved, setDealFormSaved] = useState(false);

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
  }, [descHeight, showCc, showBcc]);

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
    backgroundColor: isDarkMode
      ? colours.dark.sectionBackground
      : colours.light.sectionBackground,
    borderRadius: 12,
    boxShadow: isDarkMode
      ? "0 4px 12px " + colours.dark.border
      : "0 4px 12px " + colours.light.border,
    padding: 24,
    width: "100%",
    transition: "background 0.3s, box-shadow 0.3s",
  });

  const dealSideContainerStyle = (saved: boolean) =>
    mergeStyles(sideContainerStyle, {
      border: `2px solid ${saved ? colours.green : "transparent"}`,
      boxShadow: saved
        ? `inset 0 0 8px ${colours.green}55, ${
            isDarkMode
              ? "0 4px 12px " + colours.dark.border
              : "0 4px 12px " + colours.light.border
          }`
        : isDarkMode
        ? "0 4px 12px " + colours.dark.border
        : "0 4px 12px " + colours.light.border,
      opacity: saved ? 0.6 : 1,
      transition:
        "background 0.3s, box-shadow 0.3s, border 0.3s ease, opacity 0.3s ease",
    });

  const verticalSeparatorStyle = mergeStyles({
    margin: "0 0px",
    alignSelf: "stretch",
    selectors: {
      "::before": {
        backgroundColor: isDarkMode ? colours.dark.border : colours.light.border,
        width: 2,
      },
    },
  });

  return (
    <Stack
      horizontal
      tokens={{ childrenGap: 20 }}
      verticalAlign="start"
      styles={{
        root: {
          backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
          borderRadius: 12,
          boxShadow: isDarkMode
            ? '0 4px 12px ' + colours.dark.border
            : '0 4px 12px ' + colours.light.border,
          padding: 24,
          width: '100%',
          position: 'relative',
          transition: 'background 0.3s, box-shadow 0.3s',
        },
      }}
    >
        {/* LEFT SIDE (Details) */}
        <Stack
          tokens={{ childrenGap: 8 }}
          styles={{ root: { width: "50%" } }}
          className={sideContainerStyle}
        >
        {/* Row 1: Enquiry Details */}
        <Stack
          style={{
            marginBottom: notesSpacing,
            transition: "margin 0.2s ease",
          }}
        >
          <div className={enquiryNotesContainer}>
            <div className={enquiryNotesHeader}>Enquiry Details</div>
            <div className={enquiryNotesContent}>
              <Stack tokens={{ childrenGap: 4 }}>
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
                {enquiry.Initial_first_call_notes && (
                  <>
                    <Separator style={{ margin: "8px 0" }} />
                    <Text>{enquiry.Initial_first_call_notes}</Text>
                  </>
                )}
              </Stack>

            </div>
          </div>
        </Stack>

        {/* Row 2: To / CC / BCC */}
          <div ref={toCcBccRef} style={{ marginBottom: rowSpacing }}>
            <Stack tokens={{ childrenGap: 6 }}>
              <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="end">
                <Stack.Item grow>
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
                  <Stack.Item grow>
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
                            icon: { fontSize: 12, color: "#fff" },
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
                  <Stack.Item grow>
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
                            icon: { fontSize: 12, color: "#fff" },
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
            </Stack>
          </div>
        {/* Row 3: Subject */}
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
        <Separator vertical className={verticalSeparatorStyle} />
        {/* RIGHT SIDE (Deal Form) */}
        <Stack
          styles={{ root: { width: "50%", display: "flex" } }}
          verticalAlign="stretch"
          className={dealSideContainerStyle(dealFormSaved)}
        >
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
