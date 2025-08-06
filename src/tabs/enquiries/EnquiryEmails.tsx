import React, { useEffect, useState } from 'react';
import { Enquiry } from '../../app/functionality/types';
import { Stack, Text, Spinner } from '@fluentui/react';

interface EmailRecord {
    [key: string]: any;
}

interface EnquiryEmailsProps {
    enquiry: Enquiry;
}

const EnquiryEmails: React.FC<EnquiryEmailsProps> = ({ enquiry }) => {
    const [emails, setEmails] = useState<EmailRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const resp = await fetch(`/api/enquiry-emails/${enquiry.ID}`);
                if (!resp.ok) {
                    throw new Error('Failed to fetch emails');
                }
                const data = await resp.json();
                setEmails(data.emails || data);
            } catch (err) {
                console.error('Error loading enquiry emails', err);
                setError('Failed to load emails');
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, [enquiry.ID]);

    if (loading) {
        return <Spinner label="Loading emails" />;
    }

    if (error) {
        return <Text>{error}</Text>;
    }

    return (
        <Stack tokens={{ childrenGap: 8 }}>
            {emails.length === 0 ? (
                <Text>No emails found.</Text>
            ) : (
                emails.map((email, idx) => (
                    <Stack key={idx} tokens={{ childrenGap: 4 }}>
                        <Text variant="mediumPlus">{email.Subject || email.subject || 'No subject'}</Text>
                        {email.Body && <Text>{email.Body}</Text>}
                    </Stack>
                ))
            )}
        </Stack>
    );
};

export default EnquiryEmails;
