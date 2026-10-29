'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PublicUser } from '@ibase/shared-types';
import { authRequest, fetchCurrentUser } from '../api/auth-api';
import { AuthContext } from '../context/auth-context';
import type { AuthContextValue } from '../context/auth-context';
import { broadcastAuthChange } from './broadcast-auth-change';

/** Restores the public user from `/me` and centralizes browser auth state. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadUser = useCallback(async () => {
    try {
      setUser(await fetchCurrentUser());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadUser();
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }
    const channel = new BroadcastChannel('ibase-auth');
    channel.onmessage = () => void reloadUser();
    return () => channel.close();
  }, [reloadUser]);

  const logout = useCallback(async () => {
    await authRequest<void>('/api/auth/logout', { method: 'POST' });
    setUser(null);
    broadcastAuthChange();
  }, []);

  const value = useMemo(
    () => ({ user, loading, setUser, logout, reloadUser }),
    [user, loading, logout, reloadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
