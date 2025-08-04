import React from 'react';
// invisible change 2
import { IconButton, mergeStyles } from '@fluentui/react';
import { useTheme } from '../app/functionality/ThemeContext';
import { colours } from '../app/styles/colours';
import Resources from '../tabs/resources/Resources';

interface ResourcesSidebarProps {
    activeTab: string;
    hovered?: boolean;
    pinned: boolean;
    setPinned: (pinned: boolean) => void;
}

const sidebarWidth = '60vw';
const DEFAULT_SIDEBAR_TOP = 140;

const calculateSidebarTop = () => {
    const tabs = document.querySelector('.customTabsContainer') as HTMLElement | null;
    const navigator = document.querySelector('.app-navigator') as HTMLElement | null;

    let offset = (tabs?.offsetHeight || 0) + (navigator?.offsetHeight || 0);

    if (offset > 0) {
        offset = Math.max(0, offset - 4);
    } else {
        offset = DEFAULT_SIDEBAR_TOP;
    }

    return offset;
};

const sidebarContainer = (isOpen: boolean, isDarkMode: boolean, top: number) =>
    mergeStyles({
        position: 'fixed',
        top,
        right: isOpen ? 0 : `calc(-${sidebarWidth})`,
        width: sidebarWidth,
        height: `calc(100vh - ${top}px)`,
        backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
        boxShadow: '-2px 0 4px rgba(0,0,0,0.2)',
        padding: 16,
        overflowY: 'auto',
        transition: 'right 0.3s ease',
        zIndex: 850,
    });

const handleStyle = (isOpen: boolean, isDarkMode: boolean, top: number) =>
    mergeStyles({
        position: 'fixed',
        top,
        right: isOpen ? sidebarWidth : 0,
        height: `calc(100vh - ${top}px)`,
        width: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backgroundColor: isOpen
            ? isDarkMode
                ? colours.dark.cardHover
                : colours.light.cardHover
            : 'transparent',
        boxShadow: '-2px 0 4px rgba(0,0,0,0.2)',
        transition: 'opacity 0.3s ease',
        zIndex: 851,
        opacity: isOpen ? 1 : 0,
        selectors: {
            ':hover': {
                opacity: 1,
                backgroundColor: isDarkMode ? colours.dark.cardHover : colours.light.cardHover,
            },
        },
    });

const ResourcesSidebar: React.FC<ResourcesSidebarProps> = ({
    activeTab,
    hovered,
    pinned,
    setPinned,
}) => {
    const { isDarkMode } = useTheme();
    const [isOpen, setIsOpen] = React.useState(false);
    const [sidebarTop, setSidebarTop] = React.useState<number>(DEFAULT_SIDEBAR_TOP);

    const updateTop = React.useCallback(() => {
        setSidebarTop(calculateSidebarTop());
    }, []);

    React.useEffect(() => {
        updateTop();
        window.addEventListener('resize', updateTop);
        return () => window.removeEventListener('resize', updateTop);
    }, [updateTop]);

    React.useEffect(() => {
        if (isOpen) {
            updateTop();
        }
    }, [isOpen, updateTop]);

    React.useEffect(() => {
        updateTop();
    }, [activeTab, updateTop]);

    React.useEffect(() => {
        if (activeTab === 'resources') {
            setPinned(true);
            setIsOpen(true);
        }
    }, [activeTab, setPinned]);

    React.useEffect(() => {
        if (!pinned) {
            setIsOpen(hovered || false);
        }
    }, [hovered, pinned]);

    React.useEffect(() => {
        if (pinned) {
            setIsOpen(true);
        }
    }, [pinned]);

    return (
        <>
            <div
                className={handleStyle(isOpen, isDarkMode, sidebarTop)}
                onClick={() => {
                    if (pinned) {
                        setPinned(false);
                        setIsOpen(false);
                    } else {
                        setPinned(true);
                        setIsOpen(true);
                    }
                }}
                aria-label="Toggle Resources Sidebar"
            >
                <IconButton
                    iconProps={{ iconName: isOpen ? 'ChevronRight' : 'ChevronLeft' }}
                    styles={{ root: { width: 24, height: 24 } }}
                    ariaLabel="Toggle Resources Sidebar"
                />
            </div>
            <div className={sidebarContainer(isOpen, isDarkMode, sidebarTop)}>
                <Resources />
            </div>
        </>
    );
};

export default ResourcesSidebar;
