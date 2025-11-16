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
 * React Hook for managing saved properties
 */
export const useSavedProperties = () => {
  const { user } = useAuth(); // Get current user from auth context
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all saved properties on mount
  useEffect(() => {
    if (user?.uid) {
      loadSavedProperties();
    }
  }, [user?.uid]);

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