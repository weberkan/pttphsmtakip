
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let rtdb: Database | null = null;

// This check prevents Firebase from trying to initialize on the server
// without credentials, which would cause a crash.
if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.databaseURL) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    rtdb = getDatabase(app);
  } catch (error) {
    console.error("Failed to initialize Firebase.", error);
    // Set to null if initialization fails
    app = null;
    db = null;
    auth = null;
    rtdb = null;
  }
} else if (process.env.NODE_ENV !== 'production') {
  // In development, it's helpful to show a warning if Firebase is not configured.
  console.warn(`
    ** FIREBASE IS NOT CONFIGURED **
    Your Firebase environment variables are not set. The app will run without 
    database, authentication, or presence features.
    
    To fix this, set up your .env.local file with the necessary Firebase credentials.
    See your project's Firebase console for details.
  `);
}


export { app, db, auth, rtdb };
