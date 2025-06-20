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
}

const ACTION_BAR_HEIGHT = 48;

const quickLinksStyle = (isDarkMode: boolean) =>
    mergeStyles({
        backgroundColor: isDarkMode
            ? colours.dark.sectionBackground
            : colours.light.sectionBackground,
        padding: '0',
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
}) => {
    return (
        <div className={quickLinksStyle(isDarkMode)} style={{ display: 'flex', gap: '10px', minHeight: ACTION_BAR_HEIGHT }}>
            {quickActions.map((action, index) => (
                <QuickActionsCard
                    key={action.title}
                    title={action.title}
                    icon={action.icon}
                    isDarkMode={isDarkMode}
                    onClick={() => handleActionClick(action)}
                    iconColor={colours.cta}
                    style={{
                        '--card-index': index,
                        fontSize: '16px',
                        padding: '0 12px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
