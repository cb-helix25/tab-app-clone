import React from 'react';
import { Stack, Text, IconButton, TooltipHost, IButtonStyles } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { Enquiry } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';
import RatingIndicator from './RatingIndicator';
import { cleanNotes } from '../../app/functionality/textUtils';
import { useTheme } from '../../app/functionality/ThemeContext';
import '../../app/styles/EnquiryCardV2.css';

interface TeamData {
    Email?: string;
    Initials?: string;
}

interface EnquiryCardV2Props {
    enquiry: Enquiry;
    onSelect: (enquiry: Enquiry) => void;
    onRate: (enquiryId: string) => void;
    animationDelay?: number;
    teamData?: TeamData[] | null;
}

const iconButtonStyles = (iconColor: string): IButtonStyles => ({
    root: {
        color: iconColor,
        backgroundColor: 'transparent',
        border: 'none',
        selectors: {
            ':hover': {
                backgroundColor: colours.cta,
                color: '#ffffff',
            },
            ':focus': {
                backgroundColor: colours.cta,
                color: '#ffffff',
            },
        },
        height: '20px',
        width: '20px',
        padding: '0px',
        boxShadow: 'none',
    },
    icon: {
        fontSize: '16px',
        lineHeight: '20px',
        color: iconColor,
    },
});

const accentColour = (area: string) => {
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

const EnquiryCardV2: React.FC<EnquiryCardV2Props> = ({
    enquiry,
    onSelect,
    onRate,
    animationDelay = 0,
    teamData,
}) => {
    const { isDarkMode } = useTheme();

    const lowerPOC = enquiry.Point_of_Contact?.toLowerCase() || '';
    const isClaimed =
        lowerPOC &&
        ![
            'team@helix-law.com',
            'property@helix-law.com',
            'commercial@helix-law.com',
            'construction@helix-law.com',
            'employment@helix-law.com',
            'automations@helix-law.com',
        ].includes(lowerPOC);

    const claimer = isClaimed ? teamData?.find((t) => t.Email?.toLowerCase() === lowerPOC) : undefined;
    const claimerInitials = claimer?.Initials || '';

    const cardClass = mergeStyles('enquiryCardV2', {
        backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
        borderLeft: `4px solid ${accentColour(enquiry.Area_of_Work)}`,
        padding: componentTokens.card.base.padding,
        borderRadius: componentTokens.card.base.borderRadius,
        boxShadow: componentTokens.card.base.boxShadow,
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

    const handleCardClick = () => {
        onSelect(enquiry);
    };

    return (
        <div className={cardClass} style={style} onClick={handleCardClick} role="button" tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
            aria-label={`View details for enquiry ${enquiry.ID}`}
        >
            <Stack className="details" tokens={{ childrenGap: 6 }}>
                <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                    {`${enquiry.First_Name} ${enquiry.Last_Name}`}
                    {enquiry.Company ? ` - ${enquiry.Company}` : ''}
                </Text>
                {enquiry.Value && (
                    <Text variant="small" styles={{ root: { color: colours.highlight } }}>
                        Value: {enquiry.Value}
                    </Text>
                )}
                {enquiry.Initial_first_call_notes && (
                    <Text variant="small" styles={{ root: { color: isDarkMode ? colours.dark.text : colours.light.text } }}>
                        {cleanNotes(enquiry.Initial_first_call_notes)}
                    </Text>
                )}
            </Stack>
            <Stack horizontal className="actions">
                {enquiry.Phone_Number && (
                    <TooltipHost content="Call Client">
                        <IconButton
                            iconProps={{ iconName: 'Phone' }}
                            ariaLabel="Call Client"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `tel:${enquiry.Phone_Number}`;
                            }}
                            styles={iconButtonStyles(colours.cta)}
                        />
                    </TooltipHost>
                )}
                {enquiry.Email && (
                    <TooltipHost content="Email Client">
                        <IconButton
                            iconProps={{ iconName: 'Mail' }}
                            ariaLabel="Email Client"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `mailto:${enquiry.Email}?subject=Your%20Enquiry&bcc=1day@followupthen.com`;
                            }}
                            styles={iconButtonStyles(colours.cta)}
                        />
                    </TooltipHost>
                )}
                <TooltipHost content={enquiry.Rating ? `Rating: ${enquiry.Rating}` : 'Rate Enquiry'}>
                    <RatingIndicator rating={enquiry.Rating} onClick={() => onRate(enquiry.ID)} />
                </TooltipHost>
                {claimer && (
                    <div
                        className="claimer-badge"
                        style={{
                            background: colours.darkBlue,
                            color: '#fff',
                            border: `1px solid ${colours.highlight}`,
                            padding: '0 8px',
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 400,
                            marginLeft: 8,
                        }}
                        aria-label={`Claimed by ${claimerInitials}`}
                    >
                        {claimerInitials}
                    </div>
                )}
            </Stack>
        </div>
    );
};

export default EnquiryCardV2;