import React from 'react';
// invisible change
import { useNavigator } from '../app/functionality/NavigatorContext';
import { useTheme } from '../app/functionality/ThemeContext';
import { colours } from '../app/styles/colours';
import '../app/styles/Navigator.css';
import '../app/styles/NavigatorPivot.css';

const Navigator: React.FC = () => {
    const { content } = useNavigator();
    const { isDarkMode } = useTheme();

    if (!content) {
        return null;
    }

    return (
        <div
            className="app-navigator"
            style={{
                backgroundColor: isDarkMode
                    ? colours.dark.sectionBackground
                    : colours.light.sectionBackground,
                borderBottom: `1px solid ${isDarkMode ? '#444' : '#e5e5e5'}`,
            }}
        >
            {content}
        </div>
    );
};

export default Navigator;