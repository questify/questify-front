import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { api } from "../services/api";
import {getToken, clearToken, setToken as persistToken } from '../services/tokenStorage';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  total_points: number;
  streak_current: number;
  streak_record: number;
  start_date?: string;
}

type AuthState = {
    token: string | null;
    user: User | null;
    isAuthReady: boolean;   // token chargé
    isUserReady: boolean;   // user chargé (ou échec géré)
    isLoggedIn: boolean;
    isLoading: boolean;
    isAuthenticated: boolean;

    refreshUser: () => Promise<void>;
    loginWithToken: (token: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isUserReady, setIsUserReady] = useState(false);

    // 1) boot: charger token une fois
    useEffect(() => {
        (async () => {
            try {
                const t = await getToken();
                setToken(t);
            } finally {
                setIsAuthReady(true);
            }
        })();
    }, []);

    // 2) quand token prêt, charger le user (si token existe)
    useEffect(() => {
        if (!isAuthReady) return;

        (async () => {
            setIsUserReady(false);

            if (!token) {
                setUser(null);
                setIsUserReady(true);
                return;
            }

            try {
                // ⚠️ adapte l’endpoint à ton backend :
                // "/api/users/me" ou "/api/auth/me"
                const me = await api.users.getMe();
                setUser(me);
            } catch (e) {
                // Token invalide/expiré => on nettoie
                console.log("🔐 Failed to load user, clearing token", e);
                await clearToken();
                setToken(null);
                setUser(null);
            } finally {
                setIsUserReady(true);
            }
        })();
    }, [isAuthReady, token]);

    const refreshUser = async () => {
        if (!token) {
            setUser(null);
            setIsUserReady(true);
            return;
        }
        setIsUserReady(false);
        try {
            const me = await api.users.getMe();
            setUser(me);
        } finally {
            setIsUserReady(true);
        }
    };

    const loginWithToken = async (newToken: string) => {
        await persistToken(newToken);
        setToken(newToken);
        // user sera chargé automatiquement par l’effet
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await api.auth.login({ email, password });
            await loginWithToken(response.token);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            const response = await api.auth.register({ name, email, password });
            await loginWithToken(response.token);
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    };

    const logout = async () => {
        await clearToken();
        setToken(null);
        setUser(null);
        setIsUserReady(true);
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        setUser({ ...user, ...updates });
    };

    const value = useMemo<AuthState>(
        () => ({
            token,
            user,
            isAuthReady,
            isUserReady,
            isLoggedIn: Boolean(token),
            isLoading: !isAuthReady || !isUserReady,
            isAuthenticated: Boolean(token && user),

            refreshUser,
            loginWithToken,
            login,
            register,
            logout,
            updateUser,
        }),
        [token, user, isAuthReady, isUserReady]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}