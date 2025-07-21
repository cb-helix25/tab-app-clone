import React, { useRef, useState } from 'react';
// invisible change 2
import {
    Stack,
    PrimaryButton,
    DefaultButton,
    Dialog,
    DialogType,
    DialogFooter,
    DatePicker,
    IDatePickerStyles,
    Checkbox,
} from '@fluentui/react';
import { sharedPrimaryButtonStyles, sharedDefaultButtonStyles } from '../app/styles/ButtonStyles';
import '../app/styles/MultiSelect.css';
import '../app/styles/InstructionCard.css';

interface Option {
    key: string | number;
    text: string;
}

interface QuestionGroupProps {
    label: string;
    options: Option[];
    selectedKey: string | number | undefined;
    onChange: (key: string | number, text: string) => void;
    showPrompt?: boolean; // Whether to show a prompt when "No" is selected
}

const QuestionGroup: React.FC<QuestionGroupProps> = ({ label, options, selectedKey, onChange, showPrompt = false }) => {
    // For yes/no questions, use 2-column grid, otherwise 3-column grid
    const isYesNoQuestion = options.length === 2 && 
        options.some(opt => opt.text.toLowerCase() === 'yes') && 
        options.some(opt => opt.text.toLowerCase() === 'no');
    
    const gridColumns = isYesNoQuestion ? 2 : 3;
    
    // Check if "No" is selected and we should show the prompt
    const shouldShowPrompt = showPrompt && isYesNoQuestion && selectedKey === 'no';
    
    return (
        <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginBottom: 16 } }}>
            <div className="question-banner" style={{ width: '100%', boxSizing: 'border-box' }}>
                {label}
            </div>
            <div 
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                    gap: '8px',
                    width: '100%'
                }}
            >
                {options.map((option) => {
                    const isSelected = option.key === selectedKey;
                    return (
                        <button
                            key={option.key}
                            type="button"
                            onClick={() => onChange(option.key, option.text)}
                            className="client-details-contact-bigbtn"
                            style={{
                                background: isSelected ? '#e7f1ff' : '#fff',
                                border: isSelected ? '1px solid #3690CE' : '1px solid #e1dfdd',
                                color: isSelected ? '#3690CE' : '#061733',
                                padding: '12px 18px',
                                fontSize: '16px',
                                fontWeight: '500',
                                borderRadius: '0',
                                cursor: 'pointer',
                                transition: 'background 0.18s, border 0.18s, color 0.18s',
                                textAlign: 'left',
                                justifyContent: 'flex-start',
                                display: 'flex',
                                alignItems: 'center',
                                minHeight: '60px',
                                boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                                whiteSpace: 'normal',
                                wordWrap: 'break-word',
                                hyphens: 'auto',
                                lineHeight: '1.4'
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.background = '#e7f1ff';
                                    e.currentTarget.style.borderColor = '#3690CE';
                                    e.currentTarget.style.color = '#3690CE';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.background = '#fff';
                                    e.currentTarget.style.borderColor = '#e1dfdd';
                                    e.currentTarget.style.color = '#061733';
                                }
                            }}
                        >
                            {option.text}
                        </button>
                    );
                })}
            </div>
            {shouldShowPrompt && (
                <div style={{
                    background: '#fffbe6',
                    border: '2px solid #FFB900',
                    borderRadius: 0,
                    padding: '12px 16px',
                    color: '#b88600',
                    fontSize: 14,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 12
                }}>
                    <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: 20, 
                        height: 20, 
                        background: '#FFB900', 
                        borderRadius: '50%',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 'bold'
                    }}>
                        i
                    </span>
                    The document can be found{' '}
                    <a 
                        href="#" 
                        style={{ 
                            color: '#3690CE', 
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            // Placeholder action - could open a modal, navigate to document, etc.
                            alert('Document access would be implemented here');
                        }}
                    >
                        here
                    </a>.
                </div>
            )}
        </Stack>
    );
};

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
    limitationDate: Date | undefined;
    setLimitationDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
    limitationDateTbc: boolean;
    setLimitationDateTbc: React.Dispatch<React.SetStateAction<boolean>>;
    onContinue: () => void;
    isComplete: () => boolean;
    onHeaderButtonsChange?: (buttons: { clearAllButton: React.ReactNode | null; jsonButton: React.ReactNode }) => void;
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
    limitationDate,
    setLimitationDate,
    limitationDateTbc,
    setLimitationDateTbc,
    onContinue,
    isComplete,
    onHeaderButtonsChange,
}) => {
    const initialRiskCore = useRef<RiskCore>(riskCore);
    const initialClientRisk = useRef<boolean | undefined>(consideredClientRisk);
    const initialTransactionRisk = useRef<boolean | undefined>(consideredTransactionRisk);
    const initialTransactionLevel = useRef<string>(transactionRiskLevel);
    const initialFirmWideSanctions = useRef<boolean | undefined>(consideredFirmWideSanctions);
    const initialFirmWideAML = useRef<boolean | undefined>(consideredFirmWideAML);

    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [jsonPreviewOpen, setJsonPreviewOpen] = useState(false);

    const hasDataToClear = () => {
        const coreChanged = Object.entries(riskCore).some(
            ([k, v]) => (initialRiskCore.current as any)[k] !== v
        );
        return (
            coreChanged ||
            consideredClientRisk !== initialClientRisk.current ||
            consideredTransactionRisk !== initialTransactionRisk.current ||
            transactionRiskLevel !== initialTransactionLevel.current ||
            consideredFirmWideSanctions !== initialFirmWideSanctions.current ||
            consideredFirmWideAML !== initialFirmWideAML.current
        );
    };

    const doClearAll = () => {
        setIsClearDialogOpen(false);
        setRiskCore({
            clientType: '',
            clientTypeValue: 0,
            destinationOfFunds: '',
            destinationOfFundsValue: 0,
            fundsType: '',
            fundsTypeValue: 0,
            clientIntroduced: '',
            clientIntroducedValue: 0,
            limitation: '',
            limitationValue: 0,
            sourceOfFunds: '',
            sourceOfFundsValue: 0,
            valueOfInstruction: '',
            valueOfInstructionValue: 0,
        });
        setConsideredClientRisk(false);
        setConsideredTransactionRisk(false);
        setTransactionRiskLevel('');
        setConsideredFirmWideSanctions(false);
        setConsideredFirmWideAML(false);
        setJsonPreviewOpen(false);
    };

    const handleClearAll = () => {
        if (hasDataToClear()) {
            setIsClearDialogOpen(true);
        } else {
            doClearAll();
        }
    };

    const generateJson = () => ({
        ComplianceDate: new Date().toISOString().split('T')[0],
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
        TransactionRiskLevel: transactionRiskLevel || null,
        ClientRiskFactorsConsidered: consideredClientRisk,
        TransactionRiskFactorsConsidered: consideredTransactionRisk,
        FirmWideSanctionsRiskConsidered: consideredFirmWideSanctions,
        FirmWideAMLPolicyConsidered: consideredFirmWideAML,
    });
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

    // Pass buttons to parent component
    React.useEffect(() => {
        if (onHeaderButtonsChange) {
            onHeaderButtonsChange({
                clearAllButton: hasDataToClear() ? (
                    <button
                        type="button"
                        onClick={() => setIsClearDialogOpen(true)}
                        style={{
                            background: '#fff',
                            border: '1px solid #e1e5e9',
                            borderRadius: 0,
                            padding: '10px 16px',
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#D65541',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontFamily: 'Raleway, sans-serif',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ffefed';
                            e.currentTarget.style.borderColor = '#D65541';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(214,85,65,0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff';
                            e.currentTarget.style.borderColor = '#e1e5e9';
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(6,23,51,0.04)';
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-10-2-1-2-2-2V6m3 0V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2m-6 5v6m4-6v6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Clear All
                    </button>
                ) : null,
                jsonButton: (
                    <button
                        type="button"
                        onClick={() => setJsonPreviewOpen(!jsonPreviewOpen)}
                        style={{
                            background: '#f8f9fa',
                            border: '1px solid #e1dfdd',
                            borderRadius: 0,
                            padding: '10px 12px',
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#3690CE',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s ease, border-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e7f1ff';
                            e.currentTarget.style.borderColor = '#3690CE';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f8f9fa';
                            e.currentTarget.style.borderColor = '#e1dfdd';
                        }}
                    >
                        <i className="ms-Icon ms-Icon--Code" style={{ fontSize: 14 }} />
                    </button>
                )
            });
        }
    }, [hasDataToClear(), jsonPreviewOpen, onHeaderButtonsChange]);


    return (
        <Stack tokens={{ childrenGap: 24 }} horizontalAlign="center">

            <Stack horizontal tokens={{ childrenGap: 32 }} styles={{ root: { width: '100%' } }}>
                <Stack tokens={{ childrenGap: 20 }} styles={{ root: { flex: 3 } }}>
                    <QuestionGroup
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
                    <QuestionGroup
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
                    <QuestionGroup
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
                    <QuestionGroup
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
                    <QuestionGroup
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
                    {[2, 3].includes(riskCore.limitationValue) && (
                        <Stack tokens={{ childrenGap: 8 }}>
                            <DatePicker
                                value={limitationDate}
                                onSelectDate={(d) => setLimitationDate(d || undefined)}
                                styles={datePickerStyles}
                                placeholder="Limitation Date"
                                formatDate={(d?: Date) => (d ? d.toLocaleDateString('en-GB') : '')}
                                disabled={limitationDateTbc}
                            />
                            <Checkbox
                                label="Limitation Date TBC"
                                checked={limitationDateTbc}
                                onChange={(_, c) => {
                                    setLimitationDateTbc(!!c);
                                    if (c) setLimitationDate(undefined);
                                }}
                            />
                        </Stack>
                    )}
                    <QuestionGroup
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
                    <QuestionGroup
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
                </Stack>

                <Stack tokens={{ childrenGap: 20 }} styles={{ root: { flex: 2 } }}>
                    <QuestionGroup
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
                        showPrompt={true}
                    />
                    <QuestionGroup
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
                        showPrompt={true}
                    />
                    {consideredTransactionRisk && (
                        <QuestionGroup
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
                    <QuestionGroup
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
                        showPrompt={true}
                    />
                    <QuestionGroup
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
                        showPrompt={true}
                    />

                    <Stack tokens={{ childrenGap: 4 }} horizontalAlign="center">
                        <span style={{ fontWeight: 600 }}>Score: {riskScore}</span>
                        <span style={{ fontWeight: 600 }}>Risk Result: {riskResult}</span>
                    </Stack>
                </Stack>
            </Stack>

            <Stack horizontal tokens={{ childrenGap: 12 }} horizontalAlign="center">
                {hasDataToClear() && (
                    <Dialog
                        hidden={!isClearDialogOpen}
                        onDismiss={() => setIsClearDialogOpen(false)}
                        dialogContentProps={{
                            type: DialogType.normal,
                            title: 'Clear All Data',
                            subText: 'Are you sure you want to clear all form data? This action cannot be undone.',
                        }}
                        modalProps={{ isBlocking: true }}
                    >
                        <DialogFooter>
                            <PrimaryButton onClick={doClearAll} text="Yes, clear all" />
                            <DefaultButton onClick={() => setIsClearDialogOpen(false)} text="Cancel" />
                        </DialogFooter>
                    </Dialog>
                )}

                <PrimaryButton
                    text="Continue"
                    onClick={onContinue}
                    disabled={!isComplete()}
                    styles={sharedPrimaryButtonStyles}
                />
            </Stack>

            {jsonPreviewOpen && (
                <div
                    style={{
                        marginTop: 12,
                        border: '1px solid #e1dfdd',
                        borderRadius: 6,
                        background: '#f8f9fa',
                        overflow: 'hidden',
                        width: '100%',
                        maxWidth: 620,
                    }}
                >
                    <div
                        style={{
                            padding: 16,
                            maxHeight: 300,
                            overflow: 'auto',
                            fontSize: 10,
                            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                            lineHeight: 1.4,
                            background: '#fff',
                        }}
                    >
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {JSON.stringify(generateJson(), null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </Stack>
    );
};

export default RiskAssessment;
