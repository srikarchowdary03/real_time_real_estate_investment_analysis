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

// ✅ Use your ORIGINAL import path
import { db } from '../config/firebase';

const COLLECTION_NAME = 'savedProperties';

/**
 * Save a property to user's favorites
 */
export const saveProperty = async (userId, propertyData, zillowData = {}, quickMetrics = {}) => {
  try {
    console.log('🔵 saveProperty called');
    console.log('  userId:', userId);
    console.log('  propertyId:', propertyData.property_id);
    
    if (!userId) throw new Error('User ID is required');
    if (!propertyData?.property_id) throw new Error('Property ID is required');

    const docId = `${userId}_${propertyData.property_id}`;
    const docRef = doc(db, COLLECTION_NAME, docId);

    // Handle both raw API data (location.address) and normalized data (flat)
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
             propertyData.enrichedData?.rentEstimate ||
             null;
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

      rentEstimate: extractRentEstimate(),
      rentRangeLow: zillowData?.rentRangeLow || null,
      rentRangeHigh: zillowData?.rentRangeHigh || null,
      photos: zillowData?.photos || propertyData.photos || [],
      annualTaxAmount: zillowData?.annualTaxAmount || zillowData?.taxData?.annualAmount || null,

      quickScore: quickMetrics?.score || quickMetrics?.investmentScore || null,
      estimatedCashFlow: quickMetrics?.monthlyCashFlow || null,
      estimatedCapRate: quickMetrics?.capRate || null,
      investmentBadge: zillowData?.investmentBadge || quickMetrics?.badge || null,

      notes: '',
      tags: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, savedPropertyData);
    console.log('✅ Property saved:', docId);
    return docId;

  } catch (error) {
    console.error('❌ Save error:', error);
    throw error;
  }
};

export const isPropertySaved = async (userId, propertyId) => {
  try {
    if (!userId || !propertyId) return false;
    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking saved:', error);
    return false;
  }
};

export const unsaveProperty = async (userId, propertyId) => {
  try {
    if (!userId || !propertyId) throw new Error('User ID and Property ID required');
    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    await deleteDoc(docRef);
    console.log('✅ Property removed:', docId);
  } catch (error) {
    console.error('❌ Unsave error:', error);
    throw error;
  }
};

export const getSavedProperties = async (userId) => {
  try {
    if (!userId) throw new Error('User ID required');
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
    console.error('❌ Get saved error:', error);
    throw error;
  }
};

export const updateSavedProperty = async (userId, propertyId, updates) => {
  try {
    if (!userId || !propertyId) throw new Error('User ID and Property ID required');
    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
    console.log('✅ Property updated:', docId);
  } catch (error) {
    console.error('❌ Update error:', error);
    throw error;
  }
};

export const getSavedProperty = async (userId, propertyId) => {
  try {
    if (!userId || !propertyId) return null;
    const docId = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Get property error:', error);
    return null;
  }
};

export default {
  saveProperty,
  isPropertySaved,
  unsaveProperty,
  getSavedProperties,
  updateSavedProperty,
  getSavedProperty
};