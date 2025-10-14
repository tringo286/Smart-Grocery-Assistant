// Import the functions and types you need from the SDKs
import { FirebaseApp, initializeApp } from "firebase/app";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBF8uLFQVNb_vU4a9jRjEx2eDa2K_qmZck",
  authDomain: "pantrypal-af9e6.firebaseapp.com",
  projectId: "pantrypal-af9e6",
  storageBucket: "pantrypal-af9e6.firebasestorage.app",
  messagingSenderId: "680391885089",
  appId: "1:680391885089:web:3920a713c2b02e646ebe60",
  measurementId: "G-WCYC6RPFMJ"
};

// Initialize Firebase
export const app: FirebaseApp = initializeApp(firebaseConfig);

// Lazy load analytics only on supported web environments
if (typeof window !== "undefined") {
  import("firebase/analytics").then(({ getAnalytics, isSupported }) => {
    isSupported().then((supported) => {
      if (supported) {
        try {
          getAnalytics(app);
        } catch (err) {
          // Optional: log error during dev
          // console.warn("Analytics init error:", err);
        }
      }
    });
  });
}
