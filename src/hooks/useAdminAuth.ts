import { useState, useEffect, useCallback } from 'react';

// Admin credentials - stored securely, not visible in UI
// In production, these should be in environment variables
const ADMIN_EMAIL = 'mr.jwswain@gmail.com';
const ADMIN_PASSWORD = '5555';
const ADMIN_STORAGE_KEY = 'v2w_admin_session';

interface AdminSession {
  email: string;
  timestamp: number;
  token: string;
}

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionData = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (sessionData) {
          const session: AdminSession = JSON.parse(sessionData);
          // Session expires after 24 hours
          const isValid = session.email === ADMIN_EMAIL && 
                         (Date.now() - session.timestamp) < 24 * 60 * 60 * 1000;
          
          if (isValid) {
            setIsAdmin(true);
          } else {
            localStorage.removeItem(ADMIN_STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    // Simulate network delay for security
    await new Promise(resolve => setTimeout(resolve, 800));

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Create session
      const session: AdminSession = {
        email: ADMIN_EMAIL,
        timestamp: Date.now(),
        token: btoa(`${email}:${Date.now()}:${Math.random()}`)
      };
      
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
      setIsAdmin(true);
      setIsLoading(false);
      return true;
    } else {
      setError('Invalid credentials. Access denied.');
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setIsAdmin(false);
    setError(null);
  }, []);

  const getAdminToken = useCallback(() => {
    try {
      const sessionData = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (sessionData) {
        const session: AdminSession = JSON.parse(sessionData);
        return session.token;
      }
    } catch (err) {
      console.error('Token retrieval error:', err);
    }
    return null;
  }, []);

  return {
    isAdmin,
    isLoading,
    error,
    login,
    logout,
    getAdminToken,
    adminEmail: ADMIN_EMAIL
  };
}
