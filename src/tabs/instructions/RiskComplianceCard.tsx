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

    const checkId = getField(data, 'CheckId', 'Check ID');
    const checkResult = getField(data, 'CheckResult', 'Check Result');
    const pepResult = getField(data, 'PEPandSanctionsCheckResult', 'PEP and Sanctions Check Result');
    const addressResult = getField(data, 'AddressVerificationCheckResult', 'Address Verification Check Result');

    const riskAssessor = getField(data, 'RiskAssessor', 'Risk Assessor');
    const riskAssessmentResult = getField(data, 'RiskAssessmentResult', 'Risk Assessment Result');
    const riskScore = getField(data, 'RiskScore', 'Risk Score');
    const riskLevel = getField(data, 'TransactionRiskLevel', 'Transaction Risk Level');
    const clientFactors = getField(data, 'ClientRiskFactorsConsidered', 'Client Risk Factors Considered');
    const transactionFactors = getField(data, 'TransactionRiskFactorsConsidered', 'Transaction Risk Factors Considered');
    const firmAML = getField(data, 'FirmWideAMLPolicyConsidered', 'Firm-Wide AML Policy Considered');
    const firmSanctions = getField(data, 'FirmWideSanctionsRiskConsidered', 'Firm-Wide Sanctions Risk Considered');

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
                {expiry && (
                    <li>
                        <strong>Expiry:</strong> {expiry}
                    </li>
                )}
                {checkId && (
                    <li>
                        <strong>Check ID:</strong> {checkId}
                    </li>
                )}
                {checkResult && (
                    <li>
                        <strong>Check Result:</strong> {checkResult}
                    </li>
                )}
                {pepResult && (
                    <li>
                        <strong>PEP/Sanctions:</strong> {pepResult}
                    </li>
                )}
                {addressResult && (
                    <li>
                        <strong>Address Check:</strong> {addressResult}
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
                {riskAssessor && (
                    <li>
                        <strong>Assessor:</strong> {riskAssessor}
                    </li>
                )}
                {riskAssessmentResult && (
                    <li>
                        <strong>Result:</strong> {riskAssessmentResult}
                    </li>
                )}
                {riskScore !== undefined && (
                    <li>
                        <strong>Score:</strong> {riskScore}
                    </li>
                )}
                {riskLevel && (
                    <li>
                        <strong>Level:</strong> {riskLevel}
                    </li>
                )}
                {clientFactors !== undefined && (
                    <li>
                        <strong>Client Factors:</strong> {clientFactors ? 'Yes' : 'No'}
                    </li>
                )}
                {transactionFactors !== undefined && (
                    <li>
                        <strong>Transaction Factors:</strong> {transactionFactors ? 'Yes' : 'No'}
                    </li>
                )}
                {firmAML !== undefined && (
                    <li>
                        <strong>Firm AML Policy:</strong> {firmAML ? 'Yes' : 'No'}
                    </li>
                )}
                {firmSanctions !== undefined && (
                    <li>
                        <strong>FW Sanctions:</strong> {firmSanctions ? 'Yes' : 'No'}
                    </li>
                )}
            </ul>
        </div>
    );
};

export default RiskComplianceCard;
