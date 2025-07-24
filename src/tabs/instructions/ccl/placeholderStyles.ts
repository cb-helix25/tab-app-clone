export const placeholderStyles = `
<style>
.placeholder-segment {
    border-top: 1px solid transparent !important;
    border-bottom: 1px solid transparent !important;
}

.placeholder-segment:first-of-type {
    border-top: 1px solid #20b26c !important;
}

.placeholder-segment:last-of-type {
    border-bottom: 1px solid #20b26c !important;
}

.placeholder-segment-empty {
    border-top: 1px solid transparent !important;
    border-bottom: 1px solid transparent !important;
}

.placeholder-segment-empty:first-of-type {
    border-top: 1px dashed #0078d4 !important;
}

.placeholder-segment-empty:last-of-type {
    border-bottom: 1px dashed #0078d4 !important;
}
</style>
`;

export function injectPlaceholderStyles() {
    if (typeof document !== 'undefined' && !document.getElementById('placeholder-molding-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'placeholder-molding-styles';
        styleElement.innerHTML = placeholderStyles.replace('<style>', '').replace('</style>', '');
        document.head.appendChild(styleElement);
    }
}