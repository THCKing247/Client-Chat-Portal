'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  selectedClientId: string | null;
  setSelectedClientId: (clientId: string | null) => void;
  selectedChatbotId: string | null;
  setSelectedChatbotId: (chatbotId: string | null) => void;
  isHyperUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored auth
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedClientId = localStorage.getItem('selectedClientId');
    const storedChatbotId = localStorage.getItem('selectedChatbotId');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedClientId) setSelectedClientId(storedClientId);
      if (storedChatbotId) setSelectedChatbotId(storedChatbotId);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Set default client for non-hyper users
    if (data.user.clientId) {
      setSelectedClientId(data.user.clientId);
      localStorage.setItem('selectedClientId', data.user.clientId);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSelectedClientId(null);
    setSelectedChatbotId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedClientId');
    localStorage.removeItem('selectedChatbotId');
  };

  const isHyperUser = user?.role === 'hyper';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        selectedClientId,
        setSelectedClientId: (clientId) => {
          setSelectedClientId(clientId);
          if (clientId) {
            localStorage.setItem('selectedClientId', clientId);
          } else {
            localStorage.removeItem('selectedClientId');
          }
        },
        selectedChatbotId,
        setSelectedChatbotId: (chatbotId) => {
          setSelectedChatbotId(chatbotId);
          if (chatbotId) {
            localStorage.setItem('selectedChatbotId', chatbotId);
          } else {
            localStorage.removeItem('selectedChatbotId');
          }
        },
        isHyperUser,
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

