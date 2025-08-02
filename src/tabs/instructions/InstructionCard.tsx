import React, { useState } from 'react';
import { format } from 'date-fns';
import { mergeStyles } from '@fluentui/react';
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
  FaBuilding
} from 'react-icons/fa';
import { colours } from '../../app/styles/colours';
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
  noHoverEffects?: boolean; // Add option to disable hover enlargement
  iconHovered?: boolean; // Add option to track icon hover state
}

const CopyableText: React.FC<CopyableTextProps> = ({ value, className, label, noHoverEffects = false, iconHovered = false }) => {
  const [copied, copy] = useCopyToClipboard();
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <span
      className={className}
      title={copied ? `${label || 'Value'} copied!` : `Click to copy ${label || 'value'}`}
      onClick={e => {
        e.stopPropagation();
        copy(value);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        display: 'inline-block', 
        position: 'relative', 
        cursor: 'copy',
        padding: isHovered && !noHoverEffects ? '2px 4px' : '0',
        backgroundColor: isHovered && !noHoverEffects ? 'rgba(54, 144, 206, 0.08)' : 'transparent',
        borderRadius: isHovered && !noHoverEffects ? '3px' : '0',
        transition: 'all 0.2s ease',
        color: isHovered ? '#3690CE' : 'inherit',
      }}
    >
      {value}
      {copied && (
        <span style={{
          position: 'absolute',
          left: '100%',
          top: 0,
          marginLeft: 8,
          fontSize: 12,
          color: '#43a047',
          background: '#fff',
          borderRadius: 3,
          padding: '2px 6px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          zIndex: 10,
        }}>
          Copied!
        </span>
      )}
    </span>
  );
};

// File type icon mapping
const iconMap: Record<string, JSX.Element> = {
  pdf: <FaFilePdf style={{ fontSize: '20px' }} />,
  doc: <FaFileWord style={{ fontSize: '20px' }} />,
  docx: <FaFileWord style={{ fontSize: '20px' }} />,
  xls: <FaFileExcel style={{ fontSize: '20px' }} />,
  xlsx: <FaFileExcel style={{ fontSize: '20px' }} />,
  ppt: <FaFilePowerpoint style={{ fontSize: '20px' }} />,
  pptx: <FaFilePowerpoint style={{ fontSize: '20px' }} />,
  txt: <FaFileAlt style={{ fontSize: '20px' }} />,
  zip: <FaFileArchive style={{ fontSize: '20px' }} />,
  rar: <FaFileArchive style={{ fontSize: '20px' }} />,
  jpg: <FaFileImage style={{ fontSize: '20px' }} />,
  jpeg: <FaFileImage style={{ fontSize: '20px' }} />,
  png: <FaFileImage style={{ fontSize: '20px' }} />,
  mp3: <FaFileAudio style={{ fontSize: '20px' }} />,
  mp4: <FaFileVideo style={{ fontSize: '20px' }} />,
};

// Get file type-specific icon
const getFileIcon = (filename?: string): JSX.Element => {
  if (!filename) return <FaFileUpload style={{ fontSize: '20px' }} />;
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return iconMap[ext] || <FaFileAlt style={{ fontSize: '20px' }} />;
};

