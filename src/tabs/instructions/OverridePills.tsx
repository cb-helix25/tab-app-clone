import React, { useState } from 'react';
import { colours } from '../../app/styles/colours';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaShieldAlt, FaIdCard, FaFolder, FaFileAlt, FaCreditCard } from 'react-icons/fa';

interface OverridePillsProps {
  instruction: any;
  selectedOverviewItem?: any;
  isDarkMode: boolean;
  onStatusUpdate?: () => void;
}

interface WorkflowStep {
  key: string;
  label: string;
  icon: React.ReactNode;
  status: 'complete' | 'in-progress' | 'failed' | 'pending';
  canOverride: boolean;
}

const OverridePills: React.FC<OverridePillsProps> = ({
  instruction,
  selectedOverviewItem,
  isDarkMode,
  onStatusUpdate
}) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState<string | null>(null);

  // Map current instruction data to workflow steps (similar to InstructionCard logic)
  const getWorkflowSteps = (): WorkflowStep[] => {
    // ID Status
    const poidResult = selectedOverviewItem?.eid?.EIDOverallResult?.toLowerCase() ?? "";
    const eidStatus = selectedOverviewItem?.eid?.EIDStatus?.toLowerCase() ?? "";
    const poidPassed = poidResult === 'passed' || poidResult === 'approved' || poidResult === 'verified';
    const proofOfIdComplete = Boolean(instruction?.PassportNumber || instruction?.DriversLicenseNumber);

    let idStatus: 'complete' | 'in-progress' | 'failed' | 'pending' = 'pending';
    if (!selectedOverviewItem?.eid || eidStatus === 'pending') {
      idStatus = proofOfIdComplete ? 'in-progress' : 'pending';
    } else if (poidPassed) {
      idStatus = 'complete';
    } else {
      idStatus = 'failed';
    }

    // Risk Status
    const risk = selectedOverviewItem?.risk || instruction?.RiskAssessment;
    const riskResultRaw = risk?.RiskAssessmentResult?.toString().toLowerCase() ?? '';
    let riskStatus: 'complete' | 'in-progress' | 'failed' | 'pending' = 'pending';
    if (riskResultRaw) {
      riskStatus = ['low', 'low risk', 'pass', 'approved'].includes(riskResultRaw) ? 'complete' : 'failed';
    } else {
      const hasRiskAssessment = Boolean(risk && (risk.RiskAssessmentResult || risk.RiskScore || risk.ComplianceDate || risk.RiskAssessor));
      riskStatus = hasRiskAssessment ? 'in-progress' : 'pending';
    }

    // Payment Status
    const payments = selectedOverviewItem?.instruction?.payments || instruction?.payments || [];
    const hasPayments = payments && payments.length > 0;
    const paymentStatus = hasPayments ? 'complete' : 'pending';

    return [
      {
        key: 'verify-id',
        label: 'Verify ID',
        icon: <FaIdCard />,
        status: idStatus,
        canOverride: true
      },
      {
        key: 'assess-risk',
        label: 'Risk Assessment',
        icon: <FaShieldAlt />,
        status: riskStatus,
        canOverride: true
      },
      {
        key: 'payment',
        label: 'Payment',
        icon: <FaCreditCard />,
        status: paymentStatus,
        canOverride: true
      }
    ];
  };

  const getPillColor = (status: string, isOverridden: boolean = false) => {
    if (isOverridden) return colours.orange; // Signpost override with orange
    switch (status) {
      case 'complete': return colours.green;
      case 'failed': return colours.red;
      case 'in-progress': return colours.blue;
      default: return colours.greyText;
    }
  };

  const handleOverrideToComplete = async (stepKey: string, stepLabel: string) => {
    if (!instruction?.InstructionRef) return;
    
    setIsUpdating(stepKey);
    
    try {
      // Map step to appropriate status update
      let updatePayload: any = {
        instructionRef: instruction.InstructionRef,
        overrideReason: overrideReason || `Manual override: ${stepLabel} marked complete via Workbench`,
        userInitials: 'WB' // Workbench initiated
      };

      switch (stepKey) {
        case 'verify-id':
          // Mark as ID verified via override
          updatePayload = {
            ...updatePayload,
            stage: 'proof-of-id-complete',
            internalStatus: 'poid'
          };
          break;
        case 'assess-risk':
          // Keep current stage/status but mark risk as overridden in reason
          updatePayload.overrideReason = `Risk Assessment ${overrideReason || 'marked complete'} - Manual override via Workbench`;
          break;
        case 'open-matter':
          // Mark matter opening progressed
          updatePayload.overrideReason = `Matter Opening ${overrideReason || 'marked complete'} - Manual override via Workbench`;
          break;
        case 'draft-ccl':
          // Mark CCL as complete
          updatePayload.overrideReason = `CCL Submission ${overrideReason || 'marked complete'} - Manual override via Workbench`;
          break;
      }

      const response = await fetch('/api/updateInstructionStatus', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      const result = await response.json();

      if (result.success) {
        // Update instruction object locally
        if (updatePayload.stage) instruction.Stage = updatePayload.stage;
        if (updatePayload.internalStatus) instruction.InternalStatus = updatePayload.internalStatus;
        
        // Add override tracking (for UI signposting)
        const overrideField = `${stepKey}Overridden`;
        (instruction as any)[overrideField] = true;
        
        if (onStatusUpdate) {
          onStatusUpdate();
        }
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
      
    } catch (error) {
      console.error('Failed to override step:', error);
    } finally {
      setIsUpdating(null);
      setShowOverrideInput(null);
      setOverrideReason('');
    }
  };

  const workflowSteps = getWorkflowSteps();

  // Check if any step is overridden
  const isOverridden = (stepKey: string): boolean => {
    switch (stepKey) {
      case 'verify-id': return Boolean(instruction?.IDOverridden);
      case 'assess-risk': return Boolean(instruction?.RiskOverridden);
      case 'open-matter': return Boolean(instruction?.MatterOverridden);
      case 'draft-ccl': return Boolean(instruction?.CCLOverridden);
      default: return false;
    }
  };

  if (!instruction) return null;

  return (
    <div style={{
      background: isDarkMode ? colours.dark.cardBackground : '#f8fafc',
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${isDarkMode ? colours.dark.border : '#e2e8f0'}`
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        {workflowSteps.map((step) => {
          const overridden = isOverridden(step.key);
          const pillColor = getPillColor(step.status, overridden);
          const isCurrentlyUpdating = isUpdating === step.key;
          const showInput = showOverrideInput === step.key;

          return (
            <div key={step.key} style={{
              background: isDarkMode ? colours.dark.cardHover : 'white',
              borderRadius: '8px',
              padding: '12px',
              border: `1px solid ${overridden ? colours.orange : isDarkMode ? colours.dark.border : '#e2e8f0'}`,
              position: 'relative'
            }}>
              {/* Override Badge */}
              {overridden && (
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: colours.orange,
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Override
                </div>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: pillColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  {step.status === 'complete' || overridden ? <FaCheckCircle /> : step.icon}
                </div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isDarkMode ? colours.dark.text : colours.light.text
                }}>
                  {step.label}
                </span>
              </div>

              <div style={{
                fontSize: '10px',
                color: colours.greyText,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Status: {overridden ? 'Overridden' : step.status}
              </div>

              {showInput ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Override reason (optional)"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    style={{
                      padding: '6px 8px',
                      fontSize: '11px',
                      border: `1px solid ${isDarkMode ? colours.dark.border : '#d1d5db'}`,
                      borderRadius: '4px',
                      background: isDarkMode ? colours.dark.background : 'white',
                      color: isDarkMode ? colours.dark.text : colours.light.text
                    }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleOverrideToComplete(step.key, step.label)}
                      disabled={isCurrentlyUpdating}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: 600,
                        background: colours.green,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isCurrentlyUpdating ? 'not-allowed' : 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {isCurrentlyUpdating ? <FaSpinner className="spin" /> : 'Complete'}
                    </button>
                    <button
                      onClick={() => {
                        setShowOverrideInput(null);
                        setOverrideReason('');
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        background: 'transparent',
                        color: colours.greyText,
                        border: `1px solid ${colours.greyText}`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                step.canOverride && step.status !== 'complete' && !overridden && (
                  <button
                    onClick={() => setShowOverrideInput(step.key)}
                    disabled={isCurrentlyUpdating}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      background: 'transparent',
                      color: colours.orange,
                      border: `1px solid ${colours.orange}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      transition: 'all 0.2s ease',
                      width: '100%'
                    }}
                  >
                    Mark Complete
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin { animation: spin 1s linear infinite; }
        `}
      </style>
    </div>
  );
};

export default OverridePills;