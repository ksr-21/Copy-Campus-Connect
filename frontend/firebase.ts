
// This declaration informs TypeScript that a global variable named 'firebase'
// will exist at runtime, provided by the <script> tags in index.html.
// This prevents compile-time errors without using ES module imports that cause race conditions.
declare const firebase: any;

// The configuration is loaded from environment variables for security.
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

// Initialize Firebase
// The global `firebase` object is guaranteed to exist here due to the script loading order.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize services
const db = firebase.firestore();

// Configure Firestore settings
// Using experimentalForceLongPolling is recommended for environments with restrictive networks (like corporate firewalls or some web containers)
// We wrap in try-catch because settings can only be called once per instance.
try {
    db.settings({
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true
    });
} catch (e) {
    console.debug("Firestore settings already applied.");
}

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true })
  .catch((err: any) => {
      if (err.code == 'failed-precondition') {
          console.warn('Persistence failed: Multiple tabs open');
      } else if (err.code == 'unimplemented') {
          console.warn('Persistence failed: Not supported');
      }
  });

export const auth = firebase.auth();
export { db };
export const storage = firebase.storage();
export const FieldValue = firebase.firestore.FieldValue;
