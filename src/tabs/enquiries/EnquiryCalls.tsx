import React from 'react';
import { Enquiry } from '../../app/functionality/types';
import { Stack, Text } from '@fluentui/react';

interface EnquiryCallsProps {
    enquiry: Enquiry;
}

const EnquiryCalls: React.FC<EnquiryCallsProps> = ({ enquiry }) => {
    return (
        <Stack tokens={{ childrenGap: 8 }}>
            <Text variant="large">Calls</Text>
            <Text>CallRail integration placeholder for enquiry {enquiry.ID}</Text>
        </Stack>
    );
};

export default EnquiryCalls;