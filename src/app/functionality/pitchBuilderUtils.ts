export const hasActivePitchBuilder = (): boolean => {
    const saved = localStorage.getItem('pitchBuilderState');
    if (!saved) return false;
    try {
        const state = JSON.parse(saved);
        return Boolean(state && state.enquiryId);
    } catch {
        return false;
    }
};

export const clearPitchBuilderDraft = (): void => {
    localStorage.removeItem('pitchBuilderState');
};