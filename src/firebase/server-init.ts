'use server';

import { getApps, getApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Initializes the Firebase Admin SDK on the server-side if it hasn't been already.
 * This is safe to call multiple times.
 * @returns An object containing the server-side Firestore instance.
 */
export async function initializeServerApp() {
  if (getApps().length === 0) {
    // Initialize with default credentials for the project environment.
    // In App Hosting, this automatically uses the application's default credentials.
    initializeApp();
  }

  return {
    firestore: getFirestore(getApp()),
  };
}
