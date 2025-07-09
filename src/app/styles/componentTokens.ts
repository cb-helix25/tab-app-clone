// invisible change
// invisible change 3
import { colours } from './colours';

/**
 * Design tokens that capture the look and feel of common UI components.
 * These values are derived from the sample instruction form styles and can be
 * reused across the application to maintain visual consistency.
 */
export const componentTokens = {
  stepHeader: {
    base: {
      backgroundColor: colours.darkBlue,
      textColor: '#ffffff',
      borderRadius: '0px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    active: {
      backgroundColor: colours.darkBlue,
      textColor: '#ffffff',
      borderColor: colours.darkBlue,
    },
    lockedOpacity: 0.5,
  },

  stepContent: {
    borderColor: 'rgba(211,211,211,0.5)',
    boxShadow: '0 4px 18px rgba(0,0,0,0.09)',
    completedBorderColor: '#7DBB7D',
  },

  toggleButton: {
    base: {
      backgroundColor: colours.grey,
      color: colours.darkBlue,
      border: `2px solid ${colours.blue}`,
      borderRadius: '0px',
      padding: '10px 16px',
    },
    hover: {
      backgroundColor: '#e0e7ff',
    },
    active: {
      backgroundColor: colours.darkBlue,
      color: '#ffffff',
    },
  },

  summaryPane: {
    base: {
      backgroundColor: colours.grey,
      borderRadius: '0px',
      borderColor: '#e3e8ef',
      boxShadow: '0 2px 12px rgba(44,71,129,0.05)',
      padding: '1.5rem 1.2rem',
    },
    collapsed: {
      backgroundColor: '#f5fdf7',
      borderColor: '#49B670',
      padding: '0',
    },
  },

  infoBanner: {
    background: `linear-gradient(to right, #ffffff, ${colours.grey})`,
    borderLeft: `3px solid ${colours.cta}`,
    padding: '0.35rem 0.75rem',
  },

  /** Banner used for confirming deal closure */
  successBanner: {
    background: `linear-gradient(to right, #ffffff, ${colours.grey})`,
    borderLeft: `3px solid ${colours.green}`,
    padding: '0.35rem 0.75rem',
  },

  accordion: {
    header: {
      background: `linear-gradient(to right, #ffffff, ${colours.grey})`,
      padding: '0.35rem 0.75rem',
      fontWeight: 600,
      color: '#1f2937',
    },
    body: {
      backgroundColor: colours.grey,
      padding: '0.75rem',
      borderRadius: '0px',
    },
  },

  /** Generic card styles used for form tiles and quick actions */
  card: {
    base: {
      padding: '12px',
      borderRadius: '0px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    hover: {
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      transform: 'translateY(-5px)',
    },
  },
} as const;

export type ComponentTokens = typeof componentTokens;
