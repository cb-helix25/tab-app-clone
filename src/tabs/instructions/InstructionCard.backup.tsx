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
import { ClientInfo } from './JointClientCard';

// Utility for copying text and showing feedback - same as enquiry cards
function useCopyToClipboard(timeout = 1200): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
      });
    }
  };
  return [copied, copy];
}

interface CopyableTextProps {
  value: string;
  className?: string;
  label?: string;
}

const CopyableText: React.FC<CopyableTextProps> = ({ value, className, label }) => {
  const [isCopied, copyToClipboard] = useCopyToClipboard();
  const handleCopy = () => copyToClipboard(value);

  return (
    <span
      className={className}
      style={{
        cursor: 'pointer',
        color: isCopied ? '#4ade80' : undefined,
        transition: 'color 0.2s'
      }}
      onClick={e => {
        e.stopPropagation();
        handleCopy();
      }}
      title={isCopied ? `Copied "${value}"` : `Click to copy`}
    >
      {isCopied ? '✓ Copied' : (label ? `${label}: ${value}` : value)}
    </span>
  );
};

// Props interface
interface InstructionCardProps {
  instruction: any; 
  expanded?: boolean;
  selected?: boolean;
  isCompleted?: boolean;
  documents?: Array<{ FileName: string; DocUrl?: string; [key: string]: any }>;
  deal?: { ServiceDescription?: string; Amount?: number };
  deals?: any[];
  clients?: ClientInfo[];
  risk?: any;
  prospectId?: number;
  eid?: any;
  eids?: any[] | any;
  compliance?: any;
  documentCount?: number;
  animationDelay?: number;
  innerRef?: React.RefObject<HTMLDivElement>;
  onSelect?: () => void;
  onToggle?: () => void;
  onProofOfIdClick?: (ref: string) => void;
  onCreateMatter?: (id: string) => void;
}

// Icon helper
const getFileIcon = (fileName: string) => {
  const extension = fileName?.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf': return <FaFilePdf />;
    case 'doc':
    case 'docx': return <FaFileWord />;
    case 'xls':
    case 'xlsx': return <FaFileExcel />;
    case 'ppt':
    case 'pptx': return <FaFilePowerpoint />;
    case 'zip':
    case 'rar': return <FaFileArchive />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return <FaFileImage />;
    case 'mp3':
    case 'wav': return <FaFileAudio />;
    case 'mp4':
    case 'avi': return <FaFileVideo />;
    default: return <FaFileAlt />;
  }
};

