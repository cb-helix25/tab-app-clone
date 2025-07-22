import React from 'react';
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
  FaInfoCircle
} from 'react-icons/fa';
import { colours } from '../../app/styles/colours';
import { ClientInfo } from './JointClientCard';

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
            : isCompleted 
                ? '0.25px solid #0ea5e9' 
                : '1px solid #e1e4e8',
        boxShadow: selected
            ? '0 0 0 1px #3690CE20, 0 4px 16px rgba(54, 144, 206, 0.15)'
            : isCompleted 
                ? 'inset 0 0 2px rgba(14, 165, 233, 0.15), 0 2px 8px rgba(0,0,0,0.08)'
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


            {/* Client Name Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#24292f',
                marginBottom: '8px',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                paddingBottom: '6px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isMultiClient ? (
                        <FaUsers style={{ 
                            fontSize: '14px', 
                            color: selected ? '#3690CE' : '#666' 
                        }} />
                    ) : (
                        <FaUser style={{ 
                            fontSize: '14px', 
                            color: selected ? '#3690CE' : '#666' 
                        }} />
                    )}
                    <span>{fullName || 'Client Name'}</span>
                </div>
                {instruction.InstructionRef && (
                    <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 400,
                        color: '#666',
                        fontFamily: 'monospace'
                    }}>
                        {instruction.InstructionRef}
                    </span>
                )}
            </div>

            {/* Stage/Status Banner */}
            {instruction.Stage && (
                <div style={{
                    backgroundColor: isCompleted ? '#f0f9ff' : '#f8f9fa',
                    borderLeft: `4px solid ${isCompleted ? '#0ea5e9' : '#6b7280'}`,
                    color: isCompleted ? '#0284c7' : '#4b5563',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    padding: '8px 16px',
                    marginBottom: '12px',
                    borderRadius: '0px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: isCompleted ? '1px solid rgba(14, 165, 233, 0.15)' : '1px solid rgba(107, 114, 128, 0.15)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaInfoCircle style={{ fontSize: '14px', opacity: 0.7 }} />
                        <span>{isCompleted ? (hasAssociatedMatter ? 'Pending CCL Draft' : 'Pending matter opening') : `Stage: ${instruction.Stage}`}</span>
                    </div>
                    {formattedDate && (
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 400,
                            opacity: 0.8
                        }}>
                            {stage === 'initialised' ? 'Initialised:' : 'Submitted:'} {formattedDate}
                        </span>
                    )}
                </div>
            )}

            {/* Service Description from Deal */}
            {deal && (deal.ServiceDescription || typeof deal.Amount === 'number') && (
                <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e1e4e8',
                    borderRadius: '0px',
                    padding: '8px 12px',
                    marginBottom: '12px',
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
                    <div style={{ marginBottom: '4px', fontSize: '0.9rem' }}>
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

            {/* Contact Information */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '12px'
            }}>
                {instruction.Email && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e1e4e8',
                        borderRadius: '0px',
                        height: '36px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            backgroundColor: '#fff',
                            borderRight: '1px solid #e1e4e8',
                            height: '100%',
                            width: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="#666" strokeWidth="1.5"/>
                                <polyline points="4,6 12,13 20,6" fill="none" stroke="#666" strokeWidth="1.5"/>
                            </svg>
                        </div>
                        <div style={{
                            fontSize: '0.8rem',
                            color: '#333',
                            padding: '0 8px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {instruction.Email}
                        </div>
                    </div>
                )}

                {instruction.Phone && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e1e4e8',
                        borderRadius: '0px',
                        height: '36px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            backgroundColor: '#fff',
                            borderRight: '1px solid #e1e4e8',
                            height: '100%',
                            width: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" fill="#666"/>
                            </svg>
                        </div>
                        <div style={{
                            fontSize: '0.8rem',
                            color: '#333',
                            padding: '0 8px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {instruction.Phone}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Summary Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '8px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                padding: '8px',
                borderRadius: '0px'
            }}>
                {/* ID Status */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>ID Verification</div>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: verifyIdStatus === 'complete' ? '#20b26c' : 
                               verifyIdStatus === 'review' ? '#FFB900' :
                               verifyIdStatus === 'received' ? '#3690CE' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: verifyIdStatus === 'complete' ? '#20b26c' : 
                                           verifyIdStatus === 'review' ? '#FFB900' :
                                           verifyIdStatus === 'received' ? '#3690CE' : '#ccc'
                        }} />
                        {verifyIdStatus === 'complete' ? 'Verified' : 
                         verifyIdStatus === 'review' ? 'Review' :
                         verifyIdStatus === 'received' ? 'Received' : 'Pending'}
                    </div>
                </div>

                {/* Payment Status */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Payment</div>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: paymentComplete ? '#20b26c' : paymentFailed ? '#d13438' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: paymentComplete ? '#20b26c' : paymentFailed ? '#d13438' : '#ccc'
                        }} />
                        {paymentComplete ? 'Complete' : paymentFailed ? 'Failed' : 'Pending'}
                    </div>
                </div>

                {/* Documents Status */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Documents</div>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: documentsComplete ? '#20b26c' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: documentsComplete ? '#20b26c' : '#ccc'
                        }} />
                        {documentsComplete ? `${documents?.length ?? documentCount} Files` : 'Pending'}
                    </div>
                </div>

                {/* Risk Assessment */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Risk</div>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: riskStatus === 'complete' ? '#20b26c' : 
                               riskStatus === 'flagged' ? '#FFB900' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: riskStatus === 'complete' ? '#20b26c' : 
                                           riskStatus === 'flagged' ? '#FFB900' : '#ccc'
                        }} />
                        {riskStatus === 'complete' ? 'Assessed' :
                         riskStatus === 'flagged' ? 'Flagged' : 'Pending'}
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
