import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { mergeStyles } from '@fluentui/react';
import { TextField, DefaultButton, PrimaryButton } from '@fluentui/react';
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
  FaSpinner,
  FaCheckCircle,
  FaEdit
} from 'react-icons/fa';

// Move interface to separate file
/**
 * Compact instruction card with clear information hierarchy for legibility.
 * TODO(ac): Narrow any-based shapes to precise interfaces where feasible.
 */
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
  onDealEdit?: (dealId: number, updates: { ServiceDescription?: string; Amount?: number }) => Promise<void>;
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
  /** Invoked to start the Risk Assessment flow when none exists yet */
  onRiskClick?: () => void;
  onOpenMatter?: (instruction: any) => void;
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
  onRiskClick,
  onOpenMatter,
  idVerificationLoading = false,
  animationDelay = 0,
  getClientNameByProspectId,
  onDealEdit
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [clickedForActions, setClickedForActions] = useState(false);
  const [isEditingDeal, setIsEditingDeal] = useState(false);
  const [editDealData, setEditDealData] = useState({
    ServiceDescription: '',
    Amount: ''
  });
  const [isSavingDeal, setIsSavingDeal] = useState(false);
  const [activeStep, setActiveStep] = useState<string>('');
  const [showRiskDetails, setShowRiskDetails] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [showMatterDetails, setShowMatterDetails] = useState(false);
  const { isDarkMode } = useTheme();

  // Deal edit handlers
  const handleEditDealClick = () => {
    setIsEditingDeal(true);
    setEditDealData({
      ServiceDescription: deal?.ServiceDescription || '',
      Amount: deal?.Amount?.toString() || ''
    });
  };

  const handleCancelEditDeal = () => {
    setIsEditingDeal(false);
    setEditDealData({
      ServiceDescription: '',
      Amount: ''
    });
  };

  const handleSaveDeal = async () => {
    if (!deal?.DealId || !onDealEdit) return;

    setIsSavingDeal(true);
    try {
      const updates: { ServiceDescription?: string; Amount?: number } = {};
      
      if (editDealData.ServiceDescription !== (deal?.ServiceDescription || '')) {
        updates.ServiceDescription = editDealData.ServiceDescription;
      }
      
      const newAmount = parseFloat(editDealData.Amount);
      if (!isNaN(newAmount) && newAmount !== (deal?.Amount || 0)) {
        updates.Amount = newAmount;
      }

      if (Object.keys(updates).length > 0) {
        await onDealEdit(deal.DealId, updates);
      }
      
      setIsEditingDeal(false);
    } catch (error) {
      console.error('Failed to save deal:', error);
      // Could add error state here if needed
    } finally {
      setIsSavingDeal(false);
    }
  };
  // Inject keyframes once for micro animations
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
    } else if (eidResult === 'failed' || eidResult === 'rejected' || eidResult === 'fail') {
      verifyIdStatus = 'review'; // Failed results should be treated as review needed
    } else if (poidPassed || eidResult === 'passed') {
      verifyIdStatus = 'complete';  
    } else {
      // Stage complete but no clear result - assume review needed
      verifyIdStatus = 'review';
    }
  } else if ((!eid && !eids?.length) || eidStatus === 'pending') {
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
    
    // Use instruction.payments if available, fallback to payments prop
    const paymentData = instruction?.payments || payments;
    
    if (!paymentData || paymentData.length === 0) {
      return 'pending';
    }
    
    // Get the most recent payment
    const latestPayment = paymentData[0]; // Already sorted by created_at DESC in API
    
    // A payment is complete if both payment_status is 'succeeded' AND internal_status is 'completed' or 'paid'
    if (latestPayment.payment_status === 'succeeded' && 
        (latestPayment.internal_status === 'completed' || latestPayment.internal_status === 'paid')) {
      return 'complete';
    }
    // Explicitly surface processing status when gateway reports it
    if (latestPayment.payment_status === 'processing') {
      return 'processing';
    }

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
  // A pill is considered to have an assessment only if key fields exist
  const hasRiskAssessment = Boolean(
    risk && (risk.RiskAssessmentResult || risk.RiskScore || risk.ComplianceDate || risk.RiskAssessor)
  );

  // Matter status - check if matter exists
  const matterStatus = (instruction?.MatterId || (instruction as any)?.matters?.length > 0) ? 'complete' : 'pending';

  // CCL status - assume pending unless explicitly complete
  const cclStatus = instruction?.CCLSubmitted ? 'complete' : 'pending';

  // New pre-ID step: Instruction/Pitch capture (integrated from pitches). Complete if a deal/service exists.
  const hasDeal = !!(deal);
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
      const label = pitchWhen ? `Pitched ${pitchWhen}` : 'Pitched';
      return { key: 'pitched', label, icon: <FaEnvelope />, colour: colours.greyText };
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
    matterStatus !== 'complete' ? 'matter' : // Moved matter before risk
    riskStatus !== 'complete' ? 'risk' :
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

  // Visual styling – simplified, gradient background for legibility
  const bgGradientLight = 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)';
  const bgGradientDark = 'linear-gradient(135deg, #151a22 0%, #11161d 100%)';
  const cardClass = mergeStyles({
    position: 'relative',
    borderRadius: 5,
    padding: '10px 16px',
    background: isDarkMode ? bgGradientDark : bgGradientLight,
    opacity: 1,
    // Responsive padding
    '@media (max-width: 768px)': {
      padding: '8px 12px',
    },
    '@media (max-width: 480px)': {
      padding: '6px 10px',
      borderRadius: 4,
    },
    border: `1px solid ${selected || clickedForActions ? colours.blue : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
    boxShadow: isDarkMode
      ? '0 4px 6px rgba(0, 0, 0, 0.3)'
      : '0 4px 6px rgba(0, 0, 0, 0.07)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontFamily: 'Raleway, sans-serif',
    cursor: 'pointer',
    transition: 'border-color .2s, transform .15s, box-shadow .3s',
    marginBottom: 4,
    overflow: 'hidden',
    borderLeftWidth: 2,
    borderLeftStyle: 'solid',
    borderLeftColor: areaColor,
    selectors: {
      ':hover': {
        transform: 'translateY(-1px)', 
        borderColor: selected ? colours.blue : colours.highlight,
        boxShadow: isDarkMode ? '0 6px 10px rgba(0,0,0,0.45)' : '0 8px 16px rgba(33,56,82,0.12)'
      },
      ':active': { transform: 'translateY(0)' },
      ':focus-within': { outline: '2px solid ' + colours.blue, outlineOffset: '2px' },
    },
  });

  const style_: React.CSSProperties = {
    '--animation-delay': `${animationDelay}s`,
  } as React.CSSProperties;

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If this is the next action step for matter and we have a handler, call it
    if (nextActionStep === 'matter' && onOpenMatter && instruction) {
      onOpenMatter(instruction);
      return;
    }
    
    // If there's a general onClick handler and it's not a pitched deal, call it
    if (onClick && !isPitchedDeal) {
      onClick();
      return;
    }
    
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

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick((e as unknown) as React.MouseEvent);
    }
  };

  return (
    <div
      className={cardClass}
      style={style_}
      onClick={handleCardClick}
      onKeyDown={handleKey}
      role="button"
      tabIndex={0}
      ref={innerRef}
      onMouseEnter={() => { setIsHovered(true); setShowDetails(true); }}
      onMouseLeave={() => { setIsHovered(false); if (!selected && !clickedForActions) setShowDetails(false); }}
    >
      {/* Left accent bar */}
      <span style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: areaColor, opacity: .95, pointerEvents: 'none' }} />
      
      {/* Header: Primary identifier + area chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, paddingLeft: 0, justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#0d2538', lineHeight: 1.2, fontSize: '15px' }}>
          {(() => {
            // First try to get client name from enquiries data lookup
            if (getClientNameByProspectId && prospectId) {
              const clientName = getClientNameByProspectId(prospectId);
              if (clientName.firstName?.trim() || clientName.lastName?.trim()) {
                return `${clientName.firstName || ''} ${clientName.lastName || ''}`.trim();
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
        {areaOfWork && (
          <span
            style={{
              marginLeft: 'auto',
              padding: '4px 8px',
              borderRadius: 12,
              fontSize: 10,
              fontWeight: 700,
              color: areaColor,
              border: `1px solid ${areaColor}`,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              whiteSpace: 'nowrap'
            }}
          >
            {areaOfWork}
          </span>
        )}
        
      </div>

      {/* Meta: contact (chips) */}
      <div style={{ 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center',
          opacity: 0.85,
          transition: 'opacity 0.2s ease',
          marginTop: 4,
          flexWrap: 'wrap'
        }}>
          {(() => {
            const email = instruction?.Email || instruction?.email || (deal as any)?.LeadClientEmail || (instruction as any)?.LeadClientEmail;
            const phone = instruction?.Phone || instruction?.phone || (deal as any)?.Phone || (instruction as any)?.PhoneNumber || (instruction as any)?.ContactNumber;
            
            return (
              <>
                {email && (
                  <div
                    style={{
                      color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(email);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colours.blue;
                      e.currentTarget.style.color = colours.blue;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
                      e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
                    }}
                    title={`Click to copy: ${email}`}
                  >
                    <FaEnvelope style={{ fontSize: '10px' }} />
                    <span style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '10px' }}>
                      {email.length > 20 ? `${email.substring(0, 17)}...` : email}
                    </span>
                  </div>
                )}
                {phone && (
                  <div
                    style={{
                      color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(phone);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colours.blue;
                      e.currentTarget.style.color = colours.blue;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
                      e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
                    }}
                    title={`Click to copy: ${phone}`}
                  >
                    <FaPhone style={{ fontSize: '10px' }} />
                    <span style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '10px' }}>
                      {phone}
                    </span>
                  </div>
                )}
              </>
            );
          })()}
      </div>

      {/* Secondary meta: reference and prospect id */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: isDarkMode ? 'rgba(255,255,255,0.55)' : '#6b7a90', fontFamily: 'Consolas, Monaco, monospace' }}>
          ID {instruction?.InstructionRef || instruction?.instructionRef || instruction?.ref || instruction?.Ref || '—'}
        </span>
        {prospectId && (
          <span
            title={`Click to copy prospect ID: ${prospectId}`}
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(String(prospectId)); }}
            style={{
              cursor: 'pointer',
              fontSize: 11,
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              padding: '2px 6px',
              borderRadius: 10,
              border: `1px dashed ${isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'}`
            }}
          >
            Prospect {prospectId}
          </span>
        )}
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
      </div>

      {/* Deal summary: service + amount (clamped) */}
      {hasDeal && (
        <div style={{
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          borderRadius: 6,
          padding: '8px 12px',
          marginTop: 6,
          marginBottom: 2
        }}>
          {isEditingDeal ? (
            /* Edit mode */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <TextField
                value={editDealData.ServiceDescription}
                onChange={(_, newValue) => setEditDealData(prev => ({ ...prev, ServiceDescription: newValue || '' }))}
                onClick={(e) => e.stopPropagation()}
                placeholder="Service description"
                multiline
                rows={2}
                disabled={isSavingDeal}
                styles={{
                  fieldGroup: {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: 4,
                  },
                  field: {
                    color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                    fontSize: 11,
                    padding: '6px 8px'
                  }
                }}
              />
              <TextField
                value={editDealData.Amount}
                onChange={(_, newValue) => setEditDealData(prev => ({ ...prev, Amount: newValue || '' }))}
                onClick={(e) => e.stopPropagation()}
                placeholder="Amount (numbers only)"
                type="number"
                disabled={isSavingDeal}
                styles={{
                  fieldGroup: {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: 4,
                  },
                  field: {
                    color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                    fontSize: 11,
                    padding: '6px 8px'
                  }
                }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <DefaultButton
                  text="Cancel"
                  onClick={(e) => { e.stopPropagation(); handleCancelEditDeal(); }}
                  disabled={isSavingDeal}
                  styles={{
                    root: {
                      height: 24,
                      fontSize: 10,
                      minWidth: 50,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
                    }
                  }}
                />
                <PrimaryButton
                  text={isSavingDeal ? 'Saving...' : 'Save'}
                  onClick={(e) => { e.stopPropagation(); handleSaveDeal(); }}
                  disabled={isSavingDeal}
                  styles={{
                    root: {
                      height: 24,
                      fontSize: 10,
                      minWidth: 50,
                      backgroundColor: colours.blue,
                      border: 'none'
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            /* Display mode */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
                lineHeight: 1.2,
                flex: 1,
                minWidth: '200px',
                marginBottom: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as any,
                overflow: 'hidden',
                fontStyle: !deal?.ServiceDescription ? 'italic' : 'normal',
                opacity: !deal?.ServiceDescription ? 0.7 : 1
              }}>
                {deal?.ServiceDescription || 'No service description'}
              </div>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                fontFamily: 'Raleway, sans-serif',
                textAlign: 'right',
                whiteSpace: 'nowrap',
                fontStyle: typeof deal?.Amount !== 'number' ? 'italic' : 'normal',
                opacity: typeof deal?.Amount !== 'number' ? 0.7 : 1
              }}>
                {typeof deal?.Amount === 'number' ? `£${deal.Amount.toLocaleString()}` : 'No amount set'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress rail: compact, minimal labels */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        marginTop: 6
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8 
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            {(isPitchedDeal ? 
              // Pitch-specific workflow
              [
                { key: 'pitched', label: 'Pitched', icon: <FaEnvelope />, colour: colours.green },
                { key: 'follow-up', label: 'Follow Up', icon: <FaPhone />, colour: colours.greyText, disabled: true } // Mark as disabled
              ] : 
              // Standard instruction workflow
              [
                pitchStage,
                { 
                  key:'payment', 
                  label: paymentStatus === 'complete' ? 
                    (payments && payments.length > 0 ? 
                      `Paid £${payments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(0)}` : 'Paid'
                    ) : 
                    (paymentStatus === 'processing' ? 'Processing' : 'Pay'), 
                  icon:<FaPoundSign />, 
                  colour: paymentStatus === 'complete' ? colours.green : (paymentStatus === 'processing' ? colours.yellow : (nextActionStep === 'payment' ? colours.blue : colours.greyText)) 
                },
                { 
                  key:'documents', 
                  label: documents && documents.length > 0 ? 
                    `Docs (${documents.length})` : 'Docs', 
                  icon:<FaFileAlt />, 
                  colour: documentStatus === 'complete' ? colours.green : documentStatus === 'neutral' ? colours.greyText : (nextActionStep === 'documents' ? colours.blue : colours.greyText) 
                },
                { 
                  key:'id', 
                  label: idVerificationLoading ? 'Verifying...' : 
                    (verifyIdStatus === 'complete' ? 
                      (eidResult ? `ID: ${eidResult}` : 'ID ✓') : 
                     verifyIdStatus === 'review' ? 'ID Review' : 'ID'), 
                  icon: idVerificationLoading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaIdCard />, 
                  colour: idVerificationLoading ? colours.orange : (verifyIdStatus === 'complete' ? colours.green : verifyIdStatus === 'review' ? colours.red : (nextActionStep === 'id' ? colours.blue : colours.greyText)) 
                },
                { 
                  key:'risk', 
                  label: riskStatus === 'complete' ? 
                    (risk?.RiskAssessmentResult ? 
                      `Risk: ${risk.RiskAssessmentResult}` : 'Risk ✓'
                    ) : 
                    (riskStatus === 'review' ? 'Risk Review' : 'Risk'), 
                  icon:<FaShieldAlt />, 
                  colour: riskStatus === 'complete' ? colours.green : (nextActionStep === 'risk' ? colours.blue : (riskStatus === 'review' ? colours.red : colours.greyText)) 
                },
                { 
                  key:'matter', 
                  label: matterStatus === 'complete' ? 'Matter ✓' : 
                    (instruction?.MatterId ? `Matter ${instruction.MatterId}` : 'Matter'), 
                  icon:<FaFolder />, 
                  colour: matterStatus === 'complete' ? colours.green : (nextActionStep === 'matter' ? colours.blue : colours.greyText) 
                },
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
              const delay = idx * 30;
              return (
                <button
                  key={step.key}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    // For pitched deals, make actions clickable; for instruction cards, only nextActionStep is clickable
                    // Exception: ID verification and Risk Assessment are always clickable to view details
                    // Don't allow clicks on disabled steps
                    if(!isDisabled && (isPitchedDeal || step.key === nextActionStep || step.key === 'id' || step.key === 'risk' || step.key === 'payment' || step.key === 'documents' || step.key === 'matter')) {
                      if (step.key === 'id' && onEIDClick) {
                        onEIDClick();
                      } else if (step.key === 'risk') {
                        if (hasRiskAssessment) {
                          setShowRiskDetails(prev => !prev);
                        } else if (onRiskClick) {
                          onRiskClick();
                        } else {
                          setShowRiskDetails(true);
                        }
                      } else if (step.key === 'payment') {
                        setShowPaymentDetails(prev => !prev);
                      } else if (step.key === 'documents') {
                        setShowDocumentDetails(prev => !prev);
                      } else if (step.key === 'matter') {
                        // If onOpenMatter handler is provided and we have an instruction, call it
                        if (onOpenMatter && instruction) {
                          onOpenMatter(instruction);
                        } else {
                          // Fallback to showing matter details
                          setShowMatterDetails(prev => !prev);
                        }
                      } else if (step.key === nextActionStep) {
                        // Generic next action (non-specific)
                        setActiveStep(prev => prev === step.key ? '' : step.key);
                      } else {
                        // Other pills - if it's for a pitched deal, make it clickable
                        if (isPitchedDeal) {
                          setActiveStep(prev => prev === step.key ? '' : step.key);
                        }
                      }
                    }
                  }}
                  className={mergeStyles({
                    background: step.key === nextActionStep ? step.colour : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                    color: step.key === nextActionStep ? '#fff' : step.colour,
                    border: `1px solid ${step.colour}`,
                    padding: '5px 10px',
                    borderRadius: 16,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: (!isDisabled && (isPitchedDeal || step.key === nextActionStep || step.key === 'id' || step.key === 'risk' || step.key === 'payment' || step.key === 'documents' || step.key === 'matter')) ? 'pointer' : 'default',
                    opacity: isDisabled ? 0.35 : 1,
                    transform: 'translateY(0) scale(1)',
                    transition: 'opacity .2s ease-out, transform .2s ease-out, background .2s, color .2s, border .2s',
                    transitionDelay: `${delay}ms`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    selectors: {
                      ':hover': (!isDisabled && (isPitchedDeal || step.key === nextActionStep || step.key === 'id' || step.key === 'risk' || step.key === 'payment' || step.key === 'documents' || step.key === 'matter')) ? {
                        background: colours.blue,
                        borderColor: colours.blue,
                        color: '#fff'
                      } : {},
                      ':active': (!isDisabled && (isPitchedDeal || step.key === nextActionStep || step.key === 'id' || step.key === 'risk' || step.key === 'payment' || step.key === 'documents' || step.key === 'matter')) ? {
                        background: colours.blue,
                        color: '#fff',
                        transform: 'scale(0.96)'
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
          
          {/* Edit Deal Button - Between Pills */}
          {onDealEdit && deal?.DealId && (
            <button
              onClick={(e) => { e.stopPropagation(); handleEditDealClick(); }}
              className={mergeStyles({
                background: 'transparent',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}`,
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                padding: '5px 10px',
                borderRadius: 16,
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: 1,
                transform: 'translateY(0) scale(1)',
                transition: 'background .2s, color .2s, border .2s',
                selectors: {
                  ':hover': {
                    background: colours.blue,
                    borderColor: colours.blue,
                    color: '#fff'
                  },
                  ':active': {
                    transform: 'scale(0.96)'
                  }
                }
              })}
            >
              <FaEdit style={{ fontSize: 10 }} />
              Edit
            </button>
          )}
          
          </div>
          
          {/* Next Action CTA */}
          {(nextActionDetails || isPitchedDeal) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              opacity: isPitchedDeal ? 0.4 : 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: isPitchedDeal ? 'not-allowed' : 'pointer',
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
                    fontSize: 10,
                    fontWeight: 600,
                    color: colours.blue,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1
                  }}>
                    Next Action
                  </span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
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
      
      {/* Risk Details Section - shown when risk pill is clicked */}
      {showRiskDetails && hasRiskAssessment && (
        <div style={{
          marginTop: '12px',
          padding: '16px',
          background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(54,144,206,0.05)',
          borderRadius: '8px',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(54,144,206,0.15)'}`,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(54,144,206,0.1)'}`
          }}>
            <FaShieldAlt style={{ color: colours.blue, fontSize: '16px' }} />
            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: isDarkMode ? '#fff' : colours.darkBlue
            }}>
              Risk Assessment Details
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {/* Risk Result */}
            {risk.RiskAssessmentResult && (
              <div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Risk Level
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: risk.RiskAssessmentResult?.toLowerCase().includes('low') ? colours.green : 
                         risk.RiskAssessmentResult?.toLowerCase().includes('medium') ? colours.yellow :
                         risk.RiskAssessmentResult?.toLowerCase().includes('high') ? colours.red : '#666'
                }}>
                  {risk.RiskAssessmentResult}
                </div>
              </div>
            )}

            {/* Risk Score */}
            {risk.RiskScore && (
              <div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Risk Score
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  {risk.RiskScore}/21
                </div>
              </div>
            )}

            {/* Assessor */}
            {risk.RiskAssessor && (
              <div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Assessed By
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  {risk.RiskAssessor}
                </div>
              </div>
            )}

            {/* Date */}
            {risk.ComplianceDate && (
              <div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Assessment Date
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  {new Date(risk.ComplianceDate).toLocaleDateString('en-GB')}
                </div>
              </div>
            )}
          </div>

          {/* Additional Risk Factors */}
          {(risk.ClientType || risk.ValueOfInstruction || risk.TransactionRiskLevel) && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>
                Risk Factors
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {risk.ClientType && (
                  <span style={{
                    padding: '4px 8px',
                    background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: isDarkMode ? '#fff' : colours.darkBlue
                  }}>
                    {risk.ClientType}
                  </span>
                )}
                {risk.ValueOfInstruction && (
                  <span style={{
                    padding: '4px 8px',
                    background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: isDarkMode ? '#fff' : colours.darkBlue
                  }}>
                    {risk.ValueOfInstruction}
                  </span>
                )}
                {risk.TransactionRiskLevel && (
                  <span style={{
                    padding: '4px 8px',
                    background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: isDarkMode ? '#fff' : colours.darkBlue
                  }}>
                    Transaction: {risk.TransactionRiskLevel}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Details Section - shown when payment pill is clicked */}
      {showPaymentDetails && payments && payments.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '16px',
          background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.05)',
          borderRadius: '8px',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(34,197,94,0.15)'}`,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(34,197,94,0.1)'}`
          }}>
            <FaCheckCircle style={{ color: colours.green, fontSize: '16px' }} />
            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: isDarkMode ? '#fff' : colours.darkBlue
            }}>
              Payment Details
            </span>
          </div>

          {payments.map((payment, idx) => (
            <div key={idx} style={{
              marginBottom: idx < payments.length - 1 ? '12px' : '0',
              paddingBottom: idx < payments.length - 1 ? '12px' : '0',
              borderBottom: idx < payments.length - 1 ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` : 'none'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {/* Amount */}
                {payment.amount && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                      Amount
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: isDarkMode ? '#fff' : colours.darkBlue }}>
                      £{payment.amount}
                    </div>
                  </div>
                )}

                {/* Status */}
                {payment.payment_status && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                      Payment Status
                    </div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: payment.payment_status === 'succeeded' ? colours.green : 
                             payment.payment_status === 'processing' ? colours.yellow :
                             payment.payment_status === 'pending' ? (isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)') :
                             colours.red
                    }}>
                      {payment.payment_status}
                    </div>
                  </div>
                )}

                {/* Internal Status */}
                {payment.internal_status && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                      Internal Status
                    </div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: ['completed', 'paid'].includes(payment.internal_status) ? colours.green : colours.yellow
                    }}>
                      {payment.internal_status}
                    </div>
                  </div>
                )}

                {/* Created Date */}
                {payment.created_at && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                      Created Date
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: isDarkMode ? '#fff' : colours.darkBlue }}>
                      {new Date(payment.created_at).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Details Section - shown when documents pill is clicked */}
      {showDocumentDetails && documents && documents.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '16px',
          background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.05)',
          borderRadius: '8px',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(34,197,94,0.15)'}`,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(34,197,94,0.1)'}`
          }}>
            <FaFileAlt style={{ color: colours.green, fontSize: '16px' }} />
            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: isDarkMode ? '#fff' : colours.darkBlue
            }}>
              Document Details ({documents.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {documents.map((doc, idx) => (
              <div 
                key={idx} 
                onClick={() => onDocumentClick && onDocumentClick(doc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  borderRadius: '6px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  cursor: onDocumentClick ? 'pointer' : 'default',
                  transition: 'all 0.2s ease'
                }}
                className={mergeStyles({
                  selectors: onDocumentClick ? {
                    ':hover': {
                      background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      transform: 'translateY(-1px)'
                    }
                  } : {}
                })}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaFileAlt style={{ color: colours.blue, fontSize: '14px' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: isDarkMode ? '#fff' : colours.darkBlue }}>
                      {doc.filename || doc.name || `Document ${idx + 1}`}
                    </div>
                    {doc.uploaded_at && (
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString('en-GB')}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    padding: '4px 8px',
                    background: colours.green,
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 600
                  }}>
                    Uploaded
                  </div>
                  {onDocumentClick && (
                    <FaDownload style={{ color: colours.blue, fontSize: '12px' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showRiskDetails && !hasRiskAssessment && (
        <div style={{
          marginTop: '12px',
          padding: '16px',
          background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(54,144,206,0.05)',
          borderRadius: '8px',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(54,144,206,0.15)'}`,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FaShieldAlt style={{ color: colours.blue, fontSize: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: isDarkMode ? '#fff' : colours.darkBlue }}>
              Risk Assessment
            </span>
          </div>
          <div style={{ fontSize: 12, color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
            No assessment found. {`Click the Risk pill to ${onRiskClick ? 'start the assessment' : 'add an assessment'}.`}
          </div>
        </div>
      )}

      {/* Matter Details Section - shown when matter pill is clicked */}
      {showMatterDetails && (instruction?.MatterId || (instruction as any)?.matters?.length > 0) && (
        <div style={{
          marginTop: '12px',
          padding: '16px',
          background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.05)',
          borderRadius: '8px',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(34,197,94,0.15)'}`,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(34,197,94,0.1)'}`
          }}>
            <FaFolder style={{ color: colours.green, fontSize: '16px' }} />
            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: isDarkMode ? '#fff' : colours.darkBlue
            }}>
              Matter Details
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {/* Matter ID */}
            {instruction?.MatterId && (
              <div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Matter ID
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  {instruction.MatterId}
                </div>
              </div>
            )}

            {/* Matter Count */}
            {(instruction as any)?.matters?.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Matters
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  {(instruction as any).matters.length} matter(s) created
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                Status
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: colours.green }}>
                Matter Created
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * InstructionCard
 * Presents instruction summary with compact, legible hierarchy and a progress rail.
 */
export default InstructionCard;
