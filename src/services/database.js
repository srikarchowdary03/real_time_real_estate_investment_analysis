/**
 * database.js - Firebase Database Service
 * 
 * COMPLETE VERSION with all exports needed by:
 * - propertycard.jsx
 * - ExpandedPropertyView.jsx
 * - useSavedProperties.js
 * - PropertyAnalysisPage.jsx
 * - Databasetest.jsx
 * - PropertyDetails.jsx
 * - MyProperties.jsx
 */
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

// Adjust this import path to match your project structure
import { db } from '../config/firebase';

const COLLECTION_NAME = 'savedProperties';

/**
 * Save a property to user's favorites
 */
export const saveProperty = async (userId, propertyData, zillowData = {}, quickMetrics = {}) => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid User ID is required');
    }
    if (!propertyData?.property_id) {
      throw new Error('Property ID is required');
    }

    console.log('🔵 saveProperty called');
    console.log('  userId:', userId);
    console.log('  propertyId:', propertyData.property_id);

    const docId = `${userId}_${propertyData.property_id}`;
    const docRef = doc(db, COLLECTION_NAME, docId);

    const extractAddress = () => {
      if (propertyData.location?.address?.line) return propertyData.location.address.line;
      return propertyData.address || '';
    };

    const extractCity = () => {
      if (propertyData.location?.address?.city) return propertyData.location.address.city;
      return propertyData.city || '';
    };

    const extractState = () => {
      if (propertyData.location?.address?.state_code) return propertyData.location.address.state_code;
      return propertyData.state || '';
    };

    const extractZip = () => {
      if (propertyData.location?.address?.postal_code) return propertyData.location.address.postal_code;
      return propertyData.zipCode || propertyData.zip || '';
    };

    const extractPrice = () => propertyData.list_price || propertyData.price || 0;
    const extractBeds = () => propertyData.description?.beds || propertyData.beds || 0;
    const extractBaths = () => propertyData.description?.baths || propertyData.baths || 0;
    const extractSqft = () => propertyData.description?.sqft || propertyData.sqft || 0;

    const extractRentEstimate = () => {
      return zillowData?.rentEstimate || 
             zillowData?.rent || 
             propertyData.rentEstimate ||
             propertyData.totalMonthlyRent ||
             propertyData.rentCastData?.rentEstimate ||
             propertyData.enrichedData?.rentEstimate ||
             null;
    };

    // Extract thumbnail from multiple possible sources
    const extractThumbnail = () => {
      return propertyData.thumbnail ||
             propertyData.primary_photo?.href ||
             propertyData.primaryPhoto ||
             propertyData.photos?.[0]?.href ||
             propertyData.photos?.[0] ||
             zillowData?.photos?.[0]?.href ||
             zillowData?.photos?.[0] ||
             zillowData?.thumbnail ||
             '';
    };

    // Extract photos array
    const extractPhotos = () => {
      if (propertyData.photos?.length > 0) {
        return propertyData.photos;
      }
      if (zillowData?.photos?.length > 0) {
        return zillowData.photos;
      }
      return [];
    };

    const savedPropertyData = {
      userId,
      propertyId: propertyData.property_id,
      
      propertyData: {
        address: extractAddress(),
        city: extractCity(),
        state: extractState(),
        zipCode: extractZip(),
        price: extractPrice(),
        beds: extractBeds(),
        baths: extractBaths(),
        sqft: extractSqft(),
      },

      // THUMBNAIL - critical for My Properties page display
      thumbnail: extractThumbnail(),
      
      // Photos array
      photos: extractPhotos(),

      // Rent data
      rentEstimate: extractRentEstimate(),
      rentRangeLow: zillowData?.rentRangeLow || propertyData.rentRangeLow || null,
      rentRangeHigh: zillowData?.rentRangeHigh || propertyData.rentRangeHigh || null,
      
      // RentCast data (if available)
      rentCastData: propertyData.rentCastData || zillowData?.rentCastData || null,
      
      // Tax data
      annualTaxAmount: zillowData?.annualTaxAmount || zillowData?.taxData?.annualAmount || propertyData.annualTaxAmount || null,
      
      // Multi-family info
      unitCount: propertyData.unitCount || propertyData.detectedUnits || propertyData.units || 1,
      isMultiFamily: propertyData.isMultiFamily || (propertyData.unitCount > 1) || (propertyData.detectedUnits > 1) || false,

      // Investment metrics
      quickScore: quickMetrics?.score || quickMetrics?.investmentScore || propertyData.metrics?.score || null,
      estimatedCashFlow: quickMetrics?.monthlyCashFlow || propertyData.metrics?.monthlyCashFlow || null,
      estimatedCapRate: quickMetrics?.capRate || propertyData.metrics?.capRate || null,
      investmentBadge: zillowData?.investmentBadge || quickMetrics?.badge || propertyData.badge || null,

      // User data
      notes: '',
      tags: [],
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, savedPropertyData);
    console.log('✅ Property saved:', docId);
    console.log('  thumbnail:', savedPropertyData.thumbnail ? 'Yes' : 'No');
    return docId;

  } catch (error) {
    console.error('❌ Save error:', error);
    throw error;
  }
};

/**
 * Check if property is saved
 */
export const isPropertySaved = async (userId, propertyId) => {
  try {
    if (!userId || typeof userId !== 'string' || !propertyId) {
      return false;
    }
    
    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    if (error.code !== 'permission-denied') {
      console.error('Error checking saved:', error);
    }
    return false;
  }
};

