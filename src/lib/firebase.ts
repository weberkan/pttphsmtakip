
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

// This check is critical. If any of these are missing, Firebase will not initialize.
if (
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId &&
  firebaseConfig.databaseURL
) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    rtdb = getDatabase(app);
  } catch (error) {
    console.error("Firebase başlatılırken bir hata oluştu. Yapılandırmanızı kontrol edin.", error);
    app = null;
    db = null;
    auth = null;
    rtdb = null;
  }
} else {
  // Only show this detailed warning in development mode.
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`
      ********************************************************************************
      *** FIREBASE YAPILANDIRMASI EKSİK VEYA HATALI ***
      ********************************************************************************
      
      Uygulamanın veritabanına bağlanması için gereken bir veya daha fazla Firebase
      bilgisi eksik. Bu durum genellikle '.env.local' dosyasındaki bir hatadan
      veya sunucunun yeniden başlatılmamasından kaynaklanır.

      Lütfen kontrol edin:
      1. Proje ana dizininde '.env.local' dosyası var mı?
      2. Dosyanın içindeki TÜM 'NEXT_PUBLIC_FIREBASE_...' değişkenleri dolu ve doğru mu?
      3. DEĞİŞİKLİKTEN SONRA GELİŞTİRME SUNUCUSUNU DURDURUP YENİDEN BAŞLATTINIZ MI? (npm run dev)

      Bu sorun çözülene kadar kimlik doğrulama ve veritabanı özellikleri çalışmayacaktır.
      
      ********************************************************************************
    `);
  }
}

export { app, db, auth, rtdb };
