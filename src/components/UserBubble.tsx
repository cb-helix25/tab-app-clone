import React, { useState, useRef, useEffect } from 'react';
import DataInspector from './DataInspector';
// invisible change 2
import { UserData } from '../app/functionality/types';
import '../app/styles/UserBubble.css';
import '../app/styles/personas.css';
import { isAdminUser, isPowerUser } from '../app/admin';

interface UserBubbleProps {
    user: UserData;
    isLocalDev?: boolean;
    onAreasChange?: (areas: string[]) => void;
    onUserChange?: (user: UserData) => void;
    availableUsers?: UserData[] | null;
}

const AVAILABLE_AREAS = [
    'Commercial',
    'Construction', 
    'Property',
    'Employment',
    'Misc/Other'
];

const UserBubble: React.FC<UserBubbleProps> = ({
    user,
    isLocalDev = false,
    onAreasChange,
    onUserChange,
    availableUsers,
}) => {
    const [open, setOpen] = useState(false);
    const [isClickToggled, setIsClickToggled] = useState(false);
    const [showDataInspector, setShowDataInspector] = useState(false);
    const bubbleRef = useRef<HTMLButtonElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const initials =
        user.Initials ||
        `${user.First?.charAt(0) || ''}${user.Last?.charAt(0) || ''}`.toUpperCase();

    useEffect(() => {
        // Persist current user initials for debugging features
        localStorage.setItem('__currentUserInitials', (user.Initials || '').toLowerCase());
    }, [user]);

    useEffect(() => {
        function updatePosition() {
            if (bubbleRef.current) {
                const bubbleRect = bubbleRef.current.getBoundingClientRect();
                
                // Position the popover relative to the bubble
                let left = bubbleRect.left;
                let top = bubbleRect.bottom + 8;
                
                // Keep popover within viewport bounds
                const popoverWidth = 320; // estimated width
                const popoverHeight = 400; // estimated height
                
                if (left + popoverWidth > window.innerWidth - 16) {
                    left = window.innerWidth - popoverWidth - 16;
                }
                if (left < 16) left = 16;

                if (top + popoverHeight > window.innerHeight - 16) {
                    top = bubbleRect.top - popoverHeight - 8;
                }
                if (top < 16) top = 16;

                setPos({ top, left });
            }
        }
        
        if (open) {
            updatePosition();
            // Prevent body scroll when popover is open
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            
            window.addEventListener('resize', updatePosition);
            
            return () => {
                window.removeEventListener('resize', updatePosition);
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [open]);

    // Handle click outside to close popover
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                open &&
                bubbleRef.current &&
                popoverRef.current &&
                !bubbleRef.current.contains(event.target as Node) &&
                !popoverRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
                setIsClickToggled(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open]);

    const copy = (text?: string) => {
        if (text) navigator.clipboard.writeText(text);
    };

    // Display all available fields from the user object.
    // Deduplicate keys that differ only by spacing or underscores.
    const detailsMap = new Map<string, { label: string; value: string; isAsana: boolean; isSecret: boolean; isRate?: boolean; isRole?: boolean }>();
    let foundRate = false, foundRole = false;
    Object.entries(user as Record<string, unknown>)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .forEach(([key, value]) => {
            const canonical = key.replace(/[\s_]/g, '').toLowerCase();
            if (canonical === 'aow') return; // handled separately
            // Hide refresh token completely
            if (canonical.includes('refreshtoken') || canonical.includes('refresh_token')) return;
            const isAsana = canonical.includes('asana');
            const isSecret = canonical.includes('secret') || canonical.includes('token');
            const isRate = canonical === 'rate';
            const isRole = canonical === 'role';
            if (isRate) foundRate = true;
            if (isRole) foundRole = true;
            if (!detailsMap.has(canonical)) {
                detailsMap.set(canonical, {
                    label: key.replace(/_/g, ' '),
                    value: String(value),
                    isAsana,
                    isSecret,
                    isRate,
                    isRole
                });
            }
        });
    const userDetails = Array.from(detailsMap.values());
    // Separate regular details from Asana details
    const regularDetails = userDetails.filter(d => !d.isAsana);
    const asanaDetails = userDetails.filter(d => d.isAsana);
    
    // State for showing Asana details
    const [showAsanaDetails, setShowAsanaDetails] = useState(false);

    // Extract and format areas of work
    let areasOfWork: string[] = [];
    if (user.AOW) {
        areasOfWork = String(user.AOW).split(',').map(s => s.trim()).filter(Boolean);
    } else if ((user as any).Area_of_Work) {
        areasOfWork = String((user as any).Area_of_Work).split(',').map(s => s.trim()).filter(Boolean);
    } else if ((user as any).aow) {
        areasOfWork = String((user as any).aow).split(',').map(s => s.trim()).filter(Boolean);
    }

    // Normalize potential fields to lower case and trim whitespace so
    // production data with trailing spaces or nickname variations still match.
    const canSwitchUser = isAdminUser(user);

    // Local dev: check for Rate/Role presence
    const showLocalDevBanner = isLocalDev;
    const missingFields = [];
    if (showLocalDevBanner) {
        if (!foundRate) missingFields.push('Rate');
        if (!foundRole) missingFields.push('Role');
    }
    return (
        <div className="user-bubble-container">
            <button
                type="button"
                className={`user-bubble-button persona-bubble ${isLocalDev && onAreasChange ? 'clickable-local-dev' : ''}`}
                ref={bubbleRef}
                onClick={() => {
                    if (open) {
                        setOpen(false);
                        setIsClickToggled(false);
                    } else {
                        setOpen(true);
                        setIsClickToggled(true);
                    }
                }}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: '600',
                    position: 'relative'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }}
            >
                {initials}
            </button>
            
            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.1)',
                            zIndex: 1998
                        }}
                        onClick={() => {
                            setOpen(false);
                            setIsClickToggled(false);
                        }}
                    />
                    
                    {/* Popover */}
                    <div
                        ref={popoverRef}
                        style={{
                            position: 'fixed',
                            top: pos.top,
                            left: pos.left,
                            width: '320px',
                            maxHeight: '80vh',
                            background: '#ffffff',
                            borderRadius: '12px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                            border: '1px solid #e5e7eb',
                            overflow: 'hidden',
                            zIndex: 1999,
                            animation: 'fadeInUp 0.2s ease forwards'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            background: '#f8fafc',
                            color: '#64748b',
                            padding: '12px 16px',
                            borderBottom: '1px solid #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    color: '#64748b'
                                }}>
                                    {initials}
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '1px', color: '#374151' }}>
                                        {user.FullName || `${user.First || ''} ${user.Last || ''}`.trim() || 'User Profile'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                        {user.Role || 'Team Member'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{
                            maxHeight: 'calc(80vh - 80px)',
                            overflowY: 'auto',
                            padding: '12px 16px'
                        }}>
                            {/* User Details */}
                            <div style={{ marginBottom: '16px' }}>
                                <h4 style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    color: '#6b7280',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Profile Details
                                </h4>
                                {/* Local dev banner for Rate/Role presence */}
                                {showLocalDevBanner && (
                                    <div style={{
                                        marginBottom: '10px',
                                        padding: '7px 10px',
                                        borderRadius: '5px',
                                        background: missingFields.length
                                            ? '#fff4e5'
                                            : '#e7fbe7',
                                        color: missingFields.length
                                            ? '#b26a00'
                                            : '#217a2b',
                                        border: missingFields.length
                                            ? '1px solid #ffd591'
                                            : '1px solid #b7eb8f',
                                        fontSize: '11px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        fontWeight: 500
                                    }}>
                                        {missingFields.length ? (
                                            <>
                                                <span style={{fontSize:'15px',fontWeight:700,verticalAlign:'middle'}}>⚠️</span>
                                                Missing: {missingFields.join(' & ')} — set these in your user data for local testing.
                                            </>
                                        ) : (
                                            <>
                                                <span style={{fontSize:'15px',fontWeight:700,verticalAlign:'middle'}}>✔</span>
                                                Rate & Role present for local user.
                                            </>
                                        )}
                                    </div>
                                )}
                                <div style={{ display: 'grid', gap: '4px' }}>
                                    {regularDetails.map((d) => (
                                        <div key={d.label} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '6px 8px',
                                            background: d.isRate || d.isRole ? '#f0fdf4' : '#fafbfc',
                                            borderRadius: '4px',
                                            border: d.isRate || d.isRole ? '1px solid #b7eb8f' : '1px solid #f1f3f4'
                                        }}>
                                            <span style={{
                                                fontSize: '10px',
                                                fontWeight: '500',
                                                color: d.isRate || d.isRole ? '#217a2b' : '#6b7280',
                                                minWidth: '70px',
                                                textTransform: 'capitalize'
                                            }}>
                                                {d.label}:
                                            </span>
                                            <span style={{
                                                fontSize: '10px',
                                                color: d.isRate || d.isRole ? '#217a2b' : '#374151',
                                                flex: 1,
                                                marginLeft: '6px',
                                                wordBreak: 'break-word',
                                                fontWeight: d.isRate || d.isRole ? 600 : 400
                                            }}>
                                                {d.isSecret ? '***HIDDEN***' : d.value}
                                            </span>
                                            <button
                                                onClick={() => copy(d.value)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#6b7280',
                                                    cursor: 'pointer',
                                                    fontSize: '9px',
                                                    padding: '2px 4px',
                                                    borderRadius: '2px',
                                                    marginLeft: '6px',
                                                    transition: 'color 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Asana Details Toggle */}
                                {asanaDetails.length > 0 && (
                                    <div style={{ marginTop: '8px' }}>
                                        <button
                                            onClick={() => setShowAsanaDetails(!showAsanaDetails)}
                                            style={{
                                                width: '100%',
                                                padding: '6px 8px',
                                                background: '#f8fafc',
                                                color: '#6b7280',
                                                border: '1px solid #f1f3f4',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#f1f5f9';
                                                e.currentTarget.style.color = '#374151';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#f8fafc';
                                                e.currentTarget.style.color = '#6b7280';
                                            }}
                                        >
                                            <span>Asana Integration Details</span>
                                            <span style={{ fontSize: '8px' }}>{showAsanaDetails ? '▼' : '▶'}</span>
                                        </button>
                                        
                                        {showAsanaDetails && (
                                            <div style={{ 
                                                marginTop: '4px',
                                                display: 'grid', 
                                                gap: '4px',
                                                background: '#fafbfc',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                border: '1px solid #f1f3f4'
                                            }}>
                                                {asanaDetails.map((d) => (
                                                    <div key={d.label} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '4px 6px',
                                                        background: '#ffffff',
                                                        borderRadius: '3px',
                                                        border: '1px solid #f1f3f4'
                                                    }}>
                                                        <span style={{
                                                            fontSize: '9px',
                                                            fontWeight: '500',
                                                            color: '#6b7280',
                                                            minWidth: '60px',
                                                            textTransform: 'capitalize'
                                                        }}>
                                                            {d.label}:
                                                        </span>
                                                        <span style={{
                                                            fontSize: '9px',
                                                            color: '#374151',
                                                            flex: 1,
                                                            marginLeft: '6px',
                                                            wordBreak: 'break-word',
                                                            fontFamily: 'monospace'
                                                        }}>
                                                            {d.isSecret ? '***HIDDEN***' : d.value}
                                                        </span>
                                                        {!d.isSecret && (
                                                            <button
                                                                onClick={() => copy(d.value)}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    color: '#6b7280',
                                                                    cursor: 'pointer',
                                                                    fontSize: '8px',
                                                                    padding: '1px 3px',
                                                                    borderRadius: '2px',
                                                                    marginLeft: '4px',
                                                                    transition: 'color 0.15s ease'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
                                                                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                                                            >
                                                                Copy
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Areas of Work */}
                            {areasOfWork.length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{
                                        margin: '0 0 8px 0',
                                        fontSize: '11px',
                                        fontWeight: '500',
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Areas of Work
                                    </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {areasOfWork.map((area, index) => (
                                            <span key={index} style={{
                                                background: '#f8fafc',
                                                color: '#6b7280',
                                                padding: '3px 6px',
                                                borderRadius: '3px',
                                                fontSize: '10px',
                                                fontWeight: '400',
                                                border: '1px solid #f1f3f4'
                                            }}>
                                                {area}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Local Area Selector */}
                            {isLocalDev && onAreasChange && (
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{
                                        margin: '0 0 8px 0',
                                        fontSize: '11px',
                                        fontWeight: '500',
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Local Development
                                    </h4>
                                    <div style={{
                                        background: '#fafbfc',
                                        border: '1px solid #f1f3f4',
                                        borderRadius: '4px',
                                        padding: '8px'
                                    }}>
                                        <div style={{ marginBottom: '6px', fontSize: '10px', color: '#6b7280' }}>
                                            Override areas of work:
                                        </div>
                                        <div style={{ display: 'grid', gap: '4px' }}>
                                            {AVAILABLE_AREAS.map(area => (
                                                <label key={area} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '10px',
                                                    color: '#6b7280'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={areasOfWork.includes(area)}
                                                        onChange={(e) => {
                                                            const newAreas = e.target.checked
                                                                ? [...areasOfWork, area]
                                                                : areasOfWork.filter(a => a !== area);
                                                            onAreasChange(newAreas);
                                                        }}
                                                        style={{ accentColor: '#6b7280' }}
                                                    />
                                                    <span>{area}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* User Switcher */}
                            {onUserChange && availableUsers && canSwitchUser && (
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{
                                        margin: '0 0 8px 0',
                                        fontSize: '11px',
                                        fontWeight: '500',
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Switch User
                                    </h4>
                                    <select
                                        onChange={(e) => {
                                            const selected = availableUsers.find(
                                                (u) => u.Initials === e.target.value,
                                            );
                                            if (selected) onUserChange(selected);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '6px 8px',
                                            border: '1px solid #f1f3f4',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            backgroundColor: '#fafbfc',
                                            color: '#374151'
                                        }}
                                    >
                                        <option value="">Select user...</option>
                                        {availableUsers.map((u) => (
                                            <option key={u.Initials} value={u.Initials}>
                                                {u.FullName || `${u.First || ''} ${u.Last || ''}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Data Inspector */}
                            {isPowerUser(user) && (
                                <div>
                                    <button
                                        onClick={() => setShowDataInspector(true)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: '#f8fafc',
                                            color: '#6b7280',
                                            border: '1px solid #f1f3f4',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#f1f5f9';
                                            e.currentTarget.style.color = '#374151';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#f8fafc';
                                            e.currentTarget.style.color = '#6b7280';
                                        }}
                                    >
                                        Open Application Inspector
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
            
            {showDataInspector && (
                <DataInspector data={user} onClose={() => setShowDataInspector(false)} />
            )}
        </div>
    );
};

export default UserBubble;
