import React, { createContext, useContext, useState, ReactNode } from 'react';
// invisible change 2

interface NavigatorContextProps {
    content: ReactNode | null;
    setContent: (content: ReactNode | null) => void;
}

const NavigatorContext = createContext<NavigatorContextProps>({
    content: null,
    setContent: () => { },
});

export const NavigatorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [content, setContent] = useState<ReactNode | null>(null);
    return (
        <NavigatorContext.Provider value={{ content, setContent }}>
            {children}
        </NavigatorContext.Provider>
    );
};

export const useNavigator = () => useContext(NavigatorContext);