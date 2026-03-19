import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/analytics';

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

let auth: firebase.auth.Auth | null = null;
let db: firebase.firestore.Firestore | null = null;
let storage: firebase.storage.Storage | null = null;
let analytics: firebase.analytics.Analytics | null = null;

const FieldValue = firebase.firestore.FieldValue;

if (firebaseConfig.apiKey) {
  try {
    const app = firebase.initializeApp(firebaseConfig);
    auth = app.auth();

    // Using initializeFirestore to re-add existing settings
    db = app.firestore();
    db.settings({
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true
    });

    storage = app.storage();

    // Initialize Analytics if supported in the current environment
    if (typeof window !== 'undefined') {
        analytics = app.analytics();
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase configuration (VITE_FIREBASE_API_KEY) is missing. Services will be unavailable.");
}

export { auth, db, storage, analytics, FieldValue };
