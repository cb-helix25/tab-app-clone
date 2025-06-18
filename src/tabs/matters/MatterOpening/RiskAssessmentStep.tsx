import React from 'react';
import { Stack, Dropdown, Toggle, PrimaryButton } from '@fluentui/react';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';

interface RiskAssessmentStepProps {
    riskCore: {
        clientType: string;
        destinationOfFunds: string;
        fundsType: string;
        clientIntroduced: string;
        limitation: string;
        sourceOfFunds: string;
        valueOfInstruction: string;
    };
    setRiskCore: (v: RiskAssessmentStepProps['riskCore']) => void;
    consideredClientRisk: boolean;
    setConsideredClientRisk: (v: boolean) => void;
    consideredTransactionRisk: boolean;
    setConsideredTransactionRisk: (v: boolean) => void;
    transactionRiskLevel: string;
    setTransactionRiskLevel: (v: string) => void;
    consideredFirmWideSanctions: boolean;
    setConsideredFirmWideSanctions: (v: boolean) => void;
    consideredFirmWideAML: boolean;
    setConsideredFirmWideAML: (v: boolean) => void;
    onContinue: () => void;
    isStepComplete: () => boolean;
}

const riskOptions = [
    { key: 'Low', text: 'Low' },
    { key: 'Medium', text: 'Medium' },
    { key: 'High', text: 'High' },
];

const RiskAssessmentStep: React.FC<RiskAssessmentStepProps> = ({
    riskCore,
    setRiskCore,
    consideredClientRisk,
    setConsideredClientRisk,
    consideredTransactionRisk,
    setConsideredTransactionRisk,
    transactionRiskLevel,
    setTransactionRiskLevel,
    consideredFirmWideSanctions,
    setConsideredFirmWideSanctions,
    consideredFirmWideAML,
    setConsideredFirmWideAML,
    onContinue,
    isStepComplete,
}) => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <Stack horizontal tokens={{ childrenGap: 40 }}>
            <Stack tokens={{ childrenGap: 15 }} styles={{ root: { width: 300 } }}>
                <Dropdown label="Client Type" placeholder="Select option" options={riskOptions} selectedKey={riskCore.clientType} onChange={(_, o) => setRiskCore({ ...riskCore, clientType: o?.key as string })} />
                <Dropdown label="Destination of Funds" placeholder="Select option" options={riskOptions} selectedKey={riskCore.destinationOfFunds} onChange={(_, o) => setRiskCore({ ...riskCore, destinationOfFunds: o?.key as string })} />
                <Dropdown label="Funds Type" placeholder="Select option" options={riskOptions} selectedKey={riskCore.fundsType} onChange={(_, o) => setRiskCore({ ...riskCore, fundsType: o?.key as string })} />
                <Dropdown label="How was Client Introduced?" placeholder="Select option" options={riskOptions} selectedKey={riskCore.clientIntroduced} onChange={(_, o) => setRiskCore({ ...riskCore, clientIntroduced: o?.key as string })} />
                <Dropdown label="Limitation" placeholder="Select option" options={riskOptions} selectedKey={riskCore.limitation} onChange={(_, o) => setRiskCore({ ...riskCore, limitation: o?.key as string })} />
                <Dropdown label="Source of Funds" placeholder="Select option" options={riskOptions} selectedKey={riskCore.sourceOfFunds} onChange={(_, o) => setRiskCore({ ...riskCore, sourceOfFunds: o?.key as string })} />
                <Dropdown label="Value of Instruction" placeholder="Select option" options={riskOptions} selectedKey={riskCore.valueOfInstruction} onChange={(_, o) => setRiskCore({ ...riskCore, valueOfInstruction: o?.key as string })} />
            </Stack>
            <Stack tokens={{ childrenGap: 15 }} styles={{ root: { width: 300 } }}>
                <Toggle label="I have considered client risk factors" checked={consideredClientRisk} onChange={(_, c) => setConsideredClientRisk(!!c)} />
                <Toggle label="I have considered transaction risk factors" checked={consideredTransactionRisk} onChange={(_, c) => setConsideredTransactionRisk(!!c)} />
                {consideredTransactionRisk && (
                    <Dropdown
                        label="Transaction Risk Level"
                        placeholder="Select risk level"
                        options={[{ key: 'Low Risk', text: 'Low Risk' }, { key: 'Medium Risk', text: 'Medium Risk' }, { key: 'High Risk', text: 'High Risk' }]}
                        selectedKey={transactionRiskLevel}
                        onChange={(_, o) => setTransactionRiskLevel(o?.key as string)}
                    />
                )}
                <Toggle label="I have considered the Firm Wide Sanctions Risk Assessment" checked={consideredFirmWideSanctions} onChange={(_, c) => setConsideredFirmWideSanctions(!!c)} />
                <Toggle label="I have considered the Firm Wide AML policy" checked={consideredFirmWideAML} onChange={(_, c) => setConsideredFirmWideAML(!!c)} />
            </Stack>
        </Stack>
        <PrimaryButton text="Continue" onClick={onContinue} disabled={!isStepComplete()} styles={sharedPrimaryButtonStyles} />
    </Stack>
);

export default RiskAssessmentStep;
