import React, { useState } from 'react';
import { mergeStyles } from '@fluentui/react';
import { format } from 'date-fns';
import {
    FaIdBadge,
    FaRegIdBadge,
    FaFileAlt,
    FaRegFileAlt,
    FaUser,
    FaPhone,
    FaAddressCard,
    FaBuilding,
    FaIdCard,
    FaMoneyBillWave,
    FaInfoCircle,
    FaChevronDown,
} from 'react-icons/fa';
import { MdAssessment, MdOutlineAssessment } from 'react-icons/md';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';
import '../../app/styles/InstructionCard.css';

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
    prospectId?: number;
    risk?: { RiskAssessmentResult?: string; RiskScore?: number } | null;
    eid?: { EIDStatus?: string } | null;
    documentCount?: number;
    animationDelay?: number;
    onOpenMatter?: () => void;
    onRiskAssessment?: () => void;
    onEIDCheck?: () => void;
    innerRef?: React.Ref<HTMLDivElement>;
}

const iconMap = {
    eid: { outline: FaRegIdBadge, filled: FaIdBadge },
    risk: { outline: MdOutlineAssessment, filled: MdAssessment },
    matter: { outline: FaRegFileAlt, filled: FaFileAlt },
};

const InstructionCard: React.FC<InstructionCardProps> = ({
    instruction,
    deal,
    prospectId,
    risk,
    eid,
    documentCount,
    animationDelay = 0,
    onOpenMatter,
    onRiskAssessment,
    onEIDCheck,
    innerRef,
}) => {
    const stage = instruction.Stage?.toLowerCase();
    const isCompleted = stage === 'completed';
    const isInitialised = stage === 'initialised';

    const [collapsed, setCollapsed] = useState(false);

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
    const openDisabled = !risk?.RiskAssessmentResult || eid?.EIDStatus?.toLowerCase() !== 'verified';
    const [activeTab, setActiveTab] = useState<'eid' | 'risk' | 'matter'>('eid');

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

    const sections = [
        {
            title: 'General',
            icon: <FaFileAlt className="group-icon" />, 
            fields: [
                ['Stage', 'Status'],
                ['ClientType', 'Client Type'],
                ['HelixContact', 'Contact'],
                ['InternalStatus', 'Internal Status'],
                ['ConsentGiven', 'Consent'],
                ['SubmissionDate', 'Submitted'],
                ['SubmissionTime', 'Submission Time'],
                ['LastUpdated', 'Last Updated'],
            ],
        },
        {
            title: 'Personal',
            icon: <FaUser className="group-icon" />,
            fields: [
                ['Title', 'Title'],
                ['FirstName', 'First Name'],
                ['LastName', 'Last Name'],
                ['Gender', 'Gender'],
                ['DOB', 'DOB'],
                ['Nationality', 'Nationality'],
                ['NationalityAlpha2', 'ISO'],
            ],
        },
        {
            title: 'Contact',
            icon: <FaPhone className="group-icon" />,
            fields: [
                ['Phone', 'Phone'],
                ['Email', 'Email'],
            ],
        },
        {
            title: 'Documents',
            icon: <FaIdCard className="group-icon" />,
            fields: [
                ['PassportNumber', 'Passport'],
                ['DriversLicenseNumber', 'DL Number'],
                ['IdType', 'ID Type'],
            ],
        },
        {
            title: 'Address',
            icon: <FaAddressCard className="group-icon" />,
            fields: [
                ['HouseNumber', 'House'],
                ['Street', 'Street'],
                ['City', 'City'],
                ['County', 'County'],
                ['Postcode', 'Postcode'],
                ['Country', 'Country'],
                ['CountryCode', 'Country Code'],
            ],
        },
        {
            title: 'Company',
            icon: <FaBuilding className="group-icon" />,
            fields: [
                ['CompanyName', 'Name'],
                ['CompanyNumber', 'Number'],
                ['CompanyHouseNumber', 'House'],
                ['CompanyStreet', 'Street'],
                ['CompanyCity', 'City'],
                ['CompanyCounty', 'County'],
                ['CompanyPostcode', 'Postcode'],
                ['CompanyCountry', 'Country'],
                ['CompanyCountryCode', 'Country Code'],
            ],
        },
        {
            title: 'Payment',
            icon: <FaMoneyBillWave className="group-icon" />,
            fields: [
                ['PaymentMethod', 'Method'],
                ['PaymentResult', 'Result'],
                ['PaymentAmount', 'Amount'],
                ['PaymentProduct', 'Product'],
                ['PaymentTimestamp', 'Timestamp'],
                ['AliasId', 'Alias ID'],
                ['OrderId', 'Order ID'],
                ['SHASign', 'SHA'],
            ],
        },
        {
            title: 'Other',
            icon: <FaInfoCircle className="group-icon" />,
            fields: [
                ['Notes', 'Notes'],
                ['ClientId', 'Client ID'],
                ['RelatedClientId', 'Related Client'],
                ['MatterId', 'Matter ID'],
            ],
        },
    ];

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        sections.forEach(sec => {
            initial[sec.title] = sec.title === 'General';
        });
        return initial;
    });

    const toggleGroup = (title: string) => {
        setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const proofOfIdComplete = Boolean(
        instruction.PassportNumber || instruction.DriversLicenseNumber
    );
    const paymentStatusRaw = instruction.PaymentResult?.toLowerCase();
    const paymentComplete = paymentStatusRaw === 'successful';
    const paymentFailed = paymentStatusRaw === 'failed';
    const documentsComplete = (documentCount ?? 0) > 0;

    const statusData = [
        {
            key: 'id',
            label: 'ID',
            status: proofOfIdComplete ? 'complete' : 'pending',
        },
        {
            key: 'payment',
            label: 'Payment',
            status: paymentComplete ? 'complete' : paymentFailed ? 'failed' : 'pending',
        },
        {
            key: 'docs',
            label: 'Docs',
            status: documentsComplete ? 'complete' : 'pending',
        },
    ];

    return (
        <div className={cardClass} style={style} ref={innerRef}>
            <header className="instruction-header" onClick={() => setCollapsed(!collapsed)}>
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
                <span className="header-title">{instruction.InstructionRef}</span>
                <FaChevronDown className="chevron-icon" />
            </header>
            {bannerText && <div className={bannerClass}>{bannerText}</div>}

            <div className="status-preview">
                {statusData.map((stat) => (
                    <div key={stat.key} className={`status-box ${stat.status}`}>
                        <span className="status-label">{stat.label}</span>
                        <span className="status-icon">
                            {stat.status === 'complete'
                                ? '✔'
                                : stat.status === 'failed'
                                    ? '✖'
                                    : '…'}
                        </span>
                    </div>
                ))}
            </div>

            <div className="card-content">
                <div className="instruction-details">
                    {sections.map((section) => {
                        const items = section.fields as [string, string][];
                        const details = items
                            .map(([key, label]) => {
                                const raw = (instruction as any)[key];
                                const val = formatValue(key, raw);
                                if (val == null || val === '') return null;
                                return <li key={key}><strong>{label}:</strong> {String(val)}</li>;
                            })
                            .filter(Boolean);

                        if (section.title === 'General') {
                            if (prospectId != null) details.unshift(<li key="prospect"><strong>Prospect ID:</strong> {prospectId}</li>);
                            if (deal?.ServiceDescription) details.push(<li key="service"><strong>Service:</strong> {deal.ServiceDescription}</li>);
                            if (deal?.AreaOfWork) details.push(<li key="area"><strong>Area:</strong> {deal.AreaOfWork}</li>);
                            if (deal?.Amount != null) details.push(<li key="amount"><strong>Amount:</strong> £{deal.Amount}</li>);
                        }

                        if (!details.length) return null;
                        const open = openGroups[section.title];
                        return (
                            <div className={`detail-group${open ? ' open' : ''}`} key={section.title}>
                                <div className="detail-summary" onClick={() => toggleGroup(section.title)}>
                                    {section.icon} {section.title}
                                </div>
                                <ul className="detail-list">{details}</ul>
                            </div>
                        );
                    })}
                </div>

                <div className="bottom-tabs">
                    {[
                        { key: 'eid', label: 'Verify ID', icon: iconMap.eid, onClick: () => { setActiveTab('eid'); onEIDCheck?.(); } },
                        { key: 'risk', label: 'Assess Risk', icon: iconMap.risk, onClick: () => { setActiveTab('risk'); onRiskAssessment?.(); } },
                        { key: 'matter', label: 'Open Matter', icon: iconMap.matter, onClick: () => { setActiveTab('matter'); onOpenMatter?.(); }, disabled: openDisabled },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            className={`bottom-tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={tab.onClick}
                            aria-label={tab.label}
                            disabled={tab.disabled}
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