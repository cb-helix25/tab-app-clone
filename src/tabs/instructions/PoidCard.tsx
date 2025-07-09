// ---   Imports ---
// invisible change 2
//
import { Stack, Text, mergeStyles, Icon } from '@fluentui/react';
import { POID, TeamData } from '../../app/functionality/types';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';
import React, { useMemo } from 'react';// Helper to calculate countdown to midnight after expiry date

// Button style for PEP & Address (inspired by client type, but color-coded, no rounded corners, full width, banner font size)
const verificationButtonStyle = (status: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 8px', // Match banner padding
    fontSize: '0.9rem', // Match banner font size
    fontWeight: 400,
    borderRadius: 0,
    border: '1px solid', // Changed from 2px to 1px for a neater look
    borderColor: status === 'passed' ? '#107C10' : '#FFB900',
    background: status === 'passed' ? '#e6f4ea' : '#fffbe6',
    color: status === 'passed' ? '#107C10' : '#b88600',
    marginRight: 0,
    marginBottom: 0,
    minWidth: 0,
    width: '50%',
    transition: 'background 0.18s, border 0.18s, color 0.18s',
    cursor: 'default',
    boxShadow: '0 1px 2px rgba(6,23,51,0.04)'
});
// src/tabs/matters/PoidCard.tsx
function getExpiryCountdown(expiryDateString: string | undefined): string | null {
    if (!expiryDateString) return null;
    // Parse expiry date (assume yyyy-mm-dd or ISO)
    const expiryDate = new Date(expiryDateString);
    if (isNaN(expiryDate.getTime())) return null;
    // Set to midnight (00:00) the day after expiry
    const expiryMidnight = new Date(expiryDate);
    expiryMidnight.setDate(expiryMidnight.getDate() + 1);
    expiryMidnight.setHours(0, 0, 0, 0);
    const now = new Date();
    let diff = expiryMidnight.getTime() - now.getTime();
    if (diff <= 0) return 'expired';
    // Calculate months, days, hours
    const msPerHour = 1000 * 60 * 60;
    const msPerDay = msPerHour * 24;
    // Months: rough calculation (30d per month)
    const months = Math.floor(diff / (msPerDay * 30));
    diff -= months * msPerDay * 30;
    const days = Math.floor(diff / msPerDay);
    diff -= days * msPerDay;
    const hours = Math.floor(diff / msPerHour);
    // Format string
    let parts = [];
    if (months > 0) parts.push(`${months}m`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (parts.length === 0) parts.push('<1h');
    return `expires in ${parts.join(' ')}`;
}

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
    companyName?: string; // invisible change 3: now passed from parent, not POID
}

// Updated card dimensions to fit nicely in a 2-column grid
const baseCardStyle = mergeStyles({
    position: 'relative',
    padding: '15px',
    borderRadius: '0px',
    width: '100%',
    minWidth: '280px', // Adjusted for 2-card layout
    maxWidth: '450px', // Increased maximum width for better use of space
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
    // border removed to prevent card from shrinking or shifting
    background: `linear-gradient(135deg, #3690CE22, #3690CE33)`,
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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    overflow: 'visible', // Allow content to expand naturally
    width: '100%', // Ensure content uses full width
});

// Animate in the links on card hover
const cardWithLinksHover = mergeStyles({
    selectors: {
        ':hover .profileLink': {
            opacity: 1,
            pointerEvents: 'auto',
            height: '44px', // Animate in height for links
        },
    },
});

// New style for profile link buttons - same size and behaviour as client type buttons
const profileButtonStyle = mergeStyles({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    color: '#061733',
    border: '2px solid #e1dfdd',
    borderRadius: 0,
    padding: '12px 18px',
    fontSize: '0.9rem',
    fontWeight: 600,
    background: '#fff',
    transition: 'background 0.18s, border 0.18s, color 0.18s',
    minWidth: 0,
    boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
    cursor: 'pointer',
    gap: 8,
    selectors: {
        ':hover': {
            background: '#e7f1ff',
            border: '2px solid #3690CE',
            color: '#3690CE',
            textDecoration: 'none',
        },
        ':focus': {
            outline: '2px solid #3690CE',
        },
        ':active': {
            background: '#d0e7ff',
        },
    },
});