// Main component
const InstructionCard: React.FC<InstructionCardProps> = ({
  instruction,
  expanded = false,
  selected = false,
  isCompleted = false,
  documents = [],
  deal,
  deals,
  clients = [],
  risk,
  prospectId,
  eid,
  eids,
  compliance,
  documentCount,
  animationDelay = 0,
  innerRef,
  onSelect,
  onToggle,
  onProofOfIdClick,
  onCreateMatter
}) => {

  const handleDocumentClick = (doc: any) => {
    if (doc.DocUrl) {
      window.open(doc.DocUrl, '_blank');
    }
  };

  // Status determination logic
  const verifyIdStatus = instruction.ProofOfIdStatus || 'pending';
  const paymentComplete = instruction.PaymentResult?.includes('successful') || instruction.PaymentResult?.includes('complete');
  const paymentFailed = instruction.PaymentResult?.includes('failed') || instruction.PaymentResult?.includes('error');
  const documentsComplete = documents.length > 0 && documents.every(doc => doc.FileName);
  const riskStatus = risk?.RiskScore ? (risk.RiskScore > 7 ? 'flagged' : 'complete') : 'pending';
  const matterStatus = instruction.MatterId ? 'complete' : 'pending';
  const hasAssociatedMatter = !!instruction.MatterId;
  const cclStatus = 'pending' as 'pending' | 'complete';

  // Determine next action step
  const getNextActionStep = () => {
    if (verifyIdStatus === 'pending') return 'id';
    if (!paymentComplete && !paymentFailed) return 'payment';
    if (!documentsComplete) return 'documents';
    if (riskStatus === 'pending') return 'risk';
    if (!hasAssociatedMatter) return 'matter';
    if (cclStatus === 'pending') return 'ccl';
    return null;
  };

  const nextActionStep = getNextActionStep();

  const [isHovered, setIsHovered] = useState(false);

  // Outer wrapper (container) styling
  const wrapperClass = mergeStyles('instruction-card-container', 'premium', selected ? 'selected' : '', {
    position: 'relative',
    border: `1px solid ${colours.light.border}`,
    borderRadius: '12px',
    background: colours.light.sectionBackground,
    boxShadow: '0 2px 6px rgba(6,23,51,0.06)',
    transition: 'box-shadow .25s ease, transform .25s ease, border-color .25s ease',
    cursor: 'pointer',
    selectors: {
      ':hover': {
        boxShadow: '0 6px 18px rgba(6,23,51,0.12)',
        transform: 'translateY(-2px)'
      }
    }
  });

  // Inner card body retains logical/layout styles
  const cardClass = mergeStyles('instructionCard', {
    backgroundColor: colours.light.sectionBackground,
    borderRadius: '0px',
    padding: '16px',
    color: colours.light.text,
    cursor: 'pointer',
    position: 'relative',
    border: selected 
      ? `2px solid ${colours.blue}` 
      : `1px solid ${colours.light.border}`,
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

  const style: React.CSSProperties = {
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
    <div className={wrapperClass} style={style} onClick={handleCardClick} ref={innerRef}
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

      {/* WORKFLOW TIMELINE - Two Column Layout for Timeline Items */}
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
        
        {/* Sequential Timeline - Connected Steps */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0px'
        }}>
        {/* ID Verification */}
        <div className="timeline-item" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
          padding: '8px 0'
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
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: colours.darkBlue
              }}>
                ID Verification
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: verifyIdStatus === 'complete' ? colours.green : 
                       verifyIdStatus === 'review' ? colours.red : colours.greyText
              }}>
                {verifyIdStatus === 'complete' ? 'Verified' : 
                 verifyIdStatus === 'review' ? 'Under Review' : 'Pending'}
              </span>
            </div>
            {(instruction.PassportNumber || instruction.DriversLicenseNumber) && (
              <div style={{
                fontSize: '0.7rem',
                color: colours.greyText,
                marginTop: '2px'
              }}>
                {instruction.PassportNumber && `Passport: ${instruction.PassportNumber}`}
                {instruction.PassportNumber && instruction.DriversLicenseNumber && ' • '}
                {instruction.DriversLicenseNumber && `License: ${instruction.DriversLicenseNumber}`}
              </div>
            )}
            {nextActionStep === 'id' && (
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '6px'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onProofOfIdClick) onProofOfIdClick(instruction.InstructionRef);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: colours.blue,
                    background: 'white',
                    border: `1px solid ${colours.blue}`,
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Review ID
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payment */}
        {instruction.PaymentResult && (
          <div className="timeline-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '8px 0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: paymentComplete ? colours.green : 
                         paymentFailed ? colours.red : 
                         nextActionStep === 'payment' ? colours.blue : colours.greyText,
              color: 'white',
              fontSize: '0.8rem',
              flexShrink: 0
            }}>
              <FaPoundSign />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: colours.darkBlue
                }}>
                  Payment
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: paymentComplete ? colours.green : 
                         paymentFailed ? colours.red : colours.greyText
                }}>
                  {paymentComplete ? 'Paid' : paymentFailed ? 'Failed' : 'Pending'}
                </span>
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: colours.greyText,
                marginTop: '2px'
              }}>
                {instruction.PaymentResult}
              </div>
            </div>
          </div>
        )}

        {/* Documents */}
        {documents && documents.length > 0 && (
          <div className="timeline-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '8px 0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: documentsComplete ? colours.green : 
                         nextActionStep === 'documents' ? colours.blue : colours.greyText,
              color: 'white',
              fontSize: '0.8rem',
              flexShrink: 0
            }}>
              <FaFileAlt />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: colours.darkBlue
                }}>
                  Documents ({documents.length})
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: documentsComplete ? colours.green : colours.greyText
                }}>
                  {documentsComplete ? 'Complete' : 'Pending'}
                </span>
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: colours.greyText,
                marginTop: '2px'
              }}>
                {documents.slice(0, 3).map(doc => doc.FileName?.split('.')[0]?.substring(0, 15) || 'Doc').join(', ')}
                {documents.length > 3 && ` +${documents.length - 3} more`}
              </div>
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        {risk && risk.MatterId === instruction.InstructionRef && (
          <div className="timeline-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '8px 0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: riskStatus === 'complete' ? colours.green : 
                         riskStatus === 'flagged' ? colours.red : 
                         nextActionStep === 'risk' ? colours.blue : colours.greyText,
              color: 'white',
              fontSize: '0.8rem',
              flexShrink: 0
            }}>
              <FaShieldAlt />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: colours.darkBlue
                }}>
                  Risk Assessment
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: riskStatus === 'flagged' ? colours.red : 
                         riskStatus === 'complete' ? colours.green : colours.greyText
                }}>
                  {riskStatus === 'flagged' ? 'Flagged' : 
                   riskStatus === 'complete' ? 'Complete' : 'Pending'}
                </span>
              </div>
              {risk.RiskScore && (
                <div style={{
                  fontSize: '0.7rem',
                  color: colours.greyText,
                  marginTop: '2px'
                }}>
                  Risk Score: {risk.RiskScore}/10
                </div>
              )}
            </div>
          </div>
        )}

        {/* Matter Creation */}
        {(hasAssociatedMatter || nextActionStep === 'matter') && (
          <div className="timeline-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '8px 0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: hasAssociatedMatter ? colours.green : 
                         nextActionStep === 'matter' ? colours.blue : colours.greyText,
              color: 'white',
              fontSize: '0.8rem',
              flexShrink: 0
            }}>
              <FaFolder />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: colours.darkBlue
                }}>
                  Matter Creation
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: hasAssociatedMatter ? colours.green : colours.greyText
                }}>
                  {hasAssociatedMatter ? 'Created' : 'Pending'}
                </span>
              </div>
              {instruction.MatterId && (
                <div style={{
                  fontSize: '0.7rem',
                  color: colours.greyText,
                  marginTop: '2px'
                }}>
                  Matter: {instruction.MatterId}
                </div>
              )}
              {nextActionStep === 'matter' && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '6px'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCreateMatter) onCreateMatter(instruction.InstructionId);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: colours.blue,
                      background: 'white',
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
        )}

        {/* CCL Submission */}
        {(cclStatus === 'pending' || cclStatus === 'complete' || nextActionStep === 'ccl') && (
          <div className="timeline-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '8px 0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: cclStatus === 'complete' ? colours.green : 
                         nextActionStep === 'ccl' ? colours.blue : colours.greyText,
              color: 'white',
              fontSize: '0.8rem',
              flexShrink: 0
            }}>
              <FaClipboardCheck />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: colours.darkBlue
                }}>
                  CCL Submission
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: cclStatus === 'complete' ? colours.green : colours.greyText
                }}>
                  {cclStatus === 'complete' ? 'Complete' : 'Pending'}
                </span>
              </div>
              {nextActionStep === 'ccl' && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '6px'
                }}>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: colours.blue,
                      background: 'white',
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
        )}
        
        </div> {/* End Timeline Items Grid */}
      </div> {/* End Workflow Timeline */}

      {/* SUBTLE CONTACT INFORMATION */}
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
