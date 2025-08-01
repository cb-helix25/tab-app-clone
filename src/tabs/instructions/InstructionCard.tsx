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
  FaCopy
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

    // Format submission date
    const formattedDate = instruction.SubmissionDate
        ? format(new Date(instruction.SubmissionDate), 'd MMM yyyy')
        : undefined;

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
        selectors: {
            ':hover': {
                boxShadow: selected
                    ? '0 0 0 1px #3690CE30, 0 6px 20px rgba(54, 144, 206, 0.2)'
                    : '0 4px 16px rgba(0,0,0,0.12)',
                transform: 'translateY(-1px)',
            },
        },
    });

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
        <div className={cardClass} style={style} onClick={handleCardClick} ref={innerRef}>
            {/* HORIZONTAL LINE LAYOUT LIKE ENQUIRY CARDS */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                width: '100%',
                flexWrap: 'wrap',
            }}>
                
                {/* CLIENT INFO AND DATE/REF - Combined Left Section */}
                <div style={{ flex: '0 0 420px', minWidth: '420px', display: 'flex', gap: '12px' }}>
                    {/* CLIENT INFO BOX */}
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e1e4e8',
                        borderRadius: '0px',
                        padding: '8px 12px',
                        height: '62px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        flex: '1'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#24292f',
                            marginBottom: '3px',
                            gap: '6px'
                        }}>
                            {isMultiClient ? (
                                <FaUsers style={{ 
                                    fontSize: '12px', 
                                    color: selected ? '#3690CE' : '#666' 
                                }} />
                            ) : (
                                <FaUser style={{ 
                                    fontSize: '12px', 
                                    color: selected ? '#3690CE' : '#666' 
                                }} />
                            )}
                            <span style={{ flex: 1 }}>{fullName || 'Client Name'}</span>
                            <FaCopy
                                style={{
                                    fontSize: '10px',
                                    color: '#999',
                                    cursor: 'pointer',
                                    transition: 'color 0.2s ease'
                                }}
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    if (navigator && navigator.clipboard) {
                                        navigator.clipboard.writeText(fullName || 'Client Name');
                                    }
                                }}
                                onMouseEnter={(e: React.MouseEvent) => {
                                    (e.currentTarget as HTMLElement).style.color = '#3690CE';
                                }}
                                onMouseLeave={(e: React.MouseEvent) => {
                                    (e.currentTarget as HTMLElement).style.color = '#999';
                                }}
                                title="Copy client name"
                            />
                        </div>
                        {instruction.Email && (
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#333',
                                marginBottom: '1px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            onMouseEnter={(e) => {
                                const icon = e.currentTarget.querySelector('.contact-icon') as HTMLElement;
                                if (icon) icon.style.color = '#3690CE';
                            }}
                            onMouseLeave={(e) => {
                                const icon = e.currentTarget.querySelector('.contact-icon') as HTMLElement;
                                if (icon) icon.style.color = selected ? '#3690CE' : '#666';
                            }}
                            >
                                <FaEnvelope 
                                    className="contact-icon"
                                    style={{ 
                                        fontSize: '10px', 
                                        color: selected ? '#3690CE' : '#666',
                                        transition: 'color 0.2s ease'
                                    }} 
                                />
                                <span 
                                    style={{ 
                                        flex: 1, 
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        color: '#3690CE'
                                    }}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        window.location.href = `mailto:${instruction.Email}`;
                                    }}
                                    title="Send email"
                                >
                                    {instruction.Email}
                                </span>
                                <FaCopy
                                    style={{
                                        fontSize: '10px',
                                        color: '#999',
                                        cursor: 'pointer',
                                        transition: 'color 0.2s ease'
                                    }}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        if (navigator && navigator.clipboard && instruction.Email) {
                                            navigator.clipboard.writeText(instruction.Email);
                                        }
                                    }}
                                    onMouseEnter={(e: React.MouseEvent) => {
                                        (e.currentTarget as HTMLElement).style.color = '#3690CE';
                                    }}
                                    onMouseLeave={(e: React.MouseEvent) => {
                                        (e.currentTarget as HTMLElement).style.color = '#999';
                                    }}
                                    title="Copy email"
                                />
                            </div>
                        )}
                        {instruction.Phone && (
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#333',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            onMouseEnter={(e) => {
                                const icon = e.currentTarget.querySelector('.contact-icon') as HTMLElement;
                                if (icon) icon.style.color = '#3690CE';
                            }}
                            onMouseLeave={(e) => {
                                const icon = e.currentTarget.querySelector('.contact-icon') as HTMLElement;
                                if (icon) icon.style.color = selected ? '#3690CE' : '#666';
                            }}
                            >
                                <FaPhone 
                                    className="contact-icon"
                                    style={{ 
                                        fontSize: '10px', 
                                        color: selected ? '#3690CE' : '#666',
                                        transition: 'color 0.2s ease'
                                    }} 
                                />
                                <span 
                                    style={{ 
                                        flex: 1, 
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        color: '#3690CE'
                                    }}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        window.location.href = `tel:${instruction.Phone}`;
                                    }}
                                    title="Call phone number"
                                >
                                    {instruction.Phone}
                                </span>
                                <FaCopy
                                    style={{
                                        fontSize: '10px',
                                        color: '#999',
                                        cursor: 'pointer',
                                        transition: 'color 0.2s ease'
                                    }}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        if (navigator && navigator.clipboard && instruction.Phone) {
                                            navigator.clipboard.writeText(instruction.Phone);
                                        }
                                    }}
                                    onMouseEnter={(e: React.MouseEvent) => {
                                        (e.currentTarget as HTMLElement).style.color = '#3690CE';
                                    }}
                                    onMouseLeave={(e: React.MouseEvent) => {
                                        (e.currentTarget as HTMLElement).style.color = '#999';
                                    }}
                                    title="Copy phone number"
                                />
                            </div>
                        )}
                    </div>

                    {/* DATE AND INSTRUCTION REF BOX */}
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e1e4e8',
                        borderRadius: '0px',
                        padding: '8px 12px',
                        height: '62px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        textAlign: 'center',
                        minWidth: '120px'
                    }}>
                        {formattedDate && (
                            <div style={{
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                color: '#24292f',
                                marginBottom: '6px'
                            }}>
                                {formattedDate}
                            </div>
                        )}
                        {instruction.InstructionRef && (
                            <div style={{
                                fontSize: '0.7rem',
                                fontWeight: 400,
                                color: '#666',
                                fontFamily: 'monospace',
                                backgroundColor: '#fff',
                                padding: '3px 6px',
                                borderRadius: '2px',
                                border: '1px solid #e1e4e8'
                            }}>
                                <CopyableText 
                                    value={instruction.InstructionRef} 
                                    label="instruction reference"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* STAGE */}
                <div style={{ flex: '0 0 140px', minWidth: '140px' }}>
                    <div style={{
                        backgroundColor: isCompleted ? '#f0f9ff' : '#f8f9fa',
                        borderLeft: `4px solid ${isCompleted ? '#0ea5e9' : '#6b7280'}`,
                        color: isCompleted ? '#0284c7' : '#4b5563',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        padding: '8px 12px',
                        borderRadius: '0px',
                        border: isCompleted ? '1px solid rgba(14, 165, 233, 0.15)' : '1px solid rgba(107, 114, 128, 0.15)',
                        height: '62px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '8px',
                            backgroundColor: colours.light.sectionBackground,
                            padding: '0 4px',
                            fontSize: '0.75rem',
                            color: '#8b949e',
                            fontWeight: 500
                        }}>
                            Next Action
                        </div>
                        {isCompleted ? (hasAssociatedMatter ? 'CCL Draft' : 'Matter Opening') : instruction.Stage}
                    </div>
                </div>

                {/* SERVICE & FEE */}
                <div style={{ flex: '1', minWidth: '250px', maxWidth: '350px' }}>
                    {deal && (deal.ServiceDescription || typeof deal.Amount === 'number') && (
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e1e4e8',
                            borderRadius: '0px',
                            padding: '8px 12px',
                            height: '62px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '-8px',
                                left: '8px',
                                backgroundColor: colours.light.sectionBackground,
                                padding: '0 4px',
                                fontSize: '0.75rem',
                                color: '#8b949e',
                                fontWeight: 500
                            }}>
                                Service & Fee
                            </div>
                            <div style={{ 
                                marginBottom: '4px', 
                                fontSize: '0.9rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {deal.ServiceDescription || 'Legal Service'}
                            </div>
                            {typeof deal.Amount === 'number' && (
                                <div style={{ 
                                    fontSize: '0.85rem', 
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

                {/* STATUS BOXES - Now inline with main content and will wrap only if needed */}
                <div style={{ 
                    display: 'flex',
                    gap: '10px',
                    flex: '1 1 520px', // Allow growth when wrapped
                    minWidth: '520px'
                }}>
                    {/* ID Status Box */}
                    <div style={{
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        padding: '10px 8px',
                        borderRadius: '0px',
                        textAlign: 'center',
                        flex: '1',
                        border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '6px' }}>ID</div>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: verifyIdStatus === 'complete' ? '#20b26c' : 
                                   verifyIdStatus === 'review' ? '#FFB900' :
                                   verifyIdStatus === 'received' ? '#3690CE' : '#666',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                        }}>
                            <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: verifyIdStatus === 'complete' ? '#20b26c' : 
                                               verifyIdStatus === 'review' ? '#FFB900' :
                                               verifyIdStatus === 'received' ? '#3690CE' : '#ccc'
                            }} />
                            {verifyIdStatus === 'complete' ? 'OK' : 
                             verifyIdStatus === 'review' ? 'Review' :
                             verifyIdStatus === 'received' ? 'Rcvd' : 'Pending'}
                        </div>
                    </div>

                    {/* Payment Status Box */}
                    <div style={{
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        padding: '10px 8px',
                        borderRadius: '0px',
                        textAlign: 'center',
                        flex: '1',
                        border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '6px' }}>Pay</div>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: paymentComplete ? '#20b26c' : paymentFailed ? '#d13438' : '#666',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                        }}>
                            <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: paymentComplete ? '#20b26c' : paymentFailed ? '#d13438' : '#ccc'
                            }} />
                            {paymentComplete ? 'OK' : paymentFailed ? 'Failed' : 'Pending'}
                        </div>
                    </div>

                    {/* Documents Status Box */}
                    <div style={{
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        padding: '10px 8px',
                        borderRadius: '0px',
                        textAlign: 'center',
                        flex: '1',
                        border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '6px' }}>Docs</div>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: documentsComplete ? '#20b26c' : '#666',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                        }}>
                            <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: documentsComplete ? '#20b26c' : '#ccc'
                            }} />
                            {documentsComplete ? `${documents?.length ?? documentCount}` : 'None'}
                        </div>
                    </div>

                    {/* Risk Status Box */}
                    <div style={{
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        padding: '10px 8px',
                        borderRadius: '0px',
                        textAlign: 'center',
                        flex: '1',
                        border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '6px' }}>Risk</div>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: riskStatus === 'complete' ? '#20b26c' : 
                                   riskStatus === 'flagged' ? '#FFB900' : '#666',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                        }}>
                            <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: riskStatus === 'complete' ? '#20b26c' : 
                                               riskStatus === 'flagged' ? '#FFB900' : '#ccc'
                            }} />
                            {riskStatus === 'complete' ? 'OK' :
                             riskStatus === 'flagged' ? 'Flag' : 'Pending'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Documents Section */}
            {expanded && documents && documents.length > 0 && (
                <div style={{
                    marginTop: '16px',
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
                        <FaFileAlt /> Deal Documents
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
    );
};

export default InstructionCard;
