import React, { useState } from 'react';
import { Stack, PrimaryButton } from '@fluentui/react';
import RiskAssessment, { RiskCore } from '../../components/RiskAssessment';
import { dashboardTokens } from './componentTokens';

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
        destinationOfFunds: existingRisk?.DestinationOfFunds ?? '',
        fundsType: existingRisk?.FundsType ?? '',
        clientIntroduced: existingRisk?.HowWasClientIntroduced ?? '',
        limitation: existingRisk?.Limitation ?? '',
        sourceOfFunds: existingRisk?.SourceOfFunds ?? '',
        valueOfInstruction: existingRisk?.ValueOfInstruction ?? '',
    });
    const [consideredClientRisk, setConsideredClientRisk] = useState(
        !!existingRisk?.ClientRiskFactorsConsidered,
    );
    const [consideredTransactionRisk, setConsideredTransactionRisk] = useState(
        !!existingRisk?.TransactionRiskFactorsConsidered,
    );
    const [transactionRiskLevel, setTransactionRiskLevel] = useState(
        existingRisk?.TransactionRiskLevel ?? '',
    );
    const [consideredFirmWideSanctions, setConsideredFirmWideSanctions] = useState(
        !!existingRisk?.FirmWideSanctionsRiskConsidered,
    );
    const [consideredFirmWideAML, setConsideredFirmWideAML] = useState(
        !!existingRisk?.FirmWideAMLPolicyConsidered,
    );

    const isComplete = () =>
        Object.values(riskCore).every((v) => v !== '') &&
        consideredClientRisk &&
        consideredTransactionRisk &&
        transactionRiskLevel !== '' &&
        consideredFirmWideSanctions &&
        consideredFirmWideAML;

    const handleContinue = async () => {
        if (!isComplete()) return;
        try {
            await fetch('/api/insertRiskAssessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    InstructionRef: instructionRef,
                    RiskAssessor: riskAssessor,
                    ClientType: riskCore.clientType,
                    DestinationOfFunds: riskCore.destinationOfFunds,
                    FundsType: riskCore.fundsType,
                    HowWasClientIntroduced: riskCore.clientIntroduced,
                    Limitation: riskCore.limitation,
                    SourceOfFunds: riskCore.sourceOfFunds,
                    ValueOfInstruction: riskCore.valueOfInstruction,
                    TransactionRiskLevel: transactionRiskLevel,
                    ClientRiskFactorsConsidered: consideredClientRisk,
                    TransactionRiskFactorsConsidered: consideredTransactionRisk,
                    FirmWideSanctionsRiskConsidered: consideredFirmWideSanctions,
                    FirmWideAMLPolicyConsidered: consideredFirmWideAML,
                    RiskAssessmentResult: transactionRiskLevel.replace(' Risk', ''),
                }),
            });
        } catch (err) {
            console.error('❌ Risk assessment submit failed', err);
        }
        onBack();
    };

    return (
        <Stack tokens={dashboardTokens}>
            <PrimaryButton text="Back" onClick={onBack} style={{ marginBottom: 16 }} />
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
            <RiskAssessment
                riskCore={riskCore}
                setRiskCore={setRiskCore}
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
        </Stack>
    );
};

export default RiskAssessmentPage;