const PoidCard: React.FC<PoidCardProps> = ({ poid, selected, onClick, teamData, companyName }) => {
    const { isDarkMode } = useTheme();


    // Compose card style
    const cardStyle = mergeStyles(
        baseCardStyle,
        isDarkMode && darkCardStyle,
        selected && selectedCardStyle,
        cardWithLinksHover,
        'poid-card'
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

    // --- New: Extract more fields for realistic display ---
    // Accept both snake_case and camelCase for compatibility, but POID type is mostly snake_case
    const fullName = `${poid.prefix || ''} ${poid.first || '[No First Name]'} ${poid.last || '[No Last Name]'}`.trim();
    // companyName is now a prop, not from poid
    const dob = poid.date_of_birth;
    const age = dob ? calculateAge(dob) : undefined;
    const nationality = poid.nationality;
    const nationalityAlpha2 = poid.nationality_iso || poid.country_code;
    const email = (poid as any).email || (poid as any).Email;
    const phone = (poid as any).phone || (poid as any).Phone;
    // Defensive: POID type may use camelCase for some fields, fallback to those if needed
    // Defensive: fallback to camelCase only if POID type allows index signature
    const address = [
        (poid as any).house_number || (poid as any).HouseNumber,
        (poid as any).street || (poid as any).Street,
        (poid as any).city || (poid as any).City,
        (poid as any).county || (poid as any).County,
        (poid as any).post_code || (poid as any).Postcode,
        (poid as any).country || (poid as any).Country
    ].filter(Boolean).join(', ');
    const idType = (poid as any).id_type || (poid as any).IdType;
    const passport = (poid as any).passport_number || (poid as any).PassportNumber;
    const driversLicense = (poid as any).drivers_license_number || (poid as any).DriversLicenseNumber;
    const instructionRef = (poid as any).instruction_ref || (poid as any).InstructionRef;
    const matterId = (poid as any).matter_id || (poid as any).MatterId;
    const prospectId = (poid as any).prospect_id || (poid as any).ProspectId;
    const paymentResult = (poid as any).payment_result || (poid as any).PaymentResult;
    const paymentAmount = (poid as any).payment_amount || (poid as any).PaymentAmount;
    const paymentProduct = (poid as any).payment_product || (poid as any).PaymentProduct;
    // --- End new fields ---

    return (
        <div onClick={onClick} className={cardStyle}>
            <div className={contentStyle}>
                <Stack tokens={{ childrenGap: 8 }}>
                    {/* Name and Company */}
                    <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center" style={{ width: '100%' }}>
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
                            {companyName && (
                                <span style={{ color: '#666', fontWeight: 600, marginRight: '8px' }}>{companyName} - </span>
                            )}
                            {fullName}
                        </Text>
                        {age !== undefined && (
                            <Text variant="small" styles={{ root: { fontFamily: 'Raleway, sans-serif', lineHeight: '1.2', color: '#555' } }}>{age} yrs</Text>
                        )}
                        {nationalityAlpha2 && (
                            <Text variant="small" styles={{ root: { fontFamily: 'Raleway, sans-serif', lineHeight: '1.2', color: '#555' } }}>{nationalityAlpha2}</Text>
                        )}
                        <div style={{ flex: 1 }} />
                        <Icon
                            iconName={backgroundIconName}
                            style={{
                                fontSize: 22,
                                opacity: 0.3,
                                transition: 'opacity 0.2s',
                                color: colours.highlight,
                                marginLeft: 8,
                                verticalAlign: 'middle',
                            }}
                            className="inlinePersonCompanyIcon"
                        />
                    </Stack>
                    {/* Email, Phone */}
                    <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
                        {email && <Text variant="small" styles={{ root: { color: '#444' } }}>{email}</Text>}
                        {phone && <Text variant="small" styles={{ root: { color: '#444' } }}>{phone}</Text>}
                    </Stack>
                    {/* Address */}
                    {address && <Text variant="small" styles={{ root: { color: '#666' } }}>{address}</Text>}
                    {/* ID Type and Numbers */}
                    <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
                        {idType && <Text variant="small" styles={{ root: { color: '#444' } }}>ID: {idType}</Text>}
                        {passport && <Text variant="small" styles={{ root: { color: '#444' } }}>Passport: {passport}</Text>}
                        {driversLicense && <Text variant="small" styles={{ root: { color: '#444' } }}>DL: {driversLicense}</Text>}
                    </Stack>
                    {/* Payment info if present */}
                    {(paymentResult || paymentAmount || paymentProduct) && (
                        <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                            {paymentResult && <Text variant="small" styles={{ root: { color: paymentResult === 'successful' ? '#107C10' : paymentResult === 'failed' ? '#D83B01' : '#555' } }}>Payment: {paymentResult}</Text>}
                            {paymentAmount && <Text variant="small" styles={{ root: { color: '#444' } }}>£{paymentAmount}</Text>}
                            {paymentProduct && <Text variant="small" styles={{ root: { color: '#444' } }}>{paymentProduct}</Text>}
                        </Stack>
                    )}
                    {/* Instruction/Deal IDs for traceability */}
                    <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                        {instructionRef && <Text variant="small" styles={{ root: { color: '#888' } }}>Ref: {instructionRef}</Text>}
                        {matterId && <Text variant="small" styles={{ root: { color: '#888' } }}>Matter: {matterId}</Text>}
                        {prospectId && <Text variant="small" styles={{ root: { color: '#888' } }}>Prospect: {prospectId}</Text>}
                    </Stack>
                    {/* Verification Status - as before */}
                    {poid.check_result && (
                        <Stack tokens={{ childrenGap: 4 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '4px 8px',
                                    backgroundColor: '#f7f7fa',
                                    borderLeft:
                                        poid.check_result && poid.check_result.toLowerCase() === 'passed'
                                            ? '3px solid #107C10'
                                        : poid.check_result && poid.check_result.toLowerCase() === 'review'
                                            ? '3px solid #FFB900'
                                            : '3px solid #D83B01',
                                    marginTop: '4px',
                                    marginBottom: '2px',
                                    fontWeight: 400,
                                    fontSize: '0.9rem',
                                    color:
                                        poid.check_result && poid.check_result.toLowerCase() === 'passed'
                                            ? '#107C10'
                                        : poid.check_result && poid.check_result.toLowerCase() === 'review'
                                            ? '#FFB900'
                                            : '#D83B01',
                                    width: '100%'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                    <Icon
                                        iconName={
                                            poid.check_result && poid.check_result.toLowerCase() === 'passed'
                                                ? 'CompletedSolid'
                                                : 'Warning'
                                        }
                                        styles={{
                                            root: {
                                                marginRight: 4,
                                                fontSize: '9px',
                                                color:
                                                    poid.check_result && poid.check_result.toLowerCase() === 'passed'
                                                        ? '#107C10'
                                                    : poid.check_result && poid.check_result.toLowerCase() === 'review'
                                                        ? '#FFB900'
                                                        : '#D83B01',
                                            },
                                        }}
                                    />
                                    <span
                                        style={{
                                            color:
                                                poid.check_result && poid.check_result.toLowerCase() === 'passed'
                                                    ? '#107C10'
                                                : poid.check_result && poid.check_result.toLowerCase() === 'review'
                                                    ? '#FFB900'
                                                    : '#D83B01',
                                        }}
                                    >
                                        ID Verification: {poid.check_result}
                                    </span>
                                </span>
                                {poid.check_expiry && (
                                    <span style={{ fontWeight: 400, fontSize: '0.85em', color: '#555', fontStyle: 'italic', marginLeft: 12 }}>
                                        {getExpiryCountdown(poid.check_expiry)}
                                    </span>
                                )}
                            </div>
                            {(poid.check_expiry || poid.check_id) && (
                                <div
                                    style={{
                                        background: '#f7f7fa',
                                        border: '1px solid #e1dfdd',
                                        borderRadius: 4,
                                        padding: '6px 12px',
                                        margin: '10px 0 10px 0',
                                        fontSize: '0.85rem',
                                        color: '#444',
                                        display: 'block',
                                    }}
                                >
                                    <div>
                                        <b>Date:</b> {poid.check_expiry ? new Date(poid.check_expiry).toLocaleDateString() : '—'}
                                    </div>
                                    {poid.check_id && (
                                        <>
                                            <div style={{ borderTop: '1px solid #e1dfdd', margin: '6px 0' }} />
                                            <div>
                                                <b>ID:</b> {poid.check_id}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            <div style={{ display: 'flex', marginLeft: 0, marginTop: 0, marginBottom: 0, width: '100%' }}>
                                {poid.pep_sanctions_result && (
                                    <span style={verificationButtonStyle(poid.pep_sanctions_result.toLowerCase())}>
                                        PEP & Sanctions: {poid.pep_sanctions_result}
                                    </span>
                                )}
                                {poid.address_verification_result && (
                                    <span style={verificationButtonStyle(poid.address_verification_result.toLowerCase())}>
                                        Address: {poid.address_verification_result}
                                    </span>
                                )}
                            </div>
                        </Stack>
                    )}
                </Stack>
            </div>
            <div className={bottomContainerStyle}>
                {badgeInitials && (
                    <div className={badgeStyle} aria-label={`POC: ${badgeInitials}`}>
                        {badgeInitials}
                    </div>
                )}
            </div>
            <style>{`
                .poid-card:hover .inlinePersonCompanyIcon {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
};

export default PoidCard;
