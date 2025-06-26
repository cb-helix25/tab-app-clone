import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CompletionState {
    summaryComplete: boolean;
    setSummaryComplete: (done: boolean) => void;
}

const CompletionContext = createContext<CompletionState | undefined>(undefined);

export const useCompletion = () => {
    const ctx = useContext(CompletionContext);
    if (!ctx) throw new Error('useCompletion must be used within CompletionProvider');
    return ctx;
};

export const CompletionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [summaryComplete, setSummaryCompleteState] = useState(false);
    const setSummaryComplete = (done: boolean) => {
        setSummaryCompleteState(done);
    };
    return (
        <CompletionContext.Provider value={{ summaryComplete, setSummaryComplete }}>
            {children}
        </CompletionContext.Provider>
    );
};