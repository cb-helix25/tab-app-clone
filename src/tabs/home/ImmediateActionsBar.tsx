import React, { useEffect, useState } from 'react';
import { Spinner, SpinnerSize, mergeStyles, keyframes, DefaultButton } from '@fluentui/react';
import { FaCheck } from 'react-icons/fa';
import QuickActionsCard from './QuickActionsCard';
import { colours } from '../../app/styles/colours';

interface Action {
    title: string;
    onClick: () => void;
    icon: string;
}

interface ImmediateActionsBarProps {
    isDarkMode: boolean;
    immediateActionsReady: boolean;
    immediateActionsList: Action[];
    highlighted?: boolean;
    showDismiss?: boolean;
    onDismiss?: () => void;
}

const ACTION_BAR_HEIGHT = 48;

const barStyle = (
    isDarkMode: boolean,
    hasImmediateActions: boolean,
    highlighted: boolean
) =>
    mergeStyles({
        backgroundColor: isDarkMode
            ? colours.dark.sectionBackground
            : colours.light.sectionBackground,
        boxShadow: isDarkMode
            ? '0 2px 4px rgba(0,0,0,0.4)'
            : '0 2px 4px rgba(0,0,0,0.1)',
        borderTop: isDarkMode
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(0,0,0,0.05)',
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
        position: hasImmediateActions ? 'sticky' : 'relative',
        top: hasImmediateActions ? ACTION_BAR_HEIGHT * 2 : 'auto',
        zIndex: hasImmediateActions ? 998 : 'auto',
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
    showDismiss = false,
    onDismiss,
}) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            const threshold = ACTION_BAR_HEIGHT * 2;
            if (window.scrollY > threshold) {
                setVisible(false);
            } else {
                setVisible(true);
            }
        };

        if (immediateActionsList.length === 0) {
            window.addEventListener('scroll', handleScroll);
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [immediateActionsList]);

    return (
        <div
            className={barStyle(
                isDarkMode,
                immediateActionsList.length > 0,
                highlighted
            )}
            style={{
                display: 'flex',
                gap: '10px',
                height: visible ? ACTION_BAR_HEIGHT : 0,
                overflow: 'hidden',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'height 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
                pointerEvents: visible ? 'auto' : 'none',
            }}
        >
            {!immediateActionsReady ? (
                <Spinner size={SpinnerSize.small} />
            ) : immediateActionsList.length === 0 ? (
                <div className={noActionsClass}>
                    <div className={noActionsIconClass}>
                        <FaCheck />
                    </div>
                    <div className={noActionsTextClass}>You have no immediate actions.</div>
                </div>
            ) : (
                <>
                    {immediateActionsList.map((action, index) => (
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
                    ))}
                    {showDismiss && (
                        <DefaultButton
                            text="Dismiss"
                            onClick={onDismiss}
                            styles={{ root: { height: 32, alignSelf: 'center' } }}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default ImmediateActionsBar;
