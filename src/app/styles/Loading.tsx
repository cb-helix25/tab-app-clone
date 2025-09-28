// invisible change 3
// src/components/Loading.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { mergeStyles } from '@fluentui/react';
import loaderIcon from '../../assets/dark blue mark.svg';
import { colours } from './colours';
import { useTheme } from '../functionality/ThemeContext';

interface LoadingProps {
  /**
   * Optional status message to render beneath the logo.
   */
  readonly message?: string;
  /**
   * Additional rotating detail messages providing contextual progress.
   */
  readonly detailMessages?: readonly string[];
  /**
   * Overrides dark mode detection when supplied (useful before theme context is ready).
   */
  readonly isDarkMode?: boolean;
}

// Define keyframes for the fade-in and scale-up animation
const fadeInScaleLoopAnimation = `
@keyframes fadeInScaleLoop {
  0% {
    opacity: 0.75;
    transform: scale(0.88);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.75;
    transform: scale(0.88);
  }
}
`;

const animatedGradient = `
@keyframes helixGradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
`;

const spinAnimation = `
@keyframes spinHelixLoader {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
`;

// Styles for the loading container
const GlobalStyles: React.FC = () => (
  <style>
    {fadeInScaleLoopAnimation}
    {animatedGradient}
    {spinAnimation}
  </style>
);

/**
 * Branded loading screen with theme-aware gradients used across suspense fallbacks.
 */
const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  detailMessages,
  isDarkMode,
}) => {
  const { isDarkMode: themeDarkMode } = useTheme();
  const [prefersDarkMode, setPrefersDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [activeDetailIndex, setActiveDetailIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => setPrefersDarkMode(event.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handler = (event: KeyboardEvent) => {
      const key = event.key || '';
      const isControl = event.ctrlKey || event.metaKey;
      if (isControl && event.shiftKey && (key === 'p' || key === 'P')) {
        setIsPaused((prev) => !prev);
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    const { body } = document;
    if (!body) {
      return undefined;
    }
    if (isPaused) {
      body.classList.add('loading-paused');
    } else {
      body.classList.remove('loading-paused');
    }
    return () => {
      body.classList.remove('loading-paused');
    };
  }, [isPaused]);

  const defaultDetails: readonly string[] = useMemo(
    () => [
      'Syncing Microsoft Teams context…',
      'Loading user profile…',
      'Retrieving matters and enquiries…',
      'Preparing dashboards…',
    ],
    [],
  );

  const details = detailMessages && detailMessages.length > 0 ? detailMessages : defaultDetails;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (!details || details.length <= 1 || isPaused) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      setActiveDetailIndex((prev) => (prev + 1) % details.length);
    }, 3200);
    return () => window.clearInterval(interval);
  }, [details, isPaused]);

  const inferHostTheme = useMemo(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme');
    if (themeParam) {
      return themeParam.toLowerCase();
    }
    const bodyDataset = document.body?.dataset?.theme;
    if (bodyDataset) {
      return bodyDataset.toLowerCase();
    }
    if (document.body?.classList.contains('theme-dark')) {
      return 'dark';
    }
    if (document.body?.classList.contains('theme-contrast')) {
      return 'contrast';
    }
    if (document.body?.classList.contains('theme-light')) {
      return 'light';
    }
    return undefined;
  }, []);

  const resolvedDarkMode = useMemo(
    () => {
      if (typeof isDarkMode === 'boolean') {
        return isDarkMode;
      }
      if (typeof themeDarkMode === 'boolean') {
        return themeDarkMode;
      }
      if (inferHostTheme) {
        return inferHostTheme === 'dark' || inferHostTheme === 'contrast';
      }
      return prefersDarkMode;
    },
    [inferHostTheme, isDarkMode, prefersDarkMode, themeDarkMode],
  );

  const containerClass = useMemo(
    () =>
      mergeStyles({
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        padding: '24px',
        background: resolvedDarkMode
          ? `radial-gradient(circle at 20% 20%, rgba(54, 144, 206, 0.12), transparent 55%), linear-gradient(135deg, #0B1220 0%, ${colours.dark.sectionBackground} 45%, #0F1C32 100%)`
          : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 40%, #E8F0FF 100%)',
        backgroundSize: '220% 220%',
        animationName: 'helixGradientShift',
        animationDuration: '12s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationPlayState: isPaused ? 'paused' : 'running',
        color: resolvedDarkMode ? colours.dark.text : colours.light.text,
        transition: 'background 0.4s ease, color 0.4s ease',
      }),
    [isPaused, resolvedDarkMode],
  );

  const logoClass = useMemo(
    () =>
      mergeStyles({
        width: '320px',
        height: '320px',
        animationName: 'fadeInScaleLoop',
        animationDuration: '3.6s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        animationPlayState: isPaused ? 'paused' : 'running',
        filter: resolvedDarkMode ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.07))',
      }),
    [isPaused, resolvedDarkMode],
  );

  const messageClass = useMemo(
    () =>
      mergeStyles({
        marginTop: '24px',
        fontSize: '18px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textAlign: 'center',
        textShadow: resolvedDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
      }),
    [resolvedDarkMode],
  );

  const detailClass = useMemo(
    () =>
      mergeStyles({
        marginTop: '12px',
        fontSize: '15px',
        fontWeight: 500,
        letterSpacing: '0.01em',
        opacity: 0.85,
        textAlign: 'center',
        maxWidth: '420px',
        lineHeight: '22px',
        transition: 'opacity 0.4s ease',
      }),
    [],
  );

  const spinnerClass = useMemo(
    () =>
      mergeStyles({
        marginTop: '32px',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        border: resolvedDarkMode ? '3px solid rgba(255, 255, 255, 0.12)' : '3px solid rgba(6, 23, 51, 0.1)',
        borderTopColor: resolvedDarkMode ? colours.dark.highlight : colours.highlight,
        animationName: 'spinHelixLoader',
        animationDuration: '1s',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationPlayState: isPaused ? 'paused' : 'running',
      }),
    [isPaused, resolvedDarkMode],
  );
  const activeDetail = details[activeDetailIndex % details.length];

  return (
    <div className={containerClass} role="status" aria-live="polite" data-paused={isPaused ? 'true' : 'false'}>
      <GlobalStyles />
      <img src={loaderIcon} alt="Loading..." className={logoClass} />
      <span className={messageClass}>{message}</span>
      <span className={detailClass}>{activeDetail}</span>
      <div className={spinnerClass} />
    </div>
  );
};

export default Loading;
