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
    risk?: { RiskAssessmentResult?: string; RiskScore?: number } | null;
    eid?: { EIDStatus?: string } | null;
    compliance?: any | null;
    documentCount?: number;
    animationDelay?: number;
    onOpenMatter?: () => void;
    onRiskAssessment?: () => void;
    onEIDCheck?: () => void;
    innerRef?: React.Ref<HTMLDivElement>;
    expanded?: boolean;
    onToggle?: () => void;
}

const iconMap = {
    eid: { outline: FaRegIdBadge, filled: FaIdBadge },
    risk: { outline: MdOutlineAssessment, filled: MdAssessment },
    matter: { outline: FaRegFileAlt, filled: FaFileAlt },
};

const InstructionCard: React.FC<InstructionCardProps> = ({
    instruction,
    deal,
    deals,
    clients,
    prospectId,
    risk,
    eid,
    compliance,
    documentCount,
    animationDelay = 0,
    onOpenMatter,
    onRiskAssessment,
    onEIDCheck,
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
        if (!value) return null;
        const dateKeys = ['SubmissionDate', 'LastUpdated', 'DOB', 'PaymentTimestamp'];
        if (dateKeys.includes(key) && typeof value === 'string') {
            try {
                return format(new Date(value), 'd MMM yyyy');
            } catch {
                return value;
            }
        }
        return value;
    };

    const proofOfIdComplete = Boolean(
        instruction.PassportNumber || instruction.DriversLicenseNumber
    );
    const paymentStatusRaw = instruction.PaymentResult?.toLowerCase();
    const paymentComplete = paymentStatusRaw === 'successful';
    const paymentFailed = paymentStatusRaw === 'failed';
    const documentsComplete = (documentCount ?? 0) > 0;
    const eidStatus = eid?.EIDStatus ?? '-';
    const complianceStatus = (compliance as any)?.Status ?? '-';
    const dealOpen = (deals ?? []).some((d: any) => d.Status?.toLowerCase() !== 'closed');
    const uniqueClients = clients ? Array.from(new Set(clients.map(c => c.ClientEmail))).length : 0;
    const leadName = instruction
        ? (instruction.FirstName || instruction.LastName)
            ? `${instruction.FirstName ?? ''} ${instruction.LastName ?? ''}`.trim()
            : instruction.CompanyName ?? clients?.find(c => c.Lead)?.ClientEmail ?? ''
        : deal?.ServiceDescription ?? '';

    const eidVerified = eidStatus.toLowerCase() === 'verified';
    const compliancePassed = complianceStatus.toLowerCase() === 'pass';
    const verifyIdComplete = proofOfIdComplete && eidVerified && compliancePassed;
    const riskAssessed = Boolean(risk?.RiskAssessmentResult);
    const dealClosed = !dealOpen;
    const openMatterReady = dealClosed && paymentComplete && eidVerified && compliancePassed;
    const openDisabled = !openMatterReady;

    const [activeTab, setActiveTab] = useState<'eid' | 'risk' | 'matter'>(() => {
        if (!verifyIdComplete) return 'eid';
        if (!riskAssessed || !openMatterReady) return 'risk';
        return 'matter';
    });

    useEffect(() => {
        if (!verifyIdComplete) setActiveTab('eid');
        else if (!riskAssessed || !openMatterReady) setActiveTab('risk');
        else setActiveTab('matter');
    }, [verifyIdComplete, riskAssessed, openMatterReady]);

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
        { key: 'clients', label: 'Clients', value: uniqueClients },
        { key: 'id', label: 'ID', status: proofOfIdComplete ? 'complete' : 'pending' },
        {
            key: 'pay',
            label: 'Pay',
            status: paymentComplete ? 'complete' : paymentFailed ? 'failed' : 'pending',
        },
        { key: 'docs', label: 'Docs', status: documentsComplete ? 'complete' : 'pending' },
        { key: 'eid', label: 'EID', status: eidStatus.toLowerCase() === 'verified' ? 'complete' : 'pending' },
        {
            key: 'comp',
            label: 'Comp.',
            status: complianceStatus.toLowerCase() === 'pass' ? 'complete' : 'pending',
        },
        { key: 'risk', label: 'Risk', value: risk?.RiskAssessmentResult ?? '-' },
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
                    const value = d.value ?? null;
                    const icon = d.status
                        ? status === 'complete' || status === 'closed'
                            ? <FaCheckCircle />
                            : status === 'failed'
                                ? <FaTimesCircle />
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
                                <span className="status-value">{value}</span>
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
                                {deal?.ServiceDescription && (
                                    <li><strong>Service:</strong> {deal.ServiceDescription}</li>
                                )}
                                {deal?.AreaOfWork && (
                                    <li><strong>Area:</strong> {deal.AreaOfWork}</li>
                                )}
                                {deal?.Amount != null && (
                                    <li><strong>Amount:</strong> £{deal.Amount}</li>
                                )}
                            </ul>
                        </div>
                    )}
                    {selectedStatus === 'clients' && (
                        <div className="detail-group open">
                            <div className="detail-summary">Clients</div>
                            <ul className="detail-list">
                                {clients && clients.map(c => (
                                    <li key={c.ClientEmail}>
                                        {c.ClientEmail} {c.Lead ? '(Lead)' : ''}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {selectedStatus === 'id' && (
                        <div className="detail-group open">
                            <div className="detail-summary">ID Details</div>
                            <ul className="detail-list">
                                {instruction.PassportNumber && (
                                    <li><strong>Passport:</strong> {instruction.PassportNumber}</li>
                                )}
                                {instruction.DriversLicenseNumber && (
                                    <li><strong>DL Number:</strong> {instruction.DriversLicenseNumber}</li>
                                )}
                                {instruction.IdType && (
                                    <li><strong>ID Type:</strong> {instruction.IdType}</li>
                                )}
                            </ul>
                        </div>
                    )}
                    {selectedStatus === 'pay' && (
                        <div className="detail-group open">
                            <div className="detail-summary">Payment</div>
                            <ul className="detail-list">
                                {instruction.PaymentMethod && (
                                    <li><strong>Method:</strong> {instruction.PaymentMethod}</li>
                                )}
                                {instruction.PaymentResult && (
                                    <li><strong>Result:</strong> {instruction.PaymentResult}</li>
                                )}
                                {instruction.PaymentAmount != null && (
                                    <li><strong>Amount:</strong> £{instruction.PaymentAmount}</li>
                                )}
                                {instruction.PaymentProduct && (
                                    <li><strong>Product:</strong> {instruction.PaymentProduct}</li>
                                )}
                                {instruction.PaymentTimestamp && (
                                    <li><strong>Timestamp:</strong> {formatValue('PaymentTimestamp', instruction.PaymentTimestamp)}</li>
                                )}
                            </ul>
                        </div>
                    )}
                    {selectedStatus === 'docs' && (
                        <div className="detail-group open">
                            <div className="detail-summary">Documents</div>
                            <ul className="detail-list">
                                <li><strong>Documents Uploaded:</strong> {documentCount ?? 0}</li>
                            </ul>
                        </div>
                    )}
                    {selectedStatus === 'eid' && (
                        <div className="detail-group open">
                            <div className="detail-summary">EID Check</div>
                            <ul className="detail-list">
                                {eid && Object.entries(eid).map(([k,v]) => (
                                    <li key={k}><strong>{k}:</strong> {String(v)}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {selectedStatus === 'comp' && (
                        <div className="detail-group open">
                            <div className="detail-summary">Compliance</div>
                            <ul className="detail-list">
                                {compliance && Object.entries(compliance).map(([k,v]) => (
                                    <li key={k}><strong>{k}:</strong> {String(v)}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {selectedStatus === 'risk' && (
                        <div className="detail-group open">
                            <div className="detail-summary">Risk</div>
                            <ul className="detail-list">
                                {risk && Object.entries(risk).map(([k,v]) => (
                                    <li key={k}><strong>{k}:</strong> {String(v)}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="bottom-tabs">
                    {[
                        {
                            key: 'eid',
                            label: 'Verify ID',
                            title: verifyIdComplete ? 'ID Verified' : undefined,
                            icon: iconMap.eid,
                            onClick: () => { setActiveTab('eid'); onEIDCheck?.(); },
                            complete: verifyIdComplete,
                        },
                        {
                            key: 'risk',
                            label: 'Assess Risk',
                            title: riskAssessed ? 'Risk Assessed' : undefined,
                            icon: iconMap.risk,
                            onClick: () => { setActiveTab('risk'); onRiskAssessment?.(); },
                            complete: riskAssessed,
                        },
                        {
                            key: 'matter',
                            label: 'Open Matter',
                            icon: iconMap.matter,
                            onClick: () => { setActiveTab('matter'); onOpenMatter?.(); },
                            disabled: openDisabled,
                        },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            className={`bottom-tab ${activeTab === tab.key ? 'active' : ''}${tab.complete ? ' complete' : ''}`}
                            onClick={tab.onClick}
                            aria-label={tab.label}
                            disabled={tab.disabled}
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