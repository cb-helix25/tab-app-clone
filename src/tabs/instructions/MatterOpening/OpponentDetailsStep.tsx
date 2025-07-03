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
  disputeValue: string;
  setDisputeValue: (v: string) => void;
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
  disputeValue,
  setDisputeValue,
  onContinue,
}) => {
  const disputeValueOptions = ['Less than £10k', '£10k - £500k', '£500k - £1m', '£1m - £5m', '£5 - £20m', '£20m+'];
      <Stack tokens={{ childrenGap: 10 }}>
        <div className="question-banner">Select Value of the Dispute</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '4px' }}>
          {disputeValueOptions.map((option) => (
            <div
              key={option}
              className={`MultiSelect-segment${disputeValue === option ? ' active' : ''}`}
              onClick={() => setDisputeValue(option)}
              style={{
                border: '1px solid var(--helix-dark-blue)',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                color: disputeValue === option ? '#fff' : '#061733',
                backgroundColor: disputeValue === option ? 'var(--helix-dark-blue)' : 'transparent',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {option}
            </div>
          ))}
        </div>
      </Stack>
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
        <div style={{ height: 1, background: '#e3e8ef', margin: '12px 0' }} />
        <BubbleTextField
          value={opponentSolicitorName}
          onChange={(_, v) => setOpponentSolicitorName(v || "")}
          placeholder="Solicitor Name"
          ariaLabel="Solicitor Name"
          isDarkMode={isDarkMode}
        />
        <div style={{ height: 1, background: '#e3e8ef', margin: '12px 0' }} />
        <BubbleTextField
          value={opponentSolicitorCompany}
          onChange={(_, v) => setOpponentSolicitorCompany(v || "")}
          placeholder="Solicitor Company"
          ariaLabel="Solicitor Company"
          isDarkMode={isDarkMode}
        />
        <div style={{ height: 1, background: '#e3e8ef', margin: '12px 0' }} />
        <BubbleTextField
          value={opponentSolicitorEmail}
          onChange={(_, v) => setOpponentSolicitorEmail(v || "")}
          placeholder="Solicitor Email"
          ariaLabel="Solicitor Email"
          isDarkMode={isDarkMode}
        />
      </div>
      <div style={{ height: 1, background: '#e3e8ef', margin: '12px 0' }} />
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
