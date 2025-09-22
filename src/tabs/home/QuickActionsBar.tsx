import React from 'react';
// Modern QuickActionsBar with professional animations and no layout jolts
import { mergeStyles } from '@fluentui/react';
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
}

const ACTION_BAR_HEIGHT = 44; // Compact bar height to match tab icon scale

const quickLinksStyle = (isDarkMode: boolean, highlighted: boolean) =>
    mergeStyles({
        // Professional gradient background
        background: isDarkMode
            ? 'linear-gradient(135deg, rgba(45, 45, 45, 0.95) 0%, rgba(58, 58, 58, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
        
        // Modern backdrop blur
        backdropFilter: 'blur(12px)',
        
        // Professional shadows
        boxShadow: isDarkMode
            ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)'
            : '0 8px 32px rgba(6, 23, 51, 0.12), 0 4px 16px rgba(6, 23, 51, 0.08)',
        
        // Layout stability - compact padding and height
        // Align content to left (remove excessive left padding)
        padding: '4px 12px',
        height: ACTION_BAR_HEIGHT,
        minHeight: ACTION_BAR_HEIGHT,
        
        // Smooth professional transitions
        transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
        
        // Flex layout with proper spacing
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '4px', // Tighter gap
        
        // Scrolling behavior
        overflowX: 'auto',
        overflowY: 'hidden',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        
        // Position and layering
        position: 'sticky',
        top: ACTION_BAR_HEIGHT,
        zIndex: 999,
        
        // More compact rounding
        borderRadius: '10px 10px 0 0',
        
        // Layout containment for performance
        contain: 'layout style',
        
        // Highlighted state with smooth scaling
        ...(highlighted && {
            transform: 'scale(1.01)',
            filter: 'brightness(1.04)',
            boxShadow: isDarkMode
                ? '0 12px 40px rgba(0, 0, 0, 0.4), 0 6px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(54, 144, 206, 0.3)'
                : '0 12px 40px rgba(6, 23, 51, 0.18), 0 6px 20px rgba(6, 23, 51, 0.12), 0 0 0 1px rgba(54, 144, 206, 0.2)',
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
}) => {
    const [selected, setSelected] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

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
            className={quickLinksStyle(isDarkMode, highlighted)}
            role="toolbar"
            aria-label="Quick Actions"
        >
            {/* Centered container for quick actions */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '100%',
                }}
            >
                {quickActions.map((action, index) => (
                    <QuickActionsCard
                        key={action.title}
                        title={getShortTitle(action.title)}
                        icon={action.icon}
                        isDarkMode={isDarkMode}
                        onClick={() => onCardClick(action)}
                        iconColor={colours.cta}
                        selected={selected === action.title}
                        confirmed={action.title === 'Confirm Attendance' ? currentUserConfirmed : undefined}
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
                            // Compact card height to match tab icons
                            height: '44px',
                            // Loading state visual feedback
                            opacity: (isLoading && selected !== action.title) ? 0.6 : 1,
                            filter: (isLoading && selected === action.title) 
                                ? 'brightness(1.1)' 
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
                            ? 'linear-gradient(135deg, rgba(45, 45, 45, 0.3) 0%, rgba(58, 58, 58, 0.2) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(248, 250, 252, 0.2) 100%)',
                        backdropFilter: 'blur(2px)',
                        borderRadius: '16px 16px 0 0',
                        pointerEvents: 'none',
                        transition: 'opacity 0.3s ease',
                    }}
                />
            )}
        </div>
    );
};

export default QuickActionsBar;
