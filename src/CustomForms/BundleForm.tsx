import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Stack, Dropdown, IDropdownOption, ComboBox, IComboBox, IComboBoxOption, TextField, DatePicker, PrimaryButton, DefaultButton, IButtonStyles, IDropdownStyles, IComboBoxStyles, ITextFieldStyles, Icon, Text } from '@fluentui/react';
import { Matter, UserData, NormalizedMatter } from '../app/functionality/types';

// Add spinning animation CSS
const spinKeyframes = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;

// Inject the keyframes into the document head
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = spinKeyframes;
    document.head.appendChild(style);
}

// Premium styling inspired by the checkout components
const premiumContainerStyle: React.CSSProperties = {
    background: 'transparent',
    padding: '1rem',
    paddingTop: '4rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxHeight: 'calc(100vh - 60px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingBottom: '4rem',
    boxSizing: 'border-box',
};

const premiumCardStyle: React.CSSProperties = {
    background: 'transparent',
    borderRadius: '16px',
    border: '1px solid rgba(229, 231, 235, 0.3)',
    overflow: 'hidden',
    maxWidth: '900px',
    margin: '0 auto',
};

const premiumHeaderStyle: React.CSSProperties = {
    background: 'transparent',
    color: '#374151',
    padding: '1rem 1.5rem',
    position: 'relative',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
};

const premiumContentStyle: React.CSSProperties = {
    padding: '1.5rem',
    paddingTop: '2rem',
};

const premiumSectionStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    borderRadius: '12px',
    padding: '1.25rem',
    marginBottom: '1.25rem',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

const premiumBannerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(54, 144, 206, 0.06) 0%, rgba(6, 23, 51, 0.06) 100%)',
    color: '#374151',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: '1px solid rgba(229, 231, 235, 0.4)',
};

