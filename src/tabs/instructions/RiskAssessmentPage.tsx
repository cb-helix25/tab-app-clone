import React, { useState } from 'react';
// invisible change 2.1
//
import { Stack, Dialog, DialogType, DialogFooter, DefaultButton, PrimaryButton } from '@fluentui/react';
import RiskAssessment, { RiskCore } from '../../components/RiskAssessment';
import { dashboardTokens } from './componentTokens';
import '../../app/styles/NewMatters.css';
import '../../app/styles/MatterOpeningCard.css';
import '../../app/styles/RiskAssessmentPage.css';
import { sharedPrimaryButtonStyles, sharedDefaultButtonStyles } from '../../app/styles/ButtonStyles';

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
    const [consideredClientRisk, setConsideredClientRisk] = useState<
        boolean | undefined
    >(existingRisk?.ClientRiskFactorsConsidered !== undefined
        ? !!existingRisk?.ClientRiskFactorsConsidered
        : false);
    const [consideredTransactionRisk, setConsideredTransactionRisk] = useState<
        boolean | undefined
    >(existingRisk?.TransactionRiskFactorsConsidered !== undefined
        ? !!existingRisk?.TransactionRiskFactorsConsidered
        : false);
    const [transactionRiskLevel, setTransactionRiskLevel] = useState(
        existingRisk?.TransactionRiskLevel ?? '',
    );
    const [consideredFirmWideSanctions, setConsideredFirmWideSanctions] = useState<
        boolean | undefined
    >(existingRisk?.FirmWideSanctionsRiskConsidered !== undefined
        ? !!existingRisk?.FirmWideSanctionsRiskConsidered
        : false);
    const [consideredFirmWideAML, setConsideredFirmWideAML] = useState<
        boolean | undefined
    >(existingRisk?.FirmWideAMLPolicyConsidered !== undefined
        ? !!existingRisk?.FirmWideAMLPolicyConsidered
        : false);

    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [headerButtons, setHeaderButtons] = useState<{ clearAllButton: React.ReactNode | null; jsonButton: React.ReactNode }>({
        clearAllButton: null,
        jsonButton: null
    });

    const handleHeaderButtonsChange = (buttons: { clearAllButton: React.ReactNode | null; jsonButton: React.ReactNode }) => {
        setHeaderButtons(buttons);
    };


    // Helper function to check if there's any data to clear
    const hasDataToClear = () => {
        return Object.values(riskCore).some(v => v !== '' && v !== 0) ||
               consideredClientRisk === true ||
               consideredTransactionRisk === true ||
               transactionRiskLevel !== '' ||
               consideredFirmWideSanctions === true ||
               consideredFirmWideAML === true;
    };

    // Clear all selections and inputs
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
    };

    const isComplete = () =>
        Object.values(riskCore).every((v) => v !== '' && v !== 0) &&
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

            // Calculate compliance expiry as 6 months from compliance date
            const complianceExpiry = complianceDate ? new Date(complianceDate.getTime()) : null;
            if (complianceExpiry) {
                complianceExpiry.setMonth(complianceExpiry.getMonth() + 6);
            }

            const payload = {
                MatterId: instructionRef, // Using instruction ref as matter ID
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
            };

            console.log('📋 Submitting risk assessment:', payload);

            const baseUrl = process.env.REACT_APP_PROXY_BASE_URL || '';
            const functionCode = process.env.REACT_APP_INSERT_RISK_ASSESSMENT_CODE || '';
            const functionPath = process.env.REACT_APP_INSERT_RISK_ASSESSMENT_PATH || 'insertRiskAssessment';
            
            const url = functionCode 
                ? `${baseUrl}/${functionPath}?code=${functionCode}`
                : `${baseUrl}/${functionPath}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status}`);
            }

            const responseData = await response.text();
            console.log('✅ Risk assessment submitted successfully:', responseData);
            
            // Show success message (you could add a toast notification here)
            alert('Risk assessment submitted successfully!');
            
        } catch (err) {
            console.error('❌ Risk assessment submit failed', err);
            alert('Failed to submit risk assessment. Please try again.');
        }
        
        onBack();
    };

    return (
        <Stack tokens={dashboardTokens} className="workflow-container">
            <div className="workflow-main matter-opening-card risk-full-width">
                {/* Header with breadcrumb-style progress - exactly like Matter Opening */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '16px 24px', 
                    borderBottom: '1px solid #e1dfdd',
                    background: '#fff',
                    margin: '-20px -20px 0 -20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
                        <i className="ms-Icon ms-Icon--DocumentSearch" style={{ fontSize: 16 }} />
                        Risk Assessment
                    </div>

                    {/* Right side controls */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8
                    }}>
                        {/* Buttons provided by child component */}
                        {headerButtons.clearAllButton}
                        {headerButtons.jsonButton}
                    </div>
                </div>

                {/* Info box styled exactly like the provided element */}
                <div style={{
                    background: 'linear-gradient(135deg, rgb(248, 250, 251) 0%, rgb(241, 244, 246) 100%)',
                    border: '1px solid rgb(225, 229, 233)',
                    borderRadius: '0px',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '0px',
                        right: '0px',
                        width: '120px',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent 0%, rgba(54, 144, 206, 0.03) 100%)',
                        pointerEvents: 'none'
                    }}></div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'rgb(107, 114, 128)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    marginBottom: '2px'
                                }}>Assessment Date &amp; Time</div>
                                <div style={{
                                    fontSize: '15px',
                                    fontWeight: 400,
                                    color: 'rgb(31, 41, 55)',
                                    fontFamily: 'Raleway, sans-serif'
                                }}>{new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB')}</div>
                            </div>
                            <div style={{
                                width: '1px',
                                height: '40px',
                                background: 'rgb(225, 229, 233)',
                                margin: '0 8px'
                            }}></div>
                            <div>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'rgb(107, 114, 128)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    marginBottom: '2px'
                                }}>Assessment Expiry</div>
                                <div style={{
                                    fontSize: '15px',
                                    fontWeight: 400,
                                    color: 'rgb(31, 41, 55)',
                                    fontFamily: 'Raleway, sans-serif'
                                }}>
                                    {complianceDate ? (() => {
                                        const expiryDate = new Date(complianceDate);
                                        expiryDate.setMonth(expiryDate.getMonth() + 6);
                                        return expiryDate.toLocaleDateString('en-GB');
                                    })() : 'Not Set'}
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'rgb(107, 114, 128)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '2px'
                            }}>User Assessing Risk</div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: '8px'
                            }}>
                                <div style={{
                                    fontSize: '15px',
                                    fontWeight: 400,
                                    color: 'rgb(54, 144, 206)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <i className="ms-Icon ms-Icon--Contact" style={{ fontSize: '14px' }}></i>
                                    {riskAssessor ? `${riskAssessor} | 141740` : 'Current User | 141740'}
                                </div>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: 'rgb(16, 185, 129)',
                                    animation: '2s ease 0s infinite normal none running pulse',
                                    boxShadow: 'rgba(16, 185, 129, 0.7) 0px 0px 0px 0px'
                                }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="step-content active" style={{ maxHeight: 'none', opacity: 1, visibility: 'visible', padding: '0.75rem' }}>
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
                        onHeaderButtonsChange={handleHeaderButtonsChange}
                    />
                </div>
            </div>

            {/* Clear All Confirmation Dialog */}
            <Dialog
                hidden={!isClearDialogOpen}
                onDismiss={() => setIsClearDialogOpen(false)}
                dialogContentProps={{
                    type: DialogType.normal,
                    title: 'Clear All Data',
                    subText: 'Are you sure you want to clear all form data? This action cannot be undone.'
                }}
                modalProps={{
                    isBlocking: true
                }}
            >
                <DialogFooter>
                    <PrimaryButton 
                        onClick={doClearAll} 
                        text="Yes, clear all"
                        styles={sharedPrimaryButtonStyles}
                    />
                    <DefaultButton 
                        onClick={() => setIsClearDialogOpen(false)} 
                        text="Cancel"
                        styles={sharedDefaultButtonStyles}
                    />
                </DialogFooter>
            </Dialog>

            {/* CSS animations for completion ticks and pulse animation */}
            <style>{`
                @keyframes tickPop {
                    from {
                        opacity: 0;
                        transform: scale(0);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .completion-tick {
                    animation: tickPop 0.3s ease;
                }
                
                .completion-tick.visible {
                    opacity: 1;
                    transform: scale(1);
                }

                @keyframes pulse {
                    0% {
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                    }
                    70% {
                        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
                    }
                }
            `}</style>
        </Stack>
    );
};

export default RiskAssessmentPage;