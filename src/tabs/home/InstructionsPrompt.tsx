import React, { useState } from 'react';
import { DefaultButton } from '@fluentui/react';
import { InstructionData } from '../../app/functionality/types';

export interface InstructionSummary {
    id: string;
    clientName: string;
    service: string;
    nextAction: string;
    disabled?: boolean; // For greyed out production features
}

export const getActionableInstructions = (
    data: InstructionData[],
    isLocalhost: boolean = false,
): InstructionSummary[] => {
    const summaries: InstructionSummary[] = [];
    const timestamp = new Date().toISOString();
    console.log(`🔍 DEBUG [${timestamp}]: getActionableInstructions processing`, data.length, 'items, isLocalhost:', isLocalhost);
    
    data.forEach((item, index) => {
        const instruction = item.instructions && item.instructions[0];
        if (!instruction) {
            console.log(`DEBUG: Item ${index} (${item.prospectId}) - no instruction found`);
            return;
        }
        
        const matterLinked = instruction.MatterId || item.matter;
        if (matterLinked && !isLocalhost) {
            console.log(`DEBUG: Item ${index} (${item.prospectId}) - already has matter:`, matterLinked);
            return; // skip if already linked to a matter (except in localhost)
        }

        // Calculate workflow status like InstructionCard.connected.tsx does
        const paymentStatus = 
            instruction.PaymentResult?.toLowerCase() === 'successful' ||
            instruction.InternalStatus === 'paid' ||
            instruction.internalStatus === 'paid'
                ? 'complete' : 'pending';
        
        const eid = item.electronicIDChecks && item.electronicIDChecks[0];
        const idVerification = item.idVerifications && item.idVerifications[0];
        const eidResult = eid?.EIDOverallResult?.toLowerCase();
        const idVerificationResult = idVerification?.EIDOverallResult?.toLowerCase();
        const poidPassed = eidResult === 'passed' || idVerificationResult === 'passed' ||
            instruction.IdVerified || instruction.EIDOverallResult?.toLowerCase() === 'passed';
        const stageComplete = instruction?.Stage === 'proof-of-id-complete' || instruction?.stage === 'proof-of-id-complete';
        
        // Use same logic as InstructionCard for verifyIdStatus to include 'review' status
        let verifyIdStatus: 'pending' | 'received' | 'review' | 'complete';
        if (stageComplete) {
            // If stage shows proof-of-id-complete, check the actual EID result
            if (eidResult === 'review') {
                verifyIdStatus = 'review';
            } else if (poidPassed || eidResult === 'passed') {
                verifyIdStatus = 'complete';  
            } else {
                // Stage complete but no clear result - assume review needed
                verifyIdStatus = 'review';
            }
        } else if (!eid && (!item.electronicIDChecks || item.electronicIDChecks.length === 0)) {
            const proofOfIdComplete = instruction?.proofOfIdComplete || instruction?.ProofOfIdComplete;
            verifyIdStatus = proofOfIdComplete ? 'received' : 'pending';
        } else if (poidPassed) {
            verifyIdStatus = 'complete';
        } else {
            verifyIdStatus = 'review';
        }
        
        const documentStatus = instruction.DocumentsReceived ? 'complete' : 'pending';
        
        const risk = item.riskAssessments && item.riskAssessments[0];
        const riskResultRaw = risk?.RiskAssessmentResult?.toString().toLowerCase() ?? "";
        const riskStatus = riskResultRaw
            ? ['low', 'low risk', 'pass', 'approved'].includes(riskResultRaw) ? 'complete' : 'review'
            : 'pending';

        // Determine next action step (same logic as InstructionCard.connected.tsx)
        const nextActionStep = 
            verifyIdStatus !== 'complete' ? 'id' :
            paymentStatus !== 'complete' ? 'payment' :
            documentStatus !== 'complete' ? 'documents' :
            riskStatus !== 'complete' ? 'risk' :
            'ccl'; // Include CCL as final step

        // For localhost, add matter opening after core workflow steps (ID + payment)
        const needsMatterOpening = isLocalhost && matterLinked && 
            verifyIdStatus === 'complete' && 
            paymentStatus === 'complete';

        // Check if any steps need review (red status)
        const hasIdReview = verifyIdStatus === 'review';
        const hasRiskReview = riskStatus === 'review';
        
        console.log(`🔍 DEBUG [${timestamp}]: Item ${index} (${item.prospectId}) workflow status:`, {
            verifyIdStatus,
            paymentStatus,
            documentStatus,
            riskStatus,
            nextActionStep,
            instruction: instruction.InstructionRef,
            stageComplete,
            eidResult,
            hasIdReview,
            hasRiskReview
        });
        
        // Include items that either:
        // 1. Have next action step as id/risk/ccl (blue active step), OR
        // 2. Have review status (red step that needs attention), OR
        // 3. Need matter opening (localhost only)
        const needsUserAction = 
            (nextActionStep === 'id' || nextActionStep === 'risk' || nextActionStep === 'ccl') ||
            hasIdReview || hasRiskReview || needsMatterOpening;
            
        if (!needsUserAction) {
            console.log(`🔍 DEBUG [${timestamp}]: Item ${index} (${item.prospectId}) - SKIPPING, no immediate action needed (nextActionStep: ${nextActionStep}, idReview: ${hasIdReview}, riskReview: ${hasRiskReview})`);
            return;
        }

        console.log(`🔍 DEBUG [${timestamp}]: Item ${index} (${item.prospectId}) - INCLUDING in actionable list (step: ${nextActionStep}, idReview: ${hasIdReview}, riskReview: ${hasRiskReview})`);

        const clientName = `${instruction.FirstName ?? ''} ${instruction.LastName ?? ''}`.trim();
        const service = item.deals?.[0]?.ServiceDescription || 'New Matter';
        
        let actionLabel = '';
        let isDisabled = false;
        
        // Determine action based on what needs attention (red steps have priority)
        if (hasIdReview) {
            actionLabel = 'Review ID';
        } else if (hasRiskReview) {
            actionLabel = 'Review Risk';
        } else if (needsMatterOpening) {
            actionLabel = 'Open Matter';
        } else if (nextActionStep === 'id') {
            actionLabel = 'Verify ID';
        } else if (nextActionStep === 'risk') {
            actionLabel = 'Assess Risk';
        } else if (nextActionStep === 'ccl') {
            actionLabel = 'Submit to CCL';
            isDisabled = !isLocalhost; // Enable CCL locally, disable in production
        } else {
            // This shouldn't happen due to filtering above, but just in case
            console.log(`DEBUG: Unexpected action step: ${nextActionStep}`);
            return;
        }

        console.log(`🔍 DEBUG [${timestamp}]: Adding actionable instruction:`, {
            id: instruction.InstructionRef ?? String(item.prospectId),
            clientName: clientName || 'Unknown Client',
            service,
            nextAction: actionLabel,
            disabled: isDisabled
        });

        summaries.push({
            id: instruction.InstructionRef ?? String(item.prospectId),
            clientName: clientName || 'Unknown Client',
            service,
            nextAction: actionLabel,
            disabled: isDisabled,
        });
    });
    
    console.log(`🔍 DEBUG [${timestamp}]: getActionableInstructions FINAL RESULT - returning`, summaries.length, 'actionable instructions');
    console.log(`🔍 DEBUG [${timestamp}]: Final actionable instructions:`, summaries.map(s => ({ id: s.id, nextAction: s.nextAction, disabled: s.disabled })));
    return summaries;
};

interface InstructionsPromptProps {
    summaries: InstructionSummary[];
    onDismiss: () => void;
}

const InstructionsPrompt: React.FC<InstructionsPromptProps> = ({ summaries, onDismiss }) => {
    const [expanded, setExpanded] = useState(false);
    if (summaries.length === 0) return null;
    return (
        <div className="instructions-prompt" style={{ padding: 16, border: '1px solid #e1dfdd', marginBottom: 16 }}>
            <p>You’ve received {summaries.length} instruction{summaries.length > 1 ? 's' : ''}. Your next step is required.</p>
            <ul style={{ marginTop: 8, marginBottom: 8 }}>
                {summaries.map(s => (
                    <li key={s.id}>{s.clientName} – {s.service} – Next: {s.nextAction}</li>
                ))}
            </ul>
            {expanded && (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 8 }}>
                    {JSON.stringify(summaries, null, 2)}
                </pre>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
                <DefaultButton onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide Details' : 'View Details'}</DefaultButton>
                <DefaultButton onClick={onDismiss}>Dismiss</DefaultButton>
            </div>
        </div>
    );
};

export default InstructionsPrompt;
