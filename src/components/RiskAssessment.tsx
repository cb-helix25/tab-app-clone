import React from 'react';
import {
    Stack,
    PrimaryButton,
    DatePicker,
    IDatePickerStyles,
} from '@fluentui/react';
import { sharedPrimaryButtonStyles } from '../app/styles/ButtonStyles';
import BigOptionGroup from './BigOptionGroup';

export interface RiskCore {
    clientType: string;
    clientTypeValue: number;
    destinationOfFunds: string;
    destinationOfFundsValue: number;
    fundsType: string;
    fundsTypeValue: number;
    clientIntroduced: string;
    clientIntroducedValue: number;
    limitation: string;
    limitationValue: number;
    sourceOfFunds: string;
    sourceOfFundsValue: number;
    valueOfInstruction: string;
    valueOfInstructionValue: number;
}

export interface RiskAssessmentProps {
    riskCore: RiskCore;
    setRiskCore: React.Dispatch<React.SetStateAction<RiskCore>>;
    complianceDate: Date | undefined;
    setComplianceDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
    complianceExpiry: Date | undefined;
    setComplianceExpiry: React.Dispatch<React.SetStateAction<Date | undefined>>;
    consideredClientRisk: boolean | undefined;
    setConsideredClientRisk: React.Dispatch<React.SetStateAction<boolean | undefined>>;
    consideredTransactionRisk: boolean | undefined;
    setConsideredTransactionRisk: React.Dispatch<React.SetStateAction<boolean | undefined>>;
    transactionRiskLevel: string;
    setTransactionRiskLevel: React.Dispatch<React.SetStateAction<string>>;
    consideredFirmWideSanctions: boolean | undefined;
    setConsideredFirmWideSanctions: React.Dispatch<React.SetStateAction<boolean | undefined>>;
    consideredFirmWideAML: boolean | undefined;
    setConsideredFirmWideAML: React.Dispatch<React.SetStateAction<boolean | undefined>>;
    onContinue: () => void;
    isComplete: () => boolean;
  }

const clientTypeOptions = [
    { key: 1, text: 'Individual or Company registered in England and Wales with Companies House' },
    { key: 2, text: 'Group Company or Subsidiary, Trust' },
    { key: 3, text: 'Non UK Company' },
];

const destinationOfFundsOptions = [
    { key: 1, text: 'Client within UK' },
    { key: 2, text: 'Client in EU/3rd party in UK' },
    { key: 3, text: 'Outwith UK or Client outwith EU' },
];

const fundsTypeOptions = [
    { key: 1, text: 'Personal Cheque, BACS' },
    { key: 2, text: 'Cash payment if less than £1,000' },
    { key: 3, text: 'Cash payment above £1,000' },
];

const introducedOptions = [
    { key: 1, text: 'Existing client introduction, personal introduction' },
    { key: 2, text: 'Internet Enquiry' },
    { key: 3, text: 'Other' },
];

const limitationOptions = [
    { key: 1, text: 'There is no applicable limitation period' },
    { key: 2, text: 'There is greater than 6 months to the expiry of the limitation period' },
    { key: 3, text: 'There is less than 6 months to limitation expiry' },
];

const sourceOfFundsOptions = [
    { key: 1, text: "Clients named account" },
    { key: 2, text: "3rd Party UK or Client's EU account" },
    { key: 3, text: "Any other account" },
];

const valueOfInstructionOptions = [
    { key: 1, text: 'Less than £10,000' },
    { key: 2, text: '£10,000 to £500,000' },
    { key: 3, text: 'Above £500,000' },
];

const datePickerStyles: Partial<IDatePickerStyles> = {
    root: { width: 300 },
    textField: {
        width: '100%',
        borderRadius: '0',
        selectors: {
            '& .ms-TextField-fieldGroup': {
                border: '1px solid #8a8886',
                background: 'transparent',
                borderRadius: '0',
                height: '32px',
            },
            '& .ms-TextField-field': {
                padding: '0 12px',
                height: '100%',
            },
        },
    },
    icon: { right: 8 },
};

