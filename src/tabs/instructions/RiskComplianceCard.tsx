import React from 'react';
//
import { mergeStyles, Text } from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';
import '../../app/styles/RiskComplianceCard.css';

interface RiskComplianceCardProps {
    data: any;
    animationDelay?: number;
    onOpenInstruction?: () => void;
}

const getField = (obj: any, ...keys: string[]) => {
    for (const key of keys) {
        const val = obj?.[key];
        if (val !== undefined && val !== null) return val;
    }
    return undefined;
};

const RiskComplianceCard: React.FC<RiskComplianceCardProps> = ({
    data,
    animationDelay = 0,
    onOpenInstruction,
}) => {
    const { isDarkMode } = useTheme();

    const cardClass = mergeStyles('riskComplianceCard', {
        backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
        color: isDarkMode ? colours.dark.text : colours.light.text,
        padding: componentTokens.card.base.padding,
        borderRadius: componentTokens.card.base.borderRadius,
        boxShadow: componentTokens.card.base.boxShadow,
        cursor: onOpenInstruction ? 'pointer' : 'default',
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        selectors: {
            ':hover': {
                boxShadow: componentTokens.card.hover.boxShadow,
                transform: componentTokens.card.hover.transform,
            },
        },
    });

    const style: React.CSSProperties = { '--animation-delay': `${animationDelay}s` } as React.CSSProperties;

    const complianceDate = getField(data, 'ComplianceDate', 'Compliance Date');
    const complianceExpiry = getField(data, 'ComplianceExpiry', 'Compliance Expiry');
    const date = complianceDate ? new Date(complianceDate).toLocaleDateString() : undefined;
    const expiry = complianceExpiry ? new Date(complianceExpiry).toLocaleDateString() : undefined;

    return (
        <div className={cardClass} style={style} onClick={onOpenInstruction}>
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                {data.MatterId}
            </Text>
            {data.ServiceDescription && <Text variant="small">{data.ServiceDescription}</Text>}
            {data.Stage && <Text variant="small">Stage: {data.Stage}</Text>}
            <dl className="data-grid">
                {Object.entries(data).map(([k, v]) => (
                    <React.Fragment key={k}>
                        <dt>{k}</dt>
                        <dd>
                            {Array.isArray(v) || typeof v === 'object'
                                ? JSON.stringify(v)
                                : String(v)}
                        </dd>
                    </React.Fragment>
                ))}
            </dl>
        </div>
    );
};

export default RiskComplianceCard;
