import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
// invisible change 2
//
import { format, isSameYear, differenceInYears, differenceInMonths, differenceInWeeks, differenceInDays, isToday, isYesterday, isThisWeek, formatDistanceToNow } from 'date-fns';
import { mergeStyles } from '@fluentui/react';
import {
    FaIdBadge,
    FaRegIdBadge,
    FaFileAlt,
    FaRegFileAlt,
    FaFolder,
    FaRegFolder,
    FaCheckCircle,
    FaClock,
    FaTimesCircle,
    FaExclamationTriangle,
} from 'react-icons/fa';
import { MdAssessment, MdOutlineAssessment, MdOutlineWarningAmber } from 'react-icons/md';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';
import { ClientInfo } from './JointClientCard';
import '../../app/styles/InstructionCard.css';
import '../../app/styles/InstructionDashboard.css';

// Utility to format date difference as human-friendly string
function formatTimelineDate(dateStr: string, timeStr?: string) {
    if (!dateStr) return '';
    let date: Date;
    if (dateStr.length > 10) {
        date = new Date(dateStr); // already has time
    } else if (timeStr) {
        date = new Date(`${dateStr}T${timeStr}`);
    } else {
        date = new Date(dateStr);
    }
    const now = new Date();
    if (isToday(date)) {
        return `today at ${format(date, 'HH:mm')}`;
    }
    if (isYesterday(date)) {
        return `yesterday at ${format(date, 'HH:mm')}`;
    }
    if (isThisWeek(date, { weekStartsOn: 1 })) {
        return `on ${format(date, 'EEEE')} at ${format(date, 'HH:mm')}`;
    }
    const years = differenceInYears(now, date);
    if (years > 0) {
        const months = differenceInMonths(now, date) % 12;
        return `${years} year${years > 1 ? 's' : ''}${months ? `, ${months} month${months > 1 ? 's' : ''}` : ''} ago`;
    }
    const months = differenceInMonths(now, date);
    if (months > 0) {
        const weeks = differenceInWeeks(now, date) % 4;
        return `${months} month${months > 1 ? 's' : ''}${weeks ? `, ${weeks} week${weeks > 1 ? 's' : ''}` : ''} ago`;
    }
    const weeks = differenceInWeeks(now, date);
    if (weeks > 0) {
        const days = differenceInDays(now, date) % 7;
        return `${weeks} week${weeks > 1 ? 's' : ''}${days ? `, ${days} day${days > 1 ? 's' : ''}` : ''} ago`;
    }
    const days = differenceInDays(now, date);
    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    return formatDistanceToNow(date, { addSuffix: true });
}  

interface InstructionInfo {
    InstructionRef: string;
    Stage?: string;
    FirstName?: string;
    LastName?: string;
    CompanyName?: string;
    Email?: string;
    HelixContact?: string;
    SubmissionDate?: string;
    ClientType?: string;
    Title?: string;
    Nationality?: string;
    NationalityAlpha2?: string;
    DOB?: string;
    Gender?: string;
    Phone?: string;
    PassportNumber?: string;
    DriversLicenseNumber?: string;
    IdType?: string;
    HouseNumber?: string;
    Street?: string;
    City?: string;
    County?: string;
    Postcode?: string;
    Country?: string;
    CountryCode?: string;
    CompanyNumber?: string;
    CompanyHouseNumber?: string;
    CompanyStreet?: string;
    CompanyCity?: string;
    CompanyCounty?: string;
    CompanyPostcode?: string;
    CompanyCountry?: string;
    CompanyCountryCode?: string;
    PaymentMethod?: string;
    PaymentResult?: string;
    PaymentAmount?: number;
    PaymentProduct?: string;
    PaymentTimestamp?: string;
    AliasId?: string;
    OrderId?: string;
    SHASign?: string;
    Notes?: string;
    ClientId?: number;
    RelatedClientId?: number;
    MatterId?: number;
}

interface DealInfo {
    InstructionRef?: string;
    ServiceDescription?: string;
    Amount?: number;
    AreaOfWork?: string;
    PitchedBy?: string;
    IsMultiClient?: boolean;
    jointClients?: ClientInfo[];
    // Add all possible deal fields for type safety
    PitchedDate?: string;
    PitchedTime?: string;
    CloseDate?: string;
    CloseTime?: string;
    PitchValidUntil?: string;
    ProspectId?: number;
    Passcode?: string;
    LeadClientId?: number;
    LeadClientEmail?: string;
    Status?: string;
    [key: string]: any;
}

interface InstructionCardProps {
    instruction: InstructionInfo;
    deal?: DealInfo;
    deals?: DealInfo[];
    clients?: ClientInfo[];
    prospectId?: number;
    risk?: {
        MatterId: string; RiskAssessmentResult?: string; RiskScore?: number 
} | null;
    eid?: { EIDStatus?: string } | null;
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
}

