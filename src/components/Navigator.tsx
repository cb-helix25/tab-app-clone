import React from 'react';
import { useNavigator } from '../app/functionality/NavigatorContext';
import { useTheme } from '../app/functionality/ThemeContext';
import { colours } from '../app/styles/colours';
import '../styles/Navigator.css';

const Navigator: React.FC = () => {
    const { content } = useNavigator();
    const { isDarkMode } = useTheme();

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