/**
 * Remove property from saved
 */
export const unsaveProperty = async (userId, propertyId) => {
  try {
    if (!userId || typeof userId !== 'string' || !propertyId) {
      throw new Error('Valid User ID and Property ID required');
    }
    
    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    await deleteDoc(docRef);
    console.log('✅ Property removed:', docId);
  } catch (error) {
    console.error('❌ Unsave error:', error);
    throw error;
  }
};

/**
 * Get all saved properties for user
 */
export const getSavedProperties = async (userId) => {
  try {
    if (!userId || typeof userId !== 'string') {
      return [];
    }
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const properties = [];
    querySnapshot.forEach((doc) => {
      properties.push({ id: doc.id, ...doc.data() });
    });
    console.log(`✅ Got ${properties.length} saved properties`);
    return properties;
  } catch (error) {
    if (error.code === 'permission-denied') {
      return [];
    }
    console.error('❌ Get saved error:', error);
    throw error;
  }
};

/**
 * Get a single saved property
 */
export const getSavedProperty = async (userId, propertyId) => {
  try {
    if (!userId || typeof userId !== 'string' || !propertyId) {
      return null;
    }
    
    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    if (error.code === 'permission-denied') {
      return null;
    }
    console.error('❌ Get property error:', error);
    return null;
  }
};

/**
 * Update a saved property (general)
 */
export const updateSavedProperty = async (userId, propertyId, updates) => {
  try {
    if (!userId || typeof userId !== 'string' || !propertyId) {
      throw new Error('Valid User ID and Property ID required');
    }
    
    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
    console.log('✅ Property updated:', docId);
  } catch (error) {
    console.error('❌ Update error:', error);
    throw error;
  }
};

/**
 * Update property with rent data from RentCast
 */
export const updatePropertyWithRentData = async (userId, propertyId, rentData) => {
  try {
    if (!userId || typeof userId !== 'string' || !propertyId) {
      return false;
    }
    
    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    
    const updates = {
      rentEstimate: rentData.totalMonthlyRent || rentData.rentEstimate || null,
      rentRangeLow: rentData.rentRangeLow || null,
      rentRangeHigh: rentData.rentRangeHigh || null,
      unitCount: rentData.unitCount || 1,
      isMultiFamily: rentData.isMultiFamily || (rentData.unitCount > 1),
      rentCastData: rentData,
      rentSource: 'RentCast',
      rentDataUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updates);
    console.log('✅ Property updated with rent data:', docId);
    return true;
  } catch (error) {
    if (error.code === 'permission-denied') {
      return false;
    }
    console.error('❌ Update rent data error:', error);
    return false;
  }
};

/**
 * Update property analysis/metrics
 */
export const updatePropertyAnalysis = async (userId, propertyId, analysis) => {
  try {
    if (!userId || typeof userId !== 'string' || !propertyId) {
      throw new Error('Valid User ID and Property ID required');
    }
    
    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    
    const updates = {
      analysis: analysis,
      quickScore: analysis?.score || analysis?.investmentScore || null,
      estimatedCashFlow: analysis?.monthlyCashFlow || null,
      estimatedCapRate: analysis?.capRate || null,
      analysisUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updates);
    console.log('✅ Property analysis updated:', docId);
  } catch (error) {
    console.error('❌ Update analysis error:', error);
    throw error;
  }
};

/**
 * Update property notes
 */
export const updatePropertyNotes = async (userId, propertyId, notes) => {
  try {
    if (!userId || typeof userId !== 'string' || !propertyId) {
      throw new Error('Valid User ID and Property ID required');
    }
    
    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    
    await updateDoc(docRef, { 
      notes: notes,
      updatedAt: serverTimestamp() 
    });
    console.log('✅ Property notes updated:', docId);
  } catch (error) {
    console.error('❌ Update notes error:', error);
    throw error;
  }
};

/**
 * Update property tags
 */
export const updatePropertyTags = async (userId, propertyId, tags) => {
  try {
    if (!userId || typeof userId !== 'string' || !propertyId) {
      throw new Error('Valid User ID and Property ID required');
    }
    
    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    
    await updateDoc(docRef, { 
      tags: tags,
      updatedAt: serverTimestamp() 
    });
    console.log('✅ Property tags updated:', docId);
  } catch (error) {
    console.error('❌ Update tags error:', error);
    throw error;
  }
};

/**
 * Update property thumbnail (for fixing missing thumbnails)
 */
export const updatePropertyThumbnail = async (userId, propertyId, thumbnailUrl) => {
  try {
    if (!userId || typeof userId !== 'string' || !propertyId) {
      throw new Error('Valid User ID and Property ID required');
    }
    
    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    
    await updateDoc(docRef, { 
      thumbnail: thumbnailUrl,
      updatedAt: serverTimestamp() 
    });
    console.log('✅ Property thumbnail updated:', docId);
  } catch (error) {
    console.error('❌ Update thumbnail error:', error);
    throw error;
  }
};

export default {
  saveProperty,
  isPropertySaved,
  unsaveProperty,
  getSavedProperties,
  getSavedProperty,
  updateSavedProperty,
  updatePropertyWithRentData,
  updatePropertyAnalysis,
  updatePropertyNotes,
  updatePropertyTags,
  updatePropertyThumbnail
};