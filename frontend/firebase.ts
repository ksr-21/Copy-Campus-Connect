
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

let auth: any = null;
let db: any = null;
let storage: any = null;
let FieldValue: any = null;

// Initialize Firebase with safety checks
try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Initialize services
        db = firebase.firestore();

        // Configure Firestore settings
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

        auth = firebase.auth();
        storage = firebase.storage();
        FieldValue = firebase.firestore.FieldValue;
    } else {
        console.warn("Firebase script not loaded. Firebase services will be unavailable.");
    }
} catch (error) {
    console.error("Firebase failed to initialize. Check your configuration.", error);
}

export { auth, db, storage, FieldValue };
