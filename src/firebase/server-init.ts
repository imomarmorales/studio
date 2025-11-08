'use server';

import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

/**
 * Initializes the Firebase Admin SDK on the server-side if it hasn't been already.
 * This is safe to call multiple times.
 * @returns An object containing the server-side Firestore instance.
 */
export async function initializeServerApp() {
  if (getApps().length === 0) {
    // Initialize with default credentials for the project environment.
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }

  return {
    firestore: getFirestore(getApp()),
  };
}
