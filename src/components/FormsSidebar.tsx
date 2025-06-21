import React from 'react';
import { IconButton, Text, mergeStyles, Stack, Link } from '@fluentui/react';
import { useTheme } from '../app/functionality/ThemeContext';
import { colours } from '../app/styles/colours';
import { formSections } from '../tabs/forms/formsData';
import { FormItem, UserData, Matter } from '../app/functionality/types';
import FormEmbed from './FormEmbed';

interface FormsSidebarProps {
    userData: UserData[] | null;
    matters: Matter[];
}

const sidebarContainer = (isOpen: boolean, isDarkMode: boolean) =>
    mergeStyles({
        position: 'fixed',
        top: 48,
        right: isOpen ? 0 : -340,
        width: 340,
        height: 'calc(100vh - 48px)',
        backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
        boxShadow: '-2px 0 4px rgba(0,0,0,0.2)',
        padding: 16,
        overflowY: 'auto',
        transition: 'right 0.3s',
        zIndex: 950,
    });

const sectionHeader = (isDarkMode: boolean) =>
    mergeStyles({
        fontWeight: 600,
        marginTop: 16,
        color: isDarkMode ? colours.dark.text : colours.light.text,
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
            <IconButton
                iconProps={{ iconName: isOpen ? 'ChevronRight' : 'ChevronLeft' }}
                onClick={() => setIsOpen(!isOpen)}
                styles={{
                    root: {
                        position: 'fixed',
                        top: 48,
                        right: isOpen ? 340 : 0,
                        zIndex: 951,
                    },
                }}
                ariaLabel="Toggle Forms Sidebar"
            />
            <div className={sidebarContainer(isOpen, isDarkMode)}>
                <Stack horizontalAlign="space-between" horizontal verticalAlign="center">
                    <Text variant="large">Forms</Text>
                    <IconButton iconProps={{ iconName: 'CollapseAll' }} onClick={collapseAll} ariaLabel="Collapse All" />
                </Stack>
                {Object.entries(formSections).map(([section, forms]) => (
                    <div key={section}>
                        <Text className={sectionHeader(isDarkMode)}>{section.replace('_', ' ')}</Text>
                        {forms.map((form) => (
                            <div key={form.title} style={{ marginBottom: 8 }}>
                                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
                                    <IconButton
                                        iconProps={{ iconName: expanded[form.title] ? 'ChevronDown' : 'ChevronRight' }}
                                        onClick={() => toggle(form.title)}
                                        ariaLabel="Expand"
                                    />
                                    <Text styles={{ root: { cursor: 'pointer' } }} onClick={() => toggle(form.title)}>
                                        {form.title}
                                    </Text>
                                    <IconButton iconProps={{ iconName: 'Copy' }} onClick={() => copyLink(form.url, form.title)} ariaLabel="Copy link" />
                                    <Link href={form.url} target="_blank" styles={{ root: { marginLeft: 'auto' } }}>
                                        open
                                    </Link>
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