import React from 'react';
import { IconButton, Text, mergeStyles, Stack } from '@fluentui/react';
import { useTheme } from '../app/functionality/ThemeContext';
import { colours } from '../app/styles/colours';
import { formSections } from '../tabs/forms/formsData';
import { FormItem, UserData, Matter } from '../app/functionality/types';
import FormEmbed from './FormEmbed';

interface FormsSidebarProps {
    userData: UserData[] | null;
    matters: Matter[];
}

const sidebarWidth = '60vw';

// Offset to position the sidebar just below the stacked header bars
// (three bars, each 48px high). This value should line up exactly
// so the sidebar hides seamlessly beneath the menus.
// The main header stack totals 144px tall but has a slight drop shadow.
// Raise the sidebar a few pixels so it sits behind the header, hiding the gap.
const SIDEBAR_TOP = 140;

const sidebarContainer = (isOpen: boolean, isDarkMode: boolean) =>
    mergeStyles({
        position: 'fixed',
        top: SIDEBAR_TOP,
        left: isOpen ? 0 : `calc(-${sidebarWidth})`,
        width: sidebarWidth,
        height: `calc(100vh - ${SIDEBAR_TOP}px)`,
        backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
        boxShadow: '2px 0 4px rgba(0,0,0,0.2)',
        padding: 16,
        overflowY: 'auto',
        transition: 'left 0.3s',
        zIndex: 950,
    });

const handleStyle = (isOpen: boolean) =>
    mergeStyles({
        position: 'fixed',
        top: SIDEBAR_TOP, // align with sidebarContainer
        left: isOpen ? sidebarWidth : 0,
        height: `calc(100vh - ${SIDEBAR_TOP}px)`,
        width: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backgroundColor: isOpen ? colours.red : 'transparent',
        boxShadow: '2px 0 4px rgba(0,0,0,0.2)',
        transition: 'left 0.3s, opacity 0.3s',
        zIndex: 951,
        opacity: isOpen ? 1 : 0,
        selectors: {
            ':hover': {
                opacity: 1,
                backgroundColor: colours.red,
            },
        },
    });

const sectionContainer = (isDarkMode: boolean) =>
    mergeStyles({
        border: `1px solid ${isDarkMode ? colours.dark.borderColor : colours.light.borderColor}`,
        borderRadius: 4,
        padding: 8,
        marginTop: 16,
            });

const FormsSidebar: React.FC<FormsSidebarProps> = ({ userData, matters }) => {
    const { isDarkMode } = useTheme();
    const [isOpen, setIsOpen] = React.useState(false);
    const [expanded, setExpanded] = React.useState<{ [title: string]: boolean }>({});

    const toggle = (title: string) => {
        setExpanded((p) => ({ ...p, [title]: !p[title] }));
    };

    const collapseAll = () => {
        const all: { [title: string]: boolean } = {};
        Object.values(formSections).forEach((arr) => {
            arr.forEach((f) => (all[f.title] = false));
        });
        setExpanded(all);
    };

    const copyLink = (url: string, title: string) => {
        navigator.clipboard.writeText(url).catch((err) => console.error(err));
    };

    return (
        <>
            <div
                className={handleStyle(isOpen)}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Forms Sidebar"
            >
                <IconButton
                    iconProps={{ iconName: isOpen ? 'ChevronLeft' : 'ChevronRight' }}
                    styles={{ root: { width: 24, height: 24 } }}
                    ariaLabel="Toggle Forms Sidebar"
                />
            </div>
            <div className={sidebarContainer(isOpen, isDarkMode)}>
                <Stack horizontalAlign="space-between" horizontal verticalAlign="center">
                    <Text variant="large">Forms</Text>
                    <IconButton iconProps={{ iconName: 'CollapseAll' }} onClick={collapseAll} ariaLabel="Collapse All" />
                </Stack>
                {Object.entries(formSections).map(([section, forms]) => (
                    <div key={section} className={sectionContainer(isDarkMode)}>
                        {forms.map((form) => (
                            <div key={form.title} style={{ marginBottom: 8 }}>
                                <Stack horizontal verticalAlign="center" styles={{ root: { width: '100%' } }}>
                                    <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
                                        <IconButton
                                            iconProps={{ iconName: expanded[form.title] ? 'ChevronDown' : 'ChevronRight' }}
                                            onClick={() => toggle(form.title)}
                                            ariaLabel="Expand"
                                        />
                                        <Text styles={{ root: { cursor: 'pointer' } }} onClick={() => toggle(form.title)}>
                                            {form.title}
                                        </Text>
                                    </Stack>
                                    <Stack horizontal tokens={{ childrenGap: 4 }} styles={{ root: { marginLeft: 'auto' } }}>
                                        <IconButton
                                            iconProps={{ iconName: 'Copy' }}
                                            onClick={() => copyLink(form.url, form.title)}
                                            ariaLabel="Copy link"
                                        />
                                        <IconButton
                                            iconProps={{ iconName: 'NavigateExternalInline' }}
                                            href={form.url}
                                            target="_blank"
                                            ariaLabel="Open link"
                                        />
                                    </Stack>
                                </Stack>
                                {expanded[form.title] && <FormEmbed link={form} userData={userData} matters={matters} />}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </>
    );
};

export default FormsSidebar;