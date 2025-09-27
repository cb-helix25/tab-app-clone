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
}

const ACTION_BAR_HEIGHT = 36; // Compact header height

const quickLinksStyle = (isDarkMode: boolean, highlighted: boolean, seamless: boolean) =>
    mergeStyles({
        // Subtle gradient background (always applied); seamless only disables extras like blur/shadow
        background: isDarkMode
            ? 'linear-gradient(135deg, rgba(45, 45, 45, 0.95) 0%, rgba(58, 58, 58, 0.90) 100%)'
            : `linear-gradient(135deg, #FFFFFF 0%, ${colours.light.grey} 100%)`,
        
        // Modern backdrop blur (disabled when seamless)
        backdropFilter: seamless ? 'none' : 'blur(12px)',
        
        // Professional shadows (removed when seamless)
        boxShadow: seamless
            ? 'none'
            : (isDarkMode
                ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)'
                : '0 8px 32px rgba(6, 23, 51, 0.12), 0 4px 16px rgba(6, 23, 51, 0.08)'),
        
    // Layout stability - compact padding
    // Align content to left (remove excessive left padding)
    padding: '2px 12px',
    minHeight: ACTION_BAR_HEIGHT,
    height: 'auto',
        
        // Smooth professional transitions
        transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
        
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
        zIndex: 100,
        
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
            transform: 'scale(1.003)',
            filter: 'brightness(1.02)',
            boxShadow: isDarkMode
                ? '0 8px 24px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.22)'
                : '0 8px 24px rgba(6, 23, 51, 0.12), 0 4px 12px rgba(6, 23, 51, 0.08)',
        }),
        
        // Hide scrollbars while maintaining functionality
        selectors: {
            '::-webkit-scrollbar': {
                display: 'none',
            },
        },
        
        // Responsive design
        '@media (max-width: 900px)': {
            padding: '6px 24px',
            gap: '4px',
        },
        '@media (max-width: 600px)': {
            padding: '6px 20px',
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
}) => {
    const [selected, setSelected] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [collapsed, setCollapsed] = React.useState<boolean>(true);

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

    const onCardClick = (action: QuickAction) => {
        // Smooth loading state transition
        setSelected(action.title);
        setIsLoading(true);
        
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
            className={quickLinksStyle(isDarkMode, highlighted, seamless)}
            role="region"
            aria-label="Quick actions"
        >
            {/* Header: compact label with chevron toggle (chevron to the right) */}
            <button
                type="button"
                aria-expanded={!collapsed}
                onClick={() => setCollapsed((c) => !c)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    height: ACTION_BAR_HEIGHT,
                    width: 'auto',
                    padding: '0 4px',
                    background: 'transparent',
                    border: 'none',
                    color: isDarkMode ? '#E5E7EB' : '#0F172A',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    flex: '0 0 auto',
                    minWidth: 120,
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

            {/* Content: action chips list (expands inline to the right) */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    paddingBottom: 6,
                    flexWrap: 'nowrap',
                    overflowX: 'auto',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    flex: '1 1 auto',
                    minWidth: 0,
                    width: collapsed ? 0 : '100%',
                    opacity: collapsed ? 0 : 1,
                    pointerEvents: collapsed ? 'none' : 'auto',
                    transition: 'width 200ms ease, opacity 180ms ease',
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
                            width: 28,
                            height: 28,
                            border: 'none',
                            borderRadius: 4,
                            background: 'transparent',
                            color: isDarkMode ? '#9CA3AF' : '#64748B',
                            cursor: 'pointer',
                            marginRight: 4,
                        }}
                    >
                        <Icon iconName="ChevronLeft" styles={{ root: { fontSize: 14 } }} />
                    </button>
                )}

                {quickActions.map((action, index) => (
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
                        style={{
                            '--card-index': index,
                            '--card-bg': isDarkMode 
                                ? colours.dark.sectionBackground 
                                : colours.light.sectionBackground,
                            '--card-hover': isDarkMode 
                                ? colours.dark.cardHover 
                                : colours.light.cardHover,
                            '--card-selected': isDarkMode 
                                ? colours.dark.cardHover 
                                : colours.light.cardHover,
                            height: '36px',
                            opacity: (isLoading && selected !== action.title) ? 0.6 : 1,
                            filter: (isLoading && selected === action.title) 
                                ? 'brightness(1.06)'
                                : 'none',
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
