import React, { useState } from 'react';
import { mergeStyles } from '@fluentui/react';
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
    animationDelay?: number;
    onOpenMatter?: () => void;
    onRiskAssessment?: () => void;
    onEIDCheck?: () => void;
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
    animationDelay = 0,
    onOpenMatter,
    onRiskAssessment,
    onEIDCheck,
}) => {
    const cardClass = mergeStyles('instructionCard', {
        backgroundColor: colours.light.sectionBackground,
        padding: componentTokens.card.base.padding,
        boxShadow: componentTokens.card.base.boxShadow,
        color: colours.light.text,
        height: '100%',
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
                return new Date(value).toLocaleDateString();
            } catch {
                return value;
            }
        }
        return value;
    };
    const openDisabled = !risk?.RiskAssessmentResult || eid?.EIDStatus?.toLowerCase() !== 'verified';
    const [activeTab, setActiveTab] = useState<'eid' | 'risk' | 'matter'>('eid');

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

    return (
        <div className={cardClass} style={style}>
            <header className="instruction-header">{instruction.InstructionRef}</header>
            <div className="bottom-tabs">
                <button
                    type="button"
                    className={`bottom-tab ${activeTab === 'eid' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('eid'); onEIDCheck?.(); }}
                    aria-label="EID Check"
                >
                    <span className="icon-hover">
                        {React.createElement(iconMap.eid.outline, { className: 'icon-outline' })}
                        {React.createElement(iconMap.eid.filled, { className: 'icon-filled' })}
                    </span>
                    <span>EID Check</span>
                </button>
                <button
                    type="button"
                    className={`bottom-tab ${activeTab === 'risk' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('risk'); onRiskAssessment?.(); }}
                    aria-label="Risk"
                >
                    <span className="icon-hover">
                        {React.createElement(iconMap.risk.outline, { className: 'icon-outline' })}
                        {React.createElement(iconMap.risk.filled, { className: 'icon-filled' })}
                    </span>
                    <span>Risk</span>
                </button>
                <button
                    type="button"
                    className={`bottom-tab ${activeTab === 'matter' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('matter'); onOpenMatter?.(); }}
                    disabled={openDisabled}
                    aria-label="Open Matter"
                >
                    <span className="icon-hover">
                        {React.createElement(iconMap.matter.outline, { className: 'icon-outline' })}
                        {React.createElement(iconMap.matter.filled, { className: 'icon-filled' })}
                    </span>
                    <span>Open Matter</span>
                </button>
            </div>
            <div className="instruction-details">
                {sections.map((section) => {
                    const items: [string, string][] = section.fields as any;
                    const details = items
                        .map(([key, label]) => {
                            const raw = (instruction as any)[key];
                            const val = formatValue(key, raw);
                            if (val === null || val === undefined || val === '') return null;
                            return (
                                <li key={key}><strong>{label}:</strong> {String(val)}</li>
                            );
                        })
                        .filter(Boolean);

                    // Append deal/prospect fields to General section
                    if (section.title === 'General') {
                        if (prospectId !== undefined) {
                            details.unshift(<li key="prospect"><strong>Prospect ID:</strong> {prospectId}</li>);
                        }
                        if (deal?.ServiceDescription) {
                            details.push(<li key="service"><strong>Service:</strong> {deal.ServiceDescription}</li>);
                        }
                        if (deal?.AreaOfWork) {
                            details.push(<li key="area"><strong>Area:</strong> {deal.AreaOfWork}</li>);
                        }
                        if (deal?.Amount !== undefined) {
                            details.push(<li key="amount"><strong>Amount:</strong> £{deal.Amount}</li>);
                        }
                    }

                    if (details.length === 0) return null;

                    return (
                        <details className="detail-group" key={section.title} open={section.title === 'General'}>
                            <summary>{section.icon} {section.title}</summary>
                            <ul className="detail-list">
                                {details}
                            </ul>
                        </details>
                    );
                })}
            </div>
        </div>
    );
};

export default InstructionCard;
