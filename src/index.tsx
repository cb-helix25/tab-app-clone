import React from 'react';
import { createRoot } from 'react-dom/client';
import { initializeIcons } from '@fluentui/react';
import './app/styles/index.css';
import App from './app/App';

initializeIcons();

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(<App />);
}