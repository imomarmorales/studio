'use client';

import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Define the shape of the context data.
export interface FirebaseContextValue {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

// Create a context for the Firebase instances.
export const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

/**
 * Provider component to make Firebase instances available throughout the app.
 */
export function FirebaseProvider({
  children,
  ...value
}: { children: React.ReactNode } & FirebaseContextValue) {
  return (
    <FirebaseContext.Provider value={value}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

// Custom hooks to easily access Firebase instances.

/**
 * Returns the full Firebase context value: { firebaseApp, auth, firestore }.
 * Throws an error if used outside of a FirebaseProvider.
 */
export function useFirebase(): FirebaseContextValue {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

/**
 * Returns the FirebaseApp instance.
 * Throws an error if used outside of a FirebaseProvider.
 */
export function useFirebaseApp(): FirebaseApp | null {
  return useFirebase().firebaseApp;
}

/**
 * Returns the Auth instance.
 * Throws an error if used outside of a FirebaseProvider.
 */
export function useAuth(): Auth | null {
  return useFirebase().auth;
}

/**
 * Returns the Firestore instance.
 * Throws an error if used outside of a FirebaseProvider.
 */
export function useFirestore(): Firestore | null {
  return useFirebase().firestore;
}
