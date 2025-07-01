import React, { useState, useEffect } from 'react';
import { mergeStyles } from '@fluentui/react';
import { format } from 'date-fns';
import {
    FaIdBadge,
    FaRegIdBadge,
    FaFileAlt,
    FaRegFileAlt,
    FaChevronDown,
    FaCheckCircle,
    FaClock,
    FaTimesCircle,
    FaExclamationTriangle,
} from 'react-icons/fa';
import { MdAssessment, MdOutlineAssessment } from 'react-icons/md';
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
    onOpenMatter?: () => void;
    onRiskAssessment?: (item?: any) => void;
    onEIDCheck?: () => void;
    onDraftCCL?: () => void;
    innerRef?: React.Ref<HTMLDivElement>;
    expanded?: boolean;
    onToggle?: () => void;
}

const iconMap = {
    eid: { outline: FaRegIdBadge, filled: FaIdBadge },
    risk: { outline: MdOutlineAssessment, filled: MdAssessment },
    matter: { outline: FaRegFileAlt, filled: FaFileAlt },
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
    onOpenMatter,
    onRiskAssessment,
    onEIDCheck,
    onDraftCCL,
    innerRef,
    expanded = false,
    onToggle,
}) => {
    const stage = instruction.Stage?.toLowerCase();
    const isCompleted = stage === 'completed';
    const isInitialised = stage === 'initialised';

    const [collapsed, setCollapsed] = useState(!expanded);

    useEffect(() => {
        setCollapsed(!expanded);
    }, [expanded]);

    const cardClass = mergeStyles('instructionCard', collapsed && 'collapsed', {
        backgroundColor: colours.light.sectionBackground,
        padding: componentTokens.card.base.padding,
        boxShadow: isCompleted
            ? `inset 0 0 8px ${colours.green}55, ${componentTokens.card.base.boxShadow}`
            : componentTokens.card.base.boxShadow,
        color: colours.light.text,
        height: 'auto',
        border: `2px solid ${isCompleted ? colours.green : 'transparent'}`,
        opacity: isCompleted ? 0.6 : 1,
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
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

    const [activeTab, setActiveTab] = useState<'eid' | 'risk' | 'matter' | 'ccl'>(() => {
        if (verifyIdStatus !== 'complete') return 'eid';
        if (!riskAssessed || !openMatterReady) return 'risk';
        return 'matter';
    });

    useEffect(() => {
        if (verifyIdStatus !== 'complete') setActiveTab('eid');
        else if (!riskAssessed || !openMatterReady) setActiveTab('risk');
        else setActiveTab('matter');
    }, [verifyIdStatus, riskAssessed, openMatterReady]);

    const [selectedStatus, setSelectedStatus] = useState<string>('deal');

    const isPoid = stage === 'poid';

    const bannerText = isCompleted
        ? 'Instructions Received'
        : isInitialised
            ? 'Pending Instructions'
            : isPoid
                ? 'Proof of Identity Received'
                : null;
    const bannerClass = mergeStyles('instruction-banner', {
        background: isCompleted || isPoid
            ? componentTokens.successBanner.background
            : componentTokens.infoBanner.background,
        borderLeft: isCompleted || isPoid
            ? componentTokens.successBanner.borderLeft
            : componentTokens.infoBanner.borderLeft,
        padding: componentTokens.infoBanner.padding,
        fontSize: '0.875rem',
    });

    const statusData = [
        { key: 'deal', label: 'Deal', status: dealOpen ? 'open' : 'closed' },
        { key: 'id', label: 'Proof of ID', status: idStatus },
        {
            key: 'pay',
            label: 'Pay',
            status: paymentComplete ? 'complete' : paymentFailed ? 'failed' : 'pending',
        },
        { key: 'docs', label: 'Docs', status: documentsComplete ? 'complete' : 'pending' },
        { key: 'risk', label: 'Risk', status: riskStatus },
    ];

    return (
        <div className={cardClass} style={style} ref={innerRef}>
            <header
                className="instruction-header"
                onClick={() => {
                    setCollapsed(!collapsed);
                    onToggle?.();
                }}
            >
                {isCompleted && (
                    <span className="completion-tick visible" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                            <polyline
                                points="5,13 10,18 19,7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                )}
                <span className="header-title">
                    {instruction.InstructionRef}
                    {leadName && <span className="lead-client">{leadName}</span>}
                </span>
                <FaChevronDown className="chevron-icon" />
            </header>
            {bannerText && <div className={bannerClass}>{bannerText}</div>}

            <div className="interactive-status status-row">
                {statusData.map((d, i) => {
                    const status = (d.status ?? '').toString().toLowerCase();
                    const icon = d.status
                        ? ['complete', 'closed', 'verified', 'approved'].includes(status)
                            ? <FaCheckCircle />
                            : status === 'failed'
                                ? <FaTimesCircle />
                                : status === 'flagged'
                                    ? <FaExclamationTriangle />
                                    : <FaClock />
                        : null;
                    return (
                        <div
                            key={i}
                            className={`status-item ${d.key}${selectedStatus === d.key ? ' active' : ''}`}
                            onClick={() => setSelectedStatus(d.key)}
                        >
                            <span className="status-label">{d.label}</span>
                            {icon ? (
                                <span className={`status-value ${status}`}>{icon}</span>
                            ) : (
                                <span className="status-value"></span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="card-content">
                <div className="instruction-details">
                    {selectedStatus === 'deal' && (
                        <div className="detail-group open">
                            <div className="detail-summary">Deal Info</div>
                            <ul className="detail-list">
                                {prospectId != null && (
                                    <li><strong>Prospect ID:</strong> {prospectId}</li>
                                )}
                                {(deals && deals.length > 0
                                    ? deals
                                    : deal
                                        ? [deal]
                                        : [])
                                    .map((d, idx) => (
                                        <React.Fragment key={idx}>
                                            {deals && deals.length > 1 && (
                                                <li><em>Deal {idx + 1}</em></li>
                                            )}
                                            {Object.entries(d).map(([k, v]) => (
                                                <li key={`${idx}-${k}`}><strong>{k}:</strong> {formatValue(k, v)}</li>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                {clients && clients.length > 0 && (
                                    <React.Fragment>
                                        <li><em>Joint Clients</em></li>
                                        {clients.map((c, cidx) => (
                                            <React.Fragment key={`c-${cidx}`}>
                                                {Object.entries(c).map(([k, v]) => (
                                                    <li key={`c-${cidx}-${k}`}><strong>{k}:</strong> {formatValue(k, v)}</li>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                )}
                            </ul>
                        </div>
                    )}
                    {selectedStatus === 'id' && (
                        <div className="detail-group open">
                            <div className="detail-summary">ID Details</div>
                            <ul className="detail-list">
                                {Object.entries(instruction)
                                    .filter(([, v]) => ['string', 'number', 'boolean'].includes(typeof v) || v === null)
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

                <div className="bottom-tabs">
                    {[
                        {
                            key: 'eid',
                            label: verifyIdLabel,
                            title: verifyIdStatus === 'complete' ? 'ID Verified' : undefined,
                            icon: iconMap.eid,
                            onClick: () => { setActiveTab('eid'); onEIDCheck?.(); },
                            status: verifyTabStatus,
                        },
                        {
                            key: 'risk',
                            label: 'Assess Risk',
                            title: riskAssessed ? 'Risk Assessed' : undefined,
                            icon: iconMap.risk,
                            onClick: () => { setActiveTab('risk'); onRiskAssessment?.({ instruction, risk }); },
                            status: riskAssessed ? 'complete' : 'ready',
                        },
                        {
                            key: 'matter',
                            label: 'Open Matter',
                            icon: iconMap.matter,
                            onClick: () => { setActiveTab('matter'); onOpenMatter?.(); },
                            status: openMatterReady ? 'ready' : 'pending',
                        },
                        {
                            key: 'ccl',
                            label: 'Draft CCL',
                            icon: iconMap.ccl,
                            onClick: () => { setActiveTab('ccl'); onDraftCCL?.(); },
                            status: 'ready',
                        },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            className={`bottom-tab ${tab.status} ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={tab.onClick}
                            aria-label={tab.label}
                            disabled={tab.status === 'pending'}
                            title={tab.title}
                        >
                            <span className="icon-hover">
                                {React.createElement(tab.icon.outline, { className: 'icon-outline' })}
                                {React.createElement(tab.icon.filled, { className: 'icon-filled' })}
                            </span>
                            <span className="label">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
);
};

export default InstructionCard;