import React from 'react';
// invisible change 2
import { useNavigatorContent } from '../app/functionality/NavigatorContext';
import { useTheme } from '../app/functionality/ThemeContext';
import { colours } from '../app/styles/colours';
import '../app/styles/Navigator.css';
import '../app/styles/NavigatorPivot.css';

const Navigator: React.FC = () => {
    const { content } = useNavigatorContent();
    const { isDarkMode } = useTheme();

    if (!content) {
        return null;
    }

    // Compact premium tokens (theme-aware)
    const CARD_RADIUS = 10;
    const PADDING_Y = 8;
    const PADDING_X = 12;
    const SHADOW = isDarkMode
        ? '0 4px 6px rgba(0, 0, 0, 0.3)'
        : '0 4px 6px rgba(0, 0, 0, 0.07)';
    const BORDER = isDarkMode
        ? '1px solid rgba(255, 255, 255, 0.08)'
        : '1px solid rgba(0, 0, 0, 0.06)';
    const GRADIENT_BG = isDarkMode
        ? 'linear-gradient(135deg, #0F172A 0%, #111827 100%)'
        : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)';

    return (
        <div
            className="app-navigator"
            style={{
                backgroundColor: isDarkMode
                    ? colours.dark.sectionBackground
                    : colours.light.sectionBackground,
            }}
        >
            <div
                className="navigator-card"
                role="region"
                aria-label="Navigator"
                style={{
                    background: GRADIENT_BG,
                    border: BORDER,
                    borderRadius: CARD_RADIUS,
                    boxShadow: SHADOW,
                    padding: `${PADDING_Y}px ${PADDING_X}px`,
                    margin: '8px 12px 0 12px',
                    transition: 'box-shadow 0.2s ease',
                }}
            >
                {content}
            </div>
        </div>
    );
};

export default Navigator;