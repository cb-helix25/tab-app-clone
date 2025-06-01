import React, { useState, useRef, useLayoutEffect } from "react";
import {
  Stack,
  TextField,
  mergeStyles,
  IconButton,
  Separator,
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

  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const toCcBccRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);
  const [descHeight, setDescHeight] = useState(0);
  const [rowSpacing, setRowSpacing] = useState(0);
  const [notesSpacing, setNotesSpacing] = useState(0);
  const [toggleTop, setToggleTop] = useState(0);

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

  const updateNotesSpacing = () => {
    if (subjectRef.current) {
      const rect = subjectRef.current.getBoundingClientRect();
      const subjectBottom = rect.top + rect.height + window.scrollY; // match coordinate system
      const spacing = Math.max(toggleTop - subjectBottom, 0);
      setNotesSpacing(spacing);
    }
  };

  useLayoutEffect(() => {
    updateNotesSpacing();
  }, [toggleTop, subject, rowSpacing, showCc, showBcc]);

  useLayoutEffect(() => {
    window.addEventListener("resize", updateNotesSpacing);
    return () => window.removeEventListener("resize", updateNotesSpacing);
  }, []);

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

  return (
    <Stack
      horizontal
      tokens={{ childrenGap: 16 }}
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
          {/* Row 1: To / CC / BCC */}
          <div ref={toCcBccRef} style={{ marginBottom: rowSpacing }}>
            <Stack tokens={{ childrenGap: 6 }}>
              <Stack
                horizontal
                tokens={{ childrenGap: 12 }}
                verticalAlign="end"
              >
                <Stack grow>
                  <div className={intakeContainer}>
                    <div className={intakeHeader}>To</div>
                    <TextField
                      value={to}
                      onChange={(_, val) => setTo(val || "")}
                      placeholder="Recipient email"
                      ariaLabel="To"
                      styles={{
                        fieldGroup: [
                          inputFieldStyle,
                          { border: "none", borderRadius: 0 },
                        ],
                      }}
                    />
                  </div>
                </Stack>
                {showCc && (
                  <Stack
                    horizontal
                    tokens={{ childrenGap: 0 }}
                    verticalAlign="end"
                  >
                    <Stack grow>
                      <div className={intakeContainer}>
                        <div className={intakeHeader}>CC</div>
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
                    </Stack>
                    <IconButton
                      iconProps={{ iconName: "Cancel" }}
                      ariaLabel="Hide CC"
                      onClick={() => setShowCc(false)}
                      styles={{
                        root: {
                          marginBottom: 24,
                          marginLeft: 4,
                          backgroundColor: "transparent",
                        },
                        rootHovered: {
                          backgroundColor: "transparent",
                          color: colours.highlight,
                        },
                      }}
                    />
            </Stack>
                )}
                {showBcc && (
                  <Stack
                    horizontal
                    tokens={{ childrenGap: 0 }}
                    verticalAlign="end"
                  >
                    <Stack grow>
                      <div className={intakeContainer}>
                        <div className={intakeHeader}>BCC</div>
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
                    </Stack>
                    <IconButton
                      iconProps={{ iconName: "Cancel" }}
                      ariaLabel="Hide BCC"
                      onClick={() => setShowBcc(false)}
                      styles={{
                        root: {
                          marginBottom: 24,
                          marginLeft: 4,
                          backgroundColor: "transparent",
                        },
                        rootHovered: {
                          backgroundColor: "transparent",
                          color: colours.highlight,
                        },
                      }}
                    />
                  </Stack>
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
          {/* Row 2: Subject */}
          <Stack>
            <div ref={subjectRef} className={intakeContainer}>
              <div className={intakeHeader}>Subject</div>
              <TextField
                value={subject}
                onChange={(_, val) => setSubject(val || "")}
                placeholder="Email subject"
                ariaLabel="Subject"
                styles={{
                  fieldGroup: [
                    inputFieldStyle,
                    { border: "none", borderRadius: 0 },
                  ],
                }}
              />
          </div>
        </Stack>
          {/* Row 3: Enquiry Notes */}
          {enquiry.Initial_first_call_notes && (
            <Stack
              style={{
                marginTop: notesSpacing,
                transition: "margin 0.2s ease",
              }}
            >
              <div className={enquiryNotesContainer}>
                <div className={enquiryNotesHeader}>Enquiry Notes</div>
                <div className={enquiryNotesContent}>
                  {enquiry.Initial_first_call_notes}
                </div>
              </div>
            </Stack>
          )}
        </Stack>
        <Separator vertical styles={{ root: { margin: "0 12px" } }} />
        {/* RIGHT SIDE (Deal Form) */}
        <Stack
          styles={{ root: { width: "50%", display: "flex" } }}
          verticalAlign="stretch"
          className={sideContainerStyle}
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
            onToggleTopChange={setToggleTop}
          />
        </Stack>
  </Stack>
  );
};

export default PitchHeaderRow;
