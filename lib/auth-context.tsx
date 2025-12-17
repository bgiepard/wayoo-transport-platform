'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';
import { users } from './data';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isPassenger: boolean;
  isCarrier: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Automatyczne ustawienie użytkownika na podstawie ścieżki URL
    const path = window.location.pathname;

    if (path.startsWith('/driver')) {
      // Panel przewoźnika - ustaw przewoźnika (Michał Wiśniewski - id: 3)
      const carrier = users.find((u) => u.id === '3' && u.role === 'carrier');
      setCurrentUser(carrier || null);
    } else {
      // Panel pasażera - ustaw pasażera (Jan Kowalski - id: 1)
      const passenger = users.find((u) => u.id === '1' && u.role === 'passenger');
      setCurrentUser(passenger || null);
    }
  }, []);

  const isPassenger = currentUser?.role === 'passenger';
  const isCarrier = currentUser?.role === 'carrier';

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isPassenger, isCarrier }}>
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
