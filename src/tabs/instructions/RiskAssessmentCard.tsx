import React from 'react';
import { Stack, Text, Icon } from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';

interface RiskAssessmentCardProps {
    riskAssessment: any;
    compactMode?: boolean;
}

const getRiskColor = (riskLevel: string) => {
    const level = riskLevel?.toLowerCase();
    if (level?.includes('low')) return { color: '#107C10', bg: '#DFF6DD' };
    if (level?.includes('medium')) return { color: '#FF8C00', bg: '#FFF4E6' };
    if (level?.includes('high')) return { color: '#D83B01', bg: '#FDF3F2' };
    return { color: '#666', bg: '#F3F2F1' };
};

const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({ 
    riskAssessment, 
    compactMode = false 
}) => {
    const { isDarkMode } = useTheme();
    
    if (!riskAssessment) return null;

    const riskColor = getRiskColor(riskAssessment.RiskAssessmentResult);
    const assessmentDate = riskAssessment.ComplianceDate 
        ? new Date(riskAssessment.ComplianceDate).toLocaleDateString()
        : null;
    const expiryDate = riskAssessment.ComplianceExpiry 
        ? new Date(riskAssessment.ComplianceExpiry).toLocaleDateString()
        : null;

    if (compactMode) {
        return (
            <div style={{
                padding: '12px',
                backgroundColor: isDarkMode ? '#2A2A2A' : '#F9F9F9',
                borderRadius: '6px',
                border: '1px solid #E1DFDD'
            }}>
                <Stack tokens={{ childrenGap: 8 }}>
                    <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                        <Text variant="small" styles={{ root: { fontWeight: 600 } }}>
                            Risk Assessment
                        </Text>
                        <div style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: riskColor.bg,
                            color: riskColor.color,
                            fontSize: '0.7rem',
                            fontWeight: 600
                        }}>
                            {riskAssessment.RiskAssessmentResult}
                        </div>
                    </Stack>
                    
                    <Stack horizontal wrap tokens={{ childrenGap: 12 }}>
                        {riskAssessment.RiskAssessor && (
                            <Text variant="small" styles={{ root: { color: '#666' } }}>
                                By: {riskAssessment.RiskAssessor}
                            </Text>
                        )}
                        {riskAssessment.RiskScore && (
                            <Text variant="small" styles={{ root: { color: '#666' } }}>
                                Score: {riskAssessment.RiskScore}
                            </Text>
                        )}
                        {assessmentDate && (
                            <Text variant="small" styles={{ root: { color: '#666' } }}>
                                Date: {assessmentDate}
                            </Text>
                        )}
                    </Stack>
                </Stack>
            </div>
        );
    }

    return (
        <div style={{
            padding: '16px',
            backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E1DFDD',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <Stack tokens={{ childrenGap: 12 }}>
                {/* Header */}
                <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
                    <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                        <Icon iconName="Shield" styles={{ root: { fontSize: 16, color: colours.highlight } }} />
                        <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, color: colours.highlight } }}>
                            Risk Assessment
                        </Text>
                    </Stack>
                    <div style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        backgroundColor: riskColor.bg,
                        color: riskColor.color,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: `1px solid ${riskColor.color}20`
                    }}>
                        {riskAssessment.RiskAssessmentResult}
                    </div>
                </Stack>

                {/* Assessor and Dates */}
                <Stack horizontal wrap tokens={{ childrenGap: 16 }} verticalAlign="center">
                    {riskAssessment.RiskAssessor && (
                        <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
                            <Icon iconName="Contact" styles={{ root: { fontSize: 12, color: '#666' } }} />
                            <Text variant="small" styles={{ root: { color: '#666' } }}>
                                Assessed by: <strong>{riskAssessment.RiskAssessor}</strong>
                            </Text>
                        </Stack>
                    )}
                    {assessmentDate && (
                        <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
                            <Icon iconName="Calendar" styles={{ root: { fontSize: 12, color: '#666' } }} />
                            <Text variant="small" styles={{ root: { color: '#666' } }}>
                                Date: <strong>{assessmentDate}</strong>
                            </Text>
                        </Stack>
                    )}
                    {expiryDate && (
                        <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
                            <Icon iconName="Clock" styles={{ root: { fontSize: 12, color: '#666' } }} />
                            <Text variant="small" styles={{ root: { color: '#666' } }}>
                                Expires: <strong>{expiryDate}</strong>
                            </Text>
                        </Stack>
                    )}
                </Stack>

                {/* Risk Score */}
                {riskAssessment.RiskScore && (
                    <div style={{
                        backgroundColor: '#F3F2F1',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        borderLeft: `3px solid ${riskColor.color}`
                    }}>
                        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                            <Text variant="small" styles={{ root: { fontWeight: 600 } }}>
                                Risk Score: {riskAssessment.RiskScore}
                            </Text>
                            {riskAssessment.TransactionRiskLevel && (
                                <Text variant="small" styles={{ root: { color: '#666', fontStyle: 'italic' } }}>
                                    Transaction: {riskAssessment.TransactionRiskLevel}
                                </Text>
                            )}
                        </Stack>
                    </div>
                )}

                {/* Key Risk Factors */}
                <Stack tokens={{ childrenGap: 6 }}>
                    <Text variant="small" styles={{ root: { fontWeight: 600, color: '#444' } }}>
                        Assessment Categories
                    </Text>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '8px'
                    }}>
                        {riskAssessment.ClientType && (
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                <strong>Client:</strong> {riskAssessment.ClientType}
                            </div>
                        )}
                        {riskAssessment.DestinationOfFunds && (
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                <strong>Destination:</strong> {riskAssessment.DestinationOfFunds}
                            </div>
                        )}
                        {riskAssessment.FundsType && (
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                <strong>Funds:</strong> {riskAssessment.FundsType}
                            </div>
                        )}
                        {riskAssessment.ValueOfInstruction && (
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                <strong>Value:</strong> {riskAssessment.ValueOfInstruction}
                            </div>
                        )}
                    </div>
                </Stack>

                {/* Compliance Checks */}
                <Stack tokens={{ childrenGap: 4 }}>
                    <Text variant="small" styles={{ root: { fontWeight: 600, color: '#444' } }}>
                        Compliance Checks
                    </Text>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '4px'
                    }}>
                        <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
                            <Icon 
                                iconName={riskAssessment.ClientRiskFactorsConsidered ? "CheckMark" : "Cancel"} 
                                styles={{ 
                                    root: { 
                                        fontSize: 10, 
                                        color: riskAssessment.ClientRiskFactorsConsidered ? '#107C10' : '#D83B01' 
                                    } 
                                }} 
                            />
                            <Text variant="xSmall" styles={{ root: { color: '#666' } }}>
                                Client Risk
                            </Text>
                        </Stack>
                        <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
                            <Icon 
                                iconName={riskAssessment.TransactionRiskFactorsConsidered ? "CheckMark" : "Cancel"} 
                                styles={{ 
                                    root: { 
                                        fontSize: 10, 
                                        color: riskAssessment.TransactionRiskFactorsConsidered ? '#107C10' : '#D83B01' 
                                    } 
                                }} 
                            />
                            <Text variant="xSmall" styles={{ root: { color: '#666' } }}>
                                Transaction Risk
                            </Text>
                        </Stack>
                        <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
                            <Icon 
                                iconName={riskAssessment.FirmWideAMLPolicyConsidered ? "CheckMark" : "Cancel"} 
                                styles={{ 
                                    root: { 
                                        fontSize: 10, 
                                        color: riskAssessment.FirmWideAMLPolicyConsidered ? '#107C10' : '#D83B01' 
                                    } 
                                }} 
                            />
                            <Text variant="xSmall" styles={{ root: { color: '#666' } }}>
                                AML Policy
                            </Text>
                        </Stack>
                        <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
                            <Icon 
                                iconName={riskAssessment.FirmWideSanctionsRiskConsidered ? "CheckMark" : "Cancel"} 
                                styles={{ 
                                    root: { 
                                        fontSize: 10, 
                                        color: riskAssessment.FirmWideSanctionsRiskConsidered ? '#107C10' : '#D83B01' 
                                    } 
                                }} 
                            />
                            <Text variant="xSmall" styles={{ root: { color: '#666' } }}>
                                Sanctions Risk
                            </Text>
                        </Stack>
                    </div>
                </Stack>
            </Stack>
        </div>
    );
};

export default RiskAssessmentCard;
