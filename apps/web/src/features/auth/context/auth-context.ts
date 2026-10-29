import { createContext } from 'react';
import type { PublicUser } from '@ibase/shared-types';

/** Shared state exposed to authentication feature components. */
export interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  setUser: (user: PublicUser | null) => void;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

/** Context populated by the authentication feature provider. */
export const AuthContext = createContext<AuthContextValue | null>(null);
