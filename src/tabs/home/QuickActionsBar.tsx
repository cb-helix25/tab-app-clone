import React from 'react';
// invisible change 2
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
    resetSelectionRef?: React.MutableRefObject<(() => void) | null>; // Ref to reset function
}

const ACTION_BAR_HEIGHT = 48;

const quickLinksStyle = (isDarkMode: boolean, highlighted: boolean) =>
    mergeStyles({
        backgroundColor: isDarkMode
            ? colours.dark.sectionBackground
            : colours.light.sectionBackground,
        boxShadow: isDarkMode
            ? '0 2px 4px rgba(0,0,0,0.4)'
            : '0 2px 4px rgba(0,0,0,0.1)',
        padding: '0 24px',
        transition: 'background-color 0.3s',
        display: 'flex',
        flexDirection: 'row',
        gap: '4px',
        overflowX: 'auto',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        alignItems: 'center',
        height: ACTION_BAR_HEIGHT,
        paddingBottom: 0,
        position: 'sticky',
        top: ACTION_BAR_HEIGHT,
        zIndex: 999,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        minWidth: 0,
        width: '100%',
        flexWrap: 'nowrap',
        ...(highlighted && {
            transform: 'scale(1.02)',
            filter: 'brightness(1.05)',
            boxShadow: '0 0 10px rgba(0,0,0,0.3)',
            transition: 'transform 0.3s, filter 0.3s, box-shadow 0.3s',
        }),
        selectors: {
            '::-webkit-scrollbar': {
                display: 'none',
            },
        },
        '@media (max-width: 900px)': {
            gap: '2px',
            padding: '0 24px',
        },
        '@media (max-width: 600px)': {
            gap: '0px',
            padding: '0 24px',
        },
    });

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
    isDarkMode,
    quickActions,
    handleActionClick,
    currentUserConfirmed,
    highlighted = false,
    resetSelectionRef,
}) => {
    const [selected, setSelected] = React.useState<string | null>(null);

    // Expose reset function via ref
    React.useEffect(() => {
        if (resetSelectionRef) {
            resetSelectionRef.current = () => setSelected(null);
        }
    }, [resetSelectionRef]);

    // Reset selection when component unmounts (when bar is hidden/removed)
    React.useEffect(() => {
        return () => {
            setSelected(null);
        };
    }, []);

    const onCardClick = (action: QuickAction) => {
        setSelected(action.title);
        handleActionClick(action);
    };
    // Map long titles to short ones for space-saving
    const getShortTitle = (title: string) => {
        switch (title) {
            case 'Create a Task':
                return 'Tasks';
            case 'Save Telephone Note':
                return 'Tel Note';
            case 'Request Annual Leave':
                return 'Request Leave';
            case 'Update Attendance':
                return 'Edit Attendance';
            case 'Book Space':
                return 'Spaces';
            default:
                return title;
        }
    };

    return (
        <div
            className={quickLinksStyle(isDarkMode, highlighted)}
            style={{
                display: 'flex',
                gap: '12px', // Increased gap for better separation
                minHeight: ACTION_BAR_HEIGHT,
                width: '100%',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                paddingTop: 2,
                paddingBottom: 2,
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
                    style={{
                        '--card-index': index,
                        fontSize: '15px',
                        padding: '0 12px',
                        height: '48px', // Changed from 44px to match Enquiries/Matters
                        minWidth: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        flex: '0 0 auto',
                        marginLeft: index === 0 ? 0 : 0,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
}

export default QuickActionsBar;
