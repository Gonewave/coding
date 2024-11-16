// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Add this import for Firebase Authentication

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCeJ_fiwMbHoJK0f2vkiPNLsLwTfN8jgSs",
  authDomain: "coding-d8704.firebaseapp.com",
  projectId: "coding-d8704",
  storageBucket: "coding-d8704.appspot.com", // Corrected the storage bucket URL
  messagingSenderId: "519089826602",
  appId: "1:519089826602:web:0f69b112d7b978c2564c53",
  measurementId: "G-N5M9T4SPPF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (if supported)
let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Initialize Firestore and Authentication
export const db = getFirestore(app);
export const auth = getAuth(app); // Export Firebase Auth for use in your app
