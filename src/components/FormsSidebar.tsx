import React from "react";
import { IconButton, Text, mergeStyles, Stack } from "@fluentui/react";
import { useTheme } from "../app/functionality/ThemeContext";
import { colours } from "../app/styles/colours";
import { formSections } from "../tabs/forms/formsData";
import { FormItem, UserData, Matter } from "../app/functionality/types";
import FormEmbed from "./FormEmbed";

interface FormsSidebarProps {
    userData: UserData[] | null;
    matters: Matter[];
    activeTab: string;
    hovered?: boolean;
    pinned: boolean;
    setPinned: (pinned: boolean) => void;
}

const sidebarWidth = "60vw";

// Offset to position the sidebar just below the stacked header bars
// (three bars, each 48px high). This value should line up exactly
// so the sidebar hides seamlessly beneath the menus.
// The main header stack totals 144px tall but has a slight drop shadow.
// Raise the sidebar a few pixels so it sits behind the header, hiding the gap.
// Base offset used when all header bars are visible. This roughly equals
// three stacked 48px rows minus a few pixels so the sidebar sits just
// behind their drop shadow.
const DEFAULT_SIDEBAR_TOP = 140;

const calculateSidebarTop = () => {
    const tabs = document.querySelector(
        ".customTabsContainer",
    ) as HTMLElement | null;
    const navigator = document.querySelector(
        ".app-navigator",
    ) as HTMLElement | null;

    let offset = (tabs?.offsetHeight || 0) + (navigator?.offsetHeight || 0);

    if (offset > 0) {
        // Nudge upwards slightly so the drop shadow of the header covers the gap
        offset = Math.max(0, offset - 4);
    } else {
        offset = DEFAULT_SIDEBAR_TOP;
    }

    return offset;
};

const sidebarContainer = (isOpen: boolean, isDarkMode: boolean, top: number) =>
    mergeStyles({
        position: "fixed",
        top,
        left: isOpen ? 0 : `calc(-${sidebarWidth})`,
        width: sidebarWidth,
        height: `calc(100vh - ${top}px)`,
        backgroundColor: isDarkMode
            ? colours.dark.sectionBackground
            : colours.light.sectionBackground,
        boxShadow: "2px 0 4px rgba(0,0,0,0.2)",
        padding: 16,
        overflowY: "auto",
        transition: "left 0.3s ease",
        zIndex: 850,
    });

const handleStyle = (isOpen: boolean, isDarkMode: boolean, top: number) =>
    mergeStyles({
        position: "fixed",
        top, // align with sidebarContainer
        left: isOpen ? sidebarWidth : 0,
        height: `calc(100vh - ${top}px)`,
        width: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        backgroundColor: isOpen
            ? isDarkMode
                ? colours.dark.cardHover
                : colours.light.cardHover
            : "transparent",
        boxShadow: "2px 0 4px rgba(0,0,0,0.2)",
        transition: "left 0.3s ease, opacity 0.3s ease",
        zIndex: 851,
        opacity: isOpen ? 1 : 0,
        selectors: {
            ":hover": {
                opacity: 1,
                backgroundColor: isDarkMode
                    ? colours.dark.cardHover
                    : colours.light.cardHover,
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

const FormsSidebar: React.FC<FormsSidebarProps> = ({
    userData,
    matters,
    activeTab,
    hovered,
    pinned,
    setPinned,
}) => {
    const { isDarkMode } = useTheme();
    const [isOpen, setIsOpen] = React.useState(false);
    const [expanded, setExpanded] = React.useState<{ [title: string]: boolean }>(
        {},
    );
    const [sidebarTop, setSidebarTop] =
        React.useState<number>(DEFAULT_SIDEBAR_TOP);

    const updateTop = React.useCallback(() => {
        setSidebarTop(calculateSidebarTop());
    }, []);

    React.useEffect(() => {
        updateTop();
        window.addEventListener("resize", updateTop);
        return () => window.removeEventListener("resize", updateTop);
    }, [updateTop]);

    React.useEffect(() => {
        if (isOpen) {
            updateTop();
        }
    }, [isOpen, updateTop]);

    React.useEffect(() => {
        if (activeTab === "forms") {
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
                aria-label="Toggle Forms Sidebar"
            >
                <IconButton
                    iconProps={{ iconName: isOpen ? "ChevronLeft" : "ChevronRight" }}
                    styles={{ root: { width: 24, height: 24 } }}
                    ariaLabel="Toggle Forms Sidebar"
                />
            </div>
            <div className={sidebarContainer(isOpen, isDarkMode, sidebarTop)}>
                <Stack
                    horizontalAlign="space-between"
                    horizontal
                    verticalAlign="center"
                >
                    <Text variant="large">Forms</Text>
                    <IconButton
                        iconProps={{ iconName: "CollapseAll" }}
                        onClick={collapseAll}
                        ariaLabel="Collapse All"
                    />
                </Stack>
                {Object.entries(formSections).map(([section, forms]) => (
                    <div key={section} className={sectionContainer(isDarkMode)}>
                        {forms.map((form) => (
                            <div key={form.title} style={{ marginBottom: 8 }}>
                                <Stack
                                    horizontal
                                    verticalAlign="center"
                                    styles={{ root: { width: "100%" } }}
                                >
                                    <Stack
                                        horizontal
                                        verticalAlign="center"
                                        tokens={{ childrenGap: 4 }}
                                    >
                                        <IconButton
                                            iconProps={{
                                                iconName: expanded[form.title]
                                                    ? "ChevronDown"
                                                    : "ChevronRight",
                                            }}
                                            onClick={() => toggle(form.title)}
                                            ariaLabel="Expand"
                                        />
                                        <Text
                                            styles={{ root: { cursor: "pointer" } }}
                                            onClick={() => toggle(form.title)}
                                        >
                                            {form.title}
                                        </Text>
                                    </Stack>
                                    <Stack
                                        horizontal
                                        tokens={{ childrenGap: 4 }}
                                        styles={{ root: { marginLeft: "auto" } }}
                                    >
                                        <IconButton
                                            iconProps={{ iconName: "Copy" }}
                                            onClick={() => copyLink(form.url, form.title)}
                                            ariaLabel="Copy link"
                                        />
                                        <IconButton
                                            iconProps={{ iconName: "NavigateExternalInline" }}
                                            href={form.url}
                                            target="_blank"
                                            ariaLabel="Open link"
                                        />
                                    </Stack>
  
                </Stack>
                                {expanded[form.title] && (
                                    <FormEmbed
                                        link={form}
                                        userData={userData}
                                        matters={matters}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </>
    );

};

export default FormsSidebar;