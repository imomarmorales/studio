'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
  DocumentData,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking<T extends DocumentData>(
  docRef: DocumentReference<T>,
  data: T,
  options: SetOptions = {}
): void {
  setDoc(docRef, data, options).catch(() => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write',
        requestResourceData: data,
      })
    );
  });
}

/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref.
 */
export function addDocumentNonBlocking<T extends DocumentData>(
  colRef: CollectionReference<T>,
  data: T
): Promise<DocumentReference<T> | void> {
  return addDoc(colRef, data).catch(() => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
  });
}

/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking<T extends DocumentData>(
  docRef: DocumentReference<T>,
  data: Partial<T>
): void {
  updateDoc(docRef, data as DocumentData).catch(() => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
  });
}

/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking<T extends DocumentData>(
  docRef: DocumentReference<T>
): void {
  deleteDoc(docRef).catch(() => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      })
    );
  });
}