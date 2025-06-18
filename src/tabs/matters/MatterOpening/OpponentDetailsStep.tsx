import React from 'react';
import { Stack, TextField, Toggle, PrimaryButton } from '@fluentui/react';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';

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
        <Toggle label="No Conflict of Interest" checked={noConflict} onChange={(_, val) => setNoConflict(!!val)} />
        <PrimaryButton text="Continue" onClick={onContinue} disabled={!noConflict} styles={sharedPrimaryButtonStyles} />
    </Stack>
);

export default OpponentDetailsStep;
