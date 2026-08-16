import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App, { ErrorBoundary } from './App.tsx';
import './index.css';

// Global error handlers to intercept cross-origin Script errors and transient IndexedDB errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = reason?.message || String(reason || '');
    if (
      msg.includes('Script error') ||
      msg === 'Script error.' ||
      msg.includes('IDBDatabase') ||
      msg.includes('database connection is closing') ||
      msg.includes('Database closing') ||
      msg.includes('transaction') ||
      msg.includes('indexedDB')
    ) {
      console.warn('[Notice] Intercepted transient rejection:', msg);
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event?.message || event?.error?.message || String(event?.error || '');
    if (
      msg === 'Script error.' ||
      msg.includes('Script error') ||
      msg.includes('ResizeObserver loop') ||
      msg.includes('IDBDatabase') ||
      msg.includes('database connection is closing') ||
      msg.includes('Database closing') ||
      msg.includes('transaction') ||
      msg.includes('indexedDB')
    ) {
      console.warn('[Notice] Intercepted transient error:', msg);
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
