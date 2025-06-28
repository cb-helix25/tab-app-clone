import React from 'react';
import { Stack, TextField, PrimaryButton, Text } from '@fluentui/react';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';
import '../../../app/styles/MultiSelect.css';

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
    onContinue: () => void;
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
}) => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <TextField placeholder="Opponent Name" value={opponentName} onChange={(_, v) => setOpponentName(v || '')} styles={{ root: { width: 400 } }} />
        <TextField placeholder="Opponent Email" value={opponentEmail} onChange={(_, v) => setOpponentEmail(v || '')} styles={{ root: { width: 400 } }} />
        <TextField placeholder="Opponent Solicitor" value={opponentSolicitorName} onChange={(_, v) => setOpponentSolicitorName(v || '')} styles={{ root: { width: 400 } }} />
        <TextField placeholder="Solicitor Company" value={opponentSolicitorCompany} onChange={(_, v) => setOpponentSolicitorCompany(v || '')} styles={{ root: { width: 400 } }} />
        <TextField placeholder="Solicitor Email" value={opponentSolicitorEmail} onChange={(_, v) => setOpponentSolicitorEmail(v || '')} styles={{ root: { width: 400 } }} />
        <Stack tokens={{ childrenGap: 10 }}>
            <Text variant="mediumPlus">Confirm No Conflict of Interest</Text>
            <div className="MultiSelect-bar">
                <div
                    className={`MultiSelect-segment${noConflict ? ' active' : ''}`}
                    onClick={() => setNoConflict(true)}
                >
                    Confirmed - No Conflict
                </div>
                <div
                    className={`MultiSelect-segment${!noConflict ? ' active' : ''}`}
                    onClick={() => setNoConflict(false)}
                >
                    Not Confirmed
                </div>
            </div>
        </Stack>
        <PrimaryButton text="Continue" onClick={onContinue} disabled={!noConflict} styles={sharedPrimaryButtonStyles} />
    </Stack>
);

export default OpponentDetailsStep;
