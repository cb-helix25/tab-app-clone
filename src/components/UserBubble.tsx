import React, { useState, useRef, useEffect } from 'react';
// invisible change 2
import { UserData } from '../app/functionality/types';
import '../app/styles/UserBubble.css';
import '../app/styles/personas.css';

interface UserBubbleProps {
    user: UserData;
    isLocalDev?: boolean;
    onAreasChange?: (areas: string[]) => void;
}

const AVAILABLE_AREAS = [
    'Commercial',
    'Construction', 
    'Property',
    'Employment',
    'Misc/Other'
];

const UserBubble: React.FC<UserBubbleProps> = ({ user, isLocalDev = false, onAreasChange }) => {
    const [open, setOpen] = useState(false);
    const [isClickToggled, setIsClickToggled] = useState(false);
    const bubbleRef = useRef<HTMLButtonElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const initials =
        user.Initials ||
        `${user.First?.charAt(0) || ''}${user.Last?.charAt(0) || ''}`.toUpperCase();

    useEffect(() => {
        function updatePosition() {
            if (bubbleRef.current && popoverRef.current) {
                const bubbleRect = bubbleRef.current.getBoundingClientRect();
                const popRect = popoverRef.current.getBoundingClientRect();

                let left = bubbleRect.left;
                if (left + popRect.width > window.innerWidth - 8) {
                    left = window.innerWidth - popRect.width - 8;
                }
                if (left < 8) left = 8;

                let top = bubbleRect.bottom + 8;
                if (top + popRect.height > window.innerHeight - 8) {
                    top = bubbleRect.top - popRect.height - 8;
                }
                if (top < 8) top = 8;

                setPos({ top, left });
            }
        }
        if (open) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition);
        }
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [open]);

    // Handle click outside to close popover in local dev mode
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (isClickToggled && 
                bubbleRef.current && 
                popoverRef.current && 
                !bubbleRef.current.contains(event.target as Node) &&
                !popoverRef.current.contains(event.target as Node)) {
                setOpen(false);
                setIsClickToggled(false);
            }
        }

        if (isClickToggled) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isClickToggled]);

    const copy = (text?: string) => {
        if (text) navigator.clipboard.writeText(text);
    };

    // Only display email, Clio ID, Entra ID, and Asana credentials from the user data
    const allowedFields = ['Email', 'ClioID', 'EntraID', 'ASANAClientID', 'ASANASecret', 'ASANARefreshToken'] as const;
    const labels: Record<typeof allowedFields[number], string> = {
        Email: 'Email',
        ClioID: 'Clio ID',
        EntraID: 'Entra ID',
        ASANAClientID: 'Asana Client ID',
        ASANASecret: 'Asana Secret',
        ASANARefreshToken: 'Asana Refresh Token',
    };

    const userDetails = allowedFields
        .filter((key) => user[key as keyof UserData])
        .map((key) => ({
            label: labels[key],
            value: String(user[key as keyof UserData]),
        }));

    // Extract and format areas of work
    let areasOfWork: string[] = [];
    if (user.AOW) {
        areasOfWork = String(user.AOW).split(',').map(s => s.trim()).filter(Boolean);
    } else if ((user as any).Area_of_Work) {
        areasOfWork = String((user as any).Area_of_Work).split(',').map(s => s.trim()).filter(Boolean);
    } else if ((user as any).aow) {
        areasOfWork = String((user as any).aow).split(',').map(s => s.trim()).filter(Boolean);
    }

    return (
        <div className="user-bubble-container">
            <button
                type="button"
                className={`user-bubble-button persona-bubble ${isLocalDev && onAreasChange ? 'clickable-local-dev' : ''}`}
                ref={bubbleRef}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => !isClickToggled && setOpen(false)}
                onFocus={() => setOpen(true)}
                onBlur={() => !isClickToggled && setOpen(false)}
                onClick={() => {
                    if (isLocalDev && onAreasChange) {
                        setIsClickToggled(!open);
                        setOpen(!open);
                    }
                }}
            >
                <span className="user-initials">{initials}</span>
            </button>
            {open && (
                <div
                    ref={popoverRef}
                    className="user-popover"
                    style={{ top: pos.top, left: pos.left }}
                    onMouseEnter={() => setOpen(true)}
                    onMouseLeave={() => !isClickToggled && setOpen(false)}
                >
                    {userDetails.map((d) => (
                        <div key={d.label} className="detail-row">
                            <span className="label">{d.label}:</span>
                            <span className="value">{d.value}</span>
                            <button
                                className="copy-btn"
                                aria-label={`Copy ${d.label}`}
                                onClick={() => copy(d.value)}
                            >
                                Copy
                            </button>
                        </div>
                    ))}
                    {areasOfWork.length > 0 && (
                        <div className="detail-row">
                            <span className="label">Areas of Work:</span>
                            <span className="value">{areasOfWork.join(', ')}</span>
                        </div>
                    )}
                    {isLocalDev && onAreasChange && (
                        <div className="local-area-selector">
                            <div className="selector-header">
                                <span className="label">Local Area Selection:</span>
                            </div>
                            <div className="area-checkboxes">
                                {AVAILABLE_AREAS.map(area => (
                                    <label key={area} className="area-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={areasOfWork.includes(area)}
                                            onChange={(e) => {
                                                const newAreas = e.target.checked 
                                                    ? [...areasOfWork, area]
                                                    : areasOfWork.filter(a => a !== area);
                                                onAreasChange(newAreas);
                                            }}
                                        />
                                        <span>{area}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserBubble;
