import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { SeedInitializer } from './seed/SeedInitializer';
import { ErrorBoundary } from './components/ErrorBoundary';

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
