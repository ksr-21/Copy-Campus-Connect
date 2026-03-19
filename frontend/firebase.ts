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

let auth: any = null;
let db: any = null;
let storage: any = null;
let analytics: any = null;
let FieldValue: any = null;

if (firebaseConfig.apiKey) {
  try {
    const app = firebase.apps.length === 0 ? firebase.initializeApp(firebaseConfig) : firebase.app();
    auth = firebase.auth(app);
    db = firebase.firestore(app);
    storage = firebase.storage(app);

    // Configure Firestore settings securely
    try {
        db.settings({
            experimentalForceLongPolling: true,
            ignoreUndefinedProperties: true
        });
    } catch (e) {
        console.warn("Firestore settings already applied.");
    }

    // Enable offline persistence
    if (typeof window !== 'undefined') {
        db.enablePersistence().catch((err: any) => {
            if (err.code === 'failed-precondition') {
                console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
            } else if (err.code === 'unimplemented') {
                console.warn("The current browser does not support persistence.");
            }
        });
    }

    FieldValue = firebase.firestore.FieldValue;

    if (typeof window !== 'undefined') {
        analytics = firebase.analytics(app);
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase configuration (VITE_FIREBASE_API_KEY) is missing. Services will be unavailable.");
}

export { auth, db, storage, analytics, FieldValue };
