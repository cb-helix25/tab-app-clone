import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ThemeProvider as FluentThemeProvider,
  createTheme,
  mergeStyles,
  Stack,
  Text,
  Toggle,
  FontWeights,
} from '@fluentui/react';
import { ThemeProvider, useTheme } from './functionality/ThemeContext';
import { colours } from './styles/colours';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from '../tabs/home/Home';
import Hub from '../tabs/home/Hub';

const resolveInitialDarkMode = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const stored = window.localStorage.getItem('helix_theme');
    if (stored === 'dark') {
      return true;
    }

    if (stored === 'light') {
      return false;
    }
  } catch {
    // Ignore storage access issues (e.g. privacy mode)
  }

  if (typeof document !== 'undefined') {
    const datasetTheme = document.body?.dataset?.theme;
    if (datasetTheme === 'dark') {
      return true;
    }
    if (datasetTheme === 'light') {
      return false;
    }
  }

  return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
};

const AppShell: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const body = document.body;
      body.style.backgroundColor = isDarkMode ? colours.dark.background : colours.light.background;
      body.style.transition = 'background-color 0.3s ease';     
    }
  }, [isDarkMode]);

  const fluentTheme = useMemo(
    () =>
      createTheme({
        palette: {
          themePrimary: colours.blue,
          themeLighterAlt: '#f3f8fc',
          themeLighter: '#d0e5f6',
          themeLight: '#aacfee',
          themeTertiary: '#5a9edc',
          themeSecondary: '#2378cb',
          themeDarkAlt: '#3182c6',
          themeDark: '#296dad',
          themeDarker: '#1f5280',
          neutralLighterAlt: isDarkMode ? '#2a2a2a' : '#fafafa',
          neutralLighter: isDarkMode ? '#2f2f2f' : '#f5f5f5',
          neutralLight: isDarkMode ? '#373737' : '#ededed',
          neutralQuaternaryAlt: isDarkMode ? '#404040' : '#e2e2e2',
          neutralQuaternary: isDarkMode ? '#474747' : '#dadada',
          neutralTertiaryAlt: isDarkMode ? '#505050' : '#c8c8c8',
          neutralTertiary: isDarkMode ? '#c8c8c8' : '#939393',
          neutralSecondary: isDarkMode ? '#d0d0d0' : '#767676',
          neutralPrimaryAlt: isDarkMode ? '#dadada' : '#3c3c3c',
          neutralPrimary: isDarkMode ? '#f3f3f3' : '#323130',
          neutralDark: isDarkMode ? '#f8f8f8' : '#201f1e',
          black: isDarkMode ? '#fdfdfd' : '#000000',
          white: isDarkMode ? colours.dark.background : colours.light.background,
        },
        isInverted: isDarkMode,
      }),
    [isDarkMode],
  );

  const containerClass = useMemo(
    () =>
      mergeStyles({
        minHeight: '100vh',
        backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
        transition: 'background-color 0.3s ease',
        padding: '32px 16px 48px',
      }),
    [isDarkMode],
  );

  const contentClass = useMemo(
    () =>
      mergeStyles({
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
      }),
    [],
  );
        
  const stackStyles = useMemo(
    () => ({
      root: {
        color: isDarkMode ? colours.dark.text : colours.light.text,
      },
    }),
    [isDarkMode],
  );

  const headingStyles = useMemo(
    () => ({
      root: {
        color: isDarkMode ? colours.dark.text : colours.light.text,
        fontWeight: FontWeights.semibold,
      },
    }),
    [isDarkMode],
  );

  const handleThemeChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, checked?: boolean) => {
      if (typeof checked === 'boolean' && checked !== isDarkMode) {
        toggleTheme();
      }
    },
    [isDarkMode, toggleTheme],
  );

    const renderPage = useCallback(
    (title: string, content: React.ReactNode) => (
      <Stack tokens={{ childrenGap: 24 }} styles={stackStyles}>
        <Stack
          horizontal
          horizontalAlign="space-between"
          verticalAlign="center"
          wrap
          tokens={{ childrenGap: 12 }}
        >
          <Text variant="xLarge" styles={headingStyles}>
            {title}
          </Text>
          <Toggle
            label="Theme"
            checked={isDarkMode}
            onText="Dark"
            offText="Light"
            onChange={handleThemeChange}
          />
        </Stack>
        {content}
      </Stack>
    ),
    [handleThemeChange, headingStyles, isDarkMode, stackStyles],
  );

  return (
    <FluentThemeProvider theme={fluentTheme}>
      <div className={containerClass}>
        <div className={contentClass}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={renderPage('Home', <Home />)} />
              <Route path="/hub" element={renderPage('Hub', <Hub />)} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    </FluentThemeProvider>
  );
};

const App: React.FC = () => {
  const [initialDarkMode] = useState(() => resolveInitialDarkMode());

  return (
    <ThemeProvider isDarkMode={initialDarkMode}>
      <AppShell />
    </ThemeProvider>
  );
};

export default App;