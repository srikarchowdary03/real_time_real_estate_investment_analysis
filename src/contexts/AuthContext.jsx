/**
 * @file Authentication context provider
 * @module contexts/AuthContext
 * @description Provides Firebase authentication state to the entire application.
 * Manages user authentication state and exposes current user information through
 * React Context. Automatically tracks authentication changes via Firebase listener.
 * 
 * @requires react
 * @requires firebase/auth
 * @requires ../firebase
 * 
 * @version 1.0.0
 */

// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Authentication context
 * 
 * Provides authentication state to all child components.
 * Contains current user and loading state.
 * 
 * @type {React.Context}
 */
const AuthContext = createContext();

/**
 * Custom authentication hook
 * 
 * Provides access to authentication context. Must be used within AuthProvider.
 * Returns current user and loading state from Firebase authentication.
 * 
 * @hook
 * @returns {Object} Authentication context value
 * @returns {Object|null} returns.currentUser - Current Firebase user object
 * @returns {string} returns.currentUser.uid - User unique identifier
 * @returns {string} returns.currentUser.email - User email address
 * @returns {string} returns.currentUser.displayName - User display name
 * @returns {string} returns.currentUser.photoURL - User profile photo URL
 * @returns {boolean} returns.loading - True while checking authentication state
 * @throws {Error} If used outside of AuthProvider
 * 
 * @example
 * function MyComponent() {
 *   const { currentUser, loading } = useAuth();
 *   
 *   if (loading) {
 *     return <div>Loading...</div>;
 *   }
 *   
 *   if (!currentUser) {
 *     return <div>Please sign in</div>;
 *   }
 *   
 *   return <div>Welcome {currentUser.displayName}!</div>;
 * }
 * 
 * @example
 * // Using in property operations
 * function SavePropertyButton({ property }) {
 *   const { currentUser } = useAuth();
 *   
 *   const handleSave = async () => {
 *     if (!currentUser) {
 *       alert('Please sign in to save properties');
 *       return;
 *     }
 *     await saveProperty(currentUser.uid, property);
 *   };
 *   
 *   return <button onClick={handleSave}>Save</button>;
 * }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication context to all child components.
 * Listens to Firebase authentication state changes and updates context automatically.
 * Displays children only after authentication state is loaded.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {React.ReactElement} Provider component
 * 
 * @example
 * // In App.jsx or main.jsx
 * import { AuthProvider } from './contexts/AuthContext';
 * 
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <YourAppComponents />
 *     </AuthProvider>
 *   );
 * }
 * 
 * @example
 * // Complete setup with router
 * <AuthProvider>
 *   <BrowserRouter>
 *     <Routes>
 *       <Route path="/" element={<Home />} />
 *       <Route path="/properties" element={<Properties />} />
 *     </Routes>
 *   </BrowserRouter>
 * </AuthProvider>
 */
export const AuthProvider = ({ children }) => {
    /**
   * Current authenticated user from Firebase
   * @type {Array}
   */
  const [currentUser, setCurrentUser] = useState(null);
   /**
   * Loading state while checking authentication
   * @type {Array}
   */
  const [loading, setLoading] = useState(true);

    /**
   * Set up Firebase authentication state listener
   * 
   * Subscribes to authentication state changes. Automatically updates
   * currentUser when user signs in, signs out, or token refreshes.
   * Cleans up listener on component unmount.
   * 
   * @listens firebase:onAuthStateChanged
   */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Context value object
   * 
   * @type {Object}
   * @property {Object|null} currentUser - Current Firebase user or null
   * @property {boolean} loading - True while verifying authentication state
   */
  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};