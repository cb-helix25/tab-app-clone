import React from 'react';
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
        gap: '8px',
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
    });

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
    isDarkMode,
    quickActions,
    handleActionClick,
    currentUserConfirmed,
    highlighted = false,
}) => {
    const [selected, setSelected] = React.useState<string | null>(null);

    const onCardClick = (action: QuickAction) => {
        setSelected(action.title);
        handleActionClick(action);
    };

    return (
        <div className={quickLinksStyle(isDarkMode, highlighted)} style={{ display: 'flex', gap: '10px', minHeight: ACTION_BAR_HEIGHT }}>
            {quickActions.map((action, index) => (
                <QuickActionsCard
                    key={action.title}
                    title={action.title}
                    icon={action.icon}
                    isDarkMode={isDarkMode}
                    onClick={() => onCardClick(action)}
                    iconColor={colours.cta}
                    selected={selected === action.title}
                    style={{
                        '--card-index': index,
                        fontSize: '16px',
                        padding: '0 12px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                    } as React.CSSProperties}
                    {...(action.title === 'Confirm Attendance'
                        ? { confirmed: currentUserConfirmed }
                        : {})}
                />
            ))}
        </div>
    );
};

export default QuickActionsBar;
