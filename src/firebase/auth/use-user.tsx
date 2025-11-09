'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth } from '../provider';

interface UseUserResult {
  user: User | null;
  isUserLoading: boolean;
  error: Error | null;
}

/**
 * React hook to subscribe to the current user's authentication state.
 * @returns An object containing the user, loading state, and any error.
 */
export function useUser(): UseUserResult {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(auth?.currentUser || null);
  const [isUserLoading, setUserLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
      // If auth is not available, we are not loading a user.
      setUserLoading(false);
      return;
    }

    // Set initial user state based on the current user if available
    setUser(auth.currentUser);
    setUserLoading(false);

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setUserLoading(false);
      },
      (error) => {
        console.error('Authentication error:', error);
        setError(error);
        setUserLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  return { user, isUserLoading, error };
}
