'use client';

import { useMemo } from 'react';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { Auth, getAuth, connectAuthEmulator } from 'firebase/auth';
import { Firestore, getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { FirebaseStorage, getStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig } from './config';
import { FirebaseProvider, useAuth, useFirebase, useFirebaseApp, useFirestore } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useUser } from './auth/use-user';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';

// One-time initialization of the Firebase app
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

if (getApps().length > 0) {
  firebaseApp = getApp();
} else {
  firebaseApp = initializeApp(firebaseConfig);
}

auth = getAuth(firebaseApp);
firestore = getFirestore(firebaseApp);
storage = getStorage(firebaseApp);


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

  // Connect Storage emulator
  try {
    connectStorageEmulator(storage, host, 9199);
  } catch (error) {
    // Emulator already connected, ignore error
  }
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
  firebaseApp,
  auth,
  firestore,
  storage,
  FirebaseProvider,
  useUser,
  useCollection,
  useDoc,
  useFirebase,
  useFirebaseApp,
  useAuth,
  useFirestore,
  useMemoFirebase,
};
