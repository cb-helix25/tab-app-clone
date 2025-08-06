import { Text } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { Matter } from '../../app/functionality/types';
import { useTheme } from '../../app/functionality/ThemeContext';
import React from 'react';

interface MatterLineItemProps {
    matter: Matter;
    onSelect: (matter: Matter) => void;
    isLast?: boolean;
}

const formatDate = (dateStr: string): string => {
    try {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
};

const MatterLineItem: React.FC<MatterLineItemProps> = ({ matter, onSelect, isLast }) => {
    const { isDarkMode } = useTheme();

    const lineStyle = mergeStyles({
        display: 'grid',
        gridTemplateColumns: '120px 1fr 160px 120px',
        alignItems: 'center',
        padding: '8px 20px',
        cursor: 'pointer',
        borderBottom: !isLast
            ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
            : 'none',
        selectors: {
            ':hover': {
                backgroundColor: isDarkMode ? '#23272e' : '#f3f3f3',
            },
        },
    });

    return (
        <div className={lineStyle} onClick={() => onSelect(matter)}>
            <Text style={{ fontWeight: 600 }}>{matter.DisplayNumber}</Text>
            <Text>{matter.ClientName}</Text>
            <Text>{matter.PracticeArea}</Text>
            <Text>{formatDate(matter.OpenDate)}</Text>
        </div>
    );
};

export default MatterLineItem;
