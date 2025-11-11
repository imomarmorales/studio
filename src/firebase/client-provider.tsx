'use client';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

// One-time initialization of the Firebase app
const { firebaseApp, auth, firestore, storage } = initializeFirebase();

/**
 * Provides the Firebase app, Auth, Firestore, and Storage instances to the client-side components.
 * This provider ensures that Firebase is initialized only once.
 */
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
      storage={storage}
    >
      {children}
    </FirebaseProvider>
  );
}
