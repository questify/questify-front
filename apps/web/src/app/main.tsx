import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { queryClient } from '@core/services/queryClient';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider } from '@core/contexts/AuthContext';
import '../styles/index.css';
import { setApiConfig } from '@core/types/api';
import { setTokenStorage } from "@core/services/tokenStorage";

setApiConfig({
    baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

setTokenStorage({
    getToken: async () => localStorage.getItem("questify_token"),
    setToken: async (token: string) =>
        localStorage.setItem("questify_token", token),
    clearToken: async () => localStorage.removeItem("questify_token"),
});

const rootEl = document.getElementById('root')
if (!rootEl) {
    throw new Error('Root element #root introuvable dans index.html')
}

ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
        <ErrorBoundary>
            <AuthProvider>
                <QueryClientProvider client={queryClient}>
                    <App />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                            },
                            success: {
                                duration: 3000,
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                duration: 5000,
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </QueryClientProvider>
            </AuthProvider>
        </ErrorBoundary>
    </React.StrictMode>
)