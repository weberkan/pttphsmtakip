
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// This check prevents Firebase from trying to initialize on the server
// without credentials, which would cause a crash.
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Failed to initialize Firebase.", error);
    // Set to null if initialization fails
    app = null;
    db = null;
    auth = null;
  }
} else {
  console.error(`
    ********************************************************************************
    *** FIREBASE IS NOT CONFIGURED ***
    ********************************************************************************
    
    Firebase credentials are not available in your environment.
    
    To fix this:
    
    1. LOCAL DEVELOPMENT:
       - Make sure you have a '.env.local' file in the root of your project.
       - Copy the contents of '.env.local.example' into it.
       - Fill it with your actual Firebase project credentials.
       - Restart your development server.
    
    2. DEPLOYMENT (Vercel, etc.):
       - Go to your hosting provider's dashboard (e.g., Vercel).
       - Navigate to your project's 'Settings' > 'Environment Variables'.
       - Add all the variables from '.env.local.example' there.
       - Redeploy your application.
    
    The app will not have database or authentication functionality until this is resolved.
    
    ********************************************************************************
  `);
}


export { app, db, auth };