const premiumInputStyle = {
    fieldGroup: {
        borderRadius: '8px',
        border: '1px solid rgba(229, 231, 235, 0.4)',
        background: 'transparent',
        minHeight: '48px',
        fontSize: '16px',
        transition: 'all 0.2s ease',
        selectors: {
            ':hover': {
                borderColor: 'rgba(229, 231, 235, 0.6)',
                background: 'rgba(255, 255, 255, 0.1)',
            },
        },
    },
    fieldGroupFocused: {
        borderColor: '#3690CE',
        background: 'rgba(255, 255, 255, 0.1)',
        boxShadow: '0 0 0 3px rgba(54, 144, 206, 0.1)',
    },
    field: {
        background: 'transparent',
        color: '#374151',
        fontSize: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    label: {
        fontWeight: '600',
        fontSize: '14px',
        color: '#374151',
        marginBottom: '6px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
};

const premiumDatePickerStyle = {
    root: { width: '100%' },
    textField: {
        fieldGroup: {
            borderRadius: '8px !important',
            border: '1px solid rgba(229, 231, 235, 0.4) !important',
            background: 'transparent !important',
            minHeight: '48px',
            fontSize: '16px',
            transition: 'all 0.2s ease',
            boxShadow: 'none !important',
            selectors: {
                ':hover': {
                    borderColor: 'rgba(229, 231, 235, 0.6) !important',
                    background: 'rgba(255, 255, 255, 0.1) !important',
                    boxShadow: 'none !important',
                },
                ':after': {
                    display: 'none !important',
                },
            },
        },
        fieldGroupFocused: {
            borderColor: '#3690CE !important',
            background: 'rgba(255, 255, 255, 0.1) !important',
            boxShadow: '0 0 0 3px rgba(54, 144, 206, 0.1) !important',
            selectors: {
                ':after': {
                    display: 'none !important',
                },
            },
        },
        field: {
            background: 'transparent !important',
            color: '#374151',
            fontSize: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '0 12px',
        },
        label: {
            fontWeight: '600',
            fontSize: '14px',
            color: '#374151',
            marginBottom: '6px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
    },
    callout: {
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(229, 231, 235, 0.6)',
        borderRadius: '8px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
    },
};

const premiumDropdownStyle = {
    dropdown: {
        borderRadius: '8px',
        border: '2px solid #e5e7eb',
        height: '48px',
        fontSize: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        selectors: {
            ':hover': {
                borderColor: '#d1d5db',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            },
        },
    },
    dropdownFocused: {
        borderColor: '#3690CE',
        boxShadow: '0 0 0 3px rgba(54, 144, 206, 0.1)',
    },
    label: {
        fontWeight: '600',
        fontSize: '14px',
        color: '#374151',
        marginBottom: '6px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    callout: {
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        border: '2px solid #e5e7eb',
    },
    dropdownOption: {
        fontSize: '16px',
        padding: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        selectors: {
            ':hover': {
                backgroundColor: '#f3f4f6',
            },
        },
    },
};

const premiumButtonStyle: IButtonStyles = {
    root: {
        background: '#3690CE',
        border: 'none',
        borderRadius: '8px',
        minHeight: '48px',
        fontSize: '16px',
        fontWeight: '600',
        color: '#ffffff',
        padding: '0 2rem',
        boxShadow: '0 2px 8px rgba(54, 144, 206, 0.25)',
        transition: 'all 0.2s ease',
    },
    rootHovered: {
        background: '#2c7bb8',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(54, 144, 206, 0.35)',
    },
    rootPressed: {
        transform: 'translateY(0)',
        boxShadow: '0 2px 8px rgba(54, 144, 206, 0.25)',
    },
};

const premiumSecondaryButtonStyle: IButtonStyles = {
    root: {
        background: 'transparent',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        minHeight: '48px',
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151',
        padding: '0 2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
    },
    rootHovered: {
        background: '#f9fafb',
        borderColor: '#d1d5db',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    rootPressed: {
        transform: 'translateY(0)',
        background: '#f3f4f6',
    },
};

const toggleStyles: IButtonStyles = {
    root: {
        padding: '12px 20px',
        borderRadius: '8px',
        backgroundColor: '#f9fafb',
        border: '2px solid #e5e7eb',
        height: '48px',
        fontWeight: 600,
        color: '#374151',
        flex: 1,
        transition: 'all 0.2s ease',
    },
    rootHovered: {
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    rootPressed: {
        transform: 'translateY(0)',
    },
    rootChecked: {
        backgroundColor: '#3690CE',
        borderColor: '#3690CE',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(54, 144, 206, 0.3)',
    },
};

// Only allow a single covering letter
interface CoverLetter {
    link: string;
    copies: number;
}

interface BundleFormProps {
    users?: UserData[];
    matters: NormalizedMatter[];
    onBack: () => void;
}

const BundleForm: React.FC<BundleFormProps> = ({ users = [], matters, onBack }) => {
    // Set default name to first user if available
    const [name, setName] = useState<string>(users.length > 0 ? users[0].FullName || users[0].Nickname || users[0].Initials || 'Current User' : 'Current User');
    const [matterRef, setMatterRef] = useState<string>('');
    const [bundleLink, setBundleLink] = useState<string>('');
    const [posted, setPosted] = useState<boolean>(false);
    const [leftInOffice, setLeftInOffice] = useState<boolean>(false);
    const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
    const [officeDate, setOfficeDate] = useState<Date | null>(null);
    const [coverLetter, setCoverLetter] = useState<CoverLetter>({ link: '', copies: 1 });
    const [copiesInOffice, setCopiesInOffice] = useState<number>(1);
    const [notes, setNotes] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [submitMessage, setSubmitMessage] = useState<string>('');
    const [matterFilter, setMatterFilter] = useState<string>('');

    // Optimized user options with memoization
    const userOptions: IDropdownOption[] = useMemo(() => {
        return users.map(u => {
            const fullName = (u as any)["Full Name"] || u.FullName || `${u.First || ''} ${u.Last || ''}`.trim();
            const key = u.Initials || fullName;
            return { key, text: fullName };
        });
    }, [users]);

    // Custom Matter Reference Field State
    const [matterSearchTerm, setMatterSearchTerm] = useState(matterRef || '');
    const [matterDropdownOpen, setMatterDropdownOpen] = useState(false);
    const [selectedMatter, setSelectedMatter] = useState<any>(null);
    const matterFieldRef = useRef<HTMLDivElement>(null);

    // Sync matterSearchTerm with matterRef when matterRef changes externally
    useEffect(() => {
        if (matterRef && matterRef !== matterSearchTerm) {
            setMatterSearchTerm(matterRef);
        }
    }, [matterRef, matterSearchTerm]);

    // Filter matters based on search term
    const filteredMatters = useMemo(() => {
        if (!matters || matters.length === 0) return [];
        
        if (!matterSearchTerm.trim()) return matters.slice(0, 50); // Show first 50 if no search
        
        const searchLower = matterSearchTerm.toLowerCase();
        return matters.filter((matter: any) => {
            const displayNumber = matter["Display Number"] || matter.displayNumber || '';
            const clientName = matter["Client Name"] || matter.clientName || '';
            const description = matter["Description"] || matter.description || '';
            
            return displayNumber.toLowerCase().includes(searchLower) ||
                   clientName.toLowerCase().includes(searchLower) ||
                   description.toLowerCase().includes(searchLower);
        }).slice(0, 20); // Limit to 20 results
    }, [matters, matterSearchTerm]);

    // Handle matter selection
    const handleMatterSelect = useCallback((matter: any) => {
        const displayNumber = matter["Display Number"] || matter.displayNumber || '';
        setSelectedMatter(matter);
        setMatterRef(displayNumber);
        setMatterSearchTerm(displayNumber);
        setMatterDropdownOpen(false);
    }, []);

    // Handle search input change
    const handleMatterSearchChange = useCallback((value: string) => {
        setMatterSearchTerm(value);
        setMatterRef(value);
        setMatterDropdownOpen(value.length > 0);
        
        // Clear selection if user types something different
        if (selectedMatter && value !== (selectedMatter["Display Number"] || selectedMatter.displayNumber)) {
            setSelectedMatter(null);
        }
    }, [selectedMatter]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (matterFieldRef.current && !matterFieldRef.current.contains(event.target as Node)) {
                setMatterDropdownOpen(false);
            }
        };

        if (matterDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [matterDropdownOpen]);

    // Validation function
    const isValid = () => {
        if (!name || !matterRef || !bundleLink) return false;
        if (!posted && !leftInOffice) return false;
        if (posted) {
            if (!arrivalDate) return false;
            if (!coverLetter.link || coverLetter.copies < 1) return false;
        }
        if (leftInOffice) {
            if (!officeDate || copiesInOffice < 1) return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!isValid()) return;
        
        setSubmitting(true);
        setSubmitStatus('submitting');
        setSubmitMessage('Creating Asana task...');
        
        const currentUser = users[0];

        const getAsanaField = (user: any, key: string) => {
            // Try camelCase, then snake_case, then uppercase
            return (
                user[key] ||
                user[key.replace('ID', '_ID')] ||
                user[key.replace('ID', '_ID').toUpperCase()] ||
                user[key.replace('ID', '_Id')] ||
                user[key.replace('ID', '_Id').toUpperCase()]
            );
        };

        const payload: any = {
            name,
            matterReference: matterRef,
            bundleLink,
            deliveryOptions: {
                posted,
                leftInOffice,
            },
            arrivalDate: posted ? arrivalDate?.toISOString() : null,
            officeReadyDate: leftInOffice ? officeDate?.toISOString() : null,
            coveringLetter: posted ? coverLetter : undefined,
            copiesInOffice: leftInOffice ? copiesInOffice : undefined,
            notes: notes || undefined,
        };

        if (currentUser) {
            payload.ASANAClientID = getAsanaField(currentUser, 'ASANAClientID');
            payload.ASANASecret = getAsanaField(currentUser, 'ASANASecret');
            payload.ASANARefreshToken = getAsanaField(currentUser, 'ASANARefreshToken');
        }

        try {
            const response = await fetch('/api/bundle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            if (response.ok) {
                setSubmitStatus('success');
                setSubmitMessage('Bundle task created successfully!');
                // Wait a moment to show success message before going back
                setTimeout(() => {
                    onBack();
                }, 1500);
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                setSubmitStatus('error');
                setSubmitMessage(`Failed to create task: ${errorData.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            setSubmitStatus('error');
            setSubmitMessage('Network error - please check your connection and try again');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={premiumContainerStyle}>
            <div style={premiumCardStyle}>
                {/* Premium Header */}
                <div style={premiumHeaderStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Icon iconName="Package" style={{ fontSize: '1.25rem', color: '#6b7280' }} />
                        <div>
                            <Text variant="large" style={{ color: '#6b7280', fontWeight: '700', margin: 0, lineHeight: '1.2' }}>
                                Bundle Submission
                            </Text>
                            <Text variant="small" style={{ color: '#6b7280', margin: 0, lineHeight: '1.4' }}>
                                Submit documents for professional processing
                            </Text>
                        </div>
                    </div>
                </div>

                {/* Premium Content */}
                <div style={premiumContentStyle}>
                    {/* Basic Information Section */}
                    <div style={premiumSectionStyle}>
                        <div style={premiumBannerStyle}>
                            <Icon iconName="Contact" style={{ fontSize: '1rem' }} />
                            Request Details
                        </div>
                        <Stack tokens={{ childrenGap: 20 }}>
                            {/* Custom Matter Reference Field */}
                            <div ref={matterFieldRef} style={{ position: 'relative', width: '100%' }}>
                                <div style={{
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    color: '#374151',
                                    marginBottom: '6px',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                }}>
                                    Matter reference *
                                </div>
                                <div style={{
                                    position: 'relative',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(229, 231, 235, 0.4)',
                                    background: 'transparent',
                                    transition: 'all 0.2s ease',
                                }}>
                                    <input
                                        type="text"
                                        value={matterSearchTerm}
                                        onChange={(e) => handleMatterSearchChange(e.target.value)}
                                        onFocus={() => setMatterDropdownOpen(true)}
                                        placeholder="Search by matter number or client name..."
                                        disabled={submitting}
                                        style={{
                                            width: '100%',
                                            height: '48px',
                                            border: 'none',
                                            outline: 'none',
                                            background: 'transparent',
                                            fontSize: '16px',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                            padding: '0 48px 0 12px',
                                            color: submitting ? '#9ca3af' : '#374151',
                                            cursor: submitting ? 'not-allowed' : 'text',
                                        }}
                                        required
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        pointerEvents: 'none',
                                    }}>
                                        <Icon iconName="ChevronDown" style={{ fontSize: '16px', color: '#6b7280' }} />
                                    </div>
                                </div>
                                
                                {/* Custom Dropdown */}
                                {matterDropdownOpen && filteredMatters.length > 0 && (
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.98)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(229, 231, 235, 0.6)',
                                        borderRadius: '8px',
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
                                        marginTop: '4px',
                                    }}>
                                        {filteredMatters.map((matter: any, index: number) => {
                                            const displayNumber = matter["Display Number"] || matter.displayNumber || '';
                                            const clientName = matter["Client Name"] || matter.clientName || '';
                                            const description = matter["Description"] || matter.description || '';
                                            
                                            return (
                                                <div
                                                    key={displayNumber + index}
                                                    onClick={() => handleMatterSelect(matter)}
                                                    style={{
                                                        padding: '12px',
                                                        cursor: 'pointer',
                                                        borderBottom: index < filteredMatters.length - 1 ? '1px solid rgba(229, 231, 235, 0.2)' : 'none',
                                                        transition: 'background-color 0.15s ease',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(54, 144, 206, 0.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }}
                                                >
                                                    <div style={{
                                                        fontWeight: '600',
                                                        fontSize: '14px',
                                                        color: '#374151',
                                                        marginBottom: '2px',
                                                    }}>
                                                        {displayNumber}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '13px',
                                                        color: '#6b7280',
                                                        marginBottom: '2px',
                                                    }}>
                                                        {clientName}
                                                    </div>
                                                    {description && (
                                                        <div style={{
                                                            fontSize: '12px',
                                                            color: '#9ca3af',
                                                        }}>
                                                            {description.length > 60 ? description.substring(0, 60) + '...' : description}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <TextField
                                label="NetDocs link (bundle)"
                                value={bundleLink}
                                onChange={(_, v) => setBundleLink(v || '')}
                                required
                                disabled={submitting}
                                styles={premiumInputStyle}
                                placeholder="Enter bundle reference or link"
                            />
                        </Stack>
                    </div>

                    {/* Delivery Method Section */}
                    <div style={premiumSectionStyle}>
                        <div style={premiumBannerStyle}>
                            <Icon iconName="DeliveryTruck" style={{ fontSize: '1rem' }} />
                            Delivery Method
                        </div>
                        <Stack horizontal tokens={{ childrenGap: 12 }}>
                            <DefaultButton
                                text="Posted"
                                checked={posted}
                                onClick={() => setPosted(!posted)}
                                disabled={submitting}
                                iconProps={{ iconName: 'Send' }}
                                styles={posted ? { ...toggleStyles, rootChecked: toggleStyles.rootChecked } : toggleStyles}
                            />
                            <DefaultButton
                                text="Left in office"
                                checked={leftInOffice}
                                onClick={() => setLeftInOffice(!leftInOffice)}
                                disabled={submitting}
                                iconProps={{ iconName: 'Home' }}
                                styles={leftInOffice ? { ...toggleStyles, rootChecked: toggleStyles.rootChecked } : toggleStyles}
                            />
                        </Stack>
                    </div>

                    {/* Posted Details */}
                    {posted && (
                        <div style={premiumSectionStyle}>
                            <div style={premiumBannerStyle}>
                                <Icon iconName="Calendar" style={{ fontSize: '1rem' }} />
                                Postal Details
                            </div>
                            <Stack tokens={{ childrenGap: 20 }}>
                                <DatePicker 
                                    label="Arrival date" 
                                    value={arrivalDate || undefined} 
                                    onSelectDate={(date) => setArrivalDate(date ?? null)} 
                                    isRequired 
                                    styles={premiumDatePickerStyle}
                                />
                                <Stack horizontal tokens={{ childrenGap: 20 }}>
                                    <TextField
                                        label="Covering letter link"
                                        value={coverLetter.link}
                                        onChange={(_, v) => setCoverLetter((c) => ({ ...c, link: v || '' }))}
                                        required
                                        styles={{ ...premiumInputStyle, root: { flex: 1 } }}
                                        placeholder="Enter covering letter link"
                                    />
                                    <TextField
                                        label="No. of copies to address"
                                        type="number"
                                        value={coverLetter.copies.toString()}
                                        onChange={(_, v) => setCoverLetter((c) => ({ ...c, copies: Number(v) || 1 }))}
                                        required
                                        styles={{ ...premiumInputStyle, root: { minWidth: '180px' } }}
                                    />
                                </Stack>
                                <Text variant="small" style={{ color: '#6b7280', fontStyle: 'italic' }}>
                                    This should be to the address on the covering letter uploaded
                                </Text>
                            </Stack>
                        </div>
                    )}

                    {/* Office Details */}
                    {leftInOffice && (
                        <div style={premiumSectionStyle}>
                            <div style={premiumBannerStyle}>
                                <Icon iconName="Building" style={{ fontSize: '1rem' }} />
                                Office Drop-off
                            </div>
                            <Stack tokens={{ childrenGap: 20 }}>
                                <DatePicker 
                                    label="Office-ready date" 
                                    value={officeDate || undefined} 
                                    onSelectDate={(date) => setOfficeDate(date ?? null)} 
                                    isRequired 
                                    styles={premiumDatePickerStyle}
                                />
                                <TextField
                                    label="No. of copies in office"
                                    type="number"
                                    value={copiesInOffice.toString()}
                                    onChange={(_, v) => setCopiesInOffice(Number(v) || 1)}
                                    required
                                    styles={premiumInputStyle}
                                />
                            </Stack>
                        </div>
                    )}

                    {/* Additional Notes Section */}
                    <div style={premiumSectionStyle}>
                        <div style={premiumBannerStyle}>
                            <Icon iconName="EditNote" style={{ fontSize: '1rem' }} />
                            Additional Notes
                        </div>
                        <TextField 
                            label="Other notes" 
                            multiline 
                            rows={4} 
                            value={notes} 
                            onChange={(_, v) => setNotes(v || '')} 
                            styles={premiumInputStyle}
                            placeholder="Enter any additional notes or special instructions..."
                        />
                    </div>

                    {/* Status Feedback Section */}
                    {submitStatus !== 'idle' && (
                        <div style={{
                            ...premiumSectionStyle,
                            background: submitStatus === 'success' ? 'rgba(34, 197, 94, 0.1)' : 
                                       submitStatus === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                                       'rgba(59, 130, 246, 0.1)',
                            border: `1px solid ${submitStatus === 'success' ? 'rgba(34, 197, 94, 0.3)' : 
                                                submitStatus === 'error' ? 'rgba(239, 68, 68, 0.3)' : 
                                                'rgba(59, 130, 246, 0.3)'}`,
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                color: submitStatus === 'success' ? '#16a34a' : 
                                       submitStatus === 'error' ? '#dc2626' : 
                                       '#2563eb',
                            }}>
                                {submitStatus === 'submitting' && (
                                    <Icon iconName="More" style={{ fontSize: '1.25rem', animation: 'spin 1s linear infinite' }} />
                                )}
                                {submitStatus === 'success' && (
                                    <Icon iconName="CheckMark" style={{ fontSize: '1.25rem' }} />
                                )}
                                {submitStatus === 'error' && (
                                    <Icon iconName="ErrorBadge" style={{ fontSize: '1.25rem' }} />
                                )}
                                <Text variant="medium" style={{ fontWeight: '600' }}>
                                    {submitMessage}
                                </Text>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons Bar */}
                    <div style={{ 
                        background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
                        border: '1px solid rgba(229, 231, 235, 0.6)',
                        borderTop: '2px solid rgba(54, 144, 206, 0.1)',
                        borderRadius: '0 0 12px 12px',
                        padding: '1.25rem',
                        marginTop: '1.25rem',
                        marginLeft: '-1.5rem',
                        marginRight: '-1.5rem',
                        marginBottom: '-1.5rem',
                    }}>
                        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Icon iconName="Contact" style={{ fontSize: '1rem', color: '#6b7280' }} />
                                <Text variant="small" style={{ color: '#374151', fontWeight: '600' }}>
                                    {(() => {
                                        // Try to get user name from users array first
                                        if (users && users.length > 0) {
                                            const currentUser = users[0];
                                            const fullName = (currentUser as any)["Full Name"] || currentUser.FullName || `${currentUser.First || ''} ${currentUser.Last || ''}`.trim();
                                            return fullName.split(' ')[0];
                                        }
                                        
                                        // Fallback to userOptions lookup
                                        const currentUser = userOptions.find(u => u.key === name);
                                        const userName = currentUser?.text || name || 'User';
                                        return userName.split(' ')[0];
                                    })()}
                                </Text>
                            </div>
                            <Stack horizontal tokens={{ childrenGap: 12 }}>
                                <DefaultButton
                                    text="Cancel"
                                    onClick={onBack}
                                    styles={premiumSecondaryButtonStyle}
                                    iconProps={{ iconName: 'Cancel' }}
                                />
                                <PrimaryButton
                                    text={submitting ? 'Creating Task...' : submitStatus === 'success' ? 'Task Created!' : 'Submit Bundle'}
                                    onClick={handleSubmit}
                                    disabled={!isValid() || submitting || submitStatus === 'success'}
                                    styles={premiumButtonStyle}
                                    iconProps={
                                        submitting ? { iconName: 'More', style: { animation: 'spin 1s linear infinite' } } :
                                        submitStatus === 'success' ? { iconName: 'CheckMark' } :
                                        { iconName: 'Send' }
                                    }
                                />
                            </Stack>
                        </Stack>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BundleForm;
