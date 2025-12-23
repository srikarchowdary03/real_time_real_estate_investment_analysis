/**
 * @file Firebase configuration and initialization
 * @module config/firebase
 * @description Initializes Firebase app and exports auth and Firestore instances.
 * Handles singleton pattern to prevent multiple Firebase initializations.
 * Configuration values are loaded from environment variables.
 * 
 * @requires firebase/app
 * @requires firebase/auth
 * @requires firebase/firestore
 * @see {@link https://firebase.google.com/docs Firebase Documentation}
 * 
 * @version 1.0.0
 */

// src/firebase.js (or src/config/firebase.js)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase configuration object
 * 
 * Configuration loaded from environment variables. All values must be
 * prefixed with VITE_ to be accessible in Vite applications.
 * 
 * @constant {Object}
 * @private
 * @property {string} apiKey - Firebase API key
 * @property {string} authDomain - Firebase auth domain
 * @property {string} projectId - Firebase project ID
 * @property {string} storageBucket - Firebase storage bucket
 * @property {string} messagingSenderId - Firebase messaging sender ID
 * @property {string} appId - Firebase app ID
 */

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

/**
 * Initialize Firebase app
 * 
 * Uses singleton pattern to prevent multiple initializations. Checks if
 * Firebase app is already initialized before creating new instance.
 * 
 * @constant {FirebaseApp}
 */
// Initialize Firebase - only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Firebase Authentication instance
 * 
 * Used for all authentication operations including sign in, sign out,
 * and user state management.
 * 
 * @constant {Auth}
 * @example
 * import { auth } from './firebase';
 * const user = auth.currentUser;
 */
// Initialize Firebase services
export const auth = getAuth(app);
/**
 * Firebase Firestore database instance
 * 
 * Used for all database operations including reading and writing
 * property data, user profiles, and saved properties.
 * 
 * @constant {Firestore}
 * @example
 * import { db } from './firebase';
 * const docRef = doc(db, 'savedProperties', docId);
 */
export const db = getFirestore(app);

/**
 * Firebase app instance
 * 
 * @type {FirebaseApp}
 */
export default app;