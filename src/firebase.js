// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_API_KEY,
//   authDomain: import.meta.env.VITE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_APP_ID
// };
const firebaseConfig = { 
    apiKey: "AIzaSyBxx0gIUkMWKMIzXgL4-RuYS7mDqr8Uw6I", 
    authDomain: "real-estate-analyzer-6d6de.firebaseapp.com", 
    projectId: "real-estate-analyzer-6d6de", 
    storageBucket: "real-estate-analyzer-6d6de.firebasestorage.app", 
    messagingSenderId: "213811336331", 
    appId: "1:213811336331:web:c8a2c320aae523dd02308e", 
    measurementId: "G-01EH20LLRY" };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth
export const auth = getAuth(app);
