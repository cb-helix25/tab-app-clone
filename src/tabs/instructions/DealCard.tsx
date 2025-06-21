import React from 'react';
import { Text, PrimaryButton } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react';
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
    PitchedBy?: string;
    Status?: string;
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
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                {deal.ServiceDescription}
            </Text>
            <div className="deal-details">
                <ul className="detail-list">
                    {deal.AreaOfWork && (
                        <li>
                            <strong>Area:</strong> {deal.AreaOfWork}
                        </li>
                    )}
                    {deal.Amount !== undefined && (
                        <li>
                            <strong>Amount:</strong> £{deal.Amount}
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
