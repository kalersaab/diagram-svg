'use client';

import { useState, useEffect, useCallback } from 'react';
import UserService from '@/app/services/users';
import DiagramService from '@/app/services/diagram';
import type { ApiUser } from '@/app/services/users';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface UseAuthReturn {
  user: ApiUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const SESSION_KEY = 'diagram_user';

const userService = new UserService();
const diagramService = new DiagramService();

async function probeSession(): Promise<boolean> {
  try {
    await diagramService.getDiagrams();
    return true;
  } catch {
    return false;
  }
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored =
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem(SESSION_KEY)
        : null;

    probeSession().then(alive => {
      if (alive) {
        const cachedUser: ApiUser | null = stored
          ? (JSON.parse(stored) as ApiUser)
          : null;
        setUser(cachedUser);
        setStatus('authenticated');
      } else {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(SESSION_KEY);
        }
        setUser(null);
        setStatus('unauthenticated');
      }
    });
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SESSION_KEY);
      }
      setUser(null);
      setStatus('unauthenticated');
    };

    window.addEventListener('diagram:unauthorized', handleUnauthorized);
    return () =>
      window.removeEventListener('diagram:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await userService.login({ body: { email, password } });
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(res.data));
      }
      setUser(res.data);
      setStatus('authenticated');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Login failed';
      setError(msg);
      throw err;
    }
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await userService.signup({ body: { email, password } });

      const loginRes = await userService.login({ body: { email, password } });
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(loginRes.data));
      }
      setUser(loginRes.data);
      setStatus('authenticated');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Sign up failed';
      setError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await userService.logout();
    } catch {

    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
    }
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { user, status, login, signup, logout, error, clearError };
}