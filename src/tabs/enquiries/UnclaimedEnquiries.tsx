import React from 'react';
import { Stack, Text } from '@fluentui/react';
import { Enquiry } from '../../app/functionality/types';
import EnquiryCard from './EnquiryCard';

interface UnclaimedEnquiriesProps {
    enquiries: Enquiry[];
    onSelect: (enquiry: Enquiry) => void;
}

const UnclaimedEnquiries: React.FC<UnclaimedEnquiriesProps> = ({ enquiries, onSelect }) => {

    if (!enquiries || enquiries.length === 0) {
        return (
            <Text
                variant="medium"
                styles={{ root: { textAlign: 'center', marginTop: 20 } }}
            >
                No unclaimed enquiries.
            </Text>
        );
    }

    return (
        <Stack
            tokens={{ childrenGap: 20 }}
            styles={{ root: { padding: '20px' } }}
        >
            {enquiries.map((enquiry, index) => (
                <EnquiryCard
                    key={`${enquiry.ID}-${index}`}
                    enquiry={enquiry}
                    onSelect={onSelect}
                    onRate={() => { }}
                />
            ))}
        </Stack>
    );
};

export default UnclaimedEnquiries;
