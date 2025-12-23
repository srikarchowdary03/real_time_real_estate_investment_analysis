/**
 * @file Custom hook for managing saved properties
 * @module hooks/useSavedProperties
 * @description React hook that provides complete saved properties management including
 * loading, adding, removing, and updating saved properties in Firebase. Encapsulates
 * all Firestore operations for user's property portfolio with automatic reloading,
 * error handling, and loading states.
 * 
 * Features:
 * - Auto-loads saved properties when user authenticates
 * - Add/remove properties from collection
 * - Update analysis results, notes, and tags
 * - Check if specific property is saved
 * - Manual refresh capability
 * - Comprehensive error handling
 * - Loading states for all operations
 * 
 * Used by: MyProperties page, PropertyCard, PropertyAnalysisPage, and other components
 * that need to manage user's saved property portfolio.
 * 
 * @requires react
 * @requires ./useAuth
 * @requires ../services/database
 * 
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth'; // Assuming you have an auth hook
import {
  saveProperty,
  getSavedProperties,
  getSavedProperty,
  unsaveProperty,
  updatePropertyAnalysis,
  updatePropertyNotes,
  updatePropertyTags,
  isPropertySaved
} from '../services/database';


/**
 * Custom hook for managing user's saved properties
 * 
 * Provides comprehensive property portfolio management with Firebase integration.
 * Automatically loads saved properties when user authenticates and provides
 * methods for all CRUD operations.
 * 
 * AUTOMATIC BEHAVIORS:
 * - Loads all saved properties when user signs in
 * - Reloads list after add/remove/update operations
 * - Clears list when user signs out
 * - Handles errors and loading states automatically
 * 
 * ERROR HANDLING:
 * - All operations wrapped in try/catch
 * - Errors stored in error state
 * - Error messages logged to console
 * - Errors thrown for external handling when appropriate
 * 
 * @hook
 * @returns {Object} Saved properties state and methods
 * @returns {Array<Object>} returns.savedProperties - Array of saved property objects
 * @returns {Object} returns.savedProperties[].propertyData - Property details
 * @returns {number} returns.savedProperties[].quickScore - Investment score
 * @returns {Object} returns.savedProperties[].analysis - Saved analysis results
 * @returns {string} returns.savedProperties[].notes - User notes
 * @returns {Array<string>} returns.savedProperties[].tags - User tags
 * @returns {boolean} returns.loading - True during any operation
 * @returns {string|null} returns.error - Error message if operation failed
 * @returns {Function} returns.addProperty - Add property to collection
 * @returns {Function} returns.removeProperty - Remove property from collection
 * @returns {Function} returns.updateAnalysis - Update analysis results
 * @returns {Function} returns.updateNotes - Update property notes
 * @returns {Function} returns.updateTags - Update property tags
 * @returns {Function} returns.checkIfSaved - Check if property is saved
 * @returns {Function} returns.refreshProperties - Manually reload all properties
 * 
 * @example
 * function MyPropertiesPage() {
 *   const {
 *     savedProperties,
 *     loading,
 *     error,
 *     addProperty,
 *     removeProperty,
 *     updateNotes
 *   } = useSavedProperties();
 *   
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *   
 *   return (
 *     <div>
 *       <h1>My Properties ({savedProperties.length})</h1>
 *       {savedProperties.map(prop => (
 *         <PropertyCard
 *           key={prop.id}
 *           property={prop}
 *           onRemove={() => removeProperty(prop.propertyId)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * @example
 * // Save property with metrics
 * const { addProperty } = useSavedProperties();
 * 
 * await addProperty(
 *   propertyData,
 *   rentCastData,
 *   { score: 75, monthlyCashFlow: 450, capRate: 7.2 }
 * );
 */
