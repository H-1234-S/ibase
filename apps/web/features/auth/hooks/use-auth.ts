'use client';

import { useContext } from 'react';
import { AuthContext } from '../context/auth-context';

/** Reads the current browser authentication state. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
