// Signed-in user, kept in memory only (rules/04: no tokens in localStorage).
// With the real backend the session is an httpOnly cookie.
import { createContext, useContext, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { User } from '../api/types';

interface Auth {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const signIn = async (email: string, password: string) => setUser(await api.signIn(email, password));
  const signOut = async () => {
    await api.signOut();
    setUser(null);
  };
  return <AuthCtx.Provider value={{ user, signIn, signOut }}>{children}</AuthCtx.Provider>;
}

export function useAuth(): Auth {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}

/** The signed-in user; only used inside signed-in pages. */
export function useMe(): User {
  const { user } = useAuth();
  if (!user) throw new Error('Not signed in');
  return user;
}