const RiskAssessment: React.FC<RiskAssessmentProps> = ({
    riskCore,
    setRiskCore,
    complianceDate,
    setComplianceDate,
    complianceExpiry,
    setComplianceExpiry,
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
    isComplete,
}) => {
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

    return (
        <Stack tokens={{ childrenGap: 24 }} horizontalAlign="center">
            <Stack tokens={{ childrenGap: 20 }} styles={{ root: { maxWidth: 620, width: '100%' } }}>
                <Stack horizontal wrap horizontalAlign="center" tokens={{ childrenGap: 20 }}>
                    <DatePicker
                        label="Compliance Date"
                        value={complianceDate}
                        onSelectDate={(d) => setComplianceDate(d || undefined)}
                        formatDate={(d) => d?.toLocaleDateString('en-GB') || ''}
                        styles={datePickerStyles}
                    />
                    <DatePicker
                        label="Compliance Expiry"
                        value={complianceExpiry}
                        onSelectDate={(d) => setComplianceExpiry(d || undefined)}
                        formatDate={(d) => d?.toLocaleDateString('en-GB') || ''}
                        styles={datePickerStyles}
                    />
                </Stack>
                <BigOptionGroup
                    label="Client Type"
                    options={clientTypeOptions}
                    selectedKey={riskCore.clientTypeValue}
                    onChange={(k, t) =>
                        setRiskCore({
                            ...riskCore,
                            clientType: t,
                            clientTypeValue: Number(k) || 0,
                        })
                    }
                />
                <BigOptionGroup
                    label="Destination of Funds"
                    options={destinationOfFundsOptions}
                    selectedKey={riskCore.destinationOfFundsValue}
                    onChange={(k, t) =>
                        setRiskCore({
                            ...riskCore,
                            destinationOfFunds: t,
                            destinationOfFundsValue: Number(k) || 0,
                        })
                    }
                />
                <BigOptionGroup
                    label="Funds Type"
                    options={fundsTypeOptions}
                    selectedKey={riskCore.fundsTypeValue}
                    onChange={(k, t) =>
                        setRiskCore({
                            ...riskCore,
                            fundsType: t,
                            fundsTypeValue: Number(k) || 0,
                        })
                    }
                />
                <BigOptionGroup
                    label="How was Client Introduced?"
                    options={introducedOptions}
                    selectedKey={riskCore.clientIntroducedValue}
                    onChange={(k, t) =>
                        setRiskCore({
                            ...riskCore,
                            clientIntroduced: t,
                            clientIntroducedValue: Number(k) || 0,
                        })
                    }
                />
                <BigOptionGroup
                    label="Limitation"
                    options={limitationOptions}
                    selectedKey={riskCore.limitationValue}
                    onChange={(k, t) =>
                        setRiskCore({
                            ...riskCore,
                            limitation: t,
                            limitationValue: Number(k) || 0,
                        })
                    }
                />
                <BigOptionGroup
                    label="Source of Funds"
                    options={sourceOfFundsOptions}
                    selectedKey={riskCore.sourceOfFundsValue}
                    onChange={(k, t) =>
                        setRiskCore({
                            ...riskCore,
                            sourceOfFunds: t,
                            sourceOfFundsValue: Number(k) || 0,
                        })
                    }
                />
                <BigOptionGroup
                    label="Value of Instruction"
                    options={valueOfInstructionOptions}
                    selectedKey={riskCore.valueOfInstructionValue}
                    onChange={(k, t) =>
                        setRiskCore({
                            ...riskCore,
                            valueOfInstruction: t,
                            valueOfInstructionValue: Number(k) || 0,
                        })
                    }
                />
                <Stack horizontal wrap horizontalAlign="center" tokens={{ childrenGap: 20 }}>
                    <BigOptionGroup
                        label="I have considered client risk factors"
                        options={[{ key: 'yes', text: 'Yes' }, { key: 'no', text: 'No' }]}
                        selectedKey={
                            consideredClientRisk === undefined
                                ? undefined
                                : consideredClientRisk
                                ? 'yes'
                                : 'no'
                        }
                        onChange={(k) => setConsideredClientRisk(k === 'yes')}
                    />
                    <BigOptionGroup
                        label="I have considered transaction risk factors"
                        options={[{ key: 'yes', text: 'Yes' }, { key: 'no', text: 'No' }]}
                        selectedKey={
                            consideredTransactionRisk === undefined
                                ? undefined
                                : consideredTransactionRisk
                                ? 'yes'
                                : 'no'
                        }
                        onChange={(k) => setConsideredTransactionRisk(k === 'yes')}
                    />
                    {consideredTransactionRisk && (
                        <BigOptionGroup
                            label="Transaction Risk Level"
                            options={[
                                { key: 'Low Risk', text: 'Low Risk' },
                                { key: 'Medium Risk', text: 'Medium Risk' },
                                { key: 'High Risk', text: 'High Risk' },
                            ]}
                            selectedKey={transactionRiskLevel}
                            onChange={(k) => setTransactionRiskLevel(k as string)}
                        />
                    )}
                    <BigOptionGroup
                        label="I have considered the Firm Wide Sanctions Risk Assessment"
                        options={[{ key: 'yes', text: 'Yes' }, { key: 'no', text: 'No' }]}
                        selectedKey={
                            consideredFirmWideSanctions === undefined
                                ? undefined
                                : consideredFirmWideSanctions
                                ? 'yes'
                                : 'no'
                        }
                        onChange={(k) => setConsideredFirmWideSanctions(k === 'yes')}
                    />
                    <BigOptionGroup
                        label="I have considered the Firm Wide AML policy"
                        options={[{ key: 'yes', text: 'Yes' }, { key: 'no', text: 'No' }]}
                        selectedKey={
                            consideredFirmWideAML === undefined
                                ? undefined
                                : consideredFirmWideAML
                                ? 'yes'
                                : 'no'
                        }
                        onChange={(k) => setConsideredFirmWideAML(k === 'yes')}
                    />
                </Stack>
                <Stack tokens={{ childrenGap: 4 }} horizontalAlign="center">
                    <span style={{ fontWeight: 600 }}>Score: {riskScore}</span>
                    <span style={{ fontWeight: 600 }}>Risk Result: {riskResult}</span>
                </Stack>
            </Stack>
            <PrimaryButton
                text="Continue"
                onClick={onContinue}
                disabled={!isComplete()}
                styles={sharedPrimaryButtonStyles}
            />
        </Stack>
    );
};

export default RiskAssessment;
