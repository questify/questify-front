import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { queryClient } from '../services/queryClient'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { AuthProvider } from '../contexts/AuthContext'
import '../styles/index.css'

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