// Icons used for the bottom navigation as well as the global actions
// Use outline/filled pairs so we can swap the icon on hover
const iconMap = {
    eid: { outline: FaRegIdBadge, filled: FaIdBadge },
    risk: { outline: MdOutlineAssessment, filled: MdAssessment },
    matter: { outline: FaRegFolder, filled: FaFolder },
    ccl: { outline: FaRegFileAlt, filled: FaFileAlt },
};

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
}) => {
    const stage = instruction.Stage?.toLowerCase();
    const isCompleted = stage === 'completed';
    const isInitialised = stage === 'initialised';

    const [collapsed, setCollapsed] = useState(!expanded);
    const [showClientDetails, setShowClientDetails] = useState(false);
    const [hovered, setHovered] = React.useState<string | null>(null);

    useEffect(() => {
        setCollapsed(!expanded);
    }, [expanded]);

    const cardClass = mergeStyles('instructionCard', collapsed && 'collapsed', {
        backgroundColor: colours.light.sectionBackground,
        padding: componentTokens.card.base.padding,
        boxShadow: componentTokens.card.base.boxShadow,
        color: colours.light.text,
        height: 'auto',
        borderTop: 'none', // Exclude top border since header handles it
        borderLeft: selected ? '2px solid #3690CE' : '2px solid transparent',
        borderRight: selected ? '2px solid #3690CE' : '2px solid transparent',
        borderBottom: selected ? '2px solid #3690CE' : '2px solid transparent',
        opacity: 1,
        transition: 'box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease',
        selectors: {
            ':hover': {
                boxShadow: componentTokens.card.hover.boxShadow,
                transform: componentTokens.card.hover.transform,
            },
        },
    });

    const style: React.CSSProperties = { '--animation-delay': `${animationDelay}s` } as React.CSSProperties;
    const formatValue = (key: string, value: any) => {
        if (value === null || value === undefined) return '';
        const dateKeys = ['SubmissionDate', 'LastUpdated', 'DOB', 'PaymentTimestamp'];
        if (dateKeys.includes(key) && typeof value === 'string') {
            try {
                return format(new Date(value), 'd MMM yyyy');
            } catch {
                return value;
            }
        }
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch {
                return String(value);
            }
        }
        return String(value);
    };

    const proofOfIdComplete = Boolean(
        instruction.PassportNumber || instruction.DriversLicenseNumber
    );
    const paymentStatusRaw = instruction.PaymentResult?.toLowerCase();
    const paymentComplete = paymentStatusRaw === 'successful';
    const paymentFailed = paymentStatusRaw === 'failed';
    const documentsComplete = (documents?.length ?? documentCount ?? 0) > 0;
    const eidStatus = (eid?.EIDStatus || '').toLowerCase();
    const eidResult = (eid as any)?.EIDOverallResult?.toLowerCase();
    const complianceStatus = (compliance as any)?.Status ?? '-';
    const dealOpen = (deals ?? []).some((d: any) => d.Status?.toLowerCase() !== 'closed');
    const dealMissing = (deals ?? []).length === 0;
    const leadName = instruction
        ? (instruction.FirstName || instruction.LastName)
            ? `${instruction.FirstName ?? ''} ${instruction.LastName ?? ''}`.trim()
            : instruction.CompanyName ?? clients?.find(c => c.Lead)?.ClientEmail ?? ''
        : deal?.ServiceDescription ?? '';

    const eidPassed = eidResult === 'passed' || eidResult === 'pass';
    let verifyIdStatus: 'pending' | 'received' | 'review' | 'complete';
    if (!eid || eidStatus === 'pending') {
        verifyIdStatus = proofOfIdComplete ? 'received' : 'pending';
    } else if (eidPassed) {
        verifyIdStatus = 'complete';
    } else {
        verifyIdStatus = 'review';
    }
    const idStatus = verifyIdStatus === 'complete'
        ? 'verified'
        : verifyIdStatus === 'review'
            ? 'review'
            : verifyIdStatus === 'received'
                ? 'received'
                : 'pending';
    const riskResultRaw = risk?.MatterId === instruction.InstructionRef ? (risk as any)?.RiskAssessmentResult?.toString().toLowerCase() : undefined;
    const riskStatus = riskResultRaw
        ? ['low', 'low risk', 'pass', 'approved'].includes(riskResultRaw)
            ? 'complete'
            : 'flagged'
        : 'pending';
    const riskAssessed = riskStatus !== 'pending';
    const openMatterReady =
        !dealOpen &&
        paymentComplete &&
        documentsComplete &&
        verifyIdStatus === 'complete' &&
        riskStatus === 'complete';
    const openMatterStatus: 'pending' | 'ready' | 'complete' =
        dealOpen ? 'complete' : openMatterReady ? 'ready' : 'pending';
    // Allow opening a new matter directly from the card even if some
    // prerequisite checks are outstanding. The navigator already shows
    // the relevant warnings so we no longer disable the action here.
    const openDisabled = false;

    const verifyIdLabel = verifyIdStatus === 'complete'
        ? 'ID Verified'
        : verifyIdStatus === 'review'
            ? 'Review ID'
            : 'Verify an ID';
    const verifyTabStatus = verifyIdStatus === 'pending' && proofOfIdComplete
        ? 'ready'
        : verifyIdStatus;


    const [activeTab, setActiveTab] = useState<'eid' | 'risk' | 'matter' | 'ccl' | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const tabsRef = useRef<HTMLDivElement>(null);
    const [compact, setCompact] = useState(true);

    const [showRawJson, setShowRawJson] = useState(false);

    // Extracted components to avoid hook-in-callback error
    function RawJsonToggle({ showRawJson, setShowRawJson }: { showRawJson: boolean, setShowRawJson: React.Dispatch<React.SetStateAction<boolean>> }) {
      return (
        <div style={{marginLeft: 0, alignSelf: 'flex-start'}}>
          <button
            onClick={e => {
              e.stopPropagation();
              setShowRawJson(prev => !prev);
            }}
            style={{
              background: '#f8f9fa',
              border: '1px solid #e1dfdd',
              borderRadius: 6,
              padding: 4,
              fontSize: 12,
              color: '#3690CE',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              minHeight: 0,
              minWidth: 0,
              width: 28,
              height: 28,
            }}
            tabIndex={0}
            aria-label={showRawJson ? 'Hide Raw Data' : 'Show Raw Data'}
          >
            <i className="ms-Icon ms-Icon--Code" style={{ fontSize: 16 }} />
          </button>
        </div>
      );
    }

    function RawJsonPreview({ data }: { data: any }) {
      return (
        <div
          style={{
            margin: '8px 0 8px 0',
            border: '1px solid #e1dfdd',
            borderRadius: 6,
            background: '#f8f9fa',
            overflow: 'hidden',
            width: '100%',
            maxWidth: 600,
            alignSelf: 'flex-end',
            boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
          }}
        >
          <div
            style={{
              padding: 16,
              maxHeight: 300,
              overflow: 'auto',
              fontSize: 11,
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              lineHeight: 1.4,
              background: '#fff',
              color: '#333',
            }}
          >
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    useLayoutEffect(() => {
        function updateCompact() {
            const el = tabsRef.current;
            if (!el) return;
            const width = el.offsetWidth;
            const needed = 4 * 90 + 3 * 8; // four tabs, min width plus gap
            setCompact(width < needed);
        }
        updateCompact();
        window.addEventListener('resize', updateCompact);
        return () => window.removeEventListener('resize', updateCompact);
    }, []);

    const isPoid = stage === 'poid';



    // Status row logic: only show ID, Pay, Docs (Deal is now in its own container)
    const statusData = [
        { key: 'id', label: 'Proof of ID', status: idStatus },
        ...(!dealMissing ? [
            {
                key: 'pay',
                label: 'Pay',
                status: paymentComplete ? 'complete' : paymentFailed ? 'failed' : 'pending',
            },
            { key: 'docs', label: 'Docs', status: documentsComplete ? 'complete' : 'pending' },
        ] : [])
    ];
    // Wrap all returned JSX in a single fragment
    return (
        <div 
            className="instruction-card-container"
            style={{
                display: 'block',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                transform: `translateY(${animationDelay * 50}px)`,
                opacity: 0,
                animation: `instructionFadeIn 0.8s ease-out forwards`,
                animationDelay: `${animationDelay}s`,
            }}
        >
            <>
                <header
                    className="instruction-header"
                    style={{
                        ...(!collapsed ? { backgroundColor: colours.darkBlue, color: '#fff' } : {}),
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                        marginBottom: 0,
                        borderTop: selected ? '2px solid #3690CE' : '2px solid transparent',
                        borderLeft: selected ? '2px solid #3690CE' : '2px solid transparent',
                        borderRight: selected ? '2px solid #3690CE' : '2px solid transparent',
                        borderBottom: 'none',
                        cursor: 'pointer',
                    }}
                    onClick={() => {
                        const newState = !collapsed;
                        setCollapsed(newState);
                        setShowClientDetails(!newState); // show details when expanded, hide when collapsed
                        if (newState) setSelectedStatus(null);
                        onToggle?.();
                        onSelect?.(); // Select this instruction
                    }}
                >
                    <span className="header-title" style={{ fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span>{leadName}</span>
                        <span style={{
                            display: 'inline-block',
                            width: 1,
                            height: 20,
                            background: !collapsed ? 'rgba(255,255,255,0.35)' : '#b0b0b0',
                            margin: '0 12px',
                            verticalAlign: 'middle',
                            alignSelf: 'center',
                        }} />
                        <span style={{ fontWeight: 400, color: !collapsed ? 'rgba(255,255,255,0.7)' : '#888', fontSize: 16, letterSpacing: 0.2, alignSelf: 'center' }}>
                            {instruction.InstructionRef || '—'}
                        </span>
                        {selected && (
                            <span style={{
                                marginLeft: '12px',
                                padding: '2px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                backgroundColor: !collapsed ? 'rgba(255,255,255,0.2)' : '#3690CE',
                                color: !collapsed ? '#fff' : '#fff',
                                borderRadius: '12px',
                                alignSelf: 'center'
                            }}>
                                SELECTED
                            </span>
                        )}
                    </span>
                    <span
                        className="plusminus-icon"
                        aria-hidden="true"
                        style={!collapsed ? { color: '#fff' } : undefined}
                    >
                        {collapsed ? '+' : '−'}
                    </span>
                </header>

                {/* Amalgamated Deal/Email/Phone Container - now visually part of the card, inside the card border, collapses with the card */}
                {!collapsed && (
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                    margin: 0,
                    padding: 0,
                    borderLeft: selected ? '2px solid #3690CE' : '2px solid transparent',
                    borderRight: selected ? '2px solid #3690CE' : '2px solid transparent',
                    borderTop: 'none',
                    borderBottom: 'none',
                    borderRadius: '0 0 0 0',
                    background: 'transparent',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div className="client-details-contact-bigbtn static" style={{
                        background: '#fff',
                        border: '1.5px solid #e1dfdd',
                        boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        minWidth: 0,
                        width: '100%',
                        borderRadius: 0,
                        margin: 0,
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderTop: 'none',
                        borderBottom: 'none',
                        boxSizing: 'border-box',
                    }}>
                        {/* --- TAGS ROW --- */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          minHeight: 28,
                          marginBottom: '8px',
                          position: 'relative',
                        }}>
                          {/* Tags row, will wrap before JSON icon */}
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                            alignItems: 'center',
                            minHeight: 28,
                            flex: '1 1 0%',
                            marginRight: deal ? 36 : 0, // leave space for JSON icon
                            boxSizing: 'border-box',
                          }}>
                            {dealMissing ? (
                              <>
                                <div style={{
                                  backgroundColor: '#fffbe6',
                                  border: '1px solid #ffe58f',
                                  borderRadius: '12px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  color: '#b88600',
                                  alignSelf: 'flex-start',
                                  display: 'inline-block',
                                  whiteSpace: 'nowrap',
                                  height: 28,
                                  lineHeight: '20px',
                                  alignItems: 'center',
                                }}>
                                  No Pitch Found
                                </div>
                                <div style={{
                                  backgroundColor: '#e8f4fd',
                                  border: '1px solid #b3d9f7',
                                  borderRadius: '12px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  color: '#1a73e8',
                                  alignSelf: 'flex-start',
                                  display: 'inline-block',
                                  whiteSpace: 'nowrap',
                                  height: 28,
                                  lineHeight: '20px',
                                  alignItems: 'center',
                                  marginLeft: 8
                                }}>
                                  No Pitch Found
                                </div>
                              </>
                            ) : (
                              <>
                                {deal?.PitchedBy && (
                                  <div style={{
                                    backgroundColor: '#e8f4fd',
                                    border: '1px solid #b3d9f7',
                                    borderRadius: '12px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: '#1a73e8',
                                    alignSelf: 'flex-start',
                                    display: 'inline-block',
                                    whiteSpace: 'nowrap',
                                    height: 28,
                                    lineHeight: '20px',
                                    alignItems: 'center',
                                  }}>
                                    Pitched by {deal?.PitchedBy}
                                  </div>
                                )}
                                {deal && typeof deal.IsMultiClient !== 'undefined' && (
                                  deal.IsMultiClient ? (
                                    (() => {
                                      const allSubmitted = deal.jointClients && deal.jointClients.length > 0 && deal.jointClients.every(jc => jc.HasSubmitted);
                                      const somePending = deal.jointClients && deal.jointClients.length > 0 && deal.jointClients.some(jc => !jc.HasSubmitted);
                                      const dotColor = allSubmitted ? '#22c55e' : (somePending ? '#FFB900' : '#bdbdbd');
                                      return (
                                        <div
                                          style={{
                                            backgroundColor: '#e8f4fd',
                                            border: '1px solid #b3d9f7',
                                            borderRadius: '12px',
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            color: '#1a73e8',
                                            alignSelf: 'flex-start',
                                            display: 'inline-block',
                                            whiteSpace: 'nowrap',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            height: 28,
                                            lineHeight: '20px',
                                            alignItems: 'center',
                                          }}
                                          onMouseEnter={e => {
                                            if (!deal.jointClients || deal.jointClients.length === 0) return;
                                            const pop = document.createElement('div');
                                            pop.className = 'joint-client-popover';
                                            pop.style.position = 'absolute';
                                            pop.style.top = '110%';
                                            pop.style.left = '0';
                                            pop.style.background = '#fff';
                                            pop.style.border = '1px solid #b3d9f7';
                                            pop.style.borderRadius = '8px';
                                            pop.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
                                            pop.style.padding = '10px 16px';
                                            pop.style.zIndex = '1000';
                                            pop.style.whiteSpace = 'nowrap';
                                            pop.innerHTML = deal.jointClients.map(jc =>
                                              `<div style='margin-bottom:4px;'><span style='font-weight:600;color:#1e293b;'>${jc.ClientEmail}</span> <span style='color:${jc.HasSubmitted ? '#22c55e' : '#f59e42'};font-weight:500;margin-left:8px;'>${jc.HasSubmitted ? 'Submitted' : 'Pending'}</span></div>`
                                            ).join('');
                                            e.currentTarget.appendChild(pop);
                                          }}
                                          onMouseLeave={e => {
                                            const pop = e.currentTarget.querySelector('.joint-client-popover');
                                            if (pop) pop.remove();
                                          }}
                                        >
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{
                                              display: 'inline-block',
                                              width: 9,
                                              height: 9,
                                              borderRadius: '50%',
                                              background: dotColor,
                                              marginRight: 5,
                                              border: '1.5px solid #fff',
                                              boxShadow: '0 0 0 1px #b3d9f7',
                                            }} />
                                            Joint Client
                                          </span>
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <div style={{
                                      backgroundColor: '#e8f4fd',
                                      border: '1px solid #b3d9f7',
                                      borderRadius: '12px',
                                      padding: '4px 8px',
                                      fontSize: '11px',
                                      fontWeight: 500,
                                      color: '#1a73e8',
                                      alignSelf: 'flex-start',
                                      display: 'inline-block',
                                      whiteSpace: 'nowrap',
                                      height: 28,
                                      lineHeight: '20px',
                                      alignItems: 'center',
                                    }}>
                                      Primary Client
                                    </div>
                                  )
                                )}
                              </>
                            )}
                          </div>
                          {/* JSON icon absolutely right, vertically centered, on same row as tags */}
                          {deal && (
                            <div style={{
                              position: 'absolute',
                              right: 0,
                              top: 0,
                              height: 28,
                              display: 'flex',
                              alignItems: 'center',
                              zIndex: 2,
                            }}>
                              <RawJsonToggle showRawJson={showRawJson} setShowRawJson={setShowRawJson} />
                            </div>
                          )}
                        </div>
                        {/* --- SERVICE DESCRIPTION & AMOUNT + RAW JSON PREVIEW BUTTON --- */}
                        <div style={{display: 'flex', alignItems: 'center', width: '100%', marginBottom: 4}}>
                          {deal && (deal.ServiceDescription || typeof deal.Amount === 'number') && (
                            <div style={{fontWeight: 600, fontSize: 16, color: '#061733', flex: 1}}>
                              {deal.ServiceDescription}
                              {typeof deal.Amount === 'number' && (
                                <span style={{fontWeight: 500, color: '#3690CE', fontSize: 15}}>
                                  {' · £'}{deal.Amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {/* --- PITCHED/CLOSED/EXPIRY BANNER --- */}
                        {deal && (deal.PitchedDate || deal.PitchedTime) && (() => {
                          const status = (deal.Status || '').toLowerCase();
                          const pitchedDateObj = deal.PitchedDate ? new Date(`${deal.PitchedDate}T${deal.PitchedTime || '00:00:00'}`) : null;
                          const closedDateObj = deal.CloseDate ? new Date(`${deal.CloseDate}T${deal.CloseTime || '00:00:00'}`) : null;
                          const expiryDateObj = deal.PitchValidUntil ? new Date(deal.PitchValidUntil) : null;
                          // Duration calculation (like POID card)
                          function getDurationBanner(start: Date, end: Date, closed: boolean) {
                            let diff = end.getTime() - start.getTime();
                            if (diff <= 0) return closed ? 'Closed' : 'Expired';
                            const msPerHour = 1000 * 60 * 60;
                            const msPerDay = msPerHour * 24;
                            const msPerWeek = msPerDay * 7;
                            const msPerMonth = msPerDay * 30.44; // average month
                            const years = Math.floor(diff / (msPerMonth * 12));
                            diff -= years * msPerMonth * 12;
                            const months = Math.floor(diff / msPerMonth);
                            diff -= months * msPerMonth;
                            const weeks = Math.floor(diff / msPerWeek);
                            diff -= weeks * msPerWeek;
                            const days = Math.floor(diff / msPerDay);
                            diff -= days * msPerDay;
                            const hours = Math.floor(diff / msPerHour);
                            let parts = [];
                            if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
                            if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
                            if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
                            if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
                            if (hours > 0 && parts.length === 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
                            if (parts.length === 0) parts.push('<1 hour');
                            return closed
                              ? `Closed in ${parts.join(' / ')}`
                              : `Expires in ${parts.join(' / ')}`;
                          }
                          let banner = '';
                          if (pitchedDateObj && closedDateObj) {
                            banner = getDurationBanner(pitchedDateObj, closedDateObj, true);
                          } else if (pitchedDateObj && expiryDateObj) {
                            banner = getDurationBanner(pitchedDateObj, expiryDateObj, false);
                          }
                          if (!banner) return null;
                          return (
                            <div style={{
                              width: '100%',
                              background: closedDateObj ? '#e6f4ea' : '#fffbe6',
                              borderLeft: closedDateObj ? '3px solid #107C10' : '3px solid #FFB900',
                              color: closedDateObj ? '#107C10' : '#b88600',
                              fontWeight: 500,
                              fontSize: '0.95rem',
                              padding: '6px 12px',
                              margin: '8px 0 8px 0',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}>
                              {banner}
                            </div>
                          );
                        })()}
                        {/* Raw JSON preview (read-only) */}
                        {deal && showRawJson && (
                          <RawJsonPreview data={deal} />
                        )}
                        {/* Email and Phone banner (side by side, icon in box, input box to right) */}
                        <div style={{
                          marginTop: 10,
                          display: 'flex',
                          flexDirection: 'row',
                          gap: 16,
                          width: '100%',
                          alignItems: 'stretch',
                        }}>
                          {/* Email */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            flex: 1,
                            minWidth: 0,
                            background: '#f8f9fa',
                            border: '1.5px solid #e1dfdd',
                            borderRadius: 6,
                            boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                            height: 38,
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              background: '#fff',
                              borderRight: '1.5px solid #e1dfdd',
                              height: '100%',
                              width: 38,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <rect x="2" y="4" width="20" height="16" rx="3" fill="none" stroke="#3690CE" strokeWidth="1.5"/>
                                <polyline points="4,6 12,13 20,6" fill="none" stroke="#3690CE" strokeWidth="1.5"/>
                              </svg>
                            </div>
                            <input
                              type="text"
                              value={instruction.Email || ''}
                              readOnly
                              style={{
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: 15,
                                color: '#061733',
                                padding: '0 12px',
                                width: '100%',
                                minWidth: 0,
                                fontWeight: 500,
                                height: '100%',
                                cursor: 'default',
                              }}
                              tabIndex={-1}
                            />
                          </div>
                          {/* Phone */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            flex: 1,
                            minWidth: 0,
                            background: '#f8f9fa',
                            border: '1.5px solid #e1dfdd',
                            borderRadius: 6,
                            boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                            height: 38,
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              background: '#fff',
                              borderRight: '1.5px solid #e1dfdd',
                              height: '100%',
                              width: 38,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" fill="#3690CE"/></svg>
                            </div>
                            <input
                              type="text"
                              value={instruction.Phone || ''}
                              readOnly
                              style={{
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: 15,
                                color: '#061733',
                                padding: '0 12px',
                                width: '100%',
                                minWidth: 0,
                                fontWeight: 500,
                                height: '100%',
                                cursor: 'default',
                              }}
                              tabIndex={-1}
                            />
                          </div>
                        </div>
                    </div>
                  </div>
                )}
            </>
            <div
                className={cardClass}
                style={{
                    ...style,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                    marginTop: 0,
                    borderTop: 'none',
                    marginBottom: 0,
                    boxShadow: 'none',
                    padding: 0, // Remove all padding from the card container
                }}
                ref={innerRef}
            >
                {/* Status boxes always visible */}
                <div className="instruction-grid-4x2" style={{
                    marginTop: 0,
                    marginBottom: 0,
                    transition: 'margin-top 0.3s',
                    padding: '16px 16px', // match horizontal padding to banner/email/phone
                }}>
                    <div className="interactive-status status-row" style={{gap: 4, padding: 0, margin: 0, marginTop: 0}}>
                        {statusData.map((d, i) => {
                            const status = (d.status ?? '').toString().toLowerCase();
                            let icon = null;
                            // Special case for Docs: show grey tick if 0, green if >0
                            if (d.key === 'docs') {
                                const docsCount = documents?.length ?? documentCount ?? 0;
                                if (docsCount > 0) {
                                    icon = (
                                        <svg viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="11" fill="#fff" />
                                            <polyline
                                                points="6,13 11,18 18,7"
                                                fill="none"
                                                stroke="#20b26c"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    );
                                } else {
                                    icon = (
                                        <svg viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="11" fill="#fff" />
                                            <polyline
                                                points="6,13 11,18 18,7"
                                                fill="none"
                                                stroke="#bdbdbd"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    );
                                }
                            } else if (d.key === 'deal' && status === 'missing') {
                                // Grey cross for missing deal
                                icon = (
                                    <svg viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="11" fill="#fff" />
                                        <line x1="7" y1="7" x2="17" y2="17" stroke="#bdbdbd" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="17" y1="7" x2="7" y2="17" stroke="#bdbdbd" strokeWidth="2.5" strokeLinecap="round" />
                                    </svg>
                                );
                            } else if (d.status) {
                                if (["complete", "closed", "verified", "approved"].includes(status)) {
                                    icon = (
                                        <svg viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="11" fill="#fff" />
                                            <polyline
                                                points="6,13 11,18 18,7"
                                                fill="none"
                                                stroke="#20b26c"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    );
                                } else if (status === "failed") {
                                    icon = (
                                        <svg viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="11" fill="#fff" />
                                            <line x1="7" y1="7" x2="17" y2="17" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" />
                                            <line x1="17" y1="7" x2="7" y2="17" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" />
                                        </svg>
                                    );
                                } else if (status === "review") {
                                    icon = (
                                        <svg viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="11" fill="#fff" />
                                            <line x1="7" y1="7" x2="17" y2="17" stroke="#bfa100" strokeWidth="2.5" strokeLinecap="round" />
                                            <line x1="17" y1="7" x2="7" y2="17" stroke="#bfa100" strokeWidth="2.5" strokeLinecap="round" />
                                        </svg>
                                    );
                                } else if (status === "flagged") {
                                    icon = (
                                        <svg viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="11" fill="#fff" />
                                            <polygon points="12,7 15,16 9,16" fill="#bfa100" />
                                        </svg>
                                    );
                                } else {
                                    icon = (
                                        <svg viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="11" fill="#fff" />
                                            <circle cx="12" cy="12" r="4" fill="#bdbdbd" />
                                        </svg>
                                    );
                                }
                            }
                            const isSelected = selectedStatus === d.key;
                            // Use green for completed, red for failed, blue for selected, helix grey otherwise
                            const ctaRed = '#e74c3c';
                            const ctaRedFill = '#fdeaea';
                            const blue = '#3690CE';
                            const green = '#20b26c';
                            const greenFill = '#e6f7ef';
                            const helixGrey = '#e0e0e0';
                            const helixGreyFill = '#f4f4f6';
                            const hoverFill = '#e3f0fc';
                            let border = `1px solid ${helixGrey}`;
                            let background = helixGreyFill;
                            if (status === "failed") {
                                border = `1px solid ${ctaRed}`;
                                background = ctaRedFill;
                            } else if (status === "review") {
                                border = '1px solid #bfa100';
                                background = '#fffbe6';
                            } else if (["complete", "closed", "verified", "approved"].includes(status)) {
                                border = `1px solid ${green}`;
                                background = greenFill;
                            }
                            if (isSelected) {
                                border = `1px solid ${blue}`;
                                background = hoverFill;
                            }
    // ...existing code...
    return (
                                <div
                                    key={d.key}
                                    className={`status-item ${d.key}${isSelected ? ' active' : ''}`}
                                    onClick={() => {
                                        if (isSelected) {
                                            setSelectedStatus(null);
                                        } else {
                                            setSelectedStatus(d.key);
                                        }
                                    }}
                                    style={{
                                        border,
                                        background,
                                        borderRadius: 0,
                                        transition: 'background 0.2s, border 0.2s',
                                        boxShadow: 'none',
                                        cursor: 'pointer',
                                        margin: 0,
                                        padding: '4px 8px 4px 8px',
                                        minWidth: 0,
                                    }}
                                >
                                    <span className="status-label">{d.label}</span>
                                    <span className={`status-value ${status}`}>{icon}</span>
                                </div>
                            );
                        })}
                    </div>
                    {/* Details for status boxes (now between status and actions) */}
                    {!collapsed && selectedStatus && (
                        <div className="status-details-below">
                            <div className="instruction-details">
                                {selectedStatus === 'deal' && (
                                    <div className="client-details-contact-bigrow" style={{marginBottom: 0}}>
                                        {(deals && deals.length > 0 ? deals : deal ? [deal] : []).map((d, idx) => (
                                            <div className="client-details-contact-bigbtn static" key={idx} style={{background: '#fff', border: '2px solid #e1dfdd', boxShadow: '0 1px 2px rgba(6,23,51,0.04)', padding: '12px 18px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, flex: 1, marginRight: deals && deals.length > 1 && idx < deals.length - 1 ? 12 : 0}}>
                                                {/* Main fields */}
                                                {d.ServiceDescription && (
                                                    <div style={{fontWeight: 600, fontSize: 16, color: '#061733', marginBottom: 4}}>{d.ServiceDescription}</div>
                                                )}
                                                {typeof d.Amount === 'number' && (
                                                    <div style={{fontSize: 15, color: '#3690CE', marginBottom: 2}}>
                                                        £{d.Amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                    </div>
                                                )}
                                                {d.AreaOfWork && (
                                                    <div style={{fontSize: 14, color: '#888', marginBottom: 4}}>{d.AreaOfWork}</div>
                                                )}
                                                {/* All other fields */}
                                                <div style={{marginTop: 6, fontSize: 13, color: '#444'}}>
                                                    {Object.entries(d).filter(([k]) => !['ServiceDescription','Amount','AreaOfWork'].includes(k)).map(([k, v]) => (
                                                        <div key={k}><strong>{k}:</strong> {formatValue(k, v)}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {selectedStatus === 'id' && (
                                    <div className="detail-group open">
                                        <div className="detail-summary">ID Details</div>
                                        <ul className="detail-list">
                                            {Object.entries(instruction)
                                                .filter(([k, v]) => !['Email', 'Phone'].includes(k) && (['string', 'number', 'boolean'].includes(typeof v) || v === null))
                                                .map(([k, v]) => (
                                                    <li key={k}><strong>{k}:</strong> {formatValue(k, v)}</li>
                                                ))}
                                            {(eids && eids.length > 0
                                                ? eids
                                                : eid
                                                    ? [eid]
                                                    : []
                                            ).map((e, idx) => (
                                                <React.Fragment key={idx}>
                                                    {eids && eids.length > 1 && (
                                                        <li><em>ID Verification {idx + 1}</em></li>
                                                    )}
                                                     {Object.entries(e).map(([k, v]) => (
                                                        <li key={`${idx}-${k}`}><strong>{k}:</strong> {formatValue(k, v)}</li>
                                                     ))}
                                                </React.Fragment>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {selectedStatus === 'pay' && (
                                    <div className="detail-group open">
                                        <div className="detail-summary">Payment</div>
                                        <ul className="detail-list">
                                            {Object.entries(instruction)
                                                .filter(([k]) =>
                                                    k.startsWith('Payment') || ['AliasId', 'OrderId', 'SHASign'].includes(k)
                                                )
                                                .map(([k, v]) => (
                                                    <li key={k}><strong>{k}:</strong> {formatValue(k, v)}</li>
                                                ))}
                                        </ul>
                                    </div>
                                )}
                                {selectedStatus === 'docs' && (
                                    <div className="detail-group open">
                                        <div className="detail-summary">Documents</div>
                                        <ul className="detail-list">
                                            <li><strong>Documents Uploaded:</strong> {documents?.length ?? documentCount ?? 0}</li>
                                            {documents?.map((d, idx) => (
                                                <React.Fragment key={idx}>
                                                    {documents.length > 1 && (
                                                        <li><em>Document {idx + 1}</em></li>
                                                    )}
                                                    {Object.entries(d).map(([k, v]) => (
                                                        <li key={`${idx}-${k}`}><strong>{k}:</strong> {formatValue(k, v)}</li>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {selectedStatus === 'eid' && (
                                    <div className="detail-group open">
                                        <div className="detail-summary">Verify an ID</div>
                                        <ul className="detail-list">
                                             {eid && Object.entries(eid).map(([k,v]) => (
                                                <li key={k}><strong>{k}:</strong> {formatValue(k, v)}</li>
                                             ))}
                                        </ul>
                                    </div>
                                )}
                                {selectedStatus === 'risk' && (
                                    <div className="detail-group open">
                                        <div className="detail-summary">Assess Risk</div>
                                        <ul className="detail-list">
                                             {risk && Object.entries(risk).map(([k, v]) => (
                                                <li key={k}><strong>{k}:</strong> {formatValue(k, v)}</li>
                                             ))}
                                        </ul>
                                    </div>
                                )}
                                {selectedStatus === 'comp' && (
                                    <div className="detail-group open">
                                        <div className="detail-summary">Compliance</div>
                                        <ul className="detail-list">
                                             {compliance && Object.entries(compliance).map(([k,v]) => (
                                                <li key={k}><strong>{k}:</strong> {formatValue(k, v)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default InstructionCard;