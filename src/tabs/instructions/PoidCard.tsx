// src/tabs/matters/PoidCard.tsx
import React from 'react';
import { Stack, Text, mergeStyles, Icon } from '@fluentui/react';
import { POID, TeamData } from '../../app/functionality/types';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';

// Helper to calculate age from a date string
const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

interface PoidCardProps {
    poid: POID;
    selected: boolean;
    onClick: () => void;
    teamData?: TeamData[] | null;
}

// Updated card dimensions for 5 per row and taller for content
const baseCardStyle = mergeStyles({
    position: 'relative',
    padding: '15px',
    borderRadius: '0px',
    width: '100%',
    height: '240px',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #ffffff, #f9f9f9)',
    boxSizing: 'border-box',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    fontFamily: 'Raleway, sans-serif',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    overflow: 'hidden',
    selectors: {
        ':hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
        // Show profile links container on hover
        ':hover .profileLink': {
            opacity: 1,
        },
    },
});

const darkCardStyle = mergeStyles({
    background: 'linear-gradient(135deg, #333, #444)',
    border: '1px solid #555',
    fontFamily: 'Raleway, sans-serif',
});

const selectedCardStyle = mergeStyles({
    border: `2px solid ${colours.highlight}`,
    background: 'linear-gradient(135deg, #e0f3ff, #cce7ff)',
    fontFamily: 'Raleway, sans-serif',
});

const iconStyle = mergeStyles({
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 24,
    color: colours.highlight,
});

const bottomContainerStyle = mergeStyles({
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 75, // Adjusted to make room for the bottom-right icon
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
});

const idTextStyle = mergeStyles({
    fontSize: '0.8rem',
    fontWeight: 600,
    fontFamily: 'Raleway, sans-serif',
    maxWidth: '70%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '2px 0',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
});

const badgeStyle = mergeStyles({
    padding: '2px 8px',
    borderRadius: '0px',
    backgroundColor: colours.grey,
    color: '#333',
    fontSize: '0.7rem',
    fontWeight: 600,
    fontFamily: 'Raleway, sans-serif',
});

const backgroundIconStyle = mergeStyles({
    position: 'absolute',
    bottom: 20,
    right: 10,
    fontSize: '55px',
    transformOrigin: 'bottom right',
    opacity: 0.5,
    pointerEvents: 'none',
    zIndex: 0,
    color: colours.highlight,
    overflow: 'hidden',
});

const contentStyle = mergeStyles({
    position: 'relative',
    zIndex: 1,
    height: '85%', // Adjusted to leave more space for the bottom container
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingRight: '60px', // Add padding to avoid text overlapping with the bottom-right icon
    marginBottom: '40px', // Add bottom margin to prevent content from overlapping with the ID
});

// New style for the profile link container (aligned left)
const profileLinkContainer = mergeStyles({
    opacity: 0,
    transition: 'opacity 0.3s ease',
    marginTop: 4,
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-start',
});

// New style for profile link buttons
const profileButtonStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: colours.highlight,
    border: '1px solid #ccc',
    borderRadius: '0px',
    padding: '4px 6px',
    transition: 'background-color 0.2s, transform 0.1s',
    selectors: {
        ':hover': {
            backgroundColor: '#e1dfdd',
        },
        ':active': {
            backgroundColor: '#d0d0d0',
            transform: 'scale(0.98)',
        },
    },
});

const PoidCard: React.FC<PoidCardProps> = ({ poid, selected, onClick, teamData }) => {
    const { isDarkMode } = useTheme();

    const cardStyles = mergeStyles(
        baseCardStyle,
        isDarkMode && darkCardStyle,
        selected && selectedCardStyle
    );

    // Choose icon based on POID type.
    const backgroundIconName = poid.type === "Yes" ? "CityNext" : "Contact";

    const teamMember = teamData?.find(
        (member) => member.Email?.toLowerCase() === poid.poc?.toLowerCase()
    );
    const badgeInitials = teamMember?.Initials;

    const stage = poid.stage?.toLowerCase();
    const isCompleted = stage === 'completed';

    const bannerText = isCompleted ? 'Proof of Identity Received' : null;
    const bannerClass = mergeStyles('instruction-banner', {
        background: componentTokens.successBanner.background,
        borderLeft: componentTokens.successBanner.borderLeft,
        padding: componentTokens.infoBanner.padding,
        fontSize: '0.875rem',
        position: 'relative',
        zIndex: 2,
        marginBottom: '10px',
    });

    const dobDisplay = poid.date_of_birth
        ? `${new Date(poid.date_of_birth).toLocaleDateString()} (${calculateAge(poid.date_of_birth)})`
        : null;

    return (
        <div onClick={onClick} className={cardStyles}>
            {/* Background icon */}
            <Icon iconName={backgroundIconName} className={backgroundIconStyle} />
            {bannerText && <div className={bannerClass}>{bannerText}</div>}

            <div className={contentStyle}>
                <Stack tokens={{ childrenGap: 6 }}>
                    {/* Client's Name */}
                    <Text
                        variant="mediumPlus"
                        styles={{
                            root: {
                                fontWeight: 700,
                                color: colours.highlight,
                                fontFamily: 'Raleway, sans-serif',
                            },
                        }}
                    >
                        {poid.prefix ? `${poid.prefix} ` : ''}
                        {poid.first} {poid.last}
                    </Text>
                    {/* Company Name if applicable */}
                    {poid.type === "Yes" && poid.company_name && (
                        <Text
                            variant="small"
                            styles={{ root: { fontFamily: 'Raleway, sans-serif', color: '#555' } }}
                        >
                            {poid.company_name}
                        </Text>
                    )}
                    {/* DOB with age */}
                    {dobDisplay && (
                        <Text variant="small" styles={{ root: { fontFamily: 'Raleway, sans-serif' } }}>
                            {dobDisplay}
                        </Text>
                    )}
                    {/* Nationality (ISO) */}
                    {poid.nationality_iso && (
                        <Text variant="small" styles={{ root: { fontFamily: 'Raleway, sans-serif' } }}>
                            {poid.nationality_iso}
                        </Text>
                    )}
                    {/* Profile links: Client and Matter (appear on hover) */}
                    <div className={`${profileLinkContainer} profileLink`}>
                        {poid.client_id && (
                            <a
                                href={`https://eu.app.clio.com/nc/#/contacts/${poid.client_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={profileButtonStyle}
                            >
                                <Icon iconName="Contact" styles={{ root: { marginRight: 4 } }} />
                                <Text variant="small">{poid.client_id}</Text>
                            </a>
                        )}
                        {poid.matter_id && (
                            <a
                                href={`https://eu.app.clio.com/nc/#/matters/${poid.matter_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={profileButtonStyle}
                            >
                                <Icon iconName="Folder" styles={{ root: { marginRight: 4 } }} />
                                <Text variant="small">{poid.matter_id}</Text>
                            </a>
                        )}
                    </div>
                </Stack>

                {selected && <Icon iconName="Accept" className={iconStyle} />}

                <div className={bottomContainerStyle}>
                    <Text 
                        variant="small" 
                        className={idTextStyle}
                        styles={{ 
                            root: { 
                                position: 'relative',
                                zIndex: 2
                            } 
                        }}
                    >
                        {poid.poid_id}
                    </Text>
                    {badgeInitials && (
                        <div className={badgeStyle} aria-label={`POC: ${badgeInitials}`}>
                            {badgeInitials}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PoidCard;
