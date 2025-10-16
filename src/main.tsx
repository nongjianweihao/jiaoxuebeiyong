import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/theme.css';
import './index.css';
import { initTheme } from './theme/theme';
import { SeedInitializer } from './seed/SeedInitializer';
import { ErrorBoundary } from './components/ErrorBoundary';

initTheme();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <SeedInitializer>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </SeedInitializer>
    </HashRouter>
  </React.StrictMode>,
);
