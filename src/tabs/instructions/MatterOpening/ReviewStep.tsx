import React from 'react';
import { Stack, Text, PrimaryButton } from '@fluentui/react';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';
import { POID } from '../../../app/functionality/types';

interface ReviewStepProps {
    selectedDate: Date | null;
    supervisingPartner: string;
    originatingSolicitor: string;
    fundsReceived: string;
    clientType: string;
    selectedPoidIds: string[];
    areaOfWork: string;
    practiceArea: string;
    description: string;
    folderStructure: string;
    disputeValue: string;
    source: string;
    referrerName: string;
    opponentName: string;
    opponentEmail: string;
    opponentSolicitorName: string;
    opponentSolicitorCompany: string;
    opponentSolicitorEmail: string;
    noConflict: boolean;
    onBuild: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
    selectedDate,
    supervisingPartner,
    originatingSolicitor,
    fundsReceived,
    clientType,
    selectedPoidIds,
    areaOfWork,
    practiceArea,
    description,
    folderStructure,
    disputeValue,
    source,
    referrerName,
    opponentName,
    opponentEmail,
    opponentSolicitorName,
    opponentSolicitorCompany,
    opponentSolicitorEmail,
    noConflict,
    onBuild,
}) => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <Text variant="medium">
            <strong>Client Details</strong>:<br />
            Date: {selectedDate?.toLocaleDateString() || 'N/A'} <br />
            Supervising Partner: {supervisingPartner || 'N/A'} <br />
            Originating Solicitor: {originatingSolicitor || 'N/A'} <br />
            Funds: {fundsReceived || 'N/A'}<br /><br />
            <strong>Client Type</strong>: {clientType || 'N/A'} <br />
            <strong>POID(s)</strong>: {selectedPoidIds.join(', ') || 'None'} <br />
            <strong>Area of Work</strong>: {areaOfWork || 'N/A'} <br />
            <strong>Practice Area</strong>: {practiceArea || 'N/A'} <br />
            <strong>Description</strong>: {description || 'N/A'} <br />
            <strong>Folder Structure</strong>: {folderStructure || 'N/A'} <br />
            <strong>Dispute Value</strong>: {disputeValue || 'N/A'} <br />
            <strong>Source</strong>: {source || 'N/A'} <br />
            {source === 'referral' && <><strong>Referrer's Name</strong>: {referrerName || 'N/A'} <br /></>}
            <strong>Opponent Details</strong>: <br />
            Opponent: {opponentName || 'N/A'} ({opponentEmail || 'N/A'}) <br />
            Opponent Solicitor: {opponentSolicitorName || 'N/A'} - {opponentSolicitorCompany || 'N/A'} ({opponentSolicitorEmail || 'N/A'}) <br />
            <strong>Conflict of Interest</strong>: {noConflict ? 'There is no Conflict of Interest' : 'There is a Conflict of Interest'} <br />
        </Text>
        <PrimaryButton text="Build Matter" onClick={onBuild} styles={sharedPrimaryButtonStyles} />
    </Stack>
);

export default ReviewStep;