// Smart document handler - preview for PDFs/images, download for others
const handleDocumentClick = (doc: any) => {
  if (!doc.BlobUrl && !doc.DocumentUrl) return;
  
  const url = doc.BlobUrl || doc.DocumentUrl;
  const filename = doc.FileName || '';
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  
  // Previewable file types
  const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
  
  if (previewableTypes.includes(ext)) {
    // Open in new tab for preview
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    // Force download for non-previewable files
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

interface InstructionInfo {
    InstructionRef: string;
    Stage?: string;
    FirstName?: string;
    LastName?: string;
    CompanyName?: string;
    Email?: string;
    Phone?: string;
    SubmissionDate?: string;
    ClientType?: string;
    PassportNumber?: string;
    DriversLicenseNumber?: string;
    PaymentResult?: string;
    [key: string]: any;
}

interface DealInfo {
    InstructionRef?: string;
    ServiceDescription?: string;
    Amount?: number;
    IsMultiClient?: boolean;
    jointClients?: ClientInfo[];
    [key: string]: any;
}

interface InstructionCardProps {
    instruction: InstructionInfo;
    deal?: DealInfo;
    deals?: DealInfo[];
    clients?: ClientInfo[];
    prospectId?: number;
    risk?: {
        MatterId: string;
        RiskAssessmentResult?: string;
        RiskScore?: number;
    } | null;
    eid?: { EIDStatus?: string; EIDOverallResult?: string } | null;
    eids?: any[];
    compliance?: any | null;
    documentCount?: number;
    documents?: any[];
    animationDelay?: number;
    innerRef?: React.Ref<HTMLDivElement>;
    expanded?: boolean;
    onToggle?: () => void;
    selected?: boolean;
    onSelect?: () => void;
    onProofOfIdClick?: (ref: string) => void;
}

const InstructionCard: React.FC<InstructionCardProps> = ({
    instruction,
    deal,
    deals,
    clients,
    prospectId,
    risk,
    eid,
    eids,
    compliance,
    documentCount,
    documents,
    animationDelay = 0,
    innerRef,
    expanded = false,
    onToggle,
    selected = false,
    onSelect,
    onProofOfIdClick,
}) => {
    const stage = instruction.Stage?.toLowerCase();
    const isCompleted = stage === 'completed';

    // Check if the instruction has an associated matter
    const hasAssociatedMatter = instruction && (
        instruction.MatterId || 
        (instruction as any).matters?.length > 0
    );

    // Get client name
    const firstName = instruction.FirstName || '';
    const lastName = instruction.LastName || '';
    const fullName = firstName && lastName 
        ? `${firstName} ${lastName}`
        : firstName || lastName || instruction.CompanyName || '';

    // Determine if multi-client
    const isMultiClient = (deal && (deal.IsMultiClient || (deal.jointClients && deal.jointClients.length > 1)))
        || (instruction.ClientType && instruction.ClientType.toLowerCase().includes('joint'));

    // Get status information
    const proofOfIdComplete = Boolean(instruction.PassportNumber || instruction.DriversLicenseNumber);
    const paymentComplete = instruction.PaymentResult?.toLowerCase() === 'successful';
    const paymentFailed = instruction.PaymentResult?.toLowerCase() === 'failed';
    const documentsComplete = (documents?.length ?? documentCount ?? 0) > 0;

    const eidStatus = (eid?.EIDStatus || '').toLowerCase();
    const eidResult = (eid as any)?.EIDOverallResult?.toLowerCase();
    const eidPassed = eidResult === 'passed' || eidResult === 'pass';
    
    let verifyIdStatus: 'pending' | 'received' | 'review' | 'complete';
    if (!eid || eidStatus === 'pending') {
        verifyIdStatus = proofOfIdComplete ? 'received' : 'pending';
    } else if (eidPassed) {
        verifyIdStatus = 'complete';
    } else {
        verifyIdStatus = 'review';
    }

    const riskResultRaw = risk?.MatterId === instruction.InstructionRef ? (risk as any)?.RiskAssessmentResult?.toString().toLowerCase() : undefined;
    const riskStatus = riskResultRaw
        ? ['low', 'low risk', 'pass', 'approved'].includes(riskResultRaw)
            ? 'complete'
            : 'flagged'
        : 'pending';

    // Matter status - recognize if matter exists
    const matterStatus = hasAssociatedMatter ? 'complete' : 'pending';
    // CCL status - currently always pending until we have data to determine completion
    const cclStatus = 'pending' as 'pending' | 'complete';
    
    // Timeline progression logic - risk must be complete before matter/CCL can be considered "next"
    const riskComplete = riskStatus === 'complete' || riskStatus === 'flagged';
    
    // Determine which step should pulse (next action needed)
    const getNextActionStep = () => {
        // If ID not complete, that's next
        if (verifyIdStatus === 'pending') return 'id';
        // If payment not complete, that's next
        if (!paymentComplete && !paymentFailed) return 'payment';
        // If documents not complete, that's next
        if (!documentsComplete) return 'documents';
        // If risk not complete, that's next (this takes priority over matter)
        if (!riskComplete) return 'risk';
        // If matter not complete and risk is complete, that's next
        if (matterStatus === 'pending' && riskComplete) return 'matter';
        // If all above complete, CCL is next
        return 'ccl';
    };
    
    const nextActionStep = getNextActionStep();

    // Format submission date
    const formattedDate = instruction.SubmissionDate
        ? format(new Date(instruction.SubmissionDate), 'd MMM yyyy')
        : undefined;

    const [isHovered, setIsHovered] = useState(false);

    const cardClass = mergeStyles('instructionCard', {
        backgroundColor: colours.light.sectionBackground,
        borderRadius: '0px',
        padding: '16px',
        color: colours.light.text,
        cursor: 'pointer',
        position: 'relative',
        border: selected 
            ? '2px solid #3690CE' 
            : '1px solid #e1e4e8',
        boxShadow: selected
            ? '0 0 0 1px #3690CE20, 0 4px 16px rgba(54, 144, 206, 0.15)'
            : '0 2px 8px rgba(0,0,0,0.08)',
        opacity: isCompleted ? 0.6 : 1,
        transition: 'box-shadow 0.3s ease, transform 0.3s ease, border 0.3s ease, opacity 0.3s ease',
        flex: '1' as const, // Add flex to expand within parent
        selectors: {
            ':hover': {
                boxShadow: selected
                    ? '0 0 0 1px #3690CE30, 0 6px 20px rgba(54, 144, 206, 0.2)'
                    : '0 4px 16px rgba(0,0,0,0.12)',
                transform: 'translateY(-1px) scale(1.01)',
            },
        },
    });

    // Add CSS animation for pulsing
    const pulseAnimation = `
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    `;
    
    // Inject the animation styles if not already present
    if (!document.querySelector('#timeline-pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'timeline-pulse-animation';
        style.textContent = pulseAnimation;
        document.head.appendChild(style);
    }

    const style: React.CSSProperties = {
        '--animation-delay': `${animationDelay}s`,
    } as React.CSSProperties;

    const handleCardClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSelect) {
            // Let the parent component handle the selection/unselection logic
            onSelect();
        } else if (onToggle) {
            onToggle();
        }
    };

    return (
        <div 
            className={cardClass} 
            style={style} 
            onClick={handleCardClick} 
            ref={innerRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* CARD HEADER */}
            <div>
                {/* Header Row 1: Client Name and Ref */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        {isMultiClient ? (
                            <FaUsers style={{ 
                                fontSize: '14px', 
                                color: selected || isHovered ? '#3690CE' : '#666',
                                transition: 'color 0.3s ease'
                            }} />
                        ) : (
                            <FaUser style={{ 
                                fontSize: '14px', 
                                color: selected || isHovered ? '#3690CE' : '#666',
                                transition: 'color 0.3s ease'
                            }} />
                        )}
                        <div>
                            <span style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: selected || isHovered ? '#3690CE' : '#24292f',
                                transition: 'color 0.3s ease'
                            }}>
                                {fullName || 'Client Name'}
                            </span>
                            {instruction.CompanyName && (firstName || lastName) && (
                                <span style={{
                                    fontSize: '0.9rem',
                                    color: '#666',
                                    marginLeft: '8px'
                                }}>
                                    - {instruction.CompanyName}
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        {instruction.InstructionRef && (
                            <div style={{
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                color: '#24292f',
                                backgroundColor: 'rgba(0,0,0,0.03)',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                marginBottom: '4px'
                            }}>
                                {instruction.InstructionRef}
                            </div>
                        )}
                        {formattedDate && (
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#666'
                            }}>
                                {formattedDate}
                            </div>
                        )}
                    </div>
                </div>

                {/* Header Row 2: Contact Details */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '8px',
                    fontSize: '0.8rem'
                }}>
                    {instruction.Email && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#3690CE',
                            cursor: 'pointer'
                        }}
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${instruction.Email}`;
                        }}>
                            <FaEnvelope style={{ fontSize: '10px' }} />
                            <span>{instruction.Email}</span>
                        </div>
                    )}
                    {instruction.Phone && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#3690CE',
                            cursor: 'pointer'
                        }}
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            window.location.href = `tel:${instruction.Phone}`;
                        }}>
                            <FaPhone style={{ fontSize: '10px' }} />
                            <span>{instruction.Phone}</span>
                        </div>
                    )}
                </div>

                {/* Header Row 3: Service Description and Amount */}
                {deal && (deal.ServiceDescription || typeof deal.Amount === 'number') && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                    }}>
                        <div style={{
                            fontSize: '0.85rem',
                            color: '#333',
                            flex: 1
                        }}>
                            {deal.ServiceDescription || 'Legal Service'}
                        </div>
                        {typeof deal.Amount === 'number' && (
                            <div style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: '#3690CE',
                                fontFamily: 'Raleway'
                            }}>
                                £{deal.Amount.toLocaleString()}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* TIMELINE PROGRESS */}
            <div>
                {/* Timeline Row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    {/* Step 1: ID Verification */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '4px', 
                            backgroundColor: verifyIdStatus === 'complete' || verifyIdStatus === 'review' || verifyIdStatus === 'received' ? '#20b26c' : '#ddd',
                            flexShrink: 0,
                            overflow: 'hidden',
                            ...(nextActionStep === 'id' ? {
                                animation: 'pulse 2s infinite',
                                backgroundColor: colours.cta
                            } : {})
                        }}></div>
                        <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 600,
                            color: (verifyIdStatus === 'complete' || verifyIdStatus === 'review' || verifyIdStatus === 'received') ? '#20b26c' : 
                                   nextActionStep === 'id' ? colours.cta : '#999'
                        }}>
                            ID
                        </span>
                    </div>
                    
                    {/* Connector Line */}
                    <div style={{
                        width: '16px',
                        height: '2px',
                        backgroundColor: paymentComplete || paymentFailed ? '#20b26c' : '#ddd'
                    }}></div>
                    
                    {/* Step 2: Payment */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '4px', 
                            backgroundColor: paymentComplete || paymentFailed ? '#20b26c' : '#ddd',
                            flexShrink: 0,
                            overflow: 'hidden',
                            ...(nextActionStep === 'payment' ? {
                                animation: 'pulse 2s infinite',
                                backgroundColor: colours.cta
                            } : {})
                        }}></div>
                        <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 600,
                            color: (paymentComplete || paymentFailed) ? '#20b26c' : 
                                   nextActionStep === 'payment' ? colours.cta : '#999'
                        }}>
                            Pay
                        </span>
                    </div>
                    
                    {/* Connector Line */}
                    <div style={{
                        width: '16px',
                        height: '2px',
                        backgroundColor: documentsComplete ? '#20b26c' : '#ddd'
                    }}></div>
                    
                    {/* Step 3: Documents */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '4px', 
                            backgroundColor: documentsComplete ? '#20b26c' : '#ddd',
                            flexShrink: 0,
                            overflow: 'hidden',
                            ...(nextActionStep === 'documents' ? {
                                animation: 'pulse 2s infinite',
                                backgroundColor: colours.cta
                            } : {})
                        }}></div>
                        <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 600,
                            color: documentsComplete ? '#20b26c' : 
                                   nextActionStep === 'documents' ? colours.cta : '#999'
                        }}>
                            Docs
                        </span>
                    </div>
                    
                    {/* Connector Line */}
                    <div style={{
                        width: '16px',
                        height: '2px',
                        backgroundColor: riskStatus === 'complete' || riskStatus === 'flagged' ? '#20b26c' : '#ddd'
                    }}></div>
                    
                    {/* Step 4: Risk Assessment */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '4px', 
                            backgroundColor: riskStatus === 'complete' || riskStatus === 'flagged' ? '#20b26c' : '#ddd',
                            flexShrink: 0,
                            overflow: 'hidden',
                            ...(nextActionStep === 'risk' ? {
                                animation: 'pulse 2s infinite',
                                backgroundColor: colours.cta
                            } : {})
                        }}></div>
                        <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 600,
                            color: (riskStatus === 'complete' || riskStatus === 'flagged') ? '#20b26c' : 
                                   nextActionStep === 'risk' ? colours.cta : '#999'
                        }}>
                            Risk
                        </span>
                    </div>
                    
                    {/* Connector Line */}
                    <div style={{
                        width: '16px',
                        height: '2px',
                        backgroundColor: matterStatus === 'complete' ? '#20b26c' : '#ddd'
                    }}></div>
                    
                    {/* Step 5: Matter */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '4px', 
                            backgroundColor: matterStatus === 'complete' ? '#20b26c' : '#ddd',
                            flexShrink: 0,
                            overflow: 'hidden',
                            ...(nextActionStep === 'matter' ? {
                                animation: 'pulse 2s infinite',
                                backgroundColor: colours.cta
                            } : {})
                        }}></div>
                        <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 600,
                            color: matterStatus === 'complete' ? '#20b26c' : 
                                   nextActionStep === 'matter' ? colours.cta : '#999'
                        }}>
                            Matter
                        </span>
                    </div>
                    
                    {/* Connector Line */}
                    <div style={{
                        width: '16px',
                        height: '2px',
                        backgroundColor: cclStatus === 'complete' ? '#20b26c' : '#ddd'
                    }}></div>
                    
                    {/* Step 6: CCL */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '4px', 
                            backgroundColor: cclStatus === 'complete' ? '#20b26c' : '#ddd',
                            flexShrink: 0,
                            overflow: 'hidden',
                            ...(nextActionStep === 'ccl' ? {
                                animation: 'pulse 2s infinite',
                                backgroundColor: colours.cta
                            } : {})
                        }}></div>
                        <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 600,
                            color: cclStatus === 'complete' ? '#20b26c' : 
                                   nextActionStep === 'ccl' ? colours.cta : '#999'
                        }}>
                            CCL
                        </span>
                    </div>
                </div>
            </div>

            {/* Expanded Sections */}
            {(expanded || selected) && (
                <div>
                    {/* ID Verification Section */}
                    {(verifyIdStatus !== 'pending' || (instruction.PassportNumber || instruction.DriversLicenseNumber)) && (
                        <div style={{
                            marginBottom: '16px',
                            padding: '16px',
                            backgroundColor: 'rgba(54, 144, 206, 0.03)',
                            borderRadius: '4px',
                            border: '1px solid rgba(54, 144, 206, 0.1)'
                        }}>
                            <div style={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: '#3690CE',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <FaUser /> ID Verification
                            </div>
                            <div style={{
                                display: 'grid',
                                gap: '8px',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                            }}>
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: 'white',
                                    borderRadius: '4px',
                                    border: '1px solid #e1e4e8'
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>Status</div>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: verifyIdStatus === 'complete' ? colours.green : 
                                               verifyIdStatus === 'review' ? colours.cta :
                                               verifyIdStatus === 'received' ? colours.blue : '#666'
                                    }}>
                                        {verifyIdStatus === 'complete' ? 'Verified' : 
                                         verifyIdStatus === 'review' ? 'Under Review' :
                                         verifyIdStatus === 'received' ? 'Received' : 'Pending'}
                                    </div>
                                </div>
                                {instruction.PassportNumber && (
                                    <div style={{
                                        padding: '12px',
                                        backgroundColor: 'white',
                                        borderRadius: '4px',
                                        border: '1px solid #e1e4e8'
                                    }}>
                                        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>Passport</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                            {instruction.PassportNumber}
                                        </div>
                                    </div>
                                )}
                                {instruction.DriversLicenseNumber && (
                                    <div style={{
                                        padding: '12px',
                                        backgroundColor: 'white',
                                        borderRadius: '4px',
                                        border: '1px solid #e1e4e8'
                                    }}>
                                        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>Driver's License</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                            {instruction.DriversLicenseNumber}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Payment Section */}
                    {instruction.PaymentResult && (
                        <div style={{
                            marginBottom: '16px',
                            padding: '16px',
                            backgroundColor: 'rgba(54, 144, 206, 0.03)',
                            borderRadius: '4px',
                            border: '1px solid rgba(54, 144, 206, 0.1)'
                        }}>
                            <div style={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: '#3690CE',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <FaPoundSign /> Payment
                            </div>
                            <div style={{
                                padding: '12px',
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                border: '1px solid #e1e4e8'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>Status</div>
                                <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: paymentComplete ? colours.green : paymentFailed ? colours.red : '#666'
                                }}>
                                    {instruction.PaymentResult}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Risk Assessment Section */}
                    {risk && risk.MatterId === instruction.InstructionRef && (
                        <div style={{
                            marginBottom: '16px',
                            padding: '16px',
                            backgroundColor: 'rgba(54, 144, 206, 0.03)',
                            borderRadius: '4px',
                            border: '1px solid rgba(54, 144, 206, 0.1)'
                        }}>
                            <div style={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: '#3690CE',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <FaShieldAlt /> Risk Assessment
                            </div>
                            <div style={{
                                display: 'grid',
                                gap: '8px',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                            }}>
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: 'white',
                                    borderRadius: '4px',
                                    border: '1px solid #e1e4e8'
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>Result</div>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: riskStatus === 'complete' ? colours.green : 
                                               riskStatus === 'flagged' ? colours.cta : '#666'
                                    }}>
                                        {(risk as any)?.RiskAssessmentResult || 'Pending'}
                                    </div>
                                </div>
                                {typeof risk.RiskScore === 'number' && (
                                    <div style={{
                                        padding: '12px',
                                        backgroundColor: 'white',
                                        borderRadius: '4px',
                                        border: '1px solid #e1e4e8'
                                    }}>
                                        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>Score</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                            {risk.RiskScore}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Documents Section */}
                    {documents && documents.length > 0 && (
                        <div style={{
                            padding: '16px',
                            backgroundColor: 'rgba(54, 144, 206, 0.03)',
                            borderRadius: '4px',
                            border: '1px solid rgba(54, 144, 206, 0.1)'
                        }}>
                            <div style={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: '#3690CE',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <FaFileAlt /> Documents
                            </div>
                            
                            <div style={{
                                display: 'grid',
                                gap: '8px',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
                            }}>
                                {documents.map((doc: any, docIndex: number) => (
                                    <div key={docIndex} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 14px',
                                        backgroundColor: 'white',
                                        borderRadius: '4px',
                                        border: '1px solid #e1e4e8',
                                        fontSize: '0.75rem',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            flex: 1
                                        }}>
                                            <div style={{
                                                marginRight: '12px',
                                                fontSize: '1.1rem',
                                                color: '#3690CE'
                                            }}>
                                                {getFileIcon(doc.FileName)}
                                            </div>
                                            <div>
                                                <div style={{
                                                    fontWeight: 500,
                                                    color: '#24292f',
                                                    marginBottom: '4px'
                                                }}>
                                                    {doc.FileName || 'Unnamed document'}
                                                </div>
                                                {doc.FileSizeBytes && (
                                                    <div style={{
                                                        color: '#666',
                                                        fontSize: '0.7rem'
                                                    }}>
                                                        {Math.round(doc.FileSizeBytes / 1024)}KB
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {(doc.BlobUrl || doc.DocumentUrl) && (
                                            <button
                                                onClick={() => handleDocumentClick(doc)}
                                                style={{
                                                    color: '#3690CE',
                                                    textDecoration: 'none',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 500,
                                                    padding: '6px 10px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #3690CE',
                                                    backgroundColor: 'transparent',
                                                    transition: 'all 0.2s ease',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#3690CE';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.color = '#3690CE';
                                                }}
                                            >
                                                <FaDownload style={{ fontSize: '0.65rem' }} /> 
                                                {(() => {
                                                    const filename = doc.FileName || '';
                                                    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
                                                    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
                                                    return previewableTypes.includes(ext) ? 'Preview' : 'Download';
                                                })()}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InstructionCard;
