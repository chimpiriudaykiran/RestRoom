import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n.js';
import i18n from "i18next";
import { I18nextProvider } from 'react-i18next';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <I18nextProvider i18n={i18n} defaultNS={'translation'}>
  <React.StrictMode>
    <App />
  </React.StrictMode>
  </I18nextProvider>
);
