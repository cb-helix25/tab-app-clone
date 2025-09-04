import React, { useState } from 'react';
import '../../app/styles/InstructionCard.premium.css';
import { format, formatDistanceToNow } from 'date-fns';
import { mergeStyles } from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import { 
  FaUser, 
  FaUsers, 
  FaFileAlt, 
  FaDownload, 
  FaCalendarAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileArchive,
  FaFileImage,
  FaFileAudio,
  FaFileVideo,
  FaFileUpload,
  FaInfoCircle,
  FaEnvelope,
  FaPhone,
  FaCopy,
  FaPoundSign,
  FaShieldAlt,
  FaBuilding,
  FaFolder,
  FaClipboardCheck,
  FaIdCard
} from 'react-icons/fa';

// Move interface to separate file
export interface InstructionCardProps {
  instruction: any;
  index: number;
  selected?: boolean;
  onSelect?: () => void;
  onToggle?: () => void;
  expanded?: boolean;
  innerRef?: React.RefObject<HTMLDivElement>;
  isResizing?: boolean;
  onDocumentClick?: (document: any) => void;
  documentCount?: number;
  deal?: {
    ServiceDescription?: string;
    Amount?: number;
  };
  prospectId?: number;
  eid?: any;
  eids?: any[] | any;
  compliance?: any;
  deals?: any[];
  clients?: any[];
  risk?: any;
  documents?: any[];
  style?: React.CSSProperties;
  onClick?: () => void;
  onProofOfIdClick?: () => void;
  animationDelay?: number;
}

// Component definition with CopyableText
const CopyableText: React.FC<{ value: string; label?: string; className?: string }> = ({ value, label, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <span 
      className={className}
      onClick={handleCopy}
      style={{ cursor: 'pointer', position: 'relative' }}
      title={`Click to copy ${label || 'text'}`}
    >
      {value}
      {copied && (
        <span style={{
          position: 'absolute',
          top: '-25px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: colours.darkBlue,
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.7rem',
          whiteSpace: 'nowrap',
          zIndex: 1000
        }}>
          Copied!
        </span>
      )}
    </span>
  );
};

const InstructionCard: React.FC<InstructionCardProps> = ({
  instruction,
  index,
  selected = false,
  onSelect,
  onToggle,
  expanded = false,
  innerRef,
  isResizing = false,
  onDocumentClick,
  documentCount,
  deal,
  prospectId,
  eid,
  eids,
  compliance,
  deals,
  clients,
  risk,
  documents,
  style,
  onClick,
  animationDelay = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStepExpanded = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  // Status logic - match the logic used in global actions
  // ID Verification status based on EID data
  const eidResult = (eid?.EIDOverallResult || eids?.[0]?.EIDOverallResult)?.toLowerCase() ?? "";
  const eidStatus = (eid?.EIDStatus || eids?.[0]?.EIDStatus)?.toLowerCase() ?? "";
  const poidPassed = eidResult === "passed" || eidResult === "approved";
  const proofOfIdComplete = Boolean(instruction.PassportNumber || instruction.DriversLicenseNumber);
  
  let verifyIdStatus: 'pending' | 'received' | 'review' | 'complete';
  if (!eid && !eids?.length || eidStatus === 'pending') {
    verifyIdStatus = proofOfIdComplete ? 'received' : 'pending';
  } else if (poidPassed) {
    verifyIdStatus = 'complete';
  } else {
    verifyIdStatus = 'review';
  }

  // Payment status based on PaymentResult
  const paymentResult = instruction.PaymentResult?.toLowerCase();
  const paymentStatus = paymentResult === "successful" ? 'complete' : 'pending';

  // Documents status - check if documents exist
  const documentStatus = (documents && documents.length > 0) ? 'complete' : 'pending';

  // Risk status based on risk assessment result
  const riskResultRaw = risk?.RiskAssessmentResult?.toString().toLowerCase() ?? "";
  const riskStatus = riskResultRaw
    ? ['low', 'low risk', 'pass', 'approved'].includes(riskResultRaw) ? 'complete' : 'review'
    : 'pending';

  // Matter status - check if matter exists
  const matterStatus = (instruction.MatterId || (instruction as any).matters?.length > 0) ? 'complete' : 'pending';

  // CCL status - assume pending unless explicitly complete
  const cclStatus = instruction.CCLSubmitted ? 'complete' : 'pending';

  const isCompleted = cclStatus === 'complete';

  // Determine next action step
  const nextActionStep = 
    verifyIdStatus !== 'complete' ? 'id' :
    paymentStatus !== 'complete' ? 'payment' :
    documentStatus !== 'complete' ? 'documents' :
    riskStatus !== 'complete' ? 'risk' :
    matterStatus !== 'complete' ? 'matter' :
    cclStatus !== 'complete' ? 'ccl' : null;

  // Debug logging to see what's going wrong
  React.useEffect(() => {
    console.log(`InstructionCard ${instruction.InstructionRef} Status Debug:`, {
      fullInstruction: instruction, // Log the entire instruction object
      IdVerified: instruction.IdVerified,
      IdSubmitted: instruction.IdSubmitted,
      PaymentReceived: instruction.PaymentReceived,
      DocumentsReceived: instruction.DocumentsReceived,
      RiskAssessmentComplete: instruction.RiskAssessmentComplete,
      MatterCreated: instruction.MatterCreated,
      CCLSubmitted: instruction.CCLSubmitted,
      verifyIdStatus,
      paymentStatus,
      documentStatus,
      riskStatus,
      matterStatus,
      cclStatus,
      nextActionStep
    });
  }, [instruction.InstructionRef, verifyIdStatus, paymentStatus, documentStatus, riskStatus, matterStatus, cclStatus, nextActionStep]);

  // Debug selection state
  React.useEffect(() => {
    console.log(`InstructionCard ${instruction.InstructionRef} Selection:`, {
      selected,
      expanded,
      isCompleted
    });
  }, [instruction.InstructionRef, selected, expanded, isCompleted]);

  const cardClass = mergeStyles({
    background: `linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)`,
    border: selected ? `2px solid ${colours.blue}` : `1px solid ${colours.light.border}`,
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: selected
      ? `0 0 0 1px ${colours.blue}20, 0 4px 16px rgba(54, 144, 206, 0.15)`
      : '0 2px 8px rgba(0,0,0,0.08)',
    opacity: isCompleted ? 0.6 : 1,
    transition: 'box-shadow 0.3s ease, transform 0.3s ease, border 0.3s ease, opacity 0.3s ease',
    flex: '1' as const,
    selectors: {
      ':hover': {
        boxShadow: selected
          ? `0 0 0 1px ${colours.blue}30, 0 6px 20px rgba(54, 144, 206, 0.2)`
          : '0 4px 16px rgba(0,0,0,0.12)',
        transform: 'translateY(-1px) scale(1.01)',
      },
    },
  });

  const wrapperClass = mergeStyles({
    background: `linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)`,
    border: selected ? `2px solid ${colours.blue}` : `1px solid ${colours.light.border}`,
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: selected
      ? `0 0 0 1px ${colours.blue}20, 0 4px 16px rgba(54, 144, 206, 0.15)`
      : '0 2px 8px rgba(0,0,0,0.08)',
    opacity: isCompleted ? 0.6 : 1,
    transition: 'box-shadow 0.3s ease, transform 0.3s ease, border 0.3s ease, opacity 0.3s ease',
    flex: '1' as const,
    selectors: {
      ':hover': {
        boxShadow: selected
          ? `0 0 0 1px ${colours.blue}30, 0 6px 20px rgba(54, 144, 206, 0.2)`
          : '0 4px 16px rgba(0,0,0,0.12)',
        transform: 'translateY(-1px) scale(1.01)',
      },
    },
  });

  const style_: React.CSSProperties = {
    '--animation-delay': `${animationDelay}s`,
  } as React.CSSProperties;

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect();
    } else if (onToggle) {
      onToggle();
    }
  };

  return (
    <div className={wrapperClass} style={style_} onClick={handleCardClick} ref={innerRef}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className={cardClass} style={{ background: 'transparent', boxShadow: 'none' }}>
      
      {/* PRIMARY HEADER - Client Identity & Reference */}
      <div className="card-primary-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: `1px solid ${colours.light.border}`,
        position: 'relative',
        background: `url("data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 57.56 100" opacity="0.03">
            <path fill="${colours.darkBlue}" d="M57.56,13.1c0,7.27-7.6,10.19-11.59,11.64-4,1.46-29.98,11.15-34.78,13.1C6.4,39.77,0,41.23,0,48.5v-13.1C0,28.13,6.4,26.68,11.19,24.74c4.8-1.94,30.78-11.64,34.78-13.1,4-1.45,11.59-4.37,11.59-11.64v13.09h0Z"/>
            <path fill="${colours.darkBlue}" d="M57.56,38.84c0,7.27-7.6,10.19-11.59,11.64s-29.98,11.16-34.78,13.1c-4.8,1.94-11.19,3.4-11.19,10.67v-13.1c0-7.27,6.4-8.73,11.19-10.67,4.8-1.94,30.78-11.64,34.78-13.1,4-1.46,11.59-4.37,11.59-11.64v13.09h0Z"/>
            <path fill="${colours.darkBlue}" d="M57.56,64.59c0,7.27-7.6,10.19-11.59,11.64-4,1.46-29.98,11.15-34.78,13.1-4.8,1.94-11.19,3.39-11.19,10.67v-13.1c0-7.27,6.4-8.73,11.19-10.67,4.8-1.94,30.78-11.64,34.78-13.1,4-1.45,11.59-4.37,11.59-11.64v13.1h0Z"/>
          </svg>
        `)}")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top right',
        backgroundSize: '20px 35px'
      }}>
        
        <div className="client-identity" style={{ flex: 1 }}>
          <div className="client-name" style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: colours.darkBlue,
            marginBottom: '6px',
            letterSpacing: '-0.02em',
            lineHeight: 1.3
          }}>
            <CopyableText 
              value={(() => {
                // Try different possible name combinations
                const firstName = instruction.Forename || instruction.FirstName || instruction.forename || instruction.firstName || '';
                const lastName = instruction.Surname || instruction.LastName || instruction.surname || instruction.lastName || '';
                const fullName = instruction.FullName || instruction.fullName || instruction.Name || instruction.name || '';
                
                if (fullName) return fullName;
                if (firstName && lastName) return `${firstName} ${lastName}`;
                if (firstName) return firstName;
                if (lastName) return lastName;
                return 'Client Name';
              })()}
              className="client-name-text"
            />
          </div>
          <div className="reference-line" style={{
            fontSize: '0.75rem',
            color: colours.greyText,
            fontWeight: 600
          }}>
            <CopyableText 
              value={instruction.InstructionRef || instruction.instructionRef || instruction.ref || instruction.Ref || 'No Reference'}
              label="Ref"
            />
          </div>
        </div>
        <div className="status-indicators" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '4px'
        }}>
          {isCompleted && (
            <div className="completed-badge" style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '4px 8px',
              backgroundColor: colours.green,
              color: 'white',
              borderRadius: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Complete
            </div>
          )}
          {nextActionStep && !isCompleted && (
            <div className="action-required-badge" style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '4px 8px',
              backgroundColor: colours.blue,
              color: 'white',
              borderRadius: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Action Required
            </div>
          )}
        </div>
      </div>

      {/* LEGAL MATTER INFORMATION - Full Width */}
      {deal && (
        <div className="matter-section" style={{
          padding: '16px',
          background: `linear-gradient(135deg, ${colours.light.sectionBackground} 0%, ${colours.light.background} 100%)`,
          borderRadius: '8px',
          border: `1px solid ${colours.light.border}`,
          marginBottom: '16px',
          position: 'relative',
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 57.56 100" opacity="0.05">
              <path fill="${colours.blue}" d="M57.56,13.1c0,7.27-7.6,10.19-11.59,11.64-4,1.46-29.98,11.15-34.78,13.1C6.4,39.77,0,41.23,0,48.5v-13.1C0,28.13,6.4,26.68,11.19,24.74c4.8-1.94,30.78-11.64,34.78-13.1,4-1.45,11.59-4.37,11.59-11.64v13.09h0Z"/>
              <path fill="${colours.blue}" d="M57.56,38.84c0,7.27-7.6,10.19-11.59,11.64s-29.98,11.16-34.78,13.1c-4.8,1.94-11.19,3.4-11.19,10.67v-13.1c0-7.27,6.4-8.73,11.19-10.67,4.8-1.94,30.78-11.64,34.78-13.1,4-1.46,11.59-4.37,11.59-11.64v13.09h0Z"/>
              <path fill="${colours.blue}" d="M57.56,64.59c0,7.27-7.6,10.19-11.59,11.64-4,1.46-29.98,11.15-34.78,13.1-4.8,1.94-11.19,3.39-11.19,10.67v-13.1c0-7.27,6.4-8.73,11.19-10.67,4.8-1.94,30.78-11.64,34.78-13.1,4-1.45,11.59-4.37,11.59-11.64v13.1h0Z"/>
            </svg>
          `)}")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top right',
          backgroundSize: '30px 52px'
        }}>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div className="service-description" style={{
              flex: 1
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: colours.greyText,
                textTransform: 'uppercase',
                letterSpacing: '0.75px',
                marginBottom: '6px'
              }}>
                Legal Matter
              </div>
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: colours.darkBlue,
                lineHeight: 1.4,
                letterSpacing: '-0.01em'
              }}>
                {deal.ServiceDescription || 'Legal Service'}
              </div>
            </div>
            {typeof deal.Amount === 'number' && (
              <div className="fee-display" style={{
                textAlign: 'right',
                minWidth: '100px'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: colours.greyText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.75px',
                  marginBottom: '4px'
                }}>
                  Fee
                </div>
                <div className="premium-amount" style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: colours.blue,
                  letterSpacing: '-0.02em'
                }}>
                  £{deal.Amount.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONNECTED WORKFLOW TIMELINE */}
      <div className="workflow-timeline" style={{
        marginBottom: '16px',
        position: 'relative',
        padding: '16px',
        background: `linear-gradient(135deg, ${colours.light.background} 0%, ${colours.light.sectionBackground} 100%)`,
        borderRadius: '8px',
        border: `1px solid ${colours.light.border}`,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 57.56 100" opacity="0.04">
            <path fill="${colours.greyText}" d="M57.56,13.1c0,7.27-7.6,10.19-11.59,11.64-4,1.46-29.98,11.15-34.78,13.1C6.4,39.77,0,41.23,0,48.5v-13.1C0,28.13,6.4,26.68,11.19,24.74c4.8-1.94,30.78-11.64,34.78-13.1,4-1.45,11.59-4.37,11.59-11.64v13.09h0Z"/>
            <path fill="${colours.greyText}" d="M57.56,38.84c0,7.27-7.6,10.19-11.59,11.64s-29.98,11.16-34.78,13.1c-4.8,1.94-11.19,3.4-11.19,10.67v-13.1c0-7.27,6.4-8.73,11.19-10.67,4.8-1.94,30.78-11.64,34.78-13.1,4-1.46,11.59-4.37,11.59-11.64v13.09h0Z"/>
            <path fill="${colours.greyText}" d="M57.56,64.59c0,7.27-7.6,10.19-11.59,11.64-4,1.46-29.98,11.15-34.78,13.1-4.8,1.94-11.19,3.39-11.19,10.67v-13.1c0-7.27,6.4-8.73,11.19-10.67,4.8-1.94,30.78-11.64,34.78-13.1,4-1.45,11.59-4.37,11.59-11.64v13.1h0Z"/>
          </svg>
        `)}")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'bottom right',
        backgroundSize: '25px 43px'
      }}>
        
        {/* Sequential Timeline - Compact Steps */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          
          {/* ID Verification - Compact */}
          <div 
            onClick={() => toggleStepExpanded('id')}
            style={{
              padding: '8px 12px',
              background: 'white',
              borderRadius: '6px',
              border: `1px solid ${verifyIdStatus === 'complete' ? colours.green : 
                                    verifyIdStatus === 'review' ? colours.red : 
                                    nextActionStep === 'id' ? colours.blue : colours.light.border}`,
              boxShadow: nextActionStep === 'id' ? `0 2px 8px ${colours.blue}20` : '0 1px 3px rgba(0,0,0,0.05)',
              cursor: 'pointer'
            }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: verifyIdStatus === 'complete' ? colours.green : 
                           verifyIdStatus === 'review' ? colours.red : 
                           nextActionStep === 'id' ? colours.blue : colours.greyText,
                color: 'white',
                fontSize: '0.8rem',
                flexShrink: 0
              }}>
                <FaIdCard />
              </div>
              
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: colours.darkBlue,
                flex: 1
              }}>
                ID Verification
              </span>
              
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '10px',
                background: verifyIdStatus === 'complete' ? colours.green : 
                           verifyIdStatus === 'review' ? colours.red : colours.greyText,
                color: 'white'
              }}>
                {verifyIdStatus === 'complete' ? 'Verified' : 
                 verifyIdStatus === 'review' ? 'Review' : 'Pending'}
              </span>
              
              {nextActionStep === 'id' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: colours.blue,
                    background: 'white',
                    border: `1px solid ${colours.blue}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginLeft: '4px'
                  }}
                >
                  Request
                </button>
              )}
            </div>
            
            {/* Expandable Details */}
            {expandedSteps.has('id') && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                background: colours.light.sectionBackground,
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: colours.greyText
              }}>
                {(instruction.PassportNumber || instruction.DriversLicenseNumber) ? (
                  <div>
                    {instruction.PassportNumber && `Passport: ${instruction.PassportNumber}`}
                    {instruction.PassportNumber && instruction.DriversLicenseNumber && ' • '}
                    {instruction.DriversLicenseNumber && `License: ${instruction.DriversLicenseNumber}`}
                  </div>
                ) : (
                  <div>No ID documents submitted</div>
                )}
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="timeline-step" style={{
            display: 'flex',
            alignItems: 'flex-start',
            position: 'relative'
          }}>
            {/* Connection Line */}
            <div style={{
              position: 'absolute',
              left: '19px',
              top: '38px',
              width: '2px',
              height: '40px',
              background: paymentStatus === 'complete' ? colours.green : colours.light.border,
              zIndex: 1
            }} />
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'white',
              borderRadius: '8px',
              border: `1px solid ${paymentStatus === 'complete' ? colours.green : 
                                    nextActionStep === 'payment' ? colours.blue : colours.light.border}`,
              boxShadow: nextActionStep === 'payment' ? `0 2px 8px ${colours.blue}20` : '0 1px 3px rgba(0,0,0,0.05)',
              width: '100%',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: paymentStatus === 'complete' ? colours.green : 
                           nextActionStep === 'payment' ? colours.blue : colours.greyText,
                color: 'white',
                fontSize: '1rem',
                flexShrink: 0
              }}>
                <FaPoundSign />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: colours.darkBlue,
                    letterSpacing: '-0.01em'
                  }}>
                    Payment
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: paymentStatus === 'complete' ? colours.green : colours.greyText,
                    color: 'white'
                  }}>
                    {paymentStatus === 'complete' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                {deal && typeof deal.Amount === 'number' && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: colours.greyText,
                    marginBottom: '6px'
                  }}>
                    Fee: £{deal.Amount.toLocaleString()}
                  </div>
                )}
                {nextActionStep === 'payment' && !isCompleted && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '8px'
                  }}>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: colours.blue,
                        background: 'white',
                        border: `1px solid ${colours.blue}`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Send Invoice
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'white',
                        background: colours.blue,
                        border: `1px solid ${colours.blue}`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Mark Paid
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="timeline-step" style={{
            display: 'flex',
            alignItems: 'flex-start',
            position: 'relative'
          }}>
            {/* Connection Line */}
            <div style={{
              position: 'absolute',
              left: '19px',
              top: '38px',
              width: '2px',
              height: '40px',
              background: documentStatus === 'complete' ? colours.green : colours.light.border,
              zIndex: 1
            }} />
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'white',
              borderRadius: '8px',
              border: `1px solid ${documentStatus === 'complete' ? colours.green : 
                                    nextActionStep === 'documents' ? colours.blue : colours.light.border}`,
              boxShadow: nextActionStep === 'documents' ? `0 2px 8px ${colours.blue}20` : '0 1px 3px rgba(0,0,0,0.05)',
              width: '100%',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: documentStatus === 'complete' ? colours.green : 
                           nextActionStep === 'documents' ? colours.blue : colours.greyText,
                color: 'white',
                fontSize: '1rem',
                flexShrink: 0
              }}>
                <FaFileAlt />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: colours.darkBlue,
                    letterSpacing: '-0.01em'
                  }}>
                    Documents
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: documentStatus === 'complete' ? colours.green : colours.greyText,
                    color: 'white'
                  }}>
                    {documentStatus === 'complete' ? 'Complete' : 'Pending'}
                  </span>
                </div>
                {documentCount && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: colours.greyText,
                    marginBottom: '6px'
                  }}>
                    {documentCount} document{documentCount !== 1 ? 's' : ''} received
                  </div>
                )}
                {nextActionStep === 'documents' && !isCompleted && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '8px'
                  }}>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: colours.blue,
                        background: 'white',
                        border: `1px solid ${colours.blue}`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Request Docs
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="timeline-step" style={{
            display: 'flex',
            alignItems: 'flex-start',
            position: 'relative'
          }}>
            {/* Connection Line */}
            <div style={{
              position: 'absolute',
              left: '19px',
              top: '38px',
              width: '2px',
              height: '40px',
              background: riskStatus === 'complete' ? colours.green : colours.light.border,
              zIndex: 1
            }} />
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'white',
              borderRadius: '8px',
              border: `1px solid ${riskStatus === 'complete' ? colours.green : 
                                    nextActionStep === 'risk' ? colours.blue : colours.light.border}`,
              boxShadow: nextActionStep === 'risk' ? `0 2px 8px ${colours.blue}20` : '0 1px 3px rgba(0,0,0,0.05)',
              width: '100%',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: riskStatus === 'complete' ? colours.green : 
                           nextActionStep === 'risk' ? colours.blue : colours.greyText,
                color: 'white',
                fontSize: '1rem',
                flexShrink: 0
              }}>
                <FaShieldAlt />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: colours.darkBlue,
                    letterSpacing: '-0.01em'
                  }}>
                    Risk Assessment
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: riskStatus === 'complete' ? colours.green : colours.greyText,
                    color: 'white'
                  }}>
                    {riskStatus === 'complete' ? 'Complete' : 'Pending'}
                  </span>
                </div>
                {compliance && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: colours.greyText,
                    marginBottom: '6px'
                  }}>
                    Compliance check required
                  </div>
                )}
                {nextActionStep === 'risk' && !isCompleted && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '8px'
                  }}>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'white',
                        background: colours.blue,
                        border: `1px solid ${colours.blue}`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Complete Assessment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Matter Creation */}
          <div className="timeline-step" style={{
            display: 'flex',
            alignItems: 'flex-start',
            position: 'relative'
          }}>
            {/* Connection Line */}
            <div style={{
              position: 'absolute',
              left: '19px',
              top: '38px',
              width: '2px',
              height: '40px',
              background: matterStatus === 'complete' ? colours.green : colours.light.border,
              zIndex: 1
            }} />
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'white',
              borderRadius: '8px',
              border: `1px solid ${matterStatus === 'complete' ? colours.green : 
                                    nextActionStep === 'matter' ? colours.blue : colours.light.border}`,
              boxShadow: nextActionStep === 'matter' ? `0 2px 8px ${colours.blue}20` : '0 1px 3px rgba(0,0,0,0.05)',
              width: '100%',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: matterStatus === 'complete' ? colours.green : 
                           nextActionStep === 'matter' ? colours.blue : colours.greyText,
                color: 'white',
                fontSize: '1rem',
                flexShrink: 0
              }}>
                <FaFolder />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: colours.darkBlue,
                    letterSpacing: '-0.01em'
                  }}>
                    Matter Creation
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: matterStatus === 'complete' ? colours.green : colours.greyText,
                    color: 'white'
                  }}>
                    {matterStatus === 'complete' ? 'Created' : 'Pending'}
                  </span>
                </div>
                {nextActionStep === 'matter' && !isCompleted && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '8px'
                  }}>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'white',
                        background: colours.blue,
                        border: `1px solid ${colours.blue}`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Create Matter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CCL Submission - Final step (no connection line after) */}
          <div className="timeline-step" style={{
            display: 'flex',
            alignItems: 'flex-start',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'white',
              borderRadius: '8px',
              border: `1px solid ${cclStatus === 'complete' ? colours.green : 
                                    nextActionStep === 'ccl' ? colours.blue : colours.light.border}`,
              boxShadow: nextActionStep === 'ccl' ? `0 2px 8px ${colours.blue}20` : '0 1px 3px rgba(0,0,0,0.05)',
              width: '100%',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: cclStatus === 'complete' ? colours.green : 
                           nextActionStep === 'ccl' ? colours.blue : colours.greyText,
                color: 'white',
                fontSize: '1rem',
                flexShrink: 0
              }}>
                <FaClipboardCheck />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: colours.darkBlue,
                    letterSpacing: '-0.01em'
                  }}>
                    CCL Submission
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: cclStatus === 'complete' ? colours.green : colours.greyText,
                    color: 'white'
                  }}>
                    {cclStatus === 'complete' ? 'Complete' : 'Pending'}
                  </span>
                </div>
                {nextActionStep === 'ccl' && !isCompleted && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '8px'
                  }}>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'white',
                        background: colours.blue,
                        border: `1px solid ${colours.blue}`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Submit to CCL
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div> {/* End Sequential Timeline */}
        
      </div> {/* End Workflow Timeline */}

      {/* CLEAN CONTACT INFORMATION */}
      <div className="subtle-contact-info" style={{
        marginTop: '16px',
        padding: '12px 16px',
        background: `linear-gradient(135deg, ${colours.light.background} 0%, ${colours.light.sectionBackground} 100%)`,
        borderRadius: '8px',
        border: `1px solid ${colours.light.border}`,
        fontSize: '0.75rem',
        color: colours.greyText,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontWeight: 500 }}>{instruction.Email || instruction.email || 'N/A'}</span>
        <span style={{ opacity: 0.4 }}>•</span>
        <span style={{ fontWeight: 500 }}>{instruction.Phone || instruction.phone || 'N/A'}</span>
        <span style={{ opacity: 0.4 }}>•</span>
        <span style={{ fontWeight: 500 }}>
          {instruction.DateOfEnquiry ? (
            (() => {
              try {
                const date = new Date(instruction.DateOfEnquiry);
                return isNaN(date.getTime()) ? 'Invalid date' : formatDistanceToNow(date, { addSuffix: true });
              } catch {
                return 'Invalid date';
              }
            })()
          ) : 'N/A'}
        </span>
      </div>
      </div>
    </div>
  );
};

export default InstructionCard;
