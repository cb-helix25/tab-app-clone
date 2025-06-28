import React, { useState } from 'react';
import { Stack, PrimaryButton } from '@fluentui/react';
import RiskAssessment, { RiskCore } from '../../components/RiskAssessment';
import { dashboardTokens } from './componentTokens';

interface RiskAssessmentPageProps {
    onBack: () => void;
    instructionRef?: string;
    riskAssessor?: string;
}

const RiskAssessmentPage: React.FC<RiskAssessmentPageProps> = ({ onBack, instructionRef, riskAssessor }) => {
    const [riskCore, setRiskCore] = useState<RiskCore>({
        clientType: '',
        destinationOfFunds: '',
        fundsType: '',
        clientIntroduced: '',
        limitation: '',
        sourceOfFunds: '',
        valueOfInstruction: '',
    });
    const [consideredClientRisk, setConsideredClientRisk] = useState(false);
    const [consideredTransactionRisk, setConsideredTransactionRisk] = useState(false);
    const [transactionRiskLevel, setTransactionRiskLevel] = useState('');
    const [consideredFirmWideSanctions, setConsideredFirmWideSanctions] = useState(false);
    const [consideredFirmWideAML, setConsideredFirmWideAML] = useState(false);

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