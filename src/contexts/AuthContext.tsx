import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  total_points: number;
  streak_current: number;
  streak_record: number;
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
    // Check for stored auth token and user data on mount
    const storedUser = localStorage.getItem('questify_user');
    const storedToken = localStorage.getItem('questify_token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('questify_user');
        localStorage.removeItem('questify_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Import api here to avoid circular dependency
      const { api } = await import('../services/api');
      // Call real backend API
      const response = await api.auth.login({ email, password });
      const user: User = response.user;
      const token = response.token;

      // Store in localStorage
      localStorage.setItem('questify_user', JSON.stringify(user));
      localStorage.setItem('questify_token', token);

      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);

      // Import api here to avoid circular dependency
      const { api } = await import('../services/api');

      // Call real backend API
      const response = await api.auth.register({ name, email, password });

      const user: User = response.user;
      const token = response.token;

      // Store in localStorage
      localStorage.setItem('questify_user', JSON.stringify(user));
      localStorage.setItem('questify_token', token);

      setUser(user);
      toast.success(`Welcome to Questify, ${user.name}!`);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Email may already be in use.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('questify_user');
    localStorage.removeItem('questify_token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('questify_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
