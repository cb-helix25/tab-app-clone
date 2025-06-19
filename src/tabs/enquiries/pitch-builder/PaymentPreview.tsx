import React from 'react';
import { Stack, Text, Icon, mergeStyles } from '@fluentui/react';
import { useTheme } from '../../../app/functionality/ThemeContext';
import { colours } from '../../../app/styles/colours';

interface PaymentPreviewProps {
    serviceDescription: string;
    amount: string;
}

function formatCurrency(val: number): string {
    if (isNaN(val) || val === 0) return '£0.00';
    return val.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

const PaymentPreview: React.FC<PaymentPreviewProps> = ({ serviceDescription, amount }) => {
    const { isDarkMode } = useTheme();

    const containerClass = mergeStyles({
        background: isDarkMode ? colours.dark.cardBackground : colours.grey,
        border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
        borderRadius: 8,
        padding: 12,
        boxShadow: isDarkMode
            ? `0 1px 3px ${colours.dark.border}`
            : `0 1px 3px ${colours.light.border}`,
        width: '100%',
    });

    const labelClass = mergeStyles({
        color: colours.greyText,
        fontSize: 12,
        marginBottom: 2,
    });

    const valueClass = mergeStyles({
        fontWeight: 600,
        color: isDarkMode ? colours.light.text : colours.darkBlue,
        marginBottom: 6,
        wordBreak: 'break-word',
    });

    const lockIconClass = mergeStyles({
        color: colours.greyText,
        marginLeft: 4,
    });

    const num = parseFloat(amount.replace(/,/g, ''));
    const incVat = !isNaN(num) ? num * 1.2 : NaN;
    const formattedAmount = isNaN(incVat) ? '' : formatCurrency(incVat);

    return (
        <Stack tokens={{ childrenGap: 8 }} className={containerClass}>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
                <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                    Payment Preview
                </Text>
                <Icon iconName="Lock" className={lockIconClass} aria-label="Locked preview" />
            </Stack>
            <div>
                <Text className={labelClass}>Service Description</Text>
                <Text className={valueClass}>{serviceDescription || '—'}</Text>
            </div>
            <div>
                <Text className={labelClass}>Amount (inc. VAT)</Text>
                <Text className={valueClass}>{formattedAmount || '—'}</Text>
            </div>
        </Stack>
    );
};

export default PaymentPreview;
