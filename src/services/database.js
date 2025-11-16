import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'savedProperties';

/**
 * Save a property to user's portfolio
 * @param {string} userId - User ID from Firebase Auth
 * @param {object} propertyData - Property data from Realty API
 * @param {object} zillowData - Rent estimate data from Zillow API
 * @param {object} quickMetrics - Quick analysis metrics
 * @returns {Promise<string>} Document ID
 */
export const saveProperty = async (userId, propertyData, zillowData = {}, quickMetrics = {}) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!propertyData?.property_id) {
      throw new Error('Property ID is required');
    }

    const docId = `${userId}_${propertyData.property_id}`;
    const docRef = doc(db, COLLECTION_NAME, docId);

    const savedPropertyData = {
      userId: userId,
      propertyId: propertyData.property_id,
      
      // Property data from Realty API
      propertyData: {
        address: propertyData.location?.address?.line || '',
        city: propertyData.location?.address?.city || '',
        state: propertyData.location?.address?.state_code || '',
        zipCode: propertyData.location?.address?.postal_code || '',
        price: propertyData.list_price || 0,
        beds: propertyData.description?.beds || 0,
        baths: propertyData.description?.baths || 0,
        sqft: propertyData.description?.sqft || 0,
        propertyType: propertyData.description?.type || '',
        yearBuilt: propertyData.description?.year_built || null,
        lotSize: propertyData.description?.lot_sqft || null,
        photos: propertyData.photos || [],
        primaryPhoto: propertyData.primary_photo?.href || null,
      },

      // Zillow rent data
      rentEstimate: zillowData.rent || null,
      rentRangeLow: zillowData.rentRangeLow || null,
      rentRangeHigh: zillowData.rentRangeHigh || null,
      photos: zillowData.photos || [],
      taxAssessment: zillowData.taxAssessment || null,
      annualTaxAmount: zillowData.annualTaxAmount || null,

      // Quick metrics
      quickScore: quickMetrics.score || null,
      estimatedCashFlow: quickMetrics.cashFlow || null,
      estimatedCapRate: quickMetrics.capRate || null,
      estimatedROI: quickMetrics.roi || null,

      // User inputs and calculations (initially null)
      userInputs: null,
      fullCalculations: null,

      // Metadata
      notes: '',
      tags: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, savedPropertyData);
    console.log('✅ Property saved:', docId);
    return docId;

  } catch (error) {
    console.error('❌ Error saving property:', error);
    throw error;
  }
};

/**
 * Get all saved properties for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of saved properties
 */
export const getSavedProperties = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const properties = [];

    querySnapshot.forEach((doc) => {
      properties.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Retrieved ${properties.length} saved properties`);
    return properties;

  } catch (error) {
    console.error('❌ Error getting saved properties:', error);
    throw error;
  }
};

/**
 * Get a single saved property
 * @param {string} userId - User ID
 * @param {string} propertyId - Property ID
 * @returns {Promise<object|null>} Property data or null if not found
 */
export const getSavedProperty = async (userId, propertyId) => {
  try {
    if (!userId || !propertyId) {
      throw new Error('User ID and Property ID are required');
    }

    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log('✅ Property found:', docId);
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      console.log('⚠️ Property not found:', docId);
      return null;
    }

  } catch (error) {
    console.error('❌ Error getting saved property:', error);
    throw error;
  }
};

/**
 * Remove a property from user's saved properties
 * @param {string} userId - User ID
 * @param {string} propertyId - Property ID
 * @returns {Promise<void>}
 */
export const unsaveProperty = async (userId, propertyId) => {
  try {
    if (!userId || !propertyId) {
      throw new Error('User ID and Property ID are required');
    }

    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);

    await deleteDoc(docRef);
    console.log('✅ Property removed:', docId);

  } catch (error) {
    console.error('❌ Error removing property:', error);
    throw error;
  }
};

/**
 * Update property analysis with user inputs and calculations
 * @param {string} userId - User ID
 * @param {string} propertyId - Property ID
 * @param {object} userInputs - All 67+ calculator field inputs
 * @param {object} fullCalculations - All calculated metrics
 * @returns {Promise<void>}
 */
export const updatePropertyAnalysis = async (userId, propertyId, userInputs = {}, fullCalculations = {}) => {
  try {
    if (!userId || !propertyId) {
      throw new Error('User ID and Property ID are required');
    }

    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);

    await updateDoc(docRef, {
      userInputs: userInputs,
      fullCalculations: fullCalculations,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Property analysis updated:', docId);

  } catch (error) {
    console.error('❌ Error updating property analysis:', error);
    throw error;
  }
};

/**
 * Update property notes
 * @param {string} userId - User ID
 * @param {string} propertyId - Property ID
 * @param {string} notes - User notes
 * @returns {Promise<void>}
 */
export const updatePropertyNotes = async (userId, propertyId, notes) => {
  try {
    if (!userId || !propertyId) {
      throw new Error('User ID and Property ID are required');
    }

    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);

    await updateDoc(docRef, {
      notes: notes,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Property notes updated:', docId);

  } catch (error) {
    console.error('❌ Error updating notes:', error);
    throw error;
  }
};

/**
 * Update property tags
 * @param {string} userId - User ID
 * @param {string} propertyId - Property ID
 * @param {Array<string>} tags - Array of tags
 * @returns {Promise<void>}
 */
export const updatePropertyTags = async (userId, propertyId, tags) => {
  try {
    if (!userId || !propertyId) {
      throw new Error('User ID and Property ID are required');
    }

    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);

    await updateDoc(docRef, {
      tags: tags || [],
      updatedAt: serverTimestamp()
    });

    console.log('✅ Property tags updated:', docId);

  } catch (error) {
    console.error('❌ Error updating tags:', error);
    throw error;
  }
};

/**
 * Check if a property is saved
 * @param {string} userId - User ID
 * @param {string} propertyId - Property ID
 * @returns {Promise<boolean>} True if saved
 */
export const isPropertySaved = async (userId, propertyId) => {
  try {
    if (!userId || !propertyId) {
      return false;
    }

    const property = await getSavedProperty(userId, propertyId);
    return property !== null;

  } catch (error) {
    console.error('❌ Error checking if property is saved:', error);
    return false;
  }
};

// Export all functions
export default {
  saveProperty,
  getSavedProperties,
  getSavedProperty,
  unsaveProperty,
  updatePropertyAnalysis,
  updatePropertyNotes,
  updatePropertyTags,
  isPropertySaved
};