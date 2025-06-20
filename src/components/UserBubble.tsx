import React, { useState, useRef, useEffect } from 'react';
import { UserData } from '../app/functionality/types';
import '../app/styles/UserBubble.css';
import '../app/styles/personas.css';

interface UserBubbleProps {
    user: UserData;
}

const UserBubble: React.FC<UserBubbleProps> = ({ user }) => {
    const [open, setOpen] = useState(false);
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

    const copy = (text?: string) => {
        if (text) navigator.clipboard.writeText(text);
    };

    const userDetails = [
        { label: 'Name', value: user.FullName },
        { label: 'Email', value: user.Email },
        { label: 'Role', value: user.Role },
    ].filter((d) => d.value);

    return (
        <div className="user-bubble-container">
            <button
                type="button"
                className="user-bubble-button persona-bubble"
                ref={bubbleRef}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
            >
                <span className="user-initials">{initials}</span>
            </button>
            {open && (
                <div
                    ref={popoverRef}
                    className="user-popover"
                    style={{ top: pos.top, left: pos.left }}
                    onMouseEnter={() => setOpen(true)}
                    onMouseLeave={() => setOpen(false)}
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
                </div>
            )}
        </div>
    );
};

export default UserBubble;
