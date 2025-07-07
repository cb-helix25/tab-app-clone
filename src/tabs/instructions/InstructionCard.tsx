import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
// invisible change
//
import { mergeStyles } from '@fluentui/react';
import { format } from 'date-fns';
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
    ServiceDescription?: string;
    Amount?: number;
    AreaOfWork?: string;
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



    // Status row logic: always show Deal and ID, but only show Pay and Docs if a deal exists
    const statusData = [
        // Deal status: show a grey cross if missing, not a red one
        { key: 'deal', label: 'Deal', status: dealMissing ? 'missing' : dealOpen ? 'open' : 'closed' },
        { key: 'id', label: 'Proof of ID', status: idStatus },
        // Only show Pay and Docs if a deal exists
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
                {/* Remove tick indicator */}
                <span className="header-title" style={{ fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span>{leadName}</span>
                    {/* Vertical separator: visible on both backgrounds */}
                    <span style={{
                        display: 'inline-block',
                        width: 1,
                        height: 20,
                        background: !collapsed ? 'rgba(255,255,255,0.35)' : '#b0b0b0',
                        margin: '0 12px',
                        verticalAlign: 'middle',
                        alignSelf: 'center',
                    }} />
                    {/* Instruction Ref, non-bold, lighter color */}
                    <span style={{ fontWeight: 400, color: !collapsed ? 'rgba(255,255,255,0.7)' : '#888', fontSize: 16, letterSpacing: 0.2, alignSelf: 'center' }}>
                        {instruction.InstructionRef || '—'}
                    </span>
                    {/* Selected indicator */}
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
                }}
                ref={innerRef}
            >
                {/* Animated details wrapper */}
                <div
                    style={{
                        maxHeight: collapsed ? 0 : 1000,
                        opacity: collapsed ? 0 : 1,
                        overflow: 'hidden',
                        transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s cubic-bezier(0.4,0,0.2,1)',
                    }}
                >
                    {showClientDetails && (
                        <React.Fragment>
                            <div className="client-details-banner">
                                <div
                                    className="client-details-contact-bigrow"
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        gap: 20,
                                        background: '#fff',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 0,
                                        boxShadow: 'none',
                                        padding: '14px 20px',
                                        marginBottom: 0,
                                        minWidth: 0,
                                        width: '100%',
                                    }}
                                >
                                    {/* Email */}
                                    <a
                                        className={`client-details-contact-bigbtn${instruction.Email ? '' : ' disabled'}`}
                                        style={{ borderRadius: 0, minWidth: 0, flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 8, padding: 0, background: 'none', border: 'none', boxShadow: 'none' }}
                                        href={instruction.Email ? `mailto:${instruction.Email}` : undefined}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={instruction.Email || ''}
                                        tabIndex={instruction.Email ? 0 : -1}
                                    >
                                        <span className="client-details-contact-icon" aria-hidden="true">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{display:'block', verticalAlign:'middle'}}>
                                              <rect x="2" y="4" width="20" height="16" rx="3" fill="none" stroke="#3690CE" strokeWidth="2"/>
                                              <polyline points="4,6 12,13 20,6" fill="none" stroke="#3690CE" strokeWidth="2"/>
                                            </svg>
                                        </span>
                                        <span className="client-details-contact-value">{instruction.Email || '—'}</span>
                                    </a>
                                    {/* Phone */}
                                    <a
                                        className={`client-details-contact-bigbtn${instruction.Phone ? '' : ' disabled'}`}
                                        style={{ borderRadius: 0, minWidth: 0, flex: '1 1 180px', display: 'flex', alignItems: 'center', gap: 8, padding: 0, background: 'none', border: 'none', boxShadow: 'none' }}
                                        href={instruction.Phone ? `tel:${instruction.Phone}` : undefined}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={instruction.Phone || ''}
                                        tabIndex={instruction.Phone ? 0 : -1}
                                    >
                                        <span className="client-details-contact-icon" aria-hidden="true">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" fill="#3690CE"/></svg>
                                        </span>
                                        <span className="client-details-contact-value">{instruction.Phone || '—'}</span>
                                    </a>
                                </div>
                            </div>
                        </React.Fragment>
                    )}
                </div>
                {/* Status boxes always visible */}
                <div className="instruction-grid-4x2" style={{marginTop: collapsed ? 0 : 16, transition: 'margin-top 0.3s'}}>
                    <div className="interactive-status status-row">
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
                                } else if (["failed", "review"].includes(status)) {
                                    icon = (
                                        <svg viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="11" fill="#fff" />
                                            <line x1="7" y1="7" x2="17" y2="17" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" />
                                            <line x1="17" y1="7" x2="7" y2="17" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" />
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
                            if (["failed", "review"].includes(status)) {
                                border = `1px solid ${ctaRed}`;
                                background = ctaRedFill;
                            } else if (["complete", "closed", "verified", "approved"].includes(status)) {
                                border = `1px solid ${green}`;
                                background = greenFill;
                            }
                            if (isSelected) {
                                border = `1px solid ${blue}`;
                                background = hoverFill;
                            }
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
                                        <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                                            {/* Email field */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                        <rect x="2" y="4" width="20" height="16" rx="3" fill="none" stroke="#3690CE" strokeWidth="1.5"/>
                                                        <polyline points="4,6 12,13 20,6" fill="none" stroke="#3690CE" strokeWidth="1.5"/>
                                                    </svg>
                                                </span>
                                                <span style={{ fontSize: 15, color: '#061733', wordBreak: 'break-all' }}>{instruction.Email || '—'}</span>
                                            </div>
                                            {/* Phone field */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" fill="#3690CE"/></svg>
                                                </span>
                                                <span style={{ fontSize: 15, color: '#061733', wordBreak: 'break-all' }}>{instruction.Phone || '—'}</span>
                                            </div>
                                        </div>
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