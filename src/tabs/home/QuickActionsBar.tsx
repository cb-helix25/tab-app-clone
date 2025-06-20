import React from 'react';
import { Spinner, SpinnerSize, mergeStyles, keyframes } from '@fluentui/react';
import { FaCheck } from 'react-icons/fa';
import QuickActionsCard from './QuickActionsCard';
import { colours } from '../../app/styles/colours';

interface Action {
    title: string;
    onClick: () => void;
    icon: string;
  }

interface QuickAction {
    title: string;
    icon: string;
  }

interface QuickActionsBarProps {
    isDarkMode: boolean;
    immediateActionsReady: boolean;
    immediateActionsList: Action[];
    normalQuickActions: QuickAction[];
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
        alignItems: 'center',
        paddingBottom: 0,
        position: 'sticky',
        top: ACTION_BAR_HEIGHT,
        zIndex: 999,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
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
    justifyContent: 'center',
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

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
    isDarkMode,
    immediateActionsReady,
    immediateActionsList,
    normalQuickActions,
    handleActionClick,
    currentUserConfirmed,
}) => {
    return (
        <div
            className={quickLinksStyle(isDarkMode)}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <div style={{ display: 'flex', gap: '10px', minHeight: '40px' }}>
                {!immediateActionsReady ? (
                    <Spinner size={SpinnerSize.small} />
                ) : immediateActionsList.length === 0 ? (
                    <div className={noActionsClass}>
                        <div className={noActionsIconClass}>
                            <FaCheck />
                        </div>
                    </div>
                ) : (
                    immediateActionsList.map((action, index) => (
                        <QuickActionsCard
                            key={action.title}
                            title={action.title}
                            icon={action.icon}
                            isDarkMode={isDarkMode}
                            onClick={action.onClick}
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
                        />
                    ))
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                {normalQuickActions.map((action, index) => (
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
        </div>
    );
};

export default QuickActionsBar;
