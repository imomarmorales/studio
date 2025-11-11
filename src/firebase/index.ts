'use client';

import { useMemo } from 'react';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { Auth, getAuth, connectAuthEmulator } from 'firebase/auth';
import { Firestore, getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { FirebaseProvider, useAuth, useFirebase, useFirebaseApp, useFirestore } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useUser } from './auth/use-user';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';

// Initializes and returns a Firebase app instance.
function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  const isConfigured = getApps().length > 0;
  const firebaseApp = isConfigured ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  // NOTE: Emulator connection should only be used in development.
  if (process.env.NEXT_PUBLIC_EMULATOR_HOST) {
    const host = process.env.NEXT_PUBLIC_EMULATOR_HOST;
    
    // Connect Auth emulator
    try {
      connectAuthEmulator(auth, `http://${host}:9099`, {
        disableWarnings: true,
      });
    } catch (error) {
      // Emulator already connected, ignore error
    }

    // Connect Firestore emulator
    try {
      connectFirestoreEmulator(firestore, host, 8080);
    } catch (error) {
      // Emulator already connected, ignore error
    }
  }

  return { firebaseApp, auth, firestore };
}

// Custom hook to memoize Firebase references and queries.
function useMemoFirebase<T>(factory: () => T | null, deps: React.DependencyList): T | null {
  const memoizedValue = useMemo(factory, deps);
  
  // Mark the object as memoized to satisfy useCollection's validation
  if (memoizedValue && typeof memoizedValue === 'object') {
    Object.defineProperty(memoizedValue, '__memo', {
      value: true,
      enumerable: false,
      writable: false,
    });
  }
  
  return memoizedValue;
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useUser,
  useCollection,
  useDoc,
  useFirebase,
  useFirebaseApp,
  useAuth,
  useFirestore,
  useMemoFirebase,
};
