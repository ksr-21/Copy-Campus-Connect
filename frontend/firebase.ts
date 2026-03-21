import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBxGsCp9EalIKA5Nr5GwCiJGTbTz6hqMoY",
  authDomain: "campus-connect-a832c.firebaseapp.com",
  databaseURL: "https://campus-connect-a832c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "campus-connect-a832c",
  storageBucket: "campus-connect-a832c.firebasestorage.app",
  messagingSenderId: "475351085570",
  appId: "1:475351085570:web:24e751a9a93e7154cf2d1b",
  measurementId: "G-SWKF6LS1H7"
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
