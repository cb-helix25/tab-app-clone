import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
// invisible change 2

// Split into two contexts so components that only need setContent don't re-render when content changes
interface NavigatorActionsContextProps {
    setContent: (content: ReactNode | null) => void;
}

interface NavigatorContentContextProps {
    content: ReactNode | null;
}

const NavigatorActionsContext = createContext<NavigatorActionsContextProps>({
    setContent: () => { },
});

const NavigatorContentContext = createContext<NavigatorContentContextProps>({
    content: null,
});

export const NavigatorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [content, setContent] = useState<ReactNode | null>(null);

    const actions = useMemo(() => ({ setContent }), [setContent]);
    const contentValue = useMemo(() => ({ content }), [content]);

    return (
        <NavigatorActionsContext.Provider value={actions}>
            <NavigatorContentContext.Provider value={contentValue}>
                {children}
            </NavigatorContentContext.Provider>
        </NavigatorActionsContext.Provider>
    );
};

export const useNavigatorActions = () => useContext(NavigatorActionsContext);
export const useNavigatorContent = () => useContext(NavigatorContentContext);