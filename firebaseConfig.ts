// Import the functions and types you need from the SDKs
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { initializeAuth, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration (replace with your own project’s credentials)
const firebaseConfig = {
  apiKey: "AIzaSyBF8uLFQVNb_vU4a9jRjEx2eDa2K_qmZck",
  authDomain: "pantrypal-af9e6.firebaseapp.com",
  projectId: "pantrypal-af9e6",
  storageBucket: "pantrypal-af9e6.firebasestorage.app",
  messagingSenderId: "680391885089",
  appId: "1:680391885089:web:3920a713c2b02e646ebe60",
  measurementId: "G-WCYC6RPFMJ",
};

// Guard initialization to prevent reloading issues (common in Expo)
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with in-memory persistence (no session persistence)
const auth = initializeAuth(app, {
  persistence: inMemoryPersistence,
});

// Initialize Firestore
const firestore = getFirestore(app);

// Lazy-load Analytics for supported web environments
if (typeof window !== "undefined") {
  import("firebase/analytics").then(({ getAnalytics, isSupported }) => {
    isSupported().then((supported) => {
      if (supported) {
        try {
          getAnalytics(app);
        } catch (err) {
          // Optional: handle analytics errors
          // console.warn("Analytics initialization failed:", err);
        }
      }
    });
  });
}

// Export initialized modules for use in your app
export { app, auth, firestore };
