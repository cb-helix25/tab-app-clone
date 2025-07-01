import React from 'react';
import { Text, PrimaryButton } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react';
import {
    parseISO,
    differenceInMinutes,
    differenceInHours,
    differenceInCalendarDays,
    isToday,
    format,
    isValid,
} from 'date-fns';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';
import { sharedPrimaryButtonStyles } from '../../app/styles/ButtonStyles';
import { useTheme } from '../../app/functionality/ThemeContext';
import '../../app/styles/DealCard.css';

interface DealInfo {
    [key: string]: any;
}

interface DealCardProps {
    deal: DealInfo;
    onFollowUp?: () => void;
    animationDelay?: number;
    onOpenInstruction?: () => void;
}

const leftBorderColor = (area?: string) => {
    const normalized = area?.toLowerCase();
    switch (normalized) {
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

const statusColour = (status?: string) => {
    const normalized = status?.toLowerCase();
    switch (normalized) {
        case 'closed':
            return colours.green;
        case 'pitched':
            return colours.orange;
        default:
            return colours.greyText;
    }
};

const DealCard: React.FC<DealCardProps> = ({
    deal,
    onFollowUp,
    animationDelay = 0,
    onOpenInstruction,
}) => {
    const { isDarkMode } = useTheme();

    const getPeriod = (d: Date) => {
        const h = d.getHours();
        if (h < 12) return 'morning';
        if (h < 17) return 'afternoon';
        return 'evening';
    };

    const getPitchInfo = () => {
        if (!deal.PitchedDate || !deal.PitchedTime) return { text: '', urgent: false };
        const dt = parseISO(`${deal.PitchedDate.slice(0, 10)}T${deal.PitchedTime}`);
        if (!isValid(dt)) return { text: '', urgent: false };
        const now = new Date();
        const diffMins = differenceInMinutes(now, dt);
        const diffHours = differenceInHours(now, dt);
        let descriptor = '';
        const period = getPeriod(dt);

        if (isToday(dt)) {
            if (diffMins < 60) {
                descriptor = `${diffMins} minutes ago`;
            } else if (diffHours < 2) {
                descriptor = `earlier this ${period}`;
            } else {
                descriptor = `at ${format(dt, 'haaa').toLowerCase()} this ${period}`;
            }
        } else if (differenceInCalendarDays(now, dt) < 7) {
            descriptor = `on ${format(dt, 'EEEE')} ${period}`;
        } else {
            descriptor = `on ${format(dt, 'EEEE d MMM')}`;
        }

        const name = deal.firstName || 'the client';
        return { text: `You pitched ${name} ${descriptor}`, urgent: diffHours >= 5 };
    };

    const getCloseInfo = () => {
        if (!deal.CloseDate || !deal.CloseTime) return { text: '', urgent: false };
        const dt = parseISO(`${deal.CloseDate.slice(0, 10)}T${deal.CloseTime}`);
        if (!isValid(dt)) return { text: '', urgent: false };
        const now = new Date();
        const diffMins = differenceInMinutes(now, dt);
        const diffHours = differenceInHours(now, dt);
        let descriptor = '';
        const period = getPeriod(dt);

        if (isToday(dt)) {
            if (diffMins < 60) {
                descriptor = `${diffMins} minutes ago`;
            } else if (diffHours < 2) {
                descriptor = `earlier this ${period}`;
            } else {
                descriptor = `at ${format(dt, 'haaa').toLowerCase()} this ${period}`;
            }
        } else if (differenceInCalendarDays(now, dt) < 7) {
            descriptor = `on ${format(dt, 'EEEE')} ${period}`;
        } else {
            descriptor = `on ${format(dt, 'EEEE d MMM')}`;
        }

        const name = deal.firstName || 'the client';
        return { text: `You closed ${name} ${descriptor}`, urgent: false };
    };

    const pitchInfo = getPitchInfo();
    const closeInfo = getCloseInfo();

    const status = deal.Status ? deal.Status.toLowerCase() : undefined;
    const isClosed = status === 'closed';

    const cardClass = mergeStyles('dealCard', {
        backgroundColor: isDarkMode
            ? colours.dark.sectionBackground
            : colours.light.sectionBackground,
        borderRadius: componentTokens.card.base.borderRadius,
        padding: componentTokens.card.base.padding,
        color: isDarkMode ? colours.dark.text : colours.light.text,
        cursor: onOpenInstruction ? 'pointer' : 'default',
        borderLeft: `4px solid ${leftBorderColor(deal.AreaOfWork)}`,
        border: `2px solid ${isClosed ? colours.green : 'transparent'}`,
        boxShadow: isClosed
            ? `inset 0 0 8px ${colours.green}55, ${isDarkMode
                ? '0 4px 12px ' + colours.dark.border
                : '0 4px 12px ' + colours.light.border
            }`
            : componentTokens.card.base.boxShadow,
        opacity: isClosed ? 0.6 : 1,
        transition:
            'box-shadow 0.3s ease, transform 0.3s ease, border 0.3s ease, opacity 0.3s ease',
        selectors: {
            ':hover': {
                boxShadow: componentTokens.card.hover.boxShadow,
                transform: componentTokens.card.hover.transform,
            },
        },
    });

    const bannerClass = mergeStyles('pitch-banner', {
        background: isClosed
            ? componentTokens.successBanner.background
            : componentTokens.infoBanner.background,
        borderLeft: isClosed
            ? componentTokens.successBanner.borderLeft
            : componentTokens.infoBanner.borderLeft,
        padding: componentTokens.infoBanner.padding,
        fontSize: '0.875rem',
    });

    const style: React.CSSProperties = {
        '--animation-delay': `${animationDelay}s`,
    } as React.CSSProperties;

    const formattedDate = deal.PitchedDate
        ? new Date(deal.PitchedDate).toLocaleDateString()
        : undefined;

    const statusStyle: React.CSSProperties = {
        color: statusColour(status),
    };
    

    return (
        <div className={cardClass} style={style} onClick={onOpenInstruction}>
            {!isClosed && pitchInfo.text && (
                <div className={bannerClass}>{pitchInfo.text}</div>
            )}
            {isClosed && closeInfo.text && (
                <div className={bannerClass}>{closeInfo.text}</div>
            )}
            {!deal.InstructionRef && (
                <div className={bannerClass}>No instruction</div>
            )}
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                {deal.ServiceDescription}
            </Text>
            {deal.Amount !== undefined && (
                <Text className="deal-amount" variant="medium">
                    £{deal.Amount}
                </Text>
            )}
            <div className="deal-details">
                <dl className="data-grid">
                    {Object.entries(deal).map(([k, v]) => (
                        <React.Fragment key={k}>
                            <dt>{k}</dt>
                            <dd>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
                        </React.Fragment>
                    ))}
                </dl>
                {(formattedDate || deal.Status) && (
                    <div className="deal-footer">
                        {formattedDate && <span className="pitch-date">{formattedDate}</span>}
                        {deal.Status && (
                            <span className="status-info" style={statusStyle}>
                                <span className="status-indicator" />
                                {deal.Status}
                                {status === 'closed' && (
                                    <span className="completion-tick visible">
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
                            </span>
                        )}
                    </div>
                )}
            </div>
            {onFollowUp && (
                <div className="deal-cta" onClick={(e) => e.stopPropagation()}>
                    <PrimaryButton
                        text="Follow Up"
                        onClick={onFollowUp}
                        styles={sharedPrimaryButtonStyles}
                    />
                </div>
            )}
        </div>
    );
};

export default DealCard;
