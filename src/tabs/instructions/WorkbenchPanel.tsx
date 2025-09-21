import React, { useMemo, useState } from 'react';
import { mergeStyles } from '@fluentui/merge-styles';
import { colours } from '../../app/styles/colours';

interface WorkbenchPanelProps {
  selectedInstruction: any;
  selectedDeal: any;
  isDarkMode: boolean;
  onDealEdit: (dealId: number, updates: { ServiceDescription?: string; Amount?: number }) => Promise<void>;
  overviewItems?: any[];
  isVisible: boolean;
  onVerifyId?: (inst: any) => void;
  onAssessRisk?: (inst: any) => void;
  onOpenMatter?: (inst: any) => void;
  onDraftCcl?: (ref: string) => void;
  nextAction?: string;
}

const WorkbenchPanel: React.FC<WorkbenchPanelProps> = ({
  selectedInstruction,
  selectedDeal,
  isDarkMode,
  onDealEdit,
  overviewItems = [],
  isVisible,
  onVerifyId,
  onAssessRisk,
  onOpenMatter,
  onDraftCcl,
  nextAction
}) => {
  const [activeTab, setActiveTab] = useState('operations');
  const [pipelineData, setPipelineData] = useState('');
  const [recordType, setRecordType] = useState('instruction');
  const [isExpanded, setIsExpanded] = useState(false);
  const [bulkProcessData, setBulkProcessData] = useState('');

  const handleSystemOperation = (operation: string) => {
    console.log('System Operation:', operation);
    
    if (!selectedInstruction) {
      console.log('Please select an instruction first');
      return;
    }
    
    switch (operation) {
      case 'verify-id':
        if (onVerifyId) {
          onVerifyId(selectedInstruction);
        }
        break;
      case 'assess-risk':
        if (onAssessRisk) {
          onAssessRisk(selectedInstruction);
        }
        break;
      case 'open-matter':
        if (onOpenMatter) {
          onOpenMatter(selectedInstruction);
        }
        break;
      case 'draft-ccl':
        if (onDraftCcl) {
          onDraftCcl(selectedInstruction.InstructionRef);
        }
        break;
      default:
        console.log('Unhandled operation:', operation);
    }
  };

  // Use the same selectedOverviewItem approach as Global Actions
  const selectedOverviewItem = useMemo(() => {
    if (!selectedInstruction) return null as any;
    return (
      overviewItems.find((item: any) => item.instruction?.InstructionRef === selectedInstruction.InstructionRef) || null
    );
  }, [selectedInstruction, overviewItems]);

  // Derive normalized Area of Work with color coding for header display
  const areaOfWorkInfo = useMemo(() => {
    if (!selectedInstruction) return { label: '', color: '#22c55e' };

    const normalize = (raw?: unknown): { label: string; color: string } => {
      const val = typeof raw === 'string' ? raw.trim() : '';
      if (!val) return { label: '', color: '#22c55e' };
      const l = val.toLowerCase();
      if (l.includes('commercial')) return { label: 'Commercial', color: colours.blue }; // Use consistent blue
      if (l.includes('construction')) return { label: 'Construction', color: '#f59e0b' }; // Amber
      if (l.includes('property')) return { label: 'Property', color: '#10b981' }; // Emerald
      if (l.includes('employment')) return { label: 'Employment', color: '#8b5cf6' }; // Violet
      return { label: val, color: '#22c55e' }; // fallback
    };

    const inst: any = selectedInstruction as any;
    const fields = [
      inst?.AreaOfWork,
      inst?.Area_of_Work,
      inst?.areaOfWork,
      inst?.PracticeArea,
      inst?.practiceArea,
      inst?.Department,
      inst?.WorkType
    ];
    
    for (const field of fields) {
      const result = normalize(field);
      if (result.label) return result;
    }

    const deal: any = (selectedDeal as any) || (selectedOverviewItem as any)?.deal;
    const dealFields = [
      deal?.AreaOfWork,
      deal?.Area_of_Work,
      deal?.areaOfWork,
      deal?.PracticeArea,
      deal?.practiceArea,
      deal?.Department,
      deal?.WorkType
    ];
    
    for (const field of dealFields) {
      const result = normalize(field);
      if (result.label) return result;
    }

    return { label: '', color: '#22c55e' };
  }, [selectedInstruction, selectedDeal, selectedOverviewItem]);

  // Check if an operation is the next action
  const isNextAction = (operationKey: string): boolean => {
    if (!nextAction) return false;
    
    const actionMap: { [key: string]: string } = {
      'verify-id': 'Verify ID',
      'assess-risk': 'Assess Risk',
      'open-matter': 'Open Matter',
      'draft-ccl': 'Draft CCL'
    };
    
    return actionMap[operationKey] === nextAction;
  };

  // Determine action status based on instruction data (using same logic as InstructionCard)
  const getActionStatus = (operationKey: string): 'complete' | 'in-progress' | 'failed' | 'pending' | 'next' => {
    if (!selectedInstruction) return 'pending';

    // ID status (Global Actions parity)
    const verifyIdStatus = (() => {
      const poidResult = selectedOverviewItem?.eid?.EIDOverallResult?.toLowerCase() ?? "";
      const eidStatus = selectedOverviewItem?.eid?.EIDStatus?.toLowerCase() ?? "";
      const poidPassed = poidResult === 'passed' || poidResult === 'approved' || poidResult === 'verified';
      const proofOfIdComplete = Boolean(selectedInstruction?.PassportNumber || selectedInstruction?.DriversLicenseNumber);

      if (!selectedOverviewItem?.eid || eidStatus === 'pending') {
        return proofOfIdComplete ? 'in-progress' : 'pending'; // 'received' -> in-progress
      } else if (poidPassed) {
        return 'complete';
      } else {
        return 'failed'; // 'review' -> failed colour
      }
    })();

    const riskStatus = (() => {
      const risk = selectedOverviewItem?.risk || selectedInstruction.RiskAssessment;
      const riskResultRaw = risk?.RiskAssessmentResult?.toString().toLowerCase() ?? '';
      if (riskResultRaw) {
        return ['low', 'low risk', 'pass', 'approved'].includes(riskResultRaw) ? 'complete' : 'failed'; // 'flagged' -> failed
      }
      const hasRiskAssessment = Boolean(risk && (risk.RiskAssessmentResult || risk.RiskScore || risk.ComplianceDate || risk.RiskAssessor));
      return hasRiskAssessment ? 'in-progress' : 'pending';
    })();

    const matterStatus = (() => {
      if (selectedInstruction.MatterId || (selectedInstruction as any)?.matters?.length > 0) return 'complete';
      return 'pending';
    })();

    const cclStatus = (() => {
      if (selectedInstruction.CCLSubmitted) return 'complete';
      return 'pending';
    })();

    switch (operationKey) {
      case 'verify-id':
        return verifyIdStatus;
      case 'assess-risk':
        return riskStatus;
      case 'open-matter':
        return matterStatus;
      case 'draft-ccl':
        return cclStatus;
      default:
        return 'pending';
    }
  };

  // Get action colour based on status
  const getActionColour = (operationKey: string): string => {
    const status = getActionStatus(operationKey);
    const isNext = isNextAction(operationKey);
    
    if (status === 'complete') return colours.green;
    if (status === 'failed') return colours.red;
    if (status === 'in-progress') return colours.orange;
    if (isNext) return colours.blue;
    return colours.greyText;
  };

  // Get operations - show instruction actions by default, system operations when specifically needed
  const getOperations = () => {
    // Always show core instruction actions in collapsed state
    return [
      {
        key: 'verify-id',
        label: 'Verify ID',
        category: 'instruction'
      },
      {
        key: 'assess-risk',
        label: 'Assess Risk',
        category: 'instruction'
      },
      {
        key: 'open-matter',
        label: 'Open Matter',
        category: 'instruction'
      },
      {
        key: 'draft-ccl',
        label: 'Draft CCL',
        category: 'instruction'
      }
    ];
  };

  const containerStyle = mergeStyles({
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: isDarkMode ? colours.dark.background : '#ffffff',
    borderTop: `1px solid ${isDarkMode ? colours.dark.border : '#d1d5db'}`,
    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    transform: `translateY(${isVisible ? '0' : '100%'})`,
    transition: 'transform 0.3s ease',
  });

  const collapsedStyle = mergeStyles({
    padding: '10px 20px',
    background: isDarkMode ? colours.dark.cardBackground : '#f8fafc',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'background 0.2s ease',
    ':hover': {
      background: isDarkMode ? colours.dark.cardHover : '#f1f5f9',
    }
  });

  const operationChipStyle = (operationKey: string) => {
    const isNext = isNextAction(operationKey);
    const status = getActionStatus(operationKey);
    const colour = getActionColour(operationKey);
    
    return mergeStyles({
      padding: '6px 10px',
      borderRadius: 16,
      border: `1px solid ${colour}`,
      background: isNext ? colour : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
      color: isNext ? '#ffffff' : colour,
      fontSize: 10,
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      textTransform: 'uppercase',
      letterSpacing: '0.025em',
      position: 'relative',
      animation: isNext ? 'pulse 2s infinite' : 'none',
      ':hover': {
        background: colours.blue,
        borderColor: colours.blue,
        color: '#ffffff',
      },
      '@keyframes pulse': {
        '0%': {
          boxShadow: `0 0 0 0 ${colour}70`,
        },
        '70%': {
          boxShadow: `0 0 0 6px ${colour}00`,
        },
        '100%': {
          boxShadow: `0 0 0 0 ${colour}00`,
        }
      }
    });
  };

  const tabStyle = (isActive: boolean) => mergeStyles({
    padding: '8px 16px',
    background: isActive ? '#3b82f6' : 'transparent',
    color: isActive ? '#ffffff' : (isDarkMode ? colours.dark.text : '#6b7280'),
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    transition: 'all 0.2s ease',
    ':hover': {
      background: isActive ? '#2563eb' : (isDarkMode ? colours.dark.cardHover : '#f3f4f6'),
    }
  });

  const operationButtonStyle = mergeStyles({
    padding: '8px 12px',
    borderRadius: 4,
    border: `1px solid ${isDarkMode ? colours.dark.border : '#d1d5db'}`,
    background: '#3b82f6',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    transition: 'all 0.2s ease',
    ':hover': {
      background: '#2563eb',
      transform: 'translateY(-1px)',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none',
    }
  });

  const inputStyle = mergeStyles({
    padding: '8px 12px',
    border: `1px solid ${isDarkMode ? colours.dark.border : '#d1d5db'}`,
    borderRadius: 4,
    fontSize: 11,
    background: isDarkMode ? colours.dark.inputBackground : '#ffffff',
    color: isDarkMode ? colours.dark.text : '#111827',
    ':focus': {
      borderColor: '#3b82f6',
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    }
  });

  if (!isVisible) return null;

  const operations = getOperations();

  return (
    <div className={containerStyle}>
      {!isExpanded ? (
        /* Collapsed State */
        <div className={collapsedStyle} onClick={() => setIsExpanded(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: selectedInstruction ? areaOfWorkInfo.color : '#6b7280' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: isDarkMode ? colours.dark.text : '#374151', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                {selectedInstruction ? `${selectedInstruction.InstructionRef} Workbench` : 'Workbench'}
              </span>
              {areaOfWorkInfo.label && (
                <span style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: areaOfWorkInfo.color,
                  textTransform: 'uppercase',
                  background: `${areaOfWorkInfo.color}15`,
                  padding: '1px 4px',
                  borderRadius: 2,
                  border: `1px solid ${areaOfWorkInfo.color}30`
                }}>
                  {areaOfWorkInfo.label}
                </span>
              )}
              {nextAction && (
                <span style={{ 
                  fontSize: 9, 
                  color: '#22c55e', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  background: 'rgba(34, 197, 94, 0.1)',
                  padding: '2px 4px',
                  borderRadius: 3,
                  animation: 'pulse 2s infinite'
                }}>
                  Next: {nextAction}
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {operations.map((operation) => {
                const status = getActionStatus(operation.key);
                const statusLabel = status === 'complete' ? '✓' : 
                                  status === 'failed' ? '✗' : 
                                  status === 'in-progress' ? '●' : 
                                  isNextAction(operation.key) ? '▶' : '';
                
                return (
                  <button
                    key={operation.key}
                    className={operationChipStyle(operation.key)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSystemOperation(operation.key);
                    }}
                  >
                    {statusLabel && <span style={{ marginRight: 2 }}>{statusLabel}</span>}
                    {operation.label}
                  </button>
                );
              })}
            </div>
          </div>

          <span style={{ fontSize: 9, color: isDarkMode ? colours.dark.subText : '#6b7280' }}>▲</span>
        </div>
      ) : (
        /* Expanded State */
        <div>
          <div className={collapsedStyle} onClick={() => setIsExpanded(false)} style={{ background: isDarkMode ? colours.dark.cardHover : '#f1f5f9' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: isDarkMode ? colours.dark.text : '#374151', textTransform: 'uppercase' }}>
              {selectedInstruction ? `${selectedInstruction.InstructionRef} Workbench` : 'Workbench Panel'}
            </span>
            {areaOfWorkInfo.label && (
              <span style={{
                fontSize: 9,
                fontWeight: 600,
                color: areaOfWorkInfo.color,
                textTransform: 'uppercase',
                background: `${areaOfWorkInfo.color}15`,
                padding: '1px 4px',
                borderRadius: 2,
                border: `1px solid ${areaOfWorkInfo.color}30`,
                marginLeft: 8
              }}>
                {areaOfWorkInfo.label}
              </span>
            )}
            <span style={{ fontSize: 9, color: isDarkMode ? colours.dark.subText : '#6b7280', transform: 'rotate(180deg)' }}>▲</span>
          </div>

          <div style={{ padding: '16px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${isDarkMode ? colours.dark.border : '#e2e8f0'}` }}>
              <button className={tabStyle(activeTab === 'operations')} onClick={() => setActiveTab('operations')}>
                Bulk Operations
              </button>
              <button className={tabStyle(activeTab === 'maintenance')} onClick={() => setActiveTab('maintenance')}>
                Data Maintenance
              </button>
              <button className={tabStyle(activeTab === 'compliance')} onClick={() => setActiveTab('compliance')}>
                Compliance Tools
              </button>
              <button className={tabStyle(activeTab === 'import')} onClick={() => setActiveTab('import')}>
                Data Import
              </button>
            </div>

            {/* Operations Tab */}
            {activeTab === 'operations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? colours.dark.text : '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                    Processing Operations
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('bulk-status-update')}>
                      Bulk Status Update
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('batch-assign')}>
                      Batch Assignment
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('mass-communication')}>
                      Mass Communication
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('workflow-trigger')}>
                      Trigger Workflows
                    </button>
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? colours.dark.text : '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                    Document Generation
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('batch-ccl')}>
                      Batch CCL Generation
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('bulk-reports')}>
                      Bulk Report Generation
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('template-apply')}>
                      Apply Templates
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.subText : '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                    Bulk Processing Input
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}>
                    <textarea
                      value={bulkProcessData}
                      onChange={(e) => setBulkProcessData(e.target.value)}
                      className={inputStyle}
                      placeholder="Enter instruction references (one per line) or paste CSV data..."
                      rows={4}
                    />
                    <button 
                      className={operationButtonStyle} 
                      onClick={() => handleSystemOperation('process-bulk-input')}
                      disabled={!bulkProcessData.trim()}
                    >
                      Process
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? colours.dark.text : '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                    Data Quality
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('duplicate-detection')}>
                      Duplicate Detection
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('data-validation')}>
                      Data Validation
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('missing-data-audit')}>
                      Missing Data Audit
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('format-standardization')}>
                      Format Standardization
                    </button>
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? colours.dark.text : '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                    Record Management
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('merge-records')}>
                      Merge Records
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('archive-inactive')}>
                      Archive Inactive
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('restore-records')}>
                      Restore Records
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('purge-deleted')}>
                      Purge Deleted
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance Tab */}
            {activeTab === 'compliance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? colours.dark.text : '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                    Compliance Auditing
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('sra-compliance-check')}>
                      SRA Compliance Check
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('aml-audit')}>
                      AML Compliance Audit
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('gdpr-review')}>
                      GDPR Data Review
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('retention-audit')}>
                      Retention Policy Audit
                    </button>
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? colours.dark.text : '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                    Risk Assessment
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('bulk-risk-assessment')}>
                      Bulk Risk Assessment
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('conflict-check')}>
                      Conflict Checking
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('sanctions-screening')}>
                      Sanctions Screening
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Import Tab */}
            {activeTab === 'import' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? colours.dark.text : '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                    External Data Import
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 8, alignItems: 'end' }}>
                    <select
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value)}
                      className={inputStyle}
                    >
                      <option value="instruction">Instructions</option>
                      <option value="enquiry">Enquiries</option>
                      <option value="client">Clients</option>
                      <option value="matter">Matters</option>
                      <option value="contact">Contacts</option>
                    </select>
                    <textarea
                      value={pipelineData}
                      onChange={(e) => setPipelineData(e.target.value)}
                      className={inputStyle}
                      placeholder="Paste JSON/CSV data from external systems..."
                      rows={4}
                    />
                    <button 
                      className={operationButtonStyle} 
                      onClick={() => handleSystemOperation('import-data')}
                      disabled={!pipelineData.trim()}
                    >
                      Import
                    </button>
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? colours.dark.text : '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                    System Integration
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('crm-sync')}>
                      CRM Synchronization
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('accounting-export')}>
                      Accounting Export
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('document-sync')}>
                      Document Sync
                    </button>
                    <button className={operationButtonStyle} onClick={() => handleSystemOperation('calendar-integration')}>
                      Calendar Integration
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkbenchPanel;