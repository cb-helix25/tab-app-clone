import { IStackTokens, IStackStyles } from '@fluentui/react';
import { colours } from '../../app/styles/colours';

export const dashboardTokens: IStackTokens = {
  childrenGap: 20,
};

export const cardTokens: IStackTokens = {
  childrenGap: 8,
};

export const cardStyles: IStackStyles = {
  root: {
    padding: 20,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    backgroundColor: colours.light.sectionBackground,
  },
};

export const statusColors = {
  pending: colours.orange,
  completed: colours.green,
  awaiting: colours.yellow,
};