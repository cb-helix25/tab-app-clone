import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { mergeStyles } from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';
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
  FaIdCard,
  FaPlayCircle,
  FaSpinner
} from 'react-icons/fa';

// Move interface to separate file
export interface InstructionCardProps {
  instruction: any | null;
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
    DealId?: number;
    ServiceDescription?: string;
    Amount?: number;
    PitchedDate?: string;
    PitchedTime?: string;
    AreaOfWork?: string;
    firstName?: string;
    lastName?: string;
  };
  prospectId?: number;
  eid?: any;
  eids?: any[] | any;
  compliance?: any;
  deals?: any[];
  clients?: any[];
  risk?: any;
  documents?: any[];
  payments?: any[];
  style?: React.CSSProperties;
  onClick?: () => void;
  onProofOfIdClick?: () => void;
  onEIDClick?: () => void;
  idVerificationLoading?: boolean;
  animationDelay?: number;
  getClientNameByProspectId?: (prospectId: string | number | undefined) => { firstName: string; lastName: string };
}

// Component definition with CopyableText
const CopyableText: React.FC<{ value: string; label?: string; className?: string }> = ({ value, label, className }) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        cursor: 'pointer', 
        position: 'relative',
        padding: '2px 4px',
        borderRadius: '4px',
        transition: 'all 0.2s ease',
        backgroundColor: copied ? 'rgba(67, 160, 71, 0.1)' : (isHovered ? 'rgba(54, 144, 206, 0.1)' : 'transparent'),
        color: copied ? '#43a047' : (isHovered ? colours.cta : 'inherit'),
        border: `1px solid ${copied ? '#43a047' : (isHovered ? colours.cta : 'transparent')}`
      }}
      title={copied ? `Copied "${value}"!` : `Click to copy ${label || 'text'}`}
    >
      {value}
      {copied && (
        <span style={{
          position: 'absolute',
          top: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#43a047',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          animation: 'fadeInScale 0.2s ease-out'
        }}>
          ✓ Copied!
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid #43a047'
          }} />
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
  payments,
  style,
  onClick,
  onEIDClick,
  idVerificationLoading = false,
  animationDelay = 0,
  getClientNameByProspectId
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [clickedForActions, setClickedForActions] = useState(false);
  const [activeStep, setActiveStep] = useState<string>('');
  const { isDarkMode } = useTheme();
  // Inject keyframes once for pulse effect
  React.useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('instructioncard-pulse')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'instructioncard-pulse';
      styleTag.innerHTML = `
        @keyframes pulseGlow {
          0%{box-shadow:0 0 0 0 rgba(54,144,206,0.55);}
          60%{box-shadow:0 0 0 10px rgba(54,144,206,0);}
          100%{box-shadow:0 0 0 0 rgba(54,144,206,0);}
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: translateX(-50%) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(styleTag);
    }
  }, []);

  // Status logic - match the logic used in global actions
  // ID Verification status based on EID data
  const eidResult = (eid?.EIDOverallResult || eids?.[0]?.EIDOverallResult || instruction?.EIDOverallResult)?.toLowerCase() ?? "";
  const eidStatus = (eid?.EIDStatus || eids?.[0]?.EIDStatus)?.toLowerCase() ?? "";
  const poidPassed = eidResult === "passed" || eidResult === "approved" || eidResult === "verified";
  const proofOfIdComplete = Boolean(instruction?.PassportNumber || instruction?.DriversLicenseNumber);
  
  // Also check instruction stage for ID completion
  const stageComplete = instruction?.Stage === 'proof-of-id-complete' || instruction?.stage === 'proof-of-id-complete';
  
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
  } else if (!eid && !eids?.length || eidStatus === 'pending') {
    verifyIdStatus = proofOfIdComplete ? 'received' : 'pending';
  } else if (poidPassed) {
    verifyIdStatus = 'complete';
  } else {
    verifyIdStatus = 'review';
  }

  // Payment status based on payments array
  const getPaymentStatus = () => {    
    // Check if instruction itself is marked as paid (fallback)
    if (instruction?.InternalStatus === 'paid' || instruction?.internalStatus === 'paid') {
      return 'complete';
    }
    
    if (!payments || payments.length === 0) {
      return 'pending';
    }
    
    // Get the most recent payment
    const latestPayment = payments[0]; // Already sorted by created_at DESC in API
    console.log('Latest payment:', latestPayment);
    
    // A payment is complete if both payment_status is 'succeeded' AND internal_status is 'completed' or 'paid'
    if (latestPayment.payment_status === 'succeeded' && 
        (latestPayment.internal_status === 'completed' || latestPayment.internal_status === 'paid')) {
      console.log('Payment is complete');
      return 'complete';
    }
    
    console.log('Payment is pending - payment_status:', latestPayment.payment_status, 'internal_status:', latestPayment.internal_status);
    return 'pending';
  };
  
  const paymentStatus = getPaymentStatus();

  // Documents status - neutral if none required, green if at least one uploaded, pending if required but missing
  const documentStatus = (documents && documents.length > 0) ? 'complete' : 'neutral';

  // Risk status based on risk assessment result
  const riskResultRaw = risk?.RiskAssessmentResult?.toString().toLowerCase() ?? "";
  const riskStatus = riskResultRaw
    ? ['low', 'low risk', 'pass', 'approved'].includes(riskResultRaw) ? 'complete' : 'review'
    : 'pending';

  // Matter status - check if matter exists
  const matterStatus = (instruction?.MatterId || (instruction as any)?.matters?.length > 0) ? 'complete' : 'pending';

  // CCL status - assume pending unless explicitly complete
  const cclStatus = instruction?.CCLSubmitted ? 'complete' : 'pending';

  // New pre-ID step: Instruction/Pitch capture (integrated from pitches). Complete if a deal/service exists.
  const hasDeal = !!(deal && (deal.ServiceDescription || typeof deal.Amount === 'number'));
  const instructionCaptureStatus = hasDeal ? 'complete' : 'pending';

  // Pitch date formatting (used for timeline status & detail)
  let pitchWhen: string | null = null;

  // Always try to calculate pitch date if we have submission data
  if (instruction?.SubmissionDate) {
    try {
      const pitchDate = instruction.SubmissionDate;
      const pitchTime = instruction.SubmissionTime;
      
      let d: Date;
      if (pitchTime) {
        // SQL TIME fields come as full datetime starting from 1970-01-01
        // Extract just the time portion and combine with the submission date
        const timeOnly = new Date(pitchTime);
        const hours = timeOnly.getUTCHours();
        const minutes = timeOnly.getUTCMinutes();
        const seconds = timeOnly.getUTCSeconds();
        
        d = new Date(pitchDate);
        d.setHours(hours, minutes, seconds);
      } else {
        d = new Date(pitchDate);
      }
      
      if (!isNaN(d.getTime())) {
        const now = new Date();
        const sameDay = d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
        pitchWhen = sameDay ? format(d,'HH:mm') : format(d,'d MMM');
      }
    } catch {/* ignore */}
  }

  const isCompleted = cclStatus === 'complete';

  // Get area color (same logic as enquiry cards)
  const getAreaColor = (area: string): string => {
    switch (area?.toLowerCase()) {
      case 'commercial':
        return colours.blue;
      case 'construction':
        return colours.orange;
      case 'property':
        return colours.green;
      case 'employment':
        return colours.yellow;
      default:
        return colours.cta;
    }
  };

  // Get area of work from deals (linked by InstructionRef)
  const areaOfWork = 
    // Try direct instruction field first
    instruction?.AreaOfWork || instruction?.Area_of_Work || instruction?.areaOfWork || 
    instruction?.area_of_work || instruction?.ServiceType || instruction?.serviceType || 
    instruction?.Type || instruction?.type ||
    // Try deal prop
    deal?.AreaOfWork ||
    // Try deals array (get first deal's area)
    (deals && deals.length > 0 ? deals[0].AreaOfWork : '') ||
    // Fallback to empty string
    '';
  
  // Determine if this is a pitched deal (no instruction yet)
  const isPitchedDeal = !instruction && deal;
  
  const areaColor = getAreaColor(areaOfWork);

  // Determine next action step
  // For pitched deals, use different logic
  if (isPitchedDeal) {
    // Pitched deals get pitch-specific actions
  } else {
    // Normal instruction workflow
  }
  
  // Initialised status - if instruction exists but no other progress
  const isInitialised = instruction?.InstructionRef && !hasDeal && !proofOfIdComplete && 
                       (!instruction?.payments || instruction?.payments.length === 0) &&
                       (!documents || documents.length === 0);

  // Determine the pitch stage - one bubble that changes
  const getPitchStage = () => {
    // Instructed = proof-of-id-complete is true (instructions received)
    if (proofOfIdComplete) {
      return { key: 'instructed', label: 'Instructed', icon: <FaInfoCircle />, colour: colours.green };
    }
    // Initialised = instruction exists with stage "initialised" (client opened checkout)
    else if (instruction?.InstructionRef && (instruction?.Stage === 'initialised' || instruction?.stage === 'initialised')) {
      return { key: 'initialised', label: 'Initialised', icon: <FaPlayCircle />, colour: colours.blue };
    }
    // Pitched = deal exists (pitch sent)
    else if (hasDeal) {
      return { key: 'pitched', label: 'Pitched', icon: <FaEnvelope />, colour: colours.greyText };
    }
    // Default state
    else {
      return { key: 'pitched', label: 'Pitched', icon: <FaEnvelope />, colour: colours.greyText };
    }
  };

  const pitchStage = getPitchStage();

  const nextActionStep = isPitchedDeal 
    ? null // Pitched deals don't have an auto-active next action
    : isInitialised ? 'initialised' :
    instructionCaptureStatus !== 'complete' ? 'instruction' :
    paymentStatus !== 'complete' ? 'payment' :
    documentStatus !== 'complete' ? 'documents' :
    verifyIdStatus !== 'complete' ? 'id' :
    riskStatus !== 'complete' ? 'risk' :
    matterStatus !== 'complete' ? 'matter' :
    cclStatus !== 'complete' ? 'ccl' : null;

  // Get next action label and icon
  const getNextActionDetails = (step: string) => {
    const actionMap = {
      'follow-up': { label: 'Follow Up', icon: <FaPhone /> },
      'send-reminder': { label: 'Send Reminder', icon: <FaEnvelope /> },
      'schedule-call': { label: 'Schedule Call', icon: <FaCalendarAlt /> },
      'initialised': { label: 'Awaiting Instructions', icon: <FaInfoCircle /> },
      'instruction': { label: 'Complete Instructions', icon: <FaFileAlt /> },
      'id': { label: 'Verify Identity', icon: <FaIdCard /> },
      'payment': { label: 'Process Payment', icon: <FaPoundSign /> },
      'documents': { label: 'Upload Documents', icon: <FaFileUpload /> },
      'risk': { label: 'Risk Assessment', icon: <FaShieldAlt /> },
      'matter': { label: 'Create Matter', icon: <FaFolder /> },
      'ccl': { label: 'Complete CCL', icon: <FaClipboardCheck /> }
    };
    return actionMap[step as keyof typeof actionMap] || null;
  };

  const nextActionDetails = nextActionStep ? getNextActionDetails(nextActionStep) : null;

  // Do not auto-open details; only highlight nextActionStep via pulse.

  // Adopt enquiry card design language
  const svgMark = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 57.56 100" preserveAspectRatio="xMidYMid meet"><g fill="currentColor" opacity="0.22"><path d="M57.56,13.1c0,7.27-7.6,10.19-11.59,11.64-4,1.46-29.98,11.15-34.78,13.1C6.4,39.77,0,41.23,0,48.5v-13.1C0,28.13,6.4,26.68,11.19,24.74c4.8-1.94,30.78-11.64,34.78-13.1,4-1.45,11.59-4.37,11.59-11.64v13.09h0Z"/><path d="M57.56,38.84c0,7.27-7.6,10.19-11.59,11.64s-29.98,11.16-34.78,13.1c-4.8,1.94-11.19,3.4-11.19,10.67v-13.1c0-7.27,6.4-8.73,11.19-10.67,4.8-1.94,30.78-11.64,34.78-13.1,4-1.46,11.59-4.37,11.59-11.64v13.09h0Z"/><path d="M57.56,64.59c0,7.27-7.6,10.19-11.59,11.64-4,1.46-29.98,11.15-34.78,13.1-4.8,1.94-11.19,3.39-11.19,10.67v-13.1c0-7.27,6.4-8.73,11.19-10.67,4.8-1.94,30.78-11.64,34.78-13.1,4-1.45,11.59-4.37,11.59-11.64v13.1h0Z"/></g></svg>');
  // Visual styling - slightly different for pitched deals
  const bgColorToken = isPitchedDeal 
    ? (isDarkMode ? '#1a1f29' : '#fafbfc') // Slightly more muted background for pitched deals
    : (isDarkMode ? '#1f2732' : '#ffffff');
    
  const markColor = isPitchedDeal
    ? (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(6,23,51,0.06)') // More subtle mark for pitched deals
    : (isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(6,23,51,0.11)');
  
  const cardClass = mergeStyles({
    position: 'relative',
    borderRadius: 5,
    padding: (nextActionDetails || isPitchedDeal) ? '10px 18px' : '10px 18px',
    background: `${bgColorToken}`,
    // Subtle visual differences for pitched deals
    opacity: isPitchedDeal ? 0.92 : 1,
    // Responsive padding
    '@media (max-width: 768px)': {
      padding: (nextActionDetails || isPitchedDeal) ? '8px 14px' : '8px 14px',
    },
    '@media (max-width: 480px)': {
      padding: (nextActionDetails || isPitchedDeal) ? '6px 12px' : '6px 12px',
      borderRadius: 4,
    },
    '::after': {
      content: '""',
      position: 'absolute',
      top: 10,
      bottom: 10,
      right: 12,
      width: 160,
      background: markColor,
      maskImage: `url("data:image/svg+xml,${svgMark}")`,
      WebkitMaskImage: `url("data:image/svg+xml,${svgMark}")`,
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      opacity: 1,
      mixBlendMode: isDarkMode ? 'screen' : 'multiply',
      pointerEvents: 'none',
      transition: 'opacity .3s',
      filter: 'blur(.15px)',
      // Responsive watermark
      '@media (max-width: 768px)': {
        width: 120,
        right: 8,
      },
      '@media (max-width: 480px)': {
        width: 100,
        right: 6,
        top: 6,
        bottom: 6,
      },
      zIndex: 0,
    },
    border: `1px solid ${selected || clickedForActions ? colours.blue : 
      isPitchedDeal ? (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') :
      (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
    boxShadow: isDarkMode
      ? '0 4px 16px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04)'
      : '0 4px 14px rgba(33,56,82,0.10)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontFamily: 'Raleway, sans-serif',
    cursor: (nextActionDetails || isPitchedDeal) ? 'pointer' : 'pointer',
    transition: 'border-color .2s, transform .15s, box-shadow .3s',
    marginBottom: 4,
    overflow: 'hidden',
    borderLeftWidth: 2,
    borderLeftStyle: 'solid',
    borderLeftColor: areaColor,
    selectors: {
      ':hover': {
        transform: nextActionDetails ? 'translateY(-3px)' : 'translateY(-2px)', 
        borderColor: selected ? colours.blue : colours.highlight,
        boxShadow: nextActionDetails 
          ? (isDarkMode
              ? '0 8px 25px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(54, 144, 206, 0.2)'
              : '0 8px 25px rgba(54, 144, 206, 0.15)')
          : (isDarkMode
              ? '0 4px 16px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04)'
              : '0 4px 14px rgba(33,56,82,0.10)')
      },
      ':active': {
        transform: nextActionDetails ? 'translateY(-1px)' : 'translateY(-1px)'
      },
    },
  });

  const style_: React.CSSProperties = {
    '--animation-delay': `${animationDelay}s`,
  } as React.CSSProperties;

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Toggle clicked state for actions visibility in pitches
    if (isPitchedDeal) {
      setClickedForActions(!clickedForActions);
      setShowDetails(!clickedForActions);
    }
    
    if (onSelect) {
      onSelect();
    } else if (onToggle) {
      onToggle();
    }
  };

  return (
    <div className={cardClass} style={style_} onClick={handleCardClick} ref={innerRef}
      onMouseEnter={() => { setIsHovered(true); setShowDetails(true); }} 
      onMouseLeave={() => { setIsHovered(false); if (!selected && !clickedForActions) setShowDetails(false); }}>
      {/* Left accent bar */}
      <span style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: areaColor, opacity: .95, pointerEvents: 'none' }} />
      
      {/* Name + ID inline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, paddingLeft: 0 }}>
        <span style={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#0d2538', lineHeight: 1.2, fontSize: '15px' }}>
          {(() => {
            // First try to get client name from enquiries data lookup
            if (getClientNameByProspectId && prospectId) {
              const clientName = getClientNameByProspectId(prospectId);
              if (clientName.firstName || clientName.lastName) {
                return `${clientName.firstName} ${clientName.lastName}`.trim();
              }
            }

            // For pitched deals (no instruction), try names from deal object (ACID lookup)
            if (isPitchedDeal && deal) {
              const dealFirstName = deal.firstName || '';
              const dealLastName = deal.lastName || '';
              if (dealFirstName || dealLastName) {
                return `${dealFirstName} ${dealLastName}`.trim();
              }
            }

            // For clients with instructions, use instruction data based on client type
            if (instruction) {
              const firstName = instruction?.Forename || instruction?.FirstName || instruction?.forename || instruction?.firstName || '';
              const lastName = instruction?.Surname || instruction?.LastName || instruction?.surname || instruction?.lastName || '';
              const fullName = instruction?.FullName || instruction?.fullName || instruction?.Name || instruction?.name || '';
              const company = instruction?.Company || instruction?.CompanyName || instruction?.company || instruction?.companyName || '';
              
              // For companies, show company name
              if (instruction.ClientType === 'Company' && company) {
                return company;
              }
              
              // For individuals, show personal names
              if (fullName) return fullName;
              if (firstName && lastName) return `${firstName} ${lastName}`;
              if (firstName) return firstName;
              if (lastName) return lastName;
              if (company) return company; // Fallback to company name even for individuals
            }
            
            // Fallback to prospect ID only if no name found
            return `Client ${prospectId}`;
          })()}
        </span>
        <span style={{ fontSize: 11, color: isDarkMode ? 'rgba(255,255,255,0.45)' : '#b0b8c9', fontWeight: 500, letterSpacing: 0.5, userSelect: 'all', fontFamily: 'Consolas, Monaco, monospace', padding: '1px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
          {deal ? (
            prospectId ? `Deal: ${deal.DealId} | Prospect: ${prospectId}` : `Deal: ${deal.DealId}`
          ) : (
            `ID ${instruction?.InstructionRef || instruction?.instructionRef || instruction?.ref || instruction?.Ref || 'No Reference'}`
          )}
          {areaOfWork && (
            <>
              <span style={{ 
                width: 2, 
                height: 2, 
                borderRadius: '50%', 
                background: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
              }} />
              <span style={{ 
                color: areaColor, 
                fontWeight: 600, 
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {areaOfWork}
              </span>
            </>
          )}
        </span>
      </div>

      {/* Company & Contact details */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 12, 
        fontSize: 11, 
        color: isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)', 
        fontWeight: 500, 
        marginTop: 6, 
        marginLeft: 2,
        opacity: (showDetails || selected || clickedForActions || !isPitchedDeal) ? 1 : 0.7,
        transition: 'opacity .3s ease'
      }}>
        {(() => {
          const company = instruction?.Company || instruction?.CompanyName || instruction?.company || instruction?.companyName;
          const firstName = instruction?.Forename || instruction?.FirstName || deal?.firstName || '';
          const lastName = instruction?.Surname || instruction?.LastName || deal?.lastName || '';
          const hasPerson = firstName || lastName || instruction?.FullName || instruction?.fullName;
          if (company && hasPerson) {
            return <CopyableText value={company} label="Company" />;
          }
          return null;
        })()}
        {(() => {
          const email = instruction?.Email || instruction?.email;
          return email ? (
            <CopyableText value={email} label="Email" />
          ) : null;
        })()}
        {(() => {
          const phone = instruction?.Phone || instruction?.phone;
          return phone ? (
            <CopyableText value={phone} label="Phone" />
          ) : null;
        })()}
      </div>

      {/* Deal Information Box - Service Description and Amount */}
      {hasDeal && (
        <div style={{
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
          borderRadius: '3px',
          padding: window.innerWidth <= 480 ? '6px 10px' : '8px 14px',
          marginTop: window.innerWidth <= 480 ? '4px' : '6px',
          marginBottom: window.innerWidth <= 480 ? '1px' : '2px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: window.innerWidth <= 480 ? 'wrap' : 'nowrap'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              color: isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
              lineHeight: 1.2,
              flex: 1,
              minWidth: window.innerWidth <= 480 ? '100%' : 'auto',
              marginBottom: window.innerWidth <= 480 ? '4px' : '0'
            }}>
              {deal?.ServiceDescription || 'Legal Service'}
            </div>
            {typeof deal?.Amount === 'number' && (
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                fontFamily: 'Raleway, sans-serif',
                textAlign: 'right',
                whiteSpace: 'nowrap'
              }}>
                £{deal.Amount.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline bubbles (cascade) */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        marginTop: 6, 
        transition: 'max-height 0.35s cubic-bezier(.4,0,.2,1), padding 0.35s cubic-bezier(.4,0,.2,1)', 
        maxHeight: (showDetails || selected || !isPitchedDeal) ? 120 : 0, 
        paddingTop: (showDetails || selected || !isPitchedDeal) ? 4 : 0, 
        paddingBottom: (showDetails || selected || !isPitchedDeal) ? 8 : 0, 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8 
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            {(isPitchedDeal ? 
              // Pitch-specific workflow
              [
                { key: 'pitched', label: 'Pitched', icon: <FaEnvelope />, colour: colours.green },
                { key: 'follow-up', label: 'Follow Up', icon: <FaPhone />, colour: colours.greyText, disabled: true } // Mark as disabled
              ] : 
              // Standard instruction workflow
              [
                pitchStage,
                { key:'payment', label: paymentStatus === 'complete' ? 'Paid' : 'Pay', icon:<FaPoundSign />, colour: paymentStatus === 'complete' ? colours.green : (nextActionStep === 'payment' ? colours.blue : colours.greyText) },
                { key:'documents', label:'Docs', icon:<FaFileAlt />, colour: documentStatus === 'complete' ? colours.green : documentStatus === 'neutral' ? colours.greyText : (nextActionStep === 'documents' ? colours.blue : colours.greyText) },
                { key:'id', label: idVerificationLoading ? 'Verifying...' : 'ID', icon: idVerificationLoading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaIdCard />, colour: idVerificationLoading ? colours.orange : (verifyIdStatus === 'complete' ? colours.green : verifyIdStatus === 'review' ? colours.red : (nextActionStep === 'id' ? colours.blue : colours.greyText)) },
                { key:'risk', label:'Risk', icon:<FaShieldAlt />, colour: riskStatus === 'complete' ? colours.green : (nextActionStep === 'risk' ? colours.blue : (riskStatus === 'review' ? colours.red : colours.greyText)) },
                { key:'matter', label:'Matter', icon:<FaFolder />, colour: matterStatus === 'complete' ? colours.green : (nextActionStep === 'matter' ? colours.blue : colours.greyText) },
                // CCL - only show in development environment
                ...(process.env.NODE_ENV === 'development' ? [
                  { 
                    key:'ccl', 
                    label: (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        CCL
                        <span style={{
                          fontSize: '8px',
                          fontWeight: 700,
                          backgroundColor: colours.orange,
                          color: 'white',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          letterSpacing: '0.3px'
                        }}>
                          DEV
                        </span>
                      </span>
                    ), 
                    icon:<FaClipboardCheck />, 
                    colour: cclStatus === 'complete' ? colours.green : (nextActionStep === 'ccl' ? colours.blue : colours.greyText) 
                  }
                ] : [])
              ]
            ).map((step, idx) => {
              const isComplete = step.colour === colours.green;
              const isDisabled = (step as any).disabled; // Check if step is disabled
              const delay = (showDetails || selected || !isPitchedDeal) ? idx * 70 : (7 - 1 - idx) * 65;
              return (
                <button
                  key={step.key}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    // For pitched deals, make actions clickable; for instruction cards, only nextActionStep is clickable
                    // Exception: ID verification is always clickable to view details
                    // Don't allow clicks on disabled steps
                    if(!isDisabled && (isPitchedDeal || step.key === nextActionStep || step.key === 'id')) {
                      if (step.key === 'id' && onEIDClick) {
                        onEIDClick();
                      } else {
                        setActiveStep(prev => prev === step.key ? '' : step.key); 
                      }
                    }
                  }}
                  className={mergeStyles({
                    background: step.key === nextActionStep ? step.colour : 'transparent',
                    color: step.key === nextActionStep ? '#fff' : step.colour,
                    border: `1.5px solid ${step.colour}`,
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: (!isDisabled && (isPitchedDeal || step.key === nextActionStep || step.key === 'id')) ? 'pointer' : 'default',
                    opacity: isDisabled ? 0.3 : ((showDetails || selected || clickedForActions || !isPitchedDeal) ? 1 : 0), // Grey out disabled steps
                    transform: (showDetails || selected || clickedForActions || !isPitchedDeal) ? 'translateY(0) scale(1)' : 'translateY(6px) scale(.96)',
                    transition: 'opacity .4s cubic-bezier(.4,0,.2,1), transform .4s cubic-bezier(.4,0,.2,1), background .25s, color .25s, border .25s',
                    transitionDelay: `${delay}ms`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    selectors: {
                      ':hover': (!isDisabled && (isPitchedDeal || step.key === nextActionStep || step.key === 'id')) ? { 
                      background: colours.blue, 
                      borderColor: colours.blue 
                    } : {},
                    ':active': (!isDisabled && (isPitchedDeal || step.key === nextActionStep || step.key === 'id')) ? { 
                      background: colours.blue, 
                      transform: 'scale(0.95)' 
                    } : {},
                  },
                })}
              >
                <span style={{ fontSize: 12 }}>{step.icon}</span>
                {step.label}
                {isComplete && <span style={{ fontSize: 10, marginLeft: 2 }}>✓</span>}
              </button>
            );
          })}
          </div>
          
          {/* Next Action Arrow - aligned on same row as timeline bubbles */}
          {(nextActionDetails || isPitchedDeal) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              opacity: isPitchedDeal ? 0.4 : (isHovered ? 1 : 0.6), // Grey out pitched deals
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: isPitchedDeal ? 'not-allowed' : ((nextActionDetails || isPitchedDeal) ? 'pointer' : 'default'), // Disable cursor for pitched deals
              flexShrink: 0,
              pointerEvents: isPitchedDeal ? 'none' : 'auto' // Disable click for pitched deals
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isPitchedDeal) {
                // Disabled - no action for follow up yet
                console.log('Follow Up action disabled - coming soon');
                return;
              } else if (nextActionDetails && onClick) {
                onClick();
              }
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 2
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: colours.blue,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1
                  }}>
                    Next Action
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                    lineHeight: 1,
                    textAlign: 'right'
                  }}>
                    {isPitchedDeal ? 'Follow Up' : nextActionDetails?.label}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: isPitchedDeal ? '#999' : colours.blue, // Grey background for pitched deals
                  color: isPitchedDeal ? '#666' : 'white', // Muted text color for pitched deals
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: isPitchedDeal ? 'none' : '0 2px 6px rgba(52, 152, 219, 0.3)', // Remove shadow for pitched deals
                  transition: 'all 0.2s ease',
                  opacity: isPitchedDeal ? 0.5 : 1 // Additional opacity reduction for pitched deals
                }}>
                  →
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact banner removed per request; details now inline in header */}
    </div>
  );
};

export default InstructionCard;
