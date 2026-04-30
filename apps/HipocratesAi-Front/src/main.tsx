import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './styles/index.css';
import { AuthProvider } from './auth/AuthProvider';
import { queryClient } from './lib/queryClient';
import { ToastProvider } from './components/ui/ToastProvider';
import { ConfirmationProvider } from './components/ui/ConfirmationProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmationProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ConfirmationProvider>
      </ToastProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
);
