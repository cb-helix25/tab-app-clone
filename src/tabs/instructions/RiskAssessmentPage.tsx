import React, { useState } from 'react';
import { Stack, PrimaryButton } from '@fluentui/react';
import RiskAssessment, { RiskCore } from '../../components/RiskAssessment';
import { dashboardTokens } from './componentTokens';
import '../../app/styles/NewMatters.css';
import '../../app/styles/MatterOpeningCard.css';

interface RiskAssessmentPageProps {
    onBack: () => void;
    instructionRef?: string;
    riskAssessor?: string;
    /** Existing risk assessment data to display when available */
    existingRisk?: any | null;
}

const RiskAssessmentPage: React.FC<RiskAssessmentPageProps> = ({ onBack, instructionRef, riskAssessor, existingRisk }) => {
    const [riskCore, setRiskCore] = useState<RiskCore>({
        clientType: existingRisk?.ClientType ?? '',
        clientTypeValue: existingRisk?.ClientType_Value ?? 0,
        destinationOfFunds: existingRisk?.DestinationOfFunds ?? '',
        destinationOfFundsValue: existingRisk?.DestinationOfFunds_Value ?? 0,
        fundsType: existingRisk?.FundsType ?? '',
        fundsTypeValue: existingRisk?.FundsType_Value ?? 0,
        clientIntroduced: existingRisk?.HowWasClientIntroduced ?? '',
        clientIntroducedValue: existingRisk?.HowWasClientIntroduced_Value ?? 0,
        limitation: existingRisk?.Limitation ?? '',
        limitationValue: existingRisk?.Limitation_Value ?? 0,
        sourceOfFunds: existingRisk?.SourceOfFunds ?? '',
        sourceOfFundsValue: existingRisk?.SourceOfFunds_Value ?? 0,
        valueOfInstruction: existingRisk?.ValueOfInstruction ?? '',
        valueOfInstructionValue: existingRisk?.ValueOfInstruction_Value ?? 0,
    });
    const [complianceDate, setComplianceDate] = useState<Date | undefined>(
        existingRisk?.ComplianceDate ? new Date(existingRisk.ComplianceDate) : new Date(),
    );
    const [complianceExpiry, setComplianceExpiry] = useState<Date | undefined>(
        existingRisk?.ComplianceExpiry ? new Date(existingRisk.ComplianceExpiry) : undefined,
    );
    const [consideredClientRisk, setConsideredClientRisk] = useState<
        boolean | undefined
    >(existingRisk?.ClientRiskFactorsConsidered !== undefined
        ? !!existingRisk?.ClientRiskFactorsConsidered
        : undefined);
    const [consideredTransactionRisk, setConsideredTransactionRisk] = useState<
        boolean | undefined
    >(existingRisk?.TransactionRiskFactorsConsidered !== undefined
        ? !!existingRisk?.TransactionRiskFactorsConsidered
        : undefined);
    const [transactionRiskLevel, setTransactionRiskLevel] = useState(
        existingRisk?.TransactionRiskLevel ?? '',
    );
    const [consideredFirmWideSanctions, setConsideredFirmWideSanctions] = useState<
        boolean | undefined
    >(existingRisk?.FirmWideSanctionsRiskConsidered !== undefined
        ? !!existingRisk?.FirmWideSanctionsRiskConsidered
        : undefined);
    const [consideredFirmWideAML, setConsideredFirmWideAML] = useState<
        boolean | undefined
    >(existingRisk?.FirmWideAMLPolicyConsidered !== undefined
        ? !!existingRisk?.FirmWideAMLPolicyConsidered
        : undefined);

    const isComplete = () =>
        Object.values(riskCore).every((v) => v !== '' && v !== 0) &&
        complianceDate !== undefined &&
        complianceExpiry !== undefined &&
        consideredClientRisk !== undefined &&
        consideredTransactionRisk !== undefined &&
        (consideredTransactionRisk ? transactionRiskLevel !== '' : true) &&
        consideredFirmWideSanctions !== undefined &&
        consideredFirmWideAML !== undefined;

    const handleContinue = async () => {
        if (!isComplete()) return;
        try {
            const riskScore =
                riskCore.clientTypeValue +
                riskCore.destinationOfFundsValue +
                riskCore.fundsTypeValue +
                riskCore.clientIntroducedValue +
                riskCore.limitationValue +
                riskCore.sourceOfFundsValue +
                riskCore.valueOfInstructionValue;

            let riskResult = 'Low Risk';
            if (riskCore.limitationValue === 3 || riskScore >= 16) {
                riskResult = 'High Risk';
            } else if (riskScore >= 11) {
                riskResult = 'Medium Risk';
            }

            await fetch('/api/insertRiskAssessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    InstructionRef: instructionRef,
                    RiskAssessor: riskAssessor,
                    ComplianceDate: complianceDate?.toISOString().split('T')[0],
                    ComplianceExpiry: complianceExpiry?.toISOString().split('T')[0],
                    ClientType: riskCore.clientType,
                    ClientType_Value: riskCore.clientTypeValue,
                    DestinationOfFunds: riskCore.destinationOfFunds,
                    DestinationOfFunds_Value: riskCore.destinationOfFundsValue,
                    FundsType: riskCore.fundsType,
                    FundsType_Value: riskCore.fundsTypeValue,
                    HowWasClientIntroduced: riskCore.clientIntroduced,
                    HowWasClientIntroduced_Value: riskCore.clientIntroducedValue,
                    Limitation: riskCore.limitation,
                    Limitation_Value: riskCore.limitationValue,
                    SourceOfFunds: riskCore.sourceOfFunds,
                    SourceOfFunds_Value: riskCore.sourceOfFundsValue,
                    ValueOfInstruction: riskCore.valueOfInstruction,
                    ValueOfInstruction_Value: riskCore.valueOfInstructionValue,
                    TransactionRiskLevel: transactionRiskLevel,
                    ClientRiskFactorsConsidered: consideredClientRisk,
                    TransactionRiskFactorsConsidered: consideredTransactionRisk,
                    FirmWideSanctionsRiskConsidered: consideredFirmWideSanctions,
                    FirmWideAMLPolicyConsidered: consideredFirmWideAML,
                    RiskScore: riskScore,
                    RiskScoreIncrementBy: riskScore,
                    RiskAssessmentResult: riskResult,
                }),
            });
        } catch (err) {
            console.error('❌ Risk assessment submit failed', err);
        }
        onBack();
    };

    return (
        <Stack tokens={dashboardTokens} className="workflow-container">
            <div className="workflow-main matter-opening-card">
                <div className="step-header">
                    <h3 className="step-title">Risk Assessment</h3>
                </div>
                {existingRisk && (
                    <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginBottom: 20 } }}>
                        <h3>Existing Assessment</h3>
                        <ul className="detail-list">
                            {Object.entries(existingRisk).map(([k, v]) => (
                                v != null ? <li key={k}><strong>{k}:</strong> {String(v)}</li> : null
                            ))}
                        </ul>
                    </Stack>
                )}
                <div className="step-content">
                    <RiskAssessment
                    riskCore={riskCore}
                    setRiskCore={setRiskCore}
                    complianceDate={complianceDate}
                    setComplianceDate={setComplianceDate}
                    complianceExpiry={complianceExpiry}
                    setComplianceExpiry={setComplianceExpiry}
                    consideredClientRisk={consideredClientRisk}
                    setConsideredClientRisk={setConsideredClientRisk}
                    consideredTransactionRisk={consideredTransactionRisk}
                    setConsideredTransactionRisk={setConsideredTransactionRisk}
                    transactionRiskLevel={transactionRiskLevel}
                    setTransactionRiskLevel={setTransactionRiskLevel}
                    consideredFirmWideSanctions={consideredFirmWideSanctions}
                    setConsideredFirmWideSanctions={setConsideredFirmWideSanctions}
                    consideredFirmWideAML={consideredFirmWideAML}
                    setConsideredFirmWideAML={setConsideredFirmWideAML}
                    onContinue={handleContinue}
                    isComplete={isComplete}
                />
                </div>
            </div>
        </Stack>
    );
};

export default RiskAssessmentPage;