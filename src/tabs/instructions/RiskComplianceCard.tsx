import React from 'react';
import { mergeStyles, Text, Separator } from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';
import '../../app/styles/RiskComplianceCard.css';

interface RiskComplianceCardProps {
    data: any;
    animationDelay?: number;
    onOpenInstruction?: () => void;
}

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

    const date = data.ComplianceDate ? new Date(data.ComplianceDate).toLocaleDateString() : undefined;

    return (
        <div className={cardClass} style={style} onClick={onOpenInstruction}>
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                {data.MatterId}
            </Text>
            {data.ServiceDescription && <Text variant="small">{data.ServiceDescription}</Text>}
            {data.Stage && <Text variant="small">Stage: {data.Stage}</Text>}
            <ul className="detail-list">
                {date && (
                    <li>
                        <strong>Compliance Date:</strong> {date}
                    </li>
                )}
                {data.EIDStatus && (
                    <li>
                        <strong>EID Status:</strong> {data.EIDStatus}
                    </li>
                )}
            </ul>
            <Separator />
            <ul className="detail-list">
                {data.RiskAssessor && (
                    <li>
                        <strong>Assessor:</strong> {data.RiskAssessor}
                    </li>
                )}
                {data.RiskAssessmentResult && (
                    <li>
                        <strong>Result:</strong> {data.RiskAssessmentResult}
                    </li>
                )}
                {data.RiskScore !== undefined && (
                    <li>
                        <strong>Score:</strong> {data.RiskScore}
                    </li>
                )}
                {data.TransactionRiskLevel && (
                    <li>
                        <strong>Level:</strong> {data.TransactionRiskLevel}
                    </li>
                )}
                {data.ClientRiskFactorsConsidered !== undefined && (
                    <li>
                        <strong>Client Factors:</strong> {data.ClientRiskFactorsConsidered ? 'Yes' : 'No'}
                    </li>
                )}
                {data.TransactionRiskFactorsConsidered !== undefined && (
                    <li>
                        <strong>Transaction Factors:</strong> {data.TransactionRiskFactorsConsidered ? 'Yes' : 'No'}
                    </li>
                )}
                {data.FirmWideAMLPolicyConsidered !== undefined && (
                    <li>
                        <strong>Firm AML Policy:</strong> {data.FirmWideAMLPolicyConsidered ? 'Yes' : 'No'}
                    </li>
                )}
                {data.FirmWideSanctionsRiskConsidered !== undefined && (
                    <li>
                        <strong>FW Sanctions:</strong> {data.FirmWideSanctionsRiskConsidered ? 'Yes' : 'No'}
                    </li>
                )}
            </ul>
        </div>
    );
};

export default RiskComplianceCard;
