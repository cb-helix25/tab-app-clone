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
} from 'date-fns';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';
import { sharedPrimaryButtonStyles } from '../../app/styles/ButtonStyles';
import { useTheme } from '../../app/functionality/ThemeContext';
import '../../app/styles/DealCard.css';

interface DealInfo {
    ServiceDescription?: string;
    Amount?: number;
    AreaOfWork?: string;
    PitchedDate?: string;
    PitchedTime?: string;
    PitchedBy?: string;
    Status?: string;
    firstName?: string;
    jointClients?: { ClientEmail?: string }[];
}

interface DealCardProps {
    deal: DealInfo;
    onFollowUp?: () => void;
    animationDelay?: number;
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

const DealCard: React.FC<DealCardProps> = ({
    deal,
    onFollowUp,
    animationDelay = 0,
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

    const pitchInfo = getPitchInfo();

    const cardClass = mergeStyles('dealCard', {
        backgroundColor: isDarkMode
            ? colours.dark.sectionBackground
            : colours.light.sectionBackground,
        borderRadius: componentTokens.card.base.borderRadius,
        padding: componentTokens.card.base.padding,
        boxShadow: componentTokens.card.base.boxShadow,
        color: isDarkMode ? colours.dark.text : colours.light.text,
        borderLeft: `4px solid ${leftBorderColor(deal.AreaOfWork)}`,
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        selectors: {
            ':hover': {
                boxShadow: componentTokens.card.hover.boxShadow,
                transform: componentTokens.card.hover.transform,
            },
        },
    });

    const style: React.CSSProperties = {
        '--animation-delay': `${animationDelay}s`,
    } as React.CSSProperties;

    const formattedDate = deal.PitchedDate
        ? new Date(deal.PitchedDate).toLocaleDateString()
        : undefined;

    return (
        <div className={cardClass} style={style}>
            {pitchInfo.text && (
                <Text
                    className={`pitch-info${pitchInfo.urgent ? ' pitch-alert' : ''}`}
                    variant="small"
                >
                    {pitchInfo.text}
                    {pitchInfo.urgent ? '!' : ''}
                </Text>
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
                <ul className="detail-list">
                    {deal.AreaOfWork && (
                        <li>
                            <strong>Area:</strong> {deal.AreaOfWork}
                        </li>
                    )}
                    {deal.PitchedBy && (
                        <li>
                            <strong>Pitched By:</strong> {deal.PitchedBy}
                        </li>
                    )}
                    {formattedDate && (
                        <li>
                            <strong>Pitched:</strong> {formattedDate}
                        </li>
                    )}
                    {deal.Status && (
                        <li>
                            <strong>Status:</strong> {deal.Status}
                        </li>
                    )}
                </ul>
                {deal.jointClients && deal.jointClients.length > 0 && (
                    <div className="joint-container">
                        {deal.jointClients.map((jc, idx) => (
                            <div className="joint-banner" key={idx}>
                                Joint client: {jc.ClientEmail} - Pending
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {onFollowUp && (
                <div className="deal-cta">
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
