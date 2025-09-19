import React, { useState, useEffect } from 'react';
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
  FaIdBadge,
  FaPlayCircle,
  FaSpinner,
  FaCheckCircle,
  FaEdit
} from 'react-icons/fa';

// Helper to capitalise first letter (placed after all imports to satisfy eslint import/first)
const capitaliseFirst = (val: string): string => {
  if (!val) return val;
  return val.charAt(0).toUpperCase() + val.slice(1);
};

// Format bytes helper
const formatBytes = (bytes?: number): string => {
  if (!bytes || isNaN(bytes)) return '-';
  const units = ['B','KB','MB','GB','TB'];
  let i = 0; let v = bytes;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i>0 ? 1 : 0)} ${units[i]}`;
};

// Choose icon colour by extension
const getFileColour = (ext: string, coloursRef: typeof colours): string => {
  switch(ext) {
    case 'pdf': return coloursRef.red || '#dc2626';
    case 'doc': case 'docx': return coloursRef.blue;
    case 'xls': case 'xlsx': return coloursRef.green;
    case 'ppt': case 'pptx': return coloursRef.orange || '#ea580c';
    case 'zip': case 'rar': case '7z': return coloursRef.greyText;
  case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': return coloursRef.blue;
    default: return coloursRef.blue;
  }
};

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
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);
  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [showInstructionDetails, setShowInstructionDetails] = useState(false);
  const [loadingInstructionDetails, setLoadingInstructionDetails] = useState(false);
  const [instructionData, setInstructionData] = useState<any>(null);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  // Selected document index for inline preview when documents pill expanded
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState<number>(0);
  const [showMatterDetails, setShowMatterDetails] = useState(false);
  const [matterData, setMatterData] = useState<any>(null);
  const [loadingMatterDetails, setLoadingMatterDetails] = useState(false);
  const [fetchedDocuments, setFetchedDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  // Use fetched documents if available, otherwise fall back to props
  const documentsToUse = fetchedDocuments.length > 0 ? fetchedDocuments : (documents || []);
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
  // Fetch matter details when showMatterDetails is opened
  useEffect(() => {
    if (showMatterDetails && (instruction?.InstructionRef || instruction?.instructionRef) && !matterData && !loadingMatterDetails) {
      setLoadingMatterDetails(true);
      const instructionRef = instruction.InstructionRef || instruction.instructionRef;
      fetch(`/api/matters/details/${instructionRef}`)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            console.error('Matter fetch error:', data.error);
            setMatterData(null);
          } else {
            setMatterData(data);
          }
        })
        .catch(error => {
          console.error('Error fetching matter details:', error);
          setMatterData(null);
        })
        .finally(() => {
          setLoadingMatterDetails(false);
        });
    }
  }, [showMatterDetails, instruction?.InstructionRef, instruction?.instructionRef, matterData, loadingMatterDetails]);

  // Fetch payment details when showPaymentDetails is opened
  useEffect(() => {
    if (showPaymentDetails && (instruction?.InstructionRef || instruction?.instructionRef) && !paymentData.length && !loadingPaymentDetails) {
      setLoadingPaymentDetails(true);
      const instructionRef = instruction.InstructionRef || instruction.instructionRef;
      fetch(`/api/payments/${instructionRef}`)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            console.error('Payment fetch error:', data.error);
            setPaymentData([]);
          } else {
            setPaymentData(data.payments || []);
          }
        })
        .catch(error => {
          console.error('Error fetching payment details:', error);
          setPaymentData([]);
        })
        .finally(() => {
          setLoadingPaymentDetails(false);
        });
    } else if (!showPaymentDetails && paymentData.length > 0) {
      // Reset payment data when details are closed
      setPaymentData([]);
    }
  }, [showPaymentDetails, instruction?.InstructionRef, instruction?.instructionRef]);

  // Fetch instruction details when showInstructionDetails is opened
  useEffect(() => {
    if (showInstructionDetails && (instruction?.InstructionRef || instruction?.instructionRef) && !instructionData && !loadingInstructionDetails) {
      setLoadingInstructionDetails(true);
      const instructionRef = instruction.InstructionRef || instruction.instructionRef;
      fetch(`/api/instruction-details/${instructionRef}`)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            console.error('Instruction fetch error:', data.error);
            setInstructionData([]);
          } else {
            setInstructionData(data.instructions || []);
          }
        })
        .catch(error => {
          console.error('Error fetching instruction details:', error);
          setInstructionData([]);
        })
        .finally(() => {
          setLoadingInstructionDetails(false);
        });
    } else if (!showInstructionDetails && instructionData) {
      // Reset instruction data when details are closed
      setInstructionData([]);
    }
  }, [showInstructionDetails, instruction?.InstructionRef, instruction?.instructionRef]);

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

  // Fetch documents from API
  useEffect(() => {
    if (instruction?.InstructionRef || instruction?.reference) {
      const instructionRef = instruction.InstructionRef || instruction.reference;
      setIsLoadingDocuments(true);
      
      fetch(`/api/documents/${instructionRef}`)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error(`HTTP ${response.status}`);
        })
        .then(data => {
          setFetchedDocuments(data || []);
        })
        .catch(error => {
          console.warn('Failed to fetch documents from API:', error);
          // Keep using props documents as fallback
        })
        .finally(() => {
          setIsLoadingDocuments(false);
        });
    }
  }, [instruction?.InstructionRef, instruction?.reference]);

  // Status logic - match the logic used in global actions
  // ID Verification status based on EID data
  const eidResult = (eid?.EIDOverallResult || eids?.[0]?.EIDOverallResult || instruction?.EIDOverallResult)?.toLowerCase() ?? "";
  const eidStatus = (eid?.EIDStatus || eids?.[0]?.EIDStatus)?.toLowerCase() ?? "";
  const poidPassed = eidResult === "passed" || eidResult === "approved" || eidResult === "verified" || eidResult === "pass";
  const proofOfIdComplete = Boolean(instruction?.PassportNumber || instruction?.DriversLicenseNumber);
  
  // Also check instruction stage for ID completion
  const stageComplete = instruction?.Stage === 'proof-of-id-complete' || instruction?.stage === 'proof-of-id-complete';
  const stageLower_ = ((instruction?.Stage || instruction?.stage || '') + '').trim().toLowerCase();
  const isInstructedOrLater = stageLower_ === 'proof-of-id-complete' || stageLower_ === 'completed';
  
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
  // Payment evidence exists only if there's at least one payment record with gateway success or internal completion on that record
  const paymentRecords = (instruction?.payments || payments || []) as any[];
  const hasPaymentEvidence = paymentRecords.some(p => 
    (p.payment_status && String(p.payment_status).toLowerCase() === 'succeeded') ||
    (p.internal_status && ['completed','paid'].includes(String(p.internal_status).toLowerCase()))
  );
  const fastTrackedPayment = isInstructedOrLater && !hasPaymentEvidence;
  const fastTrackedId = isInstructedOrLater && !poidPassed;

  // Documents status - neutral if none required, green if at least one uploaded, pending if required but missing
  const documentStatus = (documentsToUse && documentsToUse.length > 0) ? 'complete' : 'neutral';

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

  // Pitch date formatting (used for timeline status & detail) – use local time and fallback to deal when missing
  let pitchWhen: string | null = null;
  try {
    const combineLocal = (dateStr?: string, timeStr?: string): Date | null => {
      if (!dateStr && !timeStr) return null;
      if (dateStr) {
        const d = new Date(dateStr);
        if (timeStr) {
          const t = new Date(timeStr);
          // Use local hours/minutes to respect user's timezone
          const h = t.getHours();
          const m = t.getMinutes();
          const s = t.getSeconds();
          d.setHours(h, m, s, 0);
        }
        return isNaN(d.getTime()) ? null : d;
      }
      const onlyT = new Date(timeStr as string);
      return isNaN(onlyT.getTime()) ? null : onlyT;
    };

    let dt: Date | null = null;
    if (instruction?.SubmissionDate || instruction?.SubmissionTime) {
      dt = combineLocal(instruction?.SubmissionDate, instruction?.SubmissionTime);
    }
    if (!dt && (deal?.PitchedDate || deal?.PitchedTime)) {
      dt = combineLocal(deal?.PitchedDate, deal?.PitchedTime);
    }
    if (dt && !isNaN(dt.getTime())) {
      const now = new Date();
      const sameDay = dt.getFullYear()===now.getFullYear() && dt.getMonth()===now.getMonth() && dt.getDate()===now.getDate();
      pitchWhen = sameDay ? format(dt,'HH:mm') : format(dt,'d MMM');
    }
  } catch {/* ignore */}

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
    // Normalise stage for robust matching (instructions data only)
    const stageLower = (instruction?.Stage || instruction?.stage || '').toLowerCase();
    // Instructed strictly from instructions data: proof-of-id-complete
    if (instruction?.InstructionRef && stageLower === 'proof-of-id-complete') {
  return { key: 'instructed', label: 'Instructed', icon: <FaIdBadge />, colour: colours.green };
    }
    // Initialised strictly from instructions data
    if (instruction?.InstructionRef && stageLower === 'initialised') {
      return { key: 'initialised', label: 'Initialised', icon: <FaPlayCircle />, colour: colours.blue };
    }
    // Pitched = deal exists (pitch sent)
    if (hasDeal) {
      const label = pitchWhen ? `Pitched ${pitchWhen}` : 'Pitched';
      return { key: 'pitched', label, icon: <FaEnvelope />, colour: colours.greyText };
    }
    // Default state
    return { key: 'pitched', label: 'Pitched', icon: <FaEnvelope />, colour: colours.greyText };
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
            // Helpers to source person name from various places
            const getEnquiryPersonName = (): string | undefined => {
              if (getClientNameByProspectId && prospectId) {
                const clientName = getClientNameByProspectId(prospectId);
                if (clientName.firstName?.trim() || clientName.lastName?.trim()) {
                  return `${clientName.firstName || ''} ${clientName.lastName || ''}`.trim();
                }
              }
              return undefined;
            };

            const getDealPersonName = (): string | undefined => {
              if (isPitchedDeal && deal) {
                const dealFirstName = (deal as any).firstName || '';
                const dealLastName = (deal as any).lastName || '';
                if (dealFirstName || dealLastName) {
                  return `${dealFirstName} ${dealLastName}`.trim();
                }
              }
              return undefined;
            };

            // If we have an instruction, prefer its context to decide formatting
            if (instruction) {
              const firstName = instruction?.Forename || instruction?.FirstName || instruction?.forename || instruction?.firstName || '';
              const lastName = instruction?.Surname || instruction?.LastName || instruction?.surname || instruction?.lastName || '';
              const fullName = instruction?.FullName || instruction?.fullName || instruction?.Name || instruction?.name || '';
              const company = instruction?.Company || instruction?.CompanyName || instruction?.company || instruction?.companyName || '';

              const personName: string | undefined = (fullName || (firstName || lastName ? `${firstName} ${lastName}`.trim() : '')) || getEnquiryPersonName() || getDealPersonName();

              if (instruction.ClientType === 'Company') {
                // Company client: company first; make person name visually subtler
                const subtleColour = isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)';
                if (company && personName) {
                  return (
                    <>
                      <span
                        style={{ fontWeight: 800, cursor: 'pointer' }}
                        title={`Click to copy company: ${company}`}
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(company); }}
                      >
                        {company}
                      </span>
                      <span
                        style={{ color: subtleColour, fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}
                        title={`Click to copy name: ${personName}`}
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(personName); }}
                      >
                        {' '}— {personName}
                      </span>
                    </>
                  );
                }
                if (company) return (
                  <span
                    style={{ fontWeight: 800, cursor: 'pointer' }}
                    title={`Click to copy company: ${company}`}
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(company); }}
                  >
                    {company}
                  </span>
                );
                if (personName) return (
                  <span
                    style={{ color: subtleColour, fontWeight: 600, cursor: 'pointer' }}
                    title={`Click to copy name: ${personName}`}
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(personName); }}
                  >
                    {personName}
                  </span>
                );
              } else {
                // Individual client: prefer person name, fallback to company if set
                if (personName) return personName;
                if (company) return company;
              }
            }

            // No instruction context: try enquiry lookup, then deal
            const fallbackName = getEnquiryPersonName() || getDealPersonName();
            if (fallbackName) return fallbackName;

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

      {/* Meta: contact + identifiers (chips) */}
      <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: 0.85,
          transition: 'opacity 0.2s ease',
          marginTop: 4,
          flexWrap: 'wrap'
        }}>
        {(() => {
          const email = instruction?.Email || instruction?.email || (deal as any)?.LeadClientEmail || (instruction as any)?.LeadClientEmail;
          const phone = instruction?.Phone || instruction?.phone || (deal as any)?.Phone || (instruction as any)?.PhoneNumber || (instruction as any)?.ContactNumber;
          const instructionRefVal = instruction?.InstructionRef || instruction?.instructionRef || instruction?.ref || instruction?.Ref;
          const prospectVal = prospectId;

          const chipBase = {
            color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
            fontSize: '11px',
            cursor: 'pointer' as const,
            padding: '3px 8px',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
          };

          const onHover = (el: HTMLElement) => {
            el.style.borderColor = colours.blue;
            el.style.color = colours.blue;
          };
          const onLeave = (el: HTMLElement) => {
            el.style.color = isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
            el.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
          };

          return (
            <>
              {email && (
                <div
                  style={{ ...chipBase, maxWidth: 'unset' }}
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(email); }}
                  onMouseEnter={(e) => onHover(e.currentTarget)}
                  onMouseLeave={(e) => onLeave(e.currentTarget)}
                  title={`Click to copy email: ${email}`}
                >
                  <FaEnvelope style={{ fontSize: '10px' }} />
                  <span style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '10px' }}>{email}</span>
                </div>
              )}
              {phone && (
                <div
                  style={chipBase}
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(phone); }}
                  onMouseEnter={(e) => onHover(e.currentTarget)}
                  onMouseLeave={(e) => onLeave(e.currentTarget)}
                  title={`Click to copy phone: ${phone}`}
                >
                  <FaPhone style={{ fontSize: '10px' }} />
                  <span style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '10px' }}>{phone}</span>
                </div>
              )}
              {instructionRefVal && (
                <div
                  style={chipBase}
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(String(instructionRefVal)); }}
                  onMouseEnter={(e) => onHover(e.currentTarget)}
                  onMouseLeave={(e) => onLeave(e.currentTarget)}
                  title={`Instruction Ref: ${instructionRefVal}`}
                >
                  <span style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '10px' }}>{instructionRefVal}</span>
                </div>
              )}
              {prospectVal && (
                <div
                  style={chipBase}
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(String(prospectVal)); }}
                  onMouseEnter={(e) => onHover(e.currentTarget)}
                  onMouseLeave={(e) => onLeave(e.currentTarget)}
                  title={`Prospect ID: ${prospectVal}`}
                >
                  <span style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '10px' }}>{prospectVal}</span>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Company & Contact details: Company moved to header; section removed intentionally */}

      {/* Deal summary: service + amount (clamped) */}
      {hasDeal && (
        <div style={{
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          borderRadius: 6,
          padding: '8px 12px',
          marginTop: 6,
          marginBottom: 2,
          position: 'relative'
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
              {/* Edit moved to Global Workbench */}
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
                  colour: fastTrackedPayment ? colours.yellow : (paymentStatus === 'complete' ? colours.green : (paymentStatus === 'processing' ? colours.yellow : (nextActionStep === 'payment' ? colours.blue : colours.greyText))),
                  complete: paymentStatus === 'complete' || fastTrackedPayment
                },
                { 
                  key:'documents', 
                  label: documentsToUse && documentsToUse.length > 0 ? 
                    `Docs (${documentsToUse.length})` : 'Docs', 
                  icon:<FaFileAlt />, 
                  colour: documentStatus === 'complete' ? colours.green : documentStatus === 'neutral' ? colours.greyText : (nextActionStep === 'documents' ? colours.blue : colours.greyText) 
                },
                { 
                  key:'id', 
                  label: idVerificationLoading ? 'Verifying...' : 
                    (verifyIdStatus === 'complete' ? 
                      (eidResult ? `ID: ${capitaliseFirst(eidResult) === 'Verified' ? 'Verified' : capitaliseFirst(eidResult)}` : 'ID') : 
                     verifyIdStatus === 'review' ? 'ID: Review' : 'ID'), 
                  icon: idVerificationLoading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaIdCard />, 
                  colour: idVerificationLoading ? colours.orange : (fastTrackedId ? colours.yellow : (verifyIdStatus === 'complete' ? colours.green : verifyIdStatus === 'review' ? colours.red : (nextActionStep === 'id' ? colours.blue : colours.greyText))),
                  complete: verifyIdStatus === 'complete' || fastTrackedId
                },
                { 
                  key:'risk', 
                  label: (() => { 
                    if (riskStatus === 'complete') {
                      if (risk?.RiskAssessmentResult) {
                        const raw = String(risk.RiskAssessmentResult);
                        const trimmed = raw.trim();
                        const lower = trimmed.toLowerCase();
                        // Remove trailing ' risk'
                        const normalised = lower.endsWith(' risk') ? trimmed.slice(0, -5) : trimmed;
                        const clean = normalised.charAt(0).toUpperCase() + normalised.slice(1);
                        return `Risk: ${clean}`;
                      }
                      return 'Risk';
                    }
                    return riskStatus === 'review' ? 'Risk: Review' : 'Risk';
                  })(), 
                  icon:<FaShieldAlt />, 
                  colour: riskStatus === 'complete' ? colours.green : (nextActionStep === 'risk' ? colours.blue : (riskStatus === 'review' ? colours.red : colours.greyText)) 
                },
                { 
                  key:'matter', 
                  label: matterStatus === 'complete' ? 'Matter: Open' : 'Matter', 
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
              const isComplete = (step as any).complete === true || step.colour === colours.green;
              const isFastTrackedVisual = (step.key === 'payment' && fastTrackedPayment) || (step.key === 'id' && fastTrackedId);
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
                    if(!isDisabled && (isPitchedDeal || step.key === nextActionStep || step.key === 'id' || step.key === 'risk' || step.key === 'payment' || step.key === 'documents' || step.key === 'matter' || step.key === 'instructed')) {
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
                      } else if (step.key === 'instructed') {
                        setShowInstructionDetails(prev => !prev);
                      } else if (step.key === 'documents') {
                        setShowDocumentDetails(prev => !prev);
                      } else if (step.key === 'matter') {
                        // If matter already exists (status is complete), show matter details
                        if (matterStatus === 'complete') {
                          setShowMatterDetails(prev => !prev);
                        } else {
                          // If no matter exists, try to open a new matter
                          if (onOpenMatter && instruction) {
                            onOpenMatter(instruction);
                          } else {
                            // Fallback to showing matter details
                            setShowMatterDetails(prev => !prev);
                          }
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
                    cursor: (!isDisabled && (isPitchedDeal || step.key === nextActionStep || step.key === 'id' || step.key === 'risk' || step.key === 'payment' || step.key === 'documents' || step.key === 'matter' || step.key === 'instructed')) ? 'pointer' : 'default',
                    opacity: isDisabled ? 0.35 : 1,
                    transform: 'translateY(0) scale(1)',
                    transition: 'opacity .2s ease-out, transform .2s ease-out, background .2s, color .2s, border .2s',
                    transitionDelay: `${delay}ms`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    selectors: {
                      ':hover': (!isDisabled && (isPitchedDeal || step.key === nextActionStep || step.key === 'id' || step.key === 'risk' || step.key === 'payment' || step.key === 'documents' || step.key === 'matter' || step.key === 'instructed')) ? {
                        background: colours.blue,
                        borderColor: colours.blue,
                        color: '#fff'
                      } : {},
                      ':active': (!isDisabled && (isPitchedDeal || step.key === nextActionStep || step.key === 'id' || step.key === 'risk' || step.key === 'payment' || step.key === 'documents' || step.key === 'matter' || step.key === 'instructed')) ? {
                        background: colours.blue,
                        color: '#fff',
                        transform: 'scale(0.96)'
                      } : {},
                  },
                })}
              >
                <span style={{ fontSize: 12 }}>{step.icon}</span>
                {step.label}
                {isComplete && (
                  isFastTrackedVisual ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 14,
                      height: 14,
                      marginLeft: 2,
                      borderRadius: '50%',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                    }} title="Fast-tracked">
                      <svg width="14" height="14" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="7" fill="#FFFFFF" />
                        <text x="8" y="11" textAnchor="middle" fontSize="10" fontWeight="900" fill={String(colours.yellow)}>!</text>
                      </svg>
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 14,
                      height: 14,
                      marginLeft: 2,
                      borderRadius: '50%',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                        <circle cx="8" cy="8" r="7" fill="#FFFFFF" />
                        {/* Modern thinner check: smaller footprint and balanced proportions */}
                        <path d="M5 8.3 L7.2 10.2 L11.2 5.8" stroke={String(colours.green)} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )
                )}
              </button>
            );
          })}
          
          {/* Edit moved into deal summary to avoid looking like an action */}
          
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
      {showInstructionDetails && (
        <div className="mt-4 p-3" style={{
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          background: isDarkMode ? '#2d2d2d' : '#f8f9fa',
          fontSize: '14px'
        }}>
          <h5 style={{
            color: isDarkMode ? '#fff' : colours.darkBlue,
            marginBottom: '12px',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            Instruction Details
          </h5>
          
          {loadingInstructionDetails ? (
            <div style={{ color: isDarkMode ? '#ccc' : '#666' }}>
              Loading instruction details...
            </div>
          ) : instructionData ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  Instruction Reference:
                </strong>
                <br />
                <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                  {instructionData.InstructionRef}
                </span>
              </div>
              
              <div>
                <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  Stage:
                </strong>
                <br />
                <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                  {instructionData.Stage}
                </span>
              </div>
              
              <div>
                <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  Client Type:
                </strong>
                <br />
                <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                  {instructionData.ClientType}
                </span>
              </div>
              
              <div>
                <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  Helix Contact:
                </strong>
                <br />
                <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                  {instructionData.HelixContact}
                </span>
              </div>
              
              {instructionData.ClientType === 'Individual' ? (
                <>
                  <div>
                    <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                      Client Name:
                    </strong>
                    <br />
                    <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                      {`${instructionData.FirstName || ''} ${instructionData.LastName || ''}`.trim()}
                    </span>
                  </div>
                  
                  <div>
                    <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                      Date of Birth:
                    </strong>
                    <br />
                    <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                      {instructionData.DateOfBirth}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                      Company Name:
                    </strong>
                    <br />
                    <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                      {instructionData.CompanyName}
                    </span>
                  </div>
                  
                  <div>
                    <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                      Company Type:
                    </strong>
                    <br />
                    <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                      {instructionData.CompanyType}
                    </span>
                  </div>
                </>
              )}
              
              <div>
                <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  Email:
                </strong>
                <br />
                <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                  {instructionData.EmailAddress}
                </span>
              </div>
              
              <div>
                <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  Phone:
                </strong>
                <br />
                <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                  {instructionData.PhoneNumber}
                </span>
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  Address:
                </strong>
                <br />
                <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                  {[instructionData.AddressLine1, instructionData.AddressLine2, instructionData.City, instructionData.County, instructionData.PostCode]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
              
              <div>
                <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  Submitted Date:
                </strong>
                <br />
                <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                  {instructionData.SubmittedDate}
                </span>
              </div>
              
              <div>
                <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  Status:
                </strong>
                <br />
                <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                  {instructionData.Status}
                </span>
              </div>
              
              {instructionData.NotesToClient && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong style={{ color: isDarkMode ? '#fff' : colours.darkBlue }}>
                    Notes to Client:
                  </strong>
                  <br />
                  <span style={{ color: isDarkMode ? '#ccc' : '#666' }}>
                    {instructionData.NotesToClient}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: isDarkMode ? '#ccc' : '#666' }}>
              No instruction details found for this reference.
            </div>
          )}
        </div>
      )}

      {showPaymentDetails && (
        <div style={{
          marginTop: '12px',
          padding: '16px',
          background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.8)',
          borderRadius: '4px',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            color: isDarkMode ? '#888' : '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'
          }}>
            Payment Details
          </div>

          {loadingPaymentDetails ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '16px',
              color: isDarkMode ? '#999' : '#666',
              fontSize: '12px'
            }}>
              Loading payment details...
            </div>
          ) : paymentData.length > 0 ? (
            paymentData.map((payment, idx) => {
              // Parse metadata if available
              let metadata: any = {};
              try {
                if (payment.metadata && typeof payment.metadata === 'string') {
                  metadata = JSON.parse(payment.metadata);
                }
              } catch (e) {
                // Ignore parsing errors
              }
              
              return (
              <div key={idx} style={{
                marginBottom: idx < paymentData.length - 1 ? '16px' : '0',
                paddingBottom: idx < paymentData.length - 1 ? '16px' : '0',
                borderBottom: idx < paymentData.length - 1 ? (isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0') : 'none'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '12px 20px',
                  fontSize: '14px'
                }}>
                  {/* Amount */}
                  {payment.amount && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        color: isDarkMode ? '#888' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Amount
                      </span>
                      <span style={{ 
                        fontWeight: 600, 
                        fontSize: '13px', 
                        color: isDarkMode ? '#e2e8f0' : '#0f172a',
                        fontFamily: 'monospace'
                      }}>
                        {payment.currency || 'GBP'} {payment.amount}
                      </span>
                    </div>
                  )}

                  {/* Payment Status */}
                  {payment.payment_status && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        color: isDarkMode ? '#888' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Payment Status
                      </span>
                      <span style={{ 
                        fontWeight: 600, 
                        fontSize: '12px', 
                        color: isDarkMode ? '#e2e8f0' : '#1e293b',
                        padding: '2px 6px',
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                        borderRadius: '3px',
                        width: 'fit-content',
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'
                      }}>
                        {payment.payment_status}
                      </span>
                    </div>
                  )}

                  {/* Internal Status */}
                  {payment.internal_status && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        color: isDarkMode ? '#888' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Internal Status
                      </span>
                      <span style={{ 
                        fontWeight: 600, 
                        fontSize: '13px', 
                        color: isDarkMode ? '#e2e8f0' : '#0f172a'
                      }}>
                        {payment.internal_status}
                      </span>
                    </div>
                  )}

                  {/* Created Date */}
                  {payment.created_at && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        color: isDarkMode ? '#888' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Created Date
                      </span>
                      <span style={{ 
                        fontWeight: 500, 
                        fontSize: '13px', 
                        color: isDarkMode ? '#e2e8f0' : '#1e293b'
                      }}>
                        {new Date(payment.created_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}

                  {/* Updated Date */}
                  {payment.updated_at && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        color: isDarkMode ? '#888' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Updated Date
                      </span>
                      <span style={{ 
                        fontWeight: 500, 
                        fontSize: '13px', 
                        color: isDarkMode ? '#e2e8f0' : '#1e293b'
                      }}>
                        {new Date(payment.updated_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}

                  {/* Payment Intent ID */}
                  {payment.payment_intent_id && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        color: isDarkMode ? '#888' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Payment Intent ID
                      </span>
                      <span style={{ 
                        fontWeight: 500, 
                        fontSize: '12px', 
                        color: isDarkMode ? '#e2e8f0' : '#1e293b',
                        fontFamily: 'monospace'
                      }}>
                        {payment.payment_intent_id.substring(0, 20)}...
                      </span>
                    </div>
                  )}

                  {/* Service Description from metadata */}
                  {(payment.service_description || metadata.serviceDescription) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        color: isDarkMode ? '#888' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Service Description
                      </span>
                      <span style={{ 
                        fontWeight: 500, 
                        fontSize: '13px', 
                        color: isDarkMode ? '#e2e8f0' : '#1e293b'
                      }}>
                        {payment.service_description || metadata.serviceDescription}
                      </span>
                    </div>
                  )}

                  {/* Area of Work from metadata */}
                  {(payment.area_of_work || metadata.areaOfWork) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        color: isDarkMode ? '#888' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Area of Work
                      </span>
                      <span style={{ 
                        fontWeight: 500, 
                        fontSize: '13px', 
                        color: isDarkMode ? '#e2e8f0' : '#1e293b'
                      }}>
                        {payment.area_of_work || metadata.areaOfWork}
                      </span>
                    </div>
                  )}

                  {/* Payment Source from metadata */}
                  {metadata.source && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        color: isDarkMode ? '#888' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Source
                      </span>
                      <span style={{ 
                        fontWeight: 500, 
                        fontSize: '13px', 
                        color: isDarkMode ? '#e2e8f0' : '#1e293b'
                      }}>
                        {metadata.source}
                      </span>
                    </div>
                  )}

                  {/* Product from metadata */}
                  {metadata.product && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        color: isDarkMode ? '#888' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Product
                      </span>
                      <span style={{ 
                        fontWeight: 500, 
                        fontSize: '13px', 
                        color: isDarkMode ? '#e2e8f0' : '#1e293b'
                      }}>
                        {metadata.product}
                      </span>
                    </div>
                  )}

                  {/* Receipt URL */}
                  {payment.receipt_url && (
                    <div style={{ 
                      gridColumn: '1 / -1',
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '2px',
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'
                    }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        color: isDarkMode ? '#888' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Receipt URL
                      </span>
                      <a 
                        href={payment.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                          fontWeight: 400, 
                          fontSize: '13px', 
                          color: isDarkMode ? '#60a5fa' : '#2563eb',
                          lineHeight: '1.4',
                          textDecoration: 'underline'
                        }}
                      >
                        View Receipt
                      </a>
                    </div>
                  )}
                </div>
              </div>
              );
            })
          ) : (
            <div style={{ 
              color: '#999',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '16px',
              fontSize: '12px'
            }}>
              No payment details found
            </div>
          )}
        </div>
      )}

      {/* Document Details Section - shown when documents pill is clicked */}
      {showDocumentDetails && documentsToUse && documentsToUse.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '16px',
          background: isDarkMode ? 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.7) 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderRadius: '10px',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
          boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px', minWidth: 240 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : '#e2e8f0'}`
              }}>
                <FaFileAlt style={{ color: colours.green, fontSize: 16 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: isDarkMode ? '#fff' : colours.darkBlue }}>
                  Documents ({documentsToUse.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {documentsToUse.map((doc, idx) => {
                  const isActive = idx === selectedDocumentIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDocumentIndex(idx)}
                      style={{
                        textAlign: 'left',
                        border: '1px solid ' + (isActive ? colours.blue : (isDarkMode ? 'rgba(255,255,255,0.15)' : '#e2e8f0')),
                        background: isActive ? (isDarkMode ? 'rgba(96,165,250,0.15)' : '#eff6ff') : (isDarkMode ? 'rgba(255,255,255,0.04)' : '#f1f5f9'),
                        padding: '8px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                        fontWeight: 500,
                        transition: 'background .15s, border-color .15s'
                      }}
                    >
                      <FaFileAlt style={{ color: isActive ? colours.blue : colours.greyText, fontSize: 14 }} />
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.FileName || doc.filename || doc.name || `Document ${idx + 1}`}
                      </span>
                      {(doc.UploadedAt || doc.uploaded_at) && (
                        <span style={{ fontSize: 10, color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
                          {new Date(doc.UploadedAt || doc.uploaded_at).toLocaleDateString('en-GB')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ flex: '2 1 420px', minWidth: 300, position: 'relative' }}>
              {(() => {
                const activeDoc: any = documentsToUse[selectedDocumentIndex];
                if (!activeDoc) return null;
                const name = activeDoc.FileName || activeDoc.filename || activeDoc.name || `Document ${selectedDocumentIndex + 1}`;
                const url: string | undefined = activeDoc.previewUrl || activeDoc.BlobUrl || activeDoc.url || activeDoc.download_url || activeDoc.preview_url;
                const size: number | undefined = activeDoc.FileSizeBytes || activeDoc.size || activeDoc.file_size || activeDoc.length;
                const uploadedBy = activeDoc.UploadedBy || activeDoc.uploaded_by || activeDoc.user || activeDoc.User;
                const uploadedAtRaw = activeDoc.UploadedAt || activeDoc.uploaded_at || activeDoc.created_at || activeDoc.CreatedAt;
                const ext = (name.split('.').pop() || '').toLowerCase();
                const officeExts = ['doc','docx','ppt','pptx','xls','xlsx'];
                const imageExts = ['png','jpg','jpeg','gif','webp'];
                const audioExts = ['mp3','wav','ogg'];
                const videoExts = ['mp4','webm','ogg','mov'];
                const textExts = ['txt','log','csv'];
                const pdfExts = ['pdf'];
                const canPreviewDirect = !!url && (imageExts.includes(ext) || audioExts.includes(ext) || videoExts.includes(ext) || textExts.includes(ext) || pdfExts.includes(ext));
                const canPreviewOffice = !!url && officeExts.includes(ext);
                const officeViewerUrl = canPreviewOffice ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url!)}` : undefined;
                return (
                  <div style={{
                    border: '1px solid ' + (isDarkMode ? 'rgba(255,255,255,0.15)' : '#e2e8f0'),
                    borderRadius: 8,
                    padding: 14,
                    background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#fff',
                    minHeight: 260,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <FaFileAlt style={{ color: getFileColour(ext, colours), fontSize: 18 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isDarkMode ? '#fff' : colours.darkBlue }}>{name}</div>
                        <div style={{ fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#64748b', marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                          {uploadedAtRaw && <span>Uploaded {new Date(uploadedAtRaw).toLocaleString('en-GB')}</span>}
                          {uploadedBy && <span>By {uploadedBy}</span>}
                          <span>Type {ext || 'n/a'}</span>
                          <span>Size {formatBytes(size)}</span>
                        </div>
                      </div>
                      {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{
                          fontSize: 11,
                          padding: '4px 8px',
                          borderRadius: 4,
                          background: colours.blue,
                          color: '#fff',
                          textDecoration: 'none'
                        }}>Open</a>
                      )}
                    </div>
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
                      {canPreviewDirect && url && (
                        imageExts.includes(ext) ? (
                          <img src={url} alt={name} style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                        ) : pdfExts.includes(ext) ? (
                          <iframe title={name} src={url} style={{ width: '100%', height: '100%', border: 'none', minHeight: 200 }} />
                        ) : textExts.includes(ext) ? (
                          <iframe title={name} src={url} style={{ width: '100%', height: '100%', border: 'none', minHeight: 200, background:'#fff' }} />
                        ) : audioExts.includes(ext) ? (
                          <audio controls style={{ width: '100%' }}>
                            <source src={url} />
                            Your browser does not support the audio element.
                          </audio>
                        ) : videoExts.includes(ext) ? (
                          <video controls style={{ width: '100%', maxHeight: 240 }}>
                            <source src={url} />
                            Your browser does not support the video tag.
                          </video>
                        ) : null
                      )}
                      {canPreviewOffice && officeViewerUrl && (
                        <iframe title={name} src={officeViewerUrl} style={{ width: '100%', height: '100%', border: 'none', minHeight: 220, background:'#fff' }} />
                      )}
                      {!canPreviewDirect && !canPreviewOffice && (
                        <div style={{
                          fontSize: 12,
                          color: isDarkMode ? '#cbd5e1' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 180,
                          textAlign: 'center',
                          padding: '0 20px'
                        }}>
                          {url ? 'Inline preview not supported for this file. Use Open to view/download.' : 'No file URL available. Metadata shown above.'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
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
      {showMatterDetails && (
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

          {loadingMatterDetails ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '16px',
              color: isDarkMode ? '#999' : '#666',
              fontSize: '12px',
              background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              borderRadius: '4px'
            }}>
              Loading matter details...
            </div>
          ) : matterData ? (
            <div style={{
              background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.8)',
              padding: '16px',
              borderRadius: '4px',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px 20px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: isDarkMode ? '#888' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Matter ID
                </span>
                <span style={{ 
                  fontWeight: 500, 
                  fontSize: '13px', 
                  color: isDarkMode ? '#e2e8f0' : '#1e293b',
                  fontFamily: 'monospace'
                }}>
                  {matterData.MatterID || 'N/A'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: isDarkMode ? '#888' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Status
                </span>
                <span style={{ 
                  fontWeight: 600, 
                  fontSize: '12px', 
                  color: isDarkMode ? '#e2e8f0' : '#1e293b',
                  padding: '2px 6px',
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  borderRadius: '3px',
                  width: 'fit-content',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'
                }}>
                  {matterData.Status === 'MatterRequest' ? 'Pending' : matterData.Status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: isDarkMode ? '#888' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Open Date
                </span>
                <span style={{ fontWeight: 500, fontSize: '13px', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                  {matterData.FormattedOpenDate || 'N/A'}
                </span>
              </div>

              {matterData.FormattedOpenTime && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    color: isDarkMode ? '#888' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Open Time
                  </span>
                  <span style={{ fontWeight: 500, fontSize: '13px', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                    {matterData.FormattedOpenTime}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: isDarkMode ? '#888' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Client Name
                </span>
                <span style={{ fontWeight: 500, fontSize: '13px', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                  {matterData.ClientName || 'N/A'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: isDarkMode ? '#888' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Client Type
                </span>
                <span style={{ fontWeight: 500, fontSize: '13px', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                  {matterData.ClientType || 'N/A'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: isDarkMode ? '#888' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Practice Area
                </span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: isDarkMode ? '#e2e8f0' : '#0f172a' }}>
                  {matterData.PracticeArea || 'N/A'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: isDarkMode ? '#888' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Approx Value
                </span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: isDarkMode ? '#e2e8f0' : '#0f172a' }}>
                  {matterData.ApproxValue || 'N/A'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: isDarkMode ? '#888' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Responsible Solicitor
                </span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: isDarkMode ? '#e2e8f0' : '#0f172a' }}>
                  {matterData.ResponsibleSolicitor || 'N/A'}
                </span>
              </div>

              {matterData.OriginatingSolicitor && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    color: isDarkMode ? '#888' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Originating Solicitor
                  </span>
                  <span style={{ fontWeight: 500, fontSize: '13px', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                    {matterData.OriginatingSolicitor}
                  </span>
                </div>
              )}

              {matterData.SupervisingPartner && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    color: isDarkMode ? '#888' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Supervising Partner
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: isDarkMode ? '#e2e8f0' : '#0f172a' }}>
                    {matterData.SupervisingPartner}
                  </span>
                </div>
              )}

              {matterData.Source && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    color: isDarkMode ? '#888' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Source
                  </span>
                  <span style={{ fontWeight: 500, fontSize: '13px', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                    {matterData.Source}
                  </span>
                </div>
              )}

              {matterData.Referrer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    color: isDarkMode ? '#888' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Referrer
                  </span>
                  <span style={{ fontWeight: 500, fontSize: '13px', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                    {matterData.Referrer}
                  </span>
                </div>
              )}

              {(matterData.OpponentID || matterData.OpponentSolicitorID) && (
                <div style={{ 
                  gridColumn: '1 / -1',
                  padding: '12px',
                  background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                  borderRadius: '3px',
                  borderLeft: '2px solid #64748b',
                  marginTop: '8px'
                }}>
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    color: isDarkMode ? '#888' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>
                    Opposition Details
                  </div>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {matterData.OpponentID && (
                      <div>
                        <span style={{ fontSize: '10px', color: isDarkMode ? '#888' : '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Party ID: </span>
                        <span style={{ fontWeight: 500, color: isDarkMode ? '#e2e8f0' : '#1e293b', fontFamily: 'monospace', fontSize: '12px' }}>
                          {matterData.OpponentID}
                        </span>
                      </div>
                    )}
                    {matterData.OpponentSolicitorID && (
                      <div>
                        <span style={{ fontSize: '10px', color: isDarkMode ? '#888' : '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Solicitor ID: </span>
                        <span style={{ fontWeight: 500, color: isDarkMode ? '#e2e8f0' : '#1e293b', fontFamily: 'monospace', fontSize: '12px' }}>
                          {matterData.OpponentSolicitorID}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {matterData.Description && (
                <div style={{ 
                  gridColumn: '1 / -1',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px',
                  paddingTop: '12px',
                  borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                  marginTop: '8px'
                }}>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    color: isDarkMode ? '#888' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Description
                  </span>
                  <span style={{ 
                    fontWeight: 400, 
                    fontSize: '13px', 
                    color: isDarkMode ? '#cbd5e1' : '#475569',
                    lineHeight: '1.4'
                  }}>
                    {matterData.Description}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              color: '#999',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '16px',
              fontSize: '12px',
              background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              borderRadius: '4px'
            }}>
              No matter details found
            </div>
          )}
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