export const useSavedProperties = () => {
    /**
   * Current authenticated user from auth context
   * @type {Object|null}
   */
  const { user } = useAuth(); // Get current user from auth context
  /**
   * Array of all saved properties for current user
   * Loaded from Firebase and refreshed after operations
   */
  const [savedProperties, setSavedProperties] = useState([]);
   /**
   * Loading state for any operation (load, add, remove, update)
   */
  const [loading, setLoading] = useState(false);
    /**
   * Error message from last failed operation
   */
  const [error, setError] = useState(null);

    /**
   * Load all saved properties when user authenticates
   * 
   * Automatically triggers when user signs in. Fetches complete list of
   * saved properties from Firebase and updates state.
   * 
   * Runs when: user.uid changes (sign in/out)
   * 
   * @listens user.uid
   */
  useEffect(() => {
    if (user?.uid) {
      loadSavedProperties();
    }
  }, [user?.uid]);

  /**
   * Load all saved properties from Firebase
   * 
   * Fetches user's complete saved property portfolio from Firestore.
   * Updates savedProperties state with results. Called automatically
   * on mount and after add/remove/update operations.
   * 
   * @async
   * @function
   * @returns {Promise<void>}
   * 
   * @example
   * await loadSavedProperties();
   * // savedProperties state now contains all user's properties
   */
  const loadSavedProperties = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const properties = await getSavedProperties(user.uid);
      setSavedProperties(properties);
    } catch (err) {
      console.error('Error loading saved properties:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add property to saved collection
   * 
   * Saves property to Firebase with optional rent data and quick metrics.
   * Automatically reloads property list after successful save.
   * 
   * @async
   * @function
   * @param {Object} propertyData - Property data to save (required)
   * @param {string} propertyData.property_id - Unique property ID (required)
   * @param {string} propertyData.address - Property address
   * @param {number} propertyData.price - Property price
   * @param {Object} [zillowData={}] - Enrichment data (RentCast, Zillow, etc.)
   * @param {number} [zillowData.rentEstimate] - Rent estimate
   * @param {number} [zillowData.unitCount] - Number of units
   * @param {Object} [quickMetrics={}] - Investment metrics
   * @param {number} [quickMetrics.score] - Investment score 0-100
   * @param {number} [quickMetrics.monthlyCashFlow] - Monthly cash flow
   * @param {number} [quickMetrics.capRate] - Cap rate percentage
   * @returns {Promise<string>} Document ID of saved property
   * @throws {Error} If user not logged in
   * @throws {Error} If save operation fails
   * 
   * @example
   * const docId = await addProperty(
   *   { property_id: 'M123', address: '123 Main St', price: 250000 },
   *   { rentEstimate: 2000, unitCount: 1 },
   *   { score: 75, monthlyCashFlow: 450, capRate: 7.2 }
   * );
   * console.log('Saved as:', docId);
   */
  const addProperty = async (propertyData, zillowData, quickMetrics) => {
    if (!user?.uid) {
      throw new Error('User must be logged in');
    }

    setLoading(true);
    setError(null);

    try {
      const docId = await saveProperty(user.uid, propertyData, zillowData, quickMetrics);
      await loadSavedProperties(); // Reload list
      return docId;
    } catch (err) {
      console.error('Error saving property:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove property from saved collection
   * 
   * Deletes property from Firebase and automatically reloads the property list.
   * Permanently removes property and all associated data (notes, tags, analysis).
   * 
   * @async
   * @function
   * @param {string} propertyId - Property ID to remove
   * @returns {Promise<void>}
   * @throws {Error} If user not logged in
   * @throws {Error} If delete operation fails
   * 
   * @example
   * await removeProperty('M123456789');
   * // Property removed from Firebase
   * // savedProperties list automatically refreshed
   */
  const removeProperty = async (propertyId) => {
    if (!user?.uid) {
      throw new Error('User must be logged in');
    }

    setLoading(true);
    setError(null);

    try {
      await unsaveProperty(user.uid, propertyId);
      await loadSavedProperties(); // Reload list
    } catch (err) {
      console.error('Error removing property:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update property analysis results
   * 
   * Saves complete investment analysis to Firebase. Stores both user inputs
   * and full calculation results for later retrieval. Automatically reloads
   * property list to reflect updated analysis.
   * 
   * @async
   * @function
   * @param {string} propertyId - Property ID to update
   * @param {Object} userInputs - User's calculation inputs
   * @param {number} userInputs.offerPrice - Offer price
   * @param {number} userInputs.repairs - Repair costs
   * @param {number} userInputs.grossRents - Annual gross rents
   * @param {Object} fullCalculations - Complete analysis from calculator
   * @param {Object} fullCalculations.quickAnalysis - Investment ratios
   * @param {Object} fullCalculations.cashflow - Cash flow details
   * @param {Object} fullCalculations.investmentScore - Investment score
   * @returns {Promise<void>}
   * @throws {Error} If user not logged in
   * 
   * @example
   * const analysis = calculator.getCompleteAnalysis();
   * await updateAnalysis(propertyId, inputs, analysis);
   * // Analysis saved to Firebase
   * // Property list refreshed with new score
   */
  const updateAnalysis = async (propertyId, userInputs, fullCalculations) => {
    if (!user?.uid) {
      throw new Error('User must be logged in');
    }

    setLoading(true);
    setError(null);

    try {
      await updatePropertyAnalysis(user.uid, propertyId, userInputs, fullCalculations);
      await loadSavedProperties(); // Reload list
    } catch (err) {
      console.error('Error updating analysis:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update property notes
   * 
   * Updates user's personal notes for a property. Notes are freeform text
   * for user's reference. Automatically reloads property list.
   * 
   * @async
   * @function
   * @param {string} propertyId - Property ID to update
   * @param {string} notes - Notes text
   * @returns {Promise<void>}
   * @throws {Error} If user not logged in
   * 
   * @example
   * await updateNotes('M123456789', 
   *   'Great location near schools. Roof needs replacement in 2-3 years.'
   * );
   */
  const updateNotes = async (propertyId, notes) => {
    if (!user?.uid) {
      throw new Error('User must be logged in');
    }

    try {
      await updatePropertyNotes(user.uid, propertyId, notes);
      await loadSavedProperties(); // Reload list
    } catch (err) {
      console.error('Error updating notes:', err);
      setError(err.message);
      throw err;
    }
  };

   /**
   * Update property tags
   * 
   * Updates custom tags for organizing properties. Tags are arrays of strings
   * for categorization (e.g., ['favorite', 'duplex', 'needs-work']).
   * Automatically reloads property list.
   * 
   * @async
   * @function
   * @param {string} propertyId - Property ID to update
   * @param {Array<string>} tags - Array of tag strings
   * @returns {Promise<void>}
   * @throws {Error} If user not logged in
   * 
   * @example
   * await updateTags('M123456789', ['favorite', 'multi-family', 'high-roi']);
   * // Tags saved to Firebase
   * // Property list refreshed to show new tags
   */
  const updateTags = async (propertyId, tags) => {
    if (!user?.uid) {
      throw new Error('User must be logged in');
    }

    try {
      await updatePropertyTags(user.uid, propertyId, tags);
      await loadSavedProperties(); // Reload list
    } catch (err) {
      console.error('Error updating tags:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Check if property is saved by user
   * 
   * Checks Firebase to see if specific property exists in user's collection.
   * Returns false if user not logged in (doesn't throw error).
   * 
   * @async
   * @function
   * @param {string} propertyId - Property ID to check
   * @returns {Promise<boolean>} True if property is saved, false otherwise
   * 
   * @example
   * const saved = await checkIfSaved('M123456789');
   * if (saved) {
   *   showSavedIndicator();
   * } else {
   *   showSaveButton();
   * }
   */
  const checkIfSaved = async (propertyId) => {
    if (!user?.uid) return false;

    try {
      return await isPropertySaved(user.uid, propertyId);
    } catch (err) {
      console.error('Error checking if saved:', err);
      return false;
    }
  };

  return {
    savedProperties,
    loading,
    error,
    addProperty,
    removeProperty,
    updateAnalysis,
    updateNotes,
    updateTags,
    checkIfSaved,
    refreshProperties: loadSavedProperties
  };
};

export default useSavedProperties;