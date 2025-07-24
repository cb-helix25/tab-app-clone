import React from 'react';

interface HoverTooltipProps {
    hoveredField: string | null;
    position: { x: number; y: number };
    displayNames: Record<string, string>;
}

const HoverTooltip: React.FC<HoverTooltipProps> = ({ hoveredField, position, displayNames }) => {
    if (!hoveredField) return null;
    const tooltipStyle = {
        position: 'fixed' as const,
        top: position.y,
        left: position.x,
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500,
        zIndex: 10000,
        pointerEvents: 'none' as const,
        whiteSpace: 'nowrap' as const
    };
    return (
        <div style={tooltipStyle}>
            {displayNames[hoveredField as keyof typeof displayNames] || hoveredField}
        </div>
    );
};

export default HoverTooltip;