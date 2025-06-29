import React from "react";
import { Stack, PrimaryButton, Text } from "@fluentui/react";
import { sharedPrimaryButtonStyles } from "../../../app/styles/ButtonStyles";
import "../../../app/styles/MultiSelect.css";
import BubbleTextField from "../../../app/styles/BubbleTextField";
import { useTheme } from "../../../app/functionality/ThemeContext";

interface OpponentDetailsStepProps {
  opponentName: string;
  setOpponentName: (v: string) => void;
  opponentEmail: string;
  setOpponentEmail: (v: string) => void;
  opponentSolicitorName: string;
  setOpponentSolicitorName: (v: string) => void;
  opponentSolicitorCompany: string;
  setOpponentSolicitorCompany: (v: string) => void;
  opponentSolicitorEmail: string;
  setOpponentSolicitorEmail: (v: string) => void;
  noConflict: boolean;
  setNoConflict: (v: boolean) => void;
  onContinue?: () => void;
}

const OpponentDetailsStep: React.FC<OpponentDetailsStepProps> = ({
  opponentName,
  setOpponentName,
  opponentEmail,
  setOpponentEmail,
  opponentSolicitorName,
  setOpponentSolicitorName,
  opponentSolicitorCompany,
  setOpponentSolicitorCompany,
  opponentSolicitorEmail,
  setOpponentSolicitorEmail,
  noConflict,
  setNoConflict,
  onContinue,
}) => {
  const { isDarkMode } = useTheme();
  return (
    <Stack tokens={{ childrenGap: 12 }}>
      <div className="opponent-section">
        <BubbleTextField
          value={opponentName}
          onChange={(_, v) => setOpponentName(v || "")}
          placeholder="Opponent Name"
          ariaLabel="Opponent Name"
          isDarkMode={isDarkMode}
        />
        <BubbleTextField
          value={opponentEmail}
          onChange={(_, v) => setOpponentEmail(v || "")}
          placeholder="Opponent Email"
          ariaLabel="Opponent Email"
          isDarkMode={isDarkMode}
        />
        <BubbleTextField
          value={opponentSolicitorName}
          onChange={(_, v) => setOpponentSolicitorName(v || "")}
          placeholder="Solicitor Name"
          ariaLabel="Solicitor Name"
          isDarkMode={isDarkMode}
        />
        <BubbleTextField
          value={opponentSolicitorCompany}
          onChange={(_, v) => setOpponentSolicitorCompany(v || "")}
          placeholder="Solicitor Company"
          ariaLabel="Solicitor Company"
          isDarkMode={isDarkMode}
        />
        <BubbleTextField
          value={opponentSolicitorEmail}
          onChange={(_, v) => setOpponentSolicitorEmail(v || "")}
          placeholder="Solicitor Email"
          ariaLabel="Solicitor Email"
          isDarkMode={isDarkMode}
        />
      </div>
      <Stack tokens={{ childrenGap: 10 }}>
        <div className="question-banner">Confirm No Conflict of Interest</div>
        <div className="MultiSelect-bar">
          <div
            className={`MultiSelect-segment${noConflict ? " active" : ""}`}
            onClick={() => setNoConflict(true)}
          >
            Confirmed - No Conflict
          </div>
          <div
            className={`MultiSelect-segment${!noConflict ? " active" : ""}`}
            onClick={() => setNoConflict(false)}
          >
            Not Confirmed
          </div>
        </div>
      </Stack>
      {onContinue && (
        <PrimaryButton
          text="Continue"
          onClick={onContinue}
          disabled={!noConflict}
          styles={sharedPrimaryButtonStyles}
        />
      )}
    </Stack>
  );
};

export default OpponentDetailsStep;
