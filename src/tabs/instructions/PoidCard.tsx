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

// Updated card dimensions to fit nicely in a 2-column grid
const baseCardStyle = mergeStyles({
    position: 'relative',
    padding: '15px',
    borderRadius: '0px',
    width: '100%',
    minWidth: '280px', // Adjusted for 2-card layout
    maxWidth: '450px', // Increased maximum width for better use of space
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
        // Show icon in full opacity on hover
        ':hover .backgroundIcon': {
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
    bottom: 15,
    left: 15,
    right: 15, // Extended to allow more space
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10, // Ensure it stays on top
    height: '30px', // Set explicit height for the bottom container
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
    opacity: 0.3, // Reduced default opacity
    pointerEvents: 'none',
    zIndex: 0,
    color: colours.highlight,
    overflow: 'hidden',
    transition: 'opacity 0.2s ease', // Add transition for smooth opacity change
});

const contentStyle = mergeStyles({
    position: 'relative',
    zIndex: 1,
    height: 'calc(100% - 80px)', // Reduced height to make room for links at bottom
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingRight: '10px', // Reduced padding to allow content to use more width
    paddingBottom: '10px', // Standard padding
    overflow: 'hidden', // Remove scroll, let content be clipped naturally
    width: '100%', // Ensure content uses full width
});

// New style for the profile link container - only visible on hover, positioned at bottom of card above ID
const profileLinkContainer = mergeStyles({
    opacity: 0,
    transition: 'opacity 0.3s ease',
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-start',
    position: 'absolute',
    bottom: '45px', // Position above the bottom container
    left: '15px',
    right: '15px',
    zIndex: 5,
    padding: '4px 0', // Padding only top/bottom
    borderTop: '1px solid #eaeaea', // Light separator
});

// New style for profile link buttons - more compact
const profileButtonStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: colours.highlight,
    border: '1px solid #ccc',
    borderRadius: '2px',
    padding: '1px 3px', // Further reduced padding for more compact buttons
    transition: 'background-color 0.2s, transform 0.1s',
    fontSize: '10px', // Smaller font size
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent background
    height: '18px', // Fixed height for consistency
    minWidth: '50px', // Minimum width for better visibility
    justifyContent: 'center',
    selectors: {
        ':hover': {
            backgroundColor: '#e1dfdd',
            textDecoration: 'none',
        },
        ':active': {
            backgroundColor: '#d0d0d0',
            transform: 'scale(0.98)',
        },
        ':focus': {
            outline: '1px solid ' + colours.highlight,
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
    const isReview = stage === 'review';
    
    let bannerText = null;
    let bannerClass = mergeStyles('instruction-banner', {
        padding: componentTokens.infoBanner.padding,
        fontSize: '0.875rem',
        position: 'relative',
        zIndex: 2,
        marginBottom: '10px',
    });
    
    // We're removing the banner since we now have the ID Verification status display
    // which provides a clearer indication of the verification status

    const dobDisplay = poid.date_of_birth
        ? `${new Date(poid.date_of_birth).toLocaleDateString()} (${calculateAge(poid.date_of_birth)})`
        : null;

    return (
        <div onClick={onClick} className={cardStyles}>
            {/* Background icon */}
            <Icon iconName={backgroundIconName} className={`${backgroundIconStyle} backgroundIcon`} />

            {/* Content Area - Main information */}
            <div className={contentStyle}>
                <Stack tokens={{ childrenGap: 8 }}>
                    {/* Client's Name */}
                    <Text
                        variant="mediumPlus"
                        styles={{
                            root: {
                                fontWeight: 700,
                                color: colours.highlight,
                                fontFamily: 'Raleway, sans-serif',
                                lineHeight: '1.2',
                            },
                        }}
                    >
                        {poid.prefix ? `${poid.prefix} ` : ''}
                        {poid.first ? poid.first : '[No First Name]'} {poid.last ? poid.last : '[No Last Name]'}
                    </Text>
                    
                    {/* Company Name if applicable */}
                    {poid.type === "Yes" && poid.company_name && (
                        <Text
                            variant="small"
                            styles={{ root: { fontFamily: 'Raleway, sans-serif', color: '#555', lineHeight: '1.2' } }}
                        >
                            {typeof poid.company_name === 'string' ? poid.company_name : '[Company Name]'}
                        </Text>
                    )}
                    
                    {/* DOB with age */}
                    {dobDisplay && (
                        <Text variant="small" styles={{ root: { fontFamily: 'Raleway, sans-serif', lineHeight: '1.2' } }}>
                            {dobDisplay}
                        </Text>
                    )}
                    
                    {/* Nationality (ISO) */}
                    {poid.nationality_iso && (
                        <Text variant="small" styles={{ root: { fontFamily: 'Raleway, sans-serif', lineHeight: '1.2' } }}>
                            {poid.nationality_iso}
                        </Text>
                    )}
                    
                    {/* Verification Status - Cleaner layout */}
                    {poid.check_result && (
                        <Stack tokens={{ childrenGap: 4 }}>
                            <div 
                                style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '4px 8px',
                                    backgroundColor: poid.check_result.toLowerCase() === 'passed' ? '#DFF6DD' : '#FFF4CE',
                                    borderLeft: poid.check_result.toLowerCase() === 'passed' ? '3px solid #107C10' : '3px solid #FFB900',
                                    marginTop: '4px',
                                    marginBottom: '2px',
                                    fontWeight: 600,
                                    fontSize: '11px',
                                    color: poid.check_result.toLowerCase() === 'passed' ? '#107C10' : '#D83B01',
                                    width: '100%'
                                }}
                            >
                                <Icon 
                                    iconName={poid.check_result.toLowerCase() === 'passed' ? 'CompletedSolid' : 'Warning'} 
                                    styles={{ root: { marginRight: 4, fontSize: '9px' } }} 
                                />
                                ID Verification: {poid.check_result}
                            </div>
                            
                            {/* Verification details as a status list */}
                            <div style={{ fontSize: '10px', marginLeft: '18px', color: '#555' }}>
                                {/* PEP & Sanctions result */}
                                {poid.pep_sanctions_result && (
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                                        <div style={{ 
                                            width: '6px', 
                                            height: '6px', 
                                            borderRadius: '50%', 
                                            backgroundColor: poid.pep_sanctions_result?.toLowerCase() === 'passed' ? '#107C10' : '#FFB900',
                                            marginRight: '4px'
                                        }}></div>
                                        <span>PEP & Sanctions: {poid.pep_sanctions_result}</span>
                                    </div>
                                )}
                                
                                {/* Address verification result */}
                                {poid.address_verification_result && (
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                                        <div style={{ 
                                            width: '6px', 
                                            height: '6px', 
                                            borderRadius: '50%', 
                                            backgroundColor: poid.address_verification_result?.toLowerCase() === 'passed' ? '#107C10' : '#FFB900',
                                            marginRight: '4px'
                                        }}></div>
                                        <span>Address: {poid.address_verification_result}</span>
                                    </div>
                                )}
                                
                                {/* Check expiry date */}
                                {poid.check_expiry && (
                                    <div style={{ fontStyle: 'italic', marginTop: '4px' }}>
                                        Expires: {poid.check_expiry}
                                    </div>
                                )}
                            </div>
                        </Stack>
                    )}
                </Stack>
            </div>
            
            {/* Profile links container - fixed position at bottom, above POID ID */}
            <div className={`${profileLinkContainer} profileLink`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Text variant="small" styles={{ root: { fontSize: '9px', color: '#666', fontWeight: 600 } }}>Links:</Text>
                    {poid.client_id && (
                        <a
                            href={`https://eu.app.clio.com/nc/#/contacts/${poid.client_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={profileButtonStyle}
                            onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
                        >
                            <Icon iconName="Contact" styles={{ root: { marginRight: 2, fontSize: '10px' } }} />
                            <Text variant="small" styles={{ root: { fontSize: '10px' } }}>Client</Text>
                        </a>
                    )}
                    {poid.matter_id && (
                        <a
                            href={`https://eu.app.clio.com/nc/#/matters/${poid.matter_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={profileButtonStyle}
                            onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
                        >
                            <Icon iconName="Folder" styles={{ root: { marginRight: 2, fontSize: '10px' } }} />
                            <Text variant="small" styles={{ root: { fontSize: '10px' } }}>Matter</Text>
                        </a>
                    )}
                </div>
            </div>

            {/* Selected icon */}
            {selected && <Icon iconName="Accept" className={iconStyle} />}

            {/* Bottom container with POID ID */}
            <div className={bottomContainerStyle}>
                <Text 
                    variant="small" 
                    className={idTextStyle}
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
    );
};

export default PoidCard;
