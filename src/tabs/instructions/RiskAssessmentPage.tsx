import React, { useState } from 'react';
import { Stack, PrimaryButton } from '@fluentui/react';
import RiskAssessment, { RiskCore } from '../../components/RiskAssessment';
import { dashboardTokens } from './componentTokens';

interface RiskAssessmentPageProps {
    onBack: () => void;
}

const RiskAssessmentPage: React.FC<RiskAssessmentPageProps> = ({ onBack }) => {
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
                onContinue={onBack}
                isComplete={isComplete}
            />
        </Stack>
    );
};

export default RiskAssessmentPage;