import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, serverTimestamp, increment, arrayUnion, arrayRemove } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let auth: any = null;
let db: any = null;
let storage: any = null;
let analytics: any = null;

// Recreating FieldValue with its core methods for backward compatibility
const FieldValue = {
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
};

if (firebaseConfig.apiKey) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Using initializeFirestore to re-add existing settings mentioned by the reviewer
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true
    });

    storage = getStorage(app);

    // Initialize Analytics if supported in the current environment
    if (typeof window !== 'undefined') {
        analytics = getAnalytics(app);
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase configuration (VITE_FIREBASE_API_KEY) is missing. Services will be unavailable.");
}

export { auth, db, storage, analytics, FieldValue };
