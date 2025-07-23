import React from 'react';

interface PlaceholderBlockProps {
    children: React.ReactNode;
    contentEditable?: boolean;
    suppressContentEditableWarning?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: () => void;
    onFocus?: (e: React.FocusEvent<HTMLSpanElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLSpanElement>) => void;
    backgroundColor: string;
    color: string;
    borderColor: string;
    borderStyle?: 'solid' | 'dashed';
    className?: string;
    'data-placeholder'?: string;
}

const PlaceholderBlock: React.FC<PlaceholderBlockProps> = ({
    children,
    backgroundColor,
    color,
    borderColor,
    borderStyle = 'dashed',
    ...props
}) => {
    const borderStyleValue = borderStyle === 'dashed' ? 'dashed' : 'solid';
    
    return (
        <span
            style={{
                backgroundColor,
                color,
                padding: '2px 4px',
                fontWeight: 500,
                outline: 'none',
                fontFamily: 'Raleway, sans-serif',
                fontSize: '14px',
                display: 'inline',
                minWidth: '20px',
                cursor: 'text',
                transition: 'all 0.2s ease',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                // Create continuous block using box-decoration-break
                border: `1px ${borderStyleValue} ${borderColor}`,
                borderRadius: '2px',
                boxDecorationBreak: 'slice',
                WebkitBoxDecorationBreak: 'slice',
                // Add custom properties for tetris-style connection
                position: 'relative'
            }}
            {...props}
        >
            {children}
        </span>
    );
};

export default PlaceholderBlock;
