import React from 'react';
// Modern QuickActionsBar with professional animations and no layout jolts
import { mergeStyles, Icon } from '@fluentui/react';
import QuickActionsCard from './QuickActionsCard';
import { colours } from '../../app/styles/colours';

interface QuickAction {
    title: string;
    icon: string;
}

interface QuickActionsBarProps {
    isDarkMode: boolean;
    quickActions: QuickAction[];
    handleActionClick: (action: QuickAction) => void;
    currentUserConfirmed: boolean;
    highlighted?: boolean;
    resetSelectionRef?: React.MutableRefObject<(() => void) | null>;
    panelActive?: boolean;
    seamless?: boolean;
    userDisplayName?: string;
    userIdentifier?: string;
}

const ACTION_BAR_HEIGHT = 30; // More compact header height

const quickLinksStyle = (isDarkMode: boolean, highlighted: boolean, seamless: boolean) =>
    mergeStyles({
        // Use transparent background in dark mode to avoid introducing new greys; let page background show through
        background: isDarkMode
            ? 'transparent'
            : `linear-gradient(135deg, #FFFFFF 0%, ${colours.light.grey} 100%)`,

        // Hairline borders top/bottom for structure (omit when seamless)
        borderTop: seamless ? 'none' : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(6,23,51,0.06)'}`,
        borderBottom: seamless ? 'none' : `1px solid ${isDarkMode ? 'rgba(0,0,0,0.35)' : 'rgba(6,23,51,0.08)'}`,
        
    // Remove backdrop blur for crisp overlay
    backdropFilter: 'none',
        
        // Professional shadows (removed when seamless)
        boxShadow: seamless
            ? 'none'
            : (isDarkMode
                ? '0 4px 6px rgba(0, 0, 0, 0.30)'
                : '0 4px 6px rgba(6, 23, 51, 0.07)'),
        
        // Layout stability - padding with more vertical spacing above and below
        // Align content to left (remove excessive left padding)
        padding: '8px 10px',
        minHeight: ACTION_BAR_HEIGHT,
        height: 46, // Even more compact height
    transition: 'all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
        
        // Flex layout: row so content reveals inline to the right of the label
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,

        // Root should not scroll horizontally; the chip row will handle its own overflow
        overflowX: 'hidden',
        overflowY: 'hidden',
        
        // Position and layering
        // Render inline within Navigator without sticky offset so it touches CustomTabs
        position: 'relative',
        zIndex: 200,
        
        // More compact rounding
        borderRadius: 0,

        // Full-bleed: negate Navigator padding (Navigator has ~12px X and ~8px Y padding)
        // This makes the background span edge-to-edge and visually touch the tabs above.
        marginLeft: -12,
        marginRight: -12,
        width: 'calc(100% + 24px)',
        marginTop: -8,
        
        // Layout containment for performance
        contain: 'layout style',
        
        // Highlighted state with smooth scaling
        ...(highlighted && !seamless && {
            transform: 'scale(1.0025)',
            filter: 'brightness(1.02)',
            boxShadow: isDarkMode
                ? '0 6px 14px rgba(0, 0, 0, 0.28)'
                : '0 6px 14px rgba(6, 23, 51, 0.10)',
        }),
        
        // Hide scrollbars while maintaining functionality
        selectors: {
            '::-webkit-scrollbar': {
                display: 'none',
            },
        },
        
        // Responsive design
        '@media (max-width: 900px)': {
            padding: '4px 16px',
            gap: '4px',
        },
        '@media (max-width: 600px)': {
            padding: '4px 12px',
            gap: '2px',
        },
    });

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
    isDarkMode,
    quickActions,
    handleActionClick,
    currentUserConfirmed,
    highlighted = false,
    resetSelectionRef,
    panelActive = false,
    seamless = false,
    userDisplayName,
    userIdentifier,
}) => {
    const [selected, setSelected] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [collapsed, setCollapsed] = React.useState<boolean>(true);
    const [labelsExpanded, setLabelsExpanded] = React.useState<boolean>(false);
    const [showGreeting, setShowGreeting] = React.useState<boolean>(false);
    const iconRailWidth = React.useMemo(() => {
        const chipCount = quickActions.length;
        if (chipCount === 0) {
            return 0;
        }
        const chipWidth = 44;
        const horizontalPadding = 8;
        return chipCount * chipWidth + horizontalPadding;
    }, [quickActions.length]);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const barRef = React.useRef<HTMLDivElement>(null);
    const headerRef = React.useRef<HTMLButtonElement>(null);
    const hasTriggeredGreetingRef = React.useRef<string | null>(null);

    const greetingStorageKey = React.useMemo(() => {
        if (!userDisplayName && !userIdentifier) {
            return null;
        }
        const identifier = (userIdentifier || userDisplayName || '').toLowerCase().trim();
        if (!identifier) {
            return null;
        }
        return `quickActionsGreeting:${identifier}`;
    }, [userDisplayName, userIdentifier]);

    const greetingLabel = React.useMemo(() => {
        if (!userDisplayName) {
            return null;
        }
        const trimmed = userDisplayName.trim();
        if (!trimmed) {
            return null;
        }
        const firstToken = trimmed.split(' ')[0];
        const capitalised = firstToken.charAt(0).toUpperCase() + firstToken.slice(1);
        return `Hi ${capitalised}!`;
    }, [userDisplayName]);

    const greetingVisible = showGreeting && Boolean(greetingLabel);

    React.useEffect(() => {
        if (!greetingStorageKey || !greetingLabel) {
            return;
        }
        if (hasTriggeredGreetingRef.current === greetingStorageKey) {
            return;
        }

        let alreadySeen = false;
        try {
            alreadySeen = window.sessionStorage.getItem(greetingStorageKey) === 'seen';
        } catch {
            alreadySeen = false;
        }

        if (!alreadySeen) {
            hasTriggeredGreetingRef.current = greetingStorageKey;
            setShowGreeting(true);
            try {
                window.sessionStorage.setItem(greetingStorageKey, 'seen');
            } catch {
                // Ignore storage failures
            }
        }
    }, [greetingLabel, greetingStorageKey]);

    React.useEffect(() => {
        if (!showGreeting) {
            return;
        }
        const timeout = window.setTimeout(() => {
            setShowGreeting(false);
        }, 4200);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [showGreeting]);

    React.useEffect(() => {
        if (!collapsed) {
            setShowGreeting(false);
        }
    }, [collapsed]);

    // Expose reset function via ref, but don't reset if panel is still active
    React.useEffect(() => {
        if (resetSelectionRef) {
            resetSelectionRef.current = () => {
                if (!panelActive) {
                    setSelected(null);
                }
            };
        }
    }, [resetSelectionRef, panelActive]);

    // Reset selection when component unmounts
    React.useEffect(() => {
        return () => {
            setSelected(null);
        };
    }, []);

    const evaluateLabelSpace = React.useCallback(() => {
        if (collapsed) {
            return;
        }

        const chipCount = quickActions.length;
        if (chipCount === 0) {
            setLabelsExpanded(false);
            return;
        }

        const barWidth = barRef.current?.clientWidth ?? 0;
        const headerWidth = headerRef.current?.getBoundingClientRect().width ?? 0;
        const structuralAllowance = 40; // gaps + padding within the bar
        const backControlAllowance = 32; // collapse button footprint

        const usableWidth = Math.max(0, barWidth - headerWidth - structuralAllowance - backControlAllowance);
        const availablePerChip = usableWidth / chipCount;
        const nextExpanded = availablePerChip >= 120;
        setLabelsExpanded((prev) => (prev === nextExpanded ? prev : nextExpanded));
    }, [collapsed, quickActions.length]);

    React.useLayoutEffect(() => {
        if (collapsed) {
            return undefined;
        }

        evaluateLabelSpace();
        const frameId = window.requestAnimationFrame(() => {
            window.requestAnimationFrame(evaluateLabelSpace);
        });
        const settleTimer = window.setTimeout(evaluateLabelSpace, 220);

        const handleResize = () => evaluateLabelSpace();
        window.addEventListener('resize', handleResize);

        const observer = new ResizeObserver(() => evaluateLabelSpace());
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            window.cancelAnimationFrame(frameId);
            window.clearTimeout(settleTimer);
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, [collapsed, evaluateLabelSpace]);

    const onCardClick = (action: QuickAction) => {
        // Smooth loading state transition
        setSelected(action.title);
        setIsLoading(true);
        setShowGreeting(false);
        
        // Professional loading feedback
        setTimeout(() => {
            handleActionClick(action);
            setIsLoading(false);
        }, 150); // Brief loading state for smooth UX
    };

    // Optimized title mapping for better UX
    const getShortTitle = (title: string) => {
        switch (title) {
            case 'Create a Task':
                return 'New Task';
            case 'Save Telephone Note':
                return 'Attendance Note';
            case 'Request Annual Leave':
                return 'Book Leave';
            case 'Update Attendance':
                return 'Attendance';
            case 'Confirm Attendance':
                return 'Confirm Attendance';
            case 'Book Space':
                return 'Book Room';
            default:
                return title;
        }
    };

    return (
        <div
            ref={barRef}
            className={quickLinksStyle(isDarkMode, highlighted, seamless)}
            role="region"
            aria-label="Quick actions"
        >
            {/* Header: compact label with chevron toggle (chevron to the right) */}
            <button
                ref={headerRef}
                type="button"
                aria-expanded={!collapsed}
                onClick={() => {
                    setCollapsed((c) => !c);
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    height: ACTION_BAR_HEIGHT,
                    width: 'auto',
                    padding: '0 2px',
                    background: 'transparent',
                    border: 'none',
                    color: isDarkMode ? '#E5E7EB' : '#0F172A',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    flex: '0 0 auto',
                    minWidth: 110,
                }}
            >
                <span style={{ fontSize: 13 }}>Quick actions</span>
                <Icon
                    iconName="DoubleChevronRight"
                    styles={{ root: {
                        transition: 'transform 200ms ease, opacity 160ms ease',
                        transform: collapsed ? 'translateX(0)' : 'translateX(6px)',
                        opacity: collapsed ? 1 : 0,
                        fontSize: 14,
                        color: isDarkMode ? '#9CA3AF' : '#64748B',
                    }}}
                />
            </button>

            {greetingLabel && (
                <div
                    aria-live="polite"
                    role="status"
                    style={{
                        position: 'absolute',
                        right: seamless ? 12 : 10,
                        top: '50%',
                        transform: greetingVisible
                            ? 'translateY(-50%) translateX(0)'
                            : 'translateY(-50%) translateX(42px)',
                        opacity: greetingVisible ? 1 : 0,
                        transition: 'opacity 200ms ease, transform 260ms cubic-bezier(0.33, 1, 0.68, 1)',
                        color: isDarkMode ? '#E5E7EB' : '#0F172A',
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: 0.2,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        textShadow: isDarkMode ? '0 1px 2px rgba(0,0,0,0.35)' : 'none',
                    }}
                >
                    {greetingLabel}
                </div>
            )}

            {/* Content: action chips list (expands inline to the right) */}
            <div
                ref={containerRef}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    paddingTop: collapsed ? 0 : 2,
                    paddingBottom: collapsed ? 0 : 2,
                    flexWrap: 'nowrap',
                    overflowX: 'hidden', // Hide overflow instead of scrolling
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    flex: collapsed ? '0 0 0' : '0 1 auto',
                    minWidth: 0,
                    width: collapsed ? 0 : 'auto',
                    maxWidth: collapsed
                        ? 0
                        : (labelsExpanded ? '100%' : `${iconRailWidth}px`),
                    opacity: collapsed ? 0 : 1,
                    pointerEvents: collapsed ? 'none' : 'auto',
                    transition: 'max-width 220ms ease, flex 220ms ease, opacity 180ms ease',
                    // One big container box with subtle border
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(6,23,51,0.1)'}`,
                    borderColor: collapsed ? 'transparent' : undefined,
                    borderRadius: collapsed ? 0 : 8,
                    padding: collapsed ? 0 : '0px 4px', // Horizontal padding only; vertical handled above
                    background: 'transparent', // No fill
                }}
            >
                {/* Back control when expanded */}
                {!collapsed && (
                    <button
                        type="button"
                        aria-label="Collapse quick actions"
                        onClick={() => setCollapsed(true)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 24,
                            height: 24,
                            border: 'none',
                            borderRadius: 4,
                            background: 'transparent',
                            color: isDarkMode ? '#9CA3AF' : '#64748B',
                            cursor: 'pointer',
                            marginRight: 2,
                        }}
                    >
                        <Icon iconName="ChevronLeft" styles={{ root: { fontSize: 14 } }} />
                    </button>
                )}

                {!collapsed && quickActions.map((action, index) => (
                    <QuickActionsCard
                        key={action.title}
                        title={getShortTitle(action.title)}
                        icon={action.icon}
                        isDarkMode={isDarkMode}
                        onClick={() => onCardClick(action)}
                        iconColor={colours.cta}
                        selected={selected === action.title}
                        confirmed={action.title === 'Confirm Attendance' || action.title === 'Update Attendance' ? currentUserConfirmed : undefined}
                        disabled={isLoading && selected !== action.title}
                        panelActive={panelActive && selected === action.title}
                        alwaysShowText={labelsExpanded}
                        style={{
                            '--card-index': index,
                            // Remove individual boxes - transparent background, no border, no shadow
                            '--card-bg': 'transparent',
                            '--card-border': 'transparent',
                            '--card-hover': isDarkMode 
                                ? 'rgba(255,255,255,0.08)'
                                : 'rgba(6,23,51,0.08)',
                            '--card-selected': isDarkMode 
                                ? 'rgba(255,255,255,0.12)'
                                : 'rgba(6,23,51,0.12)',
                            '--card-shadow': 'none',
                            height: '32px',
                            opacity: (isLoading && selected !== action.title) ? 0.6 : 1,
                            filter: (isLoading && selected === action.title) 
                                ? 'brightness(1.06)'
                                : 'none',
                            borderRadius: 6, // Subtle rounding for hover area
                            // Cascading animation
                            animation: `quickActionCascade 0.3s ease-out ${index * 0.05}s both`,
                            transform: 'translateX(-10px)',
                            animationFillMode: 'forwards',
                        } as React.CSSProperties}
                    />
                ))}
            </div>

            {/* Loading overlay for smooth state transitions */}
            {isLoading && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: isDarkMode 
                            ? 'linear-gradient(135deg, rgba(45, 45, 45, 0.25) 0%, rgba(58, 58, 58, 0.18) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(248, 250, 252, 0.18) 100%)',
                        backdropFilter: 'blur(1px)',
                        pointerEvents: 'none',
                        transition: 'opacity 0.2s ease',
                    }}
                />
            )}
        </div>
    );
};

export default QuickActionsBar;
