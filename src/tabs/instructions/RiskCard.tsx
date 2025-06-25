import React from 'react';
import { mergeStyles, Text } from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';
import '../../app/styles/RiskComplianceCard.css';

export interface RiskInfo {
    MatterId: string;
    RiskAssessor?: string;
    ComplianceDate?: string;
    RiskAssessmentResult?: string;
    RiskScore?: number;
    TransactionRiskLevel?: string;
    EIDStatus?: string;
    ClientRiskFactorsConsidered?: boolean;
    TransactionRiskFactorsConsidered?: boolean;
    FirmWideAMLPolicyConsidered?: boolean;
    FirmWideSanctionsRiskConsidered?: boolean;
}

interface RiskCardProps {
    data: RiskInfo;
    animationDelay?: number;
}

const RiskCard: React.FC<RiskCardProps> = ({ data, animationDelay = 0 }) => {
    const { isDarkMode } = useTheme();

    const cardClass = mergeStyles('riskComplianceCard', {
        backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
        color: isDarkMode ? colours.dark.text : colours.light.text,
        padding: componentTokens.card.base.padding,
        borderRadius: componentTokens.card.base.borderRadius,
        boxShadow: componentTokens.card.base.boxShadow,
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
        <div className={cardClass} style={style}>
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                {data.MatterId}
            </Text>
            <ul className="detail-list">
                {data.RiskAssessor && (
                    <li>
                        <strong>Assessor:</strong> {data.RiskAssessor}
                    </li>
                )}
                {date && (
                    <li>
                        <strong>Date:</strong> {date}
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
                {data.EIDStatus && (
                    <li>
                        <strong>EID:</strong> {data.EIDStatus}
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

export default RiskCard;
