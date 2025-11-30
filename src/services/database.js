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

export const saveProperty = async (userId, propertyData, zillowData = {}, quickMetrics = {}) => {
  try {
    console.log('🔵 saveProperty called');
    console.log('  userId:', userId);
    console.log('  propertyId:', propertyData.property_id);
    
    if (!userId) throw new Error('User ID is required');
    if (!propertyData?.property_id) throw new Error('Property ID is required');

    const docId = `${userId}_${propertyData.property_id}`;
    const docRef = doc(db, COLLECTION_NAME, docId);

    const savedPropertyData = {
      userId: userId,
      propertyId: propertyData.property_id,
      
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

      rentEstimate: zillowData.rent || null,
      rentRangeLow: zillowData.rentRangeLow || null,
      rentRangeHigh: zillowData.rentRangeHigh || null,
      photos: zillowData.photos || [],
      taxAssessment: zillowData.taxAssessment || null,
      annualTaxAmount: zillowData.annualTaxAmount || null,

      quickScore: quickMetrics?.score || null,
      estimatedCashFlow: quickMetrics?.monthlyCashFlow || null,
      estimatedCapRate: quickMetrics?.capRate || null,
      estimatedROI: quickMetrics?.cocReturn || null,

      userInputs: null,
      fullCalculations: null,

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

export default {
  saveProperty,
  isPropertySaved,
  unsaveProperty,
  getSavedProperties
};