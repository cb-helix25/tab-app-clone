import React, { useEffect, useState } from 'react';
import { Enquiry } from '../../app/functionality/types';
import { Stack, Text, Spinner, MessageBar, MessageBarType } from '@fluentui/react';
import { FaEnvelope, FaInfoCircle } from 'react-icons/fa';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';

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
    const { isDarkMode } = useTheme();

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
        return (
            <Stack tokens={{ childrenGap: 20 }} style={{ padding: '20px' }}>
                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
                    <FaEnvelope style={{ 
                        color: isDarkMode ? colours.dark.iconColor : colours.light.iconColor,
                        fontSize: '18px'
                    }} />
                    <Text variant="xLarge" styles={{
                        root: {
                            fontWeight: '600',
                            color: isDarkMode ? colours.dark.text : colours.light.text
                        }
                    }}>
                        Email History
                    </Text>
                </Stack>
                <Spinner label="Loading emails..." />
            </Stack>
        );
    }

    if (error) {
        return (
            <Stack tokens={{ childrenGap: 20 }} style={{ padding: '20px' }}>
                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
                    <FaEnvelope style={{ 
                        color: isDarkMode ? colours.dark.iconColor : colours.light.iconColor,
                        fontSize: '18px'
                    }} />
                    <Text variant="xLarge" styles={{
                        root: {
                            fontWeight: '600',
                            color: isDarkMode ? colours.dark.text : colours.light.text
                        }
                    }}>
                        Email History
                    </Text>
                </Stack>
                <MessageBar messageBarType={MessageBarType.error}>
                    <Text>{error}</Text>
                </MessageBar>
            </Stack>
        );
    }

    return (
        <Stack tokens={{ childrenGap: 20 }} style={{ padding: '20px' }}>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
                <FaEnvelope style={{ 
                    color: isDarkMode ? colours.dark.iconColor : colours.light.iconColor,
                    fontSize: '18px'
                }} />
                <Text variant="xLarge" styles={{
                    root: {
                        fontWeight: '600',
                        color: isDarkMode ? colours.dark.text : colours.light.text
                    }
                }}>
                    Email History
                </Text>
            </Stack>
            
            <MessageBar messageBarType={MessageBarType.info}>
                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                    <FaInfoCircle />
                    <Text>Email tracking is enabled in local development. Enhanced email analytics coming soon.</Text>
                </Stack>
            </MessageBar>
            
            {emails.length === 0 ? (
                <Stack style={{ 
                    padding: '16px',
                    backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
                    borderRadius: '8px',
                    border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
                }}>
                    <Text variant="medium" styles={{
                        root: {
                            color: isDarkMode ? colours.dark.subText : colours.light.subText,
                            fontStyle: 'italic'
                        }
                    }}>
                        No emails found for enquiry {enquiry.ID}
                    </Text>
                </Stack>
            ) : (
                <Stack tokens={{ childrenGap: 12 }}>
                    {emails.map((email, idx) => (
                        <Stack key={idx} style={{ 
                            padding: '16px',
                            backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
                            borderRadius: '8px',
                            border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
                        }} tokens={{ childrenGap: 8 }}>
                            <Text variant="mediumPlus" styles={{
                                root: {
                                    fontWeight: '600',
                                    color: isDarkMode ? colours.dark.text : colours.light.text
                                }
                            }}>
                                {email.Subject || email.subject || 'No subject'}
                            </Text>
                            {email.Body && (
                                <Text variant="medium" styles={{
                                    root: {
                                        color: isDarkMode ? colours.dark.subText : colours.light.subText,
                                        whiteSpace: 'pre-wrap'
                                    }
                                }}>
                                    {email.Body}
                                </Text>
                            )}
                        </Stack>
                    ))}
                </Stack>
            )}
        </Stack>
    );
};

export default EnquiryEmails;
