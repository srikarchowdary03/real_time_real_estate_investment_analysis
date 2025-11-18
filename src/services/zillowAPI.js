import axios from 'axios';

const RAPIDAPI_KEY = import.meta.env.VITE_ZILLOW_API_KEY;
const RAPIDAPI_HOST = 'real-time-zillow-data.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

// Cache
const responseCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000;

// Request queue
const requestQueue = [];
let isProcessingQueue = false;
const MIN_REQUEST_INTERVAL = 5000;
let lastRequestTime = 0;

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const { resolve, reject, fetchFn } = requestQueue.shift();
    
    try {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`⏱️ Queue waiting ${waitTime}ms...`);
        await new Promise(r => setTimeout(r, waitTime));
      }
      
      lastRequestTime = Date.now();
      const result = await fetchFn();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }
  
  isProcessingQueue = false;
}

function queueRequest(fetchFn) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, fetchFn });
    processQueue();
  });
}

const getConfig = () => ({
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST
  }
});

const getCacheKey = (address, city, state, zipCode) => {
  return `${address}_${city}_${state}_${zipCode}`.toLowerCase().replace(/\s+/g, '_');
};

const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  return (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// ============================================================================
// STEP 1: SEARCH FOR PROPERTY (Get ZPID)
// ============================================================================

async function searchPropertyByAddress(address, city, state, zipCode) {
  try {
    // Clean the address - remove unit numbers for search
    const cleanAddress = address
      .replace(/\s+(Apt|Unit|#)\s+[A-Z0-9]+/gi, '') // Remove "Apt A", "Unit 308", etc.
      .replace(/\s+-\d+/, '') // Remove "-604" from "602-604"
      .trim();
    
    const searchQuery = `${cleanAddress}, ${city}, ${state} ${zipCode}`;
    
    console.log('🔍 Searching for:', searchQuery);
    
    // Use the SEARCH endpoint (not property endpoint)
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        location: searchQuery,
        status: 'forSale' // or 'forRent'
      },
      ...getConfig()
    });

    const results = response.data?.results || [];
    
    if (results.length === 0) {
      throw new Error('Property not found in search');
    }

    // Return the first matching property's ZPID
    const property = results[0];
    return property.zpid;

  } catch (error) {
    console.error('❌ Search failed:', error.message);
    return null;
  }
}

// ============================================================================
// STEP 2: GET PROPERTY DETAILS BY ZPID
// ============================================================================

async function getPropertyDetailsByZpid(zpid) {
  try {
    console.log('📊 Fetching details for ZPID:', zpid);
    
    const response = await axios.get(`${BASE_URL}/property`, {
      params: { zpid: zpid },
      ...getConfig()
    });

    return response.data;

  } catch (error) {
    console.error('❌ Property details failed:', error.message);
    return null;
  }
}

// ============================================================================
// MAIN FUNCTION: SEARCH + FETCH
// ============================================================================

export const getPropertyData = async (address, city, state, zipCode) => {
  try {
    // Check cache first
    const cacheKey = getCacheKey(address, city, state, zipCode);
    const cachedData = responseCache.get(cacheKey);

    if (isCacheValid(cachedData)) {
      console.log('✨ Using cached data for:', address);
      return cachedData.data;
    }

    console.log('📦 Queuing request for:', address);

    // Queue the request
    const result = await queueRequest(async () => {
      // STEP 1: Search for property to get ZPID
      const zpid = await searchPropertyByAddress(address, city, state, zipCode);
      
      if (!zpid) {
        throw new Error('Could not find property ZPID');
      }

      // STEP 2: Get property details using ZPID
      const propertyData = await getPropertyDetailsByZpid(zpid);
      
      if (!propertyData) {
        throw new Error('Could not fetch property details');
      }

      // Extract data (same as before)
      const rentEstimate = 
        propertyData.rentZestimate ||
        propertyData.rentalZestimate ||
        propertyData.resoFacts?.totalActualRent ||
        null;

      let photos = [];
      if (propertyData.responsivePhotos && Array.isArray(propertyData.responsivePhotos)) {
        photos = propertyData.responsivePhotos.map(photo => 
          photo.url || photo.mixedSources?.jpeg?.[0]?.url || photo.mixedSources?.webp?.[0]?.url || null
        ).filter(url => url !== null);
      } else if (propertyData.photos) {
        photos = propertyData.photos.map(p => p.url || p).filter(url => url);
      }

      const taxHistory = propertyData.taxHistory || [];
      const latestTax = taxHistory[0] || {};
      const annualTaxAmount = 
        latestTax.taxPaid || 
        propertyData.resoFacts?.taxAnnualAmount ||
        null;

      const hoaFee = 
        propertyData.resoFacts?.hoaFee ||
        propertyData.hoaFee ||
        null;

      const formattedData = {
        rent: rentEstimate,
        rentRangeLow: rentEstimate ? Math.round(rentEstimate * 0.9) : null,
        rentRangeHigh: rentEstimate ? Math.round(rentEstimate * 1.1) : null,
        
        annualTaxAmount: annualTaxAmount,
        taxAssessment: latestTax.value || null,
        taxYear: latestTax.time || new Date().getFullYear(),
        
        photos: photos.length > 0 ? photos : null,
        photoCount: photos.length,
        
        hoaFee: hoaFee,
        
        zpid: propertyData.zpid,
        price: propertyData.price || null,
        zestimate: propertyData.zestimate || null,
        homeStatus: propertyData.homeStatus || null,
        
        bedrooms: propertyData.bedrooms || null,
        bathrooms: propertyData.bathrooms || null,
        livingArea: propertyData.livingArea || null,
        
        dataSource: 'real-time-zillow-data',
        fetchedAt: new Date().toISOString(),
      };

      // Cache it
      responseCache.set(cacheKey, {
        data: formattedData,
        timestamp: Date.now()
      });

      console.log('✅ Successfully fetched:', address);
      return formattedData;
    });

    return result;

  } catch (error) {
    console.error('❌ Zillow API Error for', address, ':', error.message);

    return {
      rent: null,
      photos: null,
      photoCount: 0,
      annualTaxAmount: null,
      hoaFee: null,
      error: error.message,
    };
  }
};

export const clearCache = () => {
  responseCache.clear();
  console.log('🗑️ Cache cleared');
};

export default {
  getPropertyData,
  clearCache
};