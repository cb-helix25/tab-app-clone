import React, { useEffect, useState } from 'react';
// invisible change 2
import { Spinner, SpinnerSize, mergeStyles, keyframes } from '@fluentui/react';
import { FaCheck } from 'react-icons/fa';
import ImmediateActionChip from './ImmediateActionChip';
import { colours } from '../../app/styles/colours';

interface Action {
    title: string;
    onClick: () => void;
    icon: string;
    disabled?: boolean; // For greyed out production features
}

interface ImmediateActionsBarProps {
    isDarkMode: boolean;
    immediateActionsReady: boolean;
    immediateActionsList: Action[];
    highlighted?: boolean;
    seamless?: boolean;
}

const ACTION_BAR_HEIGHT = 36;
const HIDE_DELAY_MS = 3000; // Auto-hide delay when there is nothing to action

// Distinct container for immediate actions styled as an app-level tray
const immediateActionsContainerStyle = (
    isDarkMode: boolean,
    highlighted: boolean
) =>
    mergeStyles({
        // Position as app-level tray extending from Navigator
        position: 'relative',
        zIndex: 10, // Much lower z-index to avoid blocking navigation
        
        // Match Navigator/Quick gradient for seamless connection
        background: isDarkMode
            ? 'linear-gradient(135deg, #0F172A 0%, #111827 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        
        // Remove all borders to create seamless connection
        border: 'none',
        borderRadius: '0 0 10px 10px', // Only bottom corners rounded
        
        // Softer, professional shadow per style guide
        boxShadow: isDarkMode
            ? '0 4px 6px rgba(0, 0, 0, 0.3)'
            : '0 4px 6px rgba(0, 0, 0, 0.07)',
        
    // Full width at app level
    margin: '0',
    // Attach to Quick Actions bar: negate only Navigator bottom padding (~8px)
    // so there's no visible gap, but do not sit "behind" it.
    marginTop: '-8px',

    // Layout - compact top padding since we're not extending behind
    padding: '6px 10px 10px 10px',
        marginBottom: '12px', // Space before main content
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        
        // Highlighted state for notifications
        ...(highlighted && {
            transform: 'translateY(-1px)',
            boxShadow: isDarkMode
                ? '0 4px 8px rgba(54, 144, 206, 0.25)'
                : '0 4px 8px rgba(54, 144, 206, 0.20)',
            borderColor: isDarkMode 
                ? 'rgba(54, 144, 206, 0.2)' 
                : 'rgba(54, 144, 206, 0.15)',
            background: isDarkMode
                ? 'linear-gradient(135deg, #1E293B 0%, #334155 100%)'
                : 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        }),
    });

const barStyle = (
    isDarkMode: boolean,
    hasImmediateActions: boolean,
    highlighted: boolean,
    seamless: boolean
) =>
    mergeStyles({
        // Remove background since container handles it
        backgroundColor: 'transparent',
        boxShadow: 'none',
        border: 'none',
        
        // Layout
        padding: '0',
        display: 'flex',
        flexDirection: 'row',
    gap: '8px',
        overflowX: 'auto',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        alignItems: 'center',
        height: ACTION_BAR_HEIGHT,
        
        selectors: {
            '::-webkit-scrollbar': {
                display: 'none',
            },
        },
    });

const fadeInKeyframes = keyframes({
    from: { opacity: 0, transform: 'translateY(5px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
});

const tickPopKeyframes = keyframes({
    '0%': { transform: 'scale(0)', opacity: 0 },
    '70%': { transform: 'scale(1.3)', opacity: 1 },
    '100%': { transform: 'scale(1)', opacity: 1 },
});

const noActionsClass = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    // Align message with the quick action cards
    justifyContent: 'flex-start',
    paddingLeft: '12px',
    animation: `${fadeInKeyframes} 0.3s ease-out`,
});

const noActionsIconClass = mergeStyles({
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: colours.highlight,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    animation: `${tickPopKeyframes} 0.3s ease`,
});

const noActionsTextClass = mergeStyles({
    marginLeft: '8px',
    fontSize: '14px',
    animation: `${fadeInKeyframes} 0.3s ease-out`,
});

const ImmediateActionsBar: React.FC<ImmediateActionsBarProps> = ({
    isDarkMode,
    immediateActionsReady,
    immediateActionsList,
    highlighted = false,
    seamless = false,
}) => {
    const [visible, setVisible] = useState(true);
    const [autoHidden, setAutoHidden] = useState(false);
    const computedVisible = (immediateActionsList.length > 0 || !immediateActionsReady) ? true : visible;

    // Hide on scroll only when not auto-hidden and there are no actions
    useEffect(() => {
        const handleScroll = () => {
            if (autoHidden) return; // keep hidden once auto-hidden until content changes
            const threshold = ACTION_BAR_HEIGHT * 2;
            if (window.scrollY > threshold) {
                setVisible(false);
            } else {
                setVisible(true);
            }
        };

        if (immediateActionsList.length === 0 && !autoHidden) {
            window.addEventListener('scroll', handleScroll);
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [immediateActionsList, autoHidden]);

    // Auto-hide the bar a few seconds after showing "Nothing to Action"
    useEffect(() => {
        let timer: number | undefined;
        if (immediateActionsReady && immediateActionsList.length === 0) {
            // show briefly, then hide
            setAutoHidden(false);
            setVisible(true);
            timer = window.setTimeout(() => {
                setAutoHidden(true);
                setVisible(false);
            }, HIDE_DELAY_MS);
        } else {
            // content changed (spinner or actions present) → ensure visible and reset auto-hidden
            if (autoHidden) setAutoHidden(false);
            setVisible(true);
        }

        return () => {
            if (timer) window.clearTimeout(timer);
        };
    }, [immediateActionsReady, immediateActionsList.length]);

    return (
        <div
            className={immediateActionsContainerStyle(isDarkMode, highlighted)}
            style={{
                height: computedVisible ? 'auto' : 0,
                overflow: 'hidden',
                opacity: computedVisible ? 1 : 0,
                transform: computedVisible ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'height 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
                pointerEvents: (computedVisible && immediateActionsReady) ? 'auto' : 'none',
            }}
        >
            {/* Removed animated accent; using a static label instead */}
            <div
                className={barStyle(
                    isDarkMode,
                    immediateActionsList.length > 0,
                    highlighted,
                    seamless
                )}
                style={{
                    display: 'flex',
                    gap: '8px',
                }}
            >
            {!immediateActionsReady ? (
                <Spinner size={SpinnerSize.small} />
            ) : immediateActionsList.length === 0 ? (
                <div className={noActionsClass}>
                    <div className={noActionsIconClass}>
                        <FaCheck />
                    </div>
                    <div className={noActionsTextClass}>Nothing to Action.</div>
                </div>
            ) : (
                <>
                    {immediateActionsList.map((action) => (
                        <ImmediateActionChip
                            key={action.title}
                            title={action.title}
                            icon={action.icon}
                            isDarkMode={isDarkMode}
                            onClick={action.onClick}
                            disabled={action.disabled}
                        />
                    ))}
                    
                </>
            )}
            </div>
        </div>
    );
};

export default ImmediateActionsBar;
