'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
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
  // Default to first passenger user
  const [currentUser, setCurrentUser] = useState<User | null>(users[0]);

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
