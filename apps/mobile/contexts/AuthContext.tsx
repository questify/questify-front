import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  total_points: number;
  streak_current: number;
  streak_record: number;
  start_date?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('questify_user');
      const storedToken = await AsyncStorage.getItem('questify_token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { api } = await import('@/core/services/api');
      const response = await api.auth.login({ email, password });
      const user: User = response.user;
      const token = response.token;

      await AsyncStorage.setItem('questify_user', JSON.stringify(user));
      await AsyncStorage.setItem('questify_token', token);

      setUser(user);
      Alert.alert('Connexion réussie', `Bienvenue ${user.name} !`);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Erreur', 'Connexion échouée. Vérifiez vos identifiants.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const { api } = await import('@/core/services/api');
      const response = await api.auth.register({ name, email, password });
      const user: User = response.user;
      const token = response.token;

      await AsyncStorage.setItem('questify_user', JSON.stringify(user));
      await AsyncStorage.setItem('questify_token', token);

      setUser(user);
      Alert.alert('Inscription réussie', `Bienvenue sur Questify, ${user.name} !`);
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Erreur', "Inscription échouée. L'email existe peut-être déjà.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('questify_user');
      await AsyncStorage.removeItem('questify_token');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    AsyncStorage.setItem('questify_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
