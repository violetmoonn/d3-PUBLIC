import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, addDoc, serverTimestamp, getDocFromServer, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errCode = (error as any)?.code || '';
  const errMessage = error instanceof Error ? error.message : String(error);

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // If offline, backend unavailable, or IndexedDB connection closing, do not throw an uncaught exception to avoid crashing onSnapshot listeners
  if (
    errCode === 'unavailable' ||
    errCode === 'failed-precondition' ||
    errMessage.includes('unavailable') ||
    errMessage.includes('Could not reach Cloud Firestore backend') ||
    errMessage.includes('offline') ||
    errMessage.includes('IDBDatabase') ||
    errMessage.includes('database connection is closing') ||
    errMessage.includes('Database closing') ||
    errMessage.includes('transaction')
  ) {
    console.warn(`[Firestore Connection Notice] Operation ${operationType} on ${path}: backend unreachable, offline, or IndexedDB connection closing. Operating in cache/fallback mode.`);
    return;
  }

  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('offline') || msg.includes('unavailable') || msg.includes('Could not reach')) {
      console.warn("Firestore connection check: client is operating in offline/cached mode.");
    } else {
      console.warn("Firebase connection test notice:", msg);
    }
  }
}
testConnection();

export const getAdminHeaders = async (password: string) => {
  const headers: Record<string, string> = {
    'x-admin-password': password,
    'Content-Type': 'application/json'
  };
  
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  writeBatch,
  signInWithPopup,
  signOut,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
};
