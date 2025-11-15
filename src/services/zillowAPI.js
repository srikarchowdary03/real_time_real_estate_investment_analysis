import axios from 'axios';

const RAPIDAPI_KEY = import.meta.env.VITE_ZILLOW_API_KEY;
const RAPIDAPI_HOST = 'zillow-com1.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

// Cache for API responses to reduce API calls
const responseCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Rate limiting - optimized for paid plans
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 500ms between requests (was 2000ms)
const MAX_RETRIES = 3; // Increased retries
const RETRY_DELAY = 3000; // 3 seconds between retries (was 5000ms)

/**
 * Wait to respect rate limits
 */
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏱️ Rate limit: waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
};

// Base configuration for all API requests
const getConfig = () => ({
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST,
    'Content-Type': 'application/json'
  }
});

/**
 * Generate cache key for a property
 * @param {string} address - Property address
 * @param {string} city - City
 * @param {string} state - State
 * @param {string} zipCode - ZIP code
 * @returns {string} Cache key
 */
const getCacheKey = (address, city, state, zipCode) => {
  return `${address}_${city}_${state}_${zipCode}`.toLowerCase().replace(/\s+/g, '_');
};

/**
 * Check if cached data is still valid
 * @param {object} cacheEntry - Cache entry with timestamp
 * @returns {boolean} True if cache is valid
 */
const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const now = Date.now();
  return (now - cacheEntry.timestamp) < CACHE_DURATION;
};

/**
 * Search for a property on Zillow to get its zpid (Zillow Property ID)
 * Uses the /property endpoint with address parameter
 */
const searchPropertyZpid = async (address, city, state, zipCode, retryCount = 0) => {
  try {
    // Wait for rate limit
    await waitForRateLimit();
    
    const searchQuery = `${address}, ${city}, ${state} ${zipCode}`;
    console.log('🔍 Searching Zillow for property:', searchQuery);

    const response = await axios.get(`${BASE_URL}/property`, {
      params: {
        address: searchQuery
      },
      ...getConfig()
    });

    if (response.data && response.data.zpid) {
      console.log('✅ Found Zillow property zpid:', response.data.zpid);
      return response.data;
    }

    console.warn('⚠️ Property not found on Zillow');
    return null;
  } catch (error) {
    // Handle rate limiting with retry
    if (error.response?.status === 429 && retryCount < MAX_RETRIES) {
      console.warn(`⏱️ Rate limited. Retry ${retryCount + 1}/${MAX_RETRIES} in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return searchPropertyZpid(address, city, state, zipCode, retryCount + 1);
    }
    
    console.error('❌ Error searching for property on Zillow:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get property details by zpid
 * Uses the /property endpoint with zpid parameter
 */
const getPropertyByZpid = async (zpid, retryCount = 0) => {
  try {
    // Wait for rate limit
    await waitForRateLimit();
    
    console.log('📊 Fetching property details for zpid:', zpid);

    const response = await axios.get(`${BASE_URL}/property`, {
      params: {
        zpid: zpid
      },
      ...getConfig()
    });

    console.log('✅ Received property details from Zillow');
    return response.data;
  } catch (error) {
    // Handle rate limiting with retry
    if (error.response?.status === 429 && retryCount < MAX_RETRIES) {
      console.warn(`⏱️ Rate limited. Retry ${retryCount + 1}/${MAX_RETRIES} in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return getPropertyByZpid(zpid, retryCount + 1);
    }
    
    console.error('❌ Error fetching property details:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get property photos from Zillow
 * @param {string} zpid - Zillow Property ID
 * @returns {Promise<Array>} Array of photo URLs
 */
const getPropertyPhotos = async (zpid, retryCount = 0) => {
  try {
    // Wait for rate limit
    await waitForRateLimit();
    
    console.log('📸 Fetching property photos for zpid:', zpid);

    const response = await axios.get(`${BASE_URL}/images`, {
      params: {
        zpid: zpid
      },
      ...getConfig()
    });

    const photos = response.data?.images || [];
    console.log(`✅ Retrieved ${photos.length} photos from Zillow`);
    return photos;
  } catch (error) {
    // Handle rate limiting with retry
    if (error.response?.status === 429 && retryCount < MAX_RETRIES) {
      console.warn(`⏱️ Rate limited. Retry ${retryCount + 1}/${MAX_RETRIES} in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return getPropertyPhotos(zpid, retryCount + 1);
    }
    
    console.warn('⚠️ Error fetching photos from Zillow:', error.response?.data || error.message);
    return []; // Return empty array if photos fail, don't break the whole flow
  }
};

/**
 * Main function to get comprehensive property data from Zillow
 * @param {string} address - Property address line (e.g., "123 Main St")
 * @param {string} city - City name
 * @param {string} state - State code (e.g., 'MA', 'CA')
 * @param {string} zipCode - ZIP code
 * @returns {Promise<object>} Property data including rent, photos, and tax info
 */
export const getPropertyData = async (address, city, state, zipCode) => {
  try {
    // Check cache first
    const cacheKey = getCacheKey(address, city, state, zipCode);
    const cachedData = responseCache.get(cacheKey);

    if (isCacheValid(cachedData)) {
      console.log('✨ Returning cached Zillow data');
      return cachedData.data;
    }

    console.log('🏠 Fetching fresh data from Zillow API...');
    console.log('   Address:', address);
    console.log('   City:', city);
    console.log('   State:', state);
    console.log('   ZIP:', zipCode);

    // Step 1: Search for the property (returns full data)
    const propertyData = await searchPropertyZpid(address, city, state, zipCode);

    if (!propertyData || !propertyData.zpid) {
      throw new Error('Property not found on Zillow');
    }

    // Step 2: Get property photos
    let photos = [];
    try {
      photos = await getPropertyPhotos(propertyData.zpid);
    } catch (photoError) {
      console.warn('⚠️ Could not fetch photos, continuing without them');
    }

    // Extract relevant data - check multiple rent fields
    const rentEstimate = propertyData.rentZestimate || propertyData.resoFacts?.totalActualRent || propertyData.zestimate;
    const formattedData = {
      // Rent estimates - CRITICAL
      rent: rentEstimate || null,
      rentRangeLow: propertyData.rentZestimateLow || (rentEstimate ? Math.round(rentEstimate * 0.9) : null),
      rentRangeHigh: propertyData.rentZestimateHigh || (rentEstimate ? Math.round(rentEstimate * 1.1) : null),

      // High-quality photos - CRITICAL
      photos: photos.length > 0 ? photos : null,

      // Property tax data - NICE TO HAVE
      taxAssessment: propertyData.resoFacts?.taxAssessedValue || propertyData.taxAssessedValue || null,
      annualTaxAmount: propertyData.resoFacts?.taxAnnualAmount || propertyData.taxHistory?.[0]?.taxPaid || null,
      taxYear: propertyData.taxHistory?.[0]?.time || new Date().getFullYear(),

      // Additional useful data
      zpid: propertyData.zpid,
      zestimate: propertyData.zestimate || null,
      homeStatus: propertyData.homeStatus || null,
      daysOnZillow: propertyData.daysOnZillow || null,

      // Raw data for debugging
      _raw: propertyData
    };

    // Cache the response
    responseCache.set(cacheKey, {
      data: formattedData,
      timestamp: Date.now()
    });

    console.log('✅ Zillow data successfully fetched and cached');
    console.log('   Rent estimate:', formattedData.rent || 'N/A');
    console.log('   Photos:', photos.length);
    console.log('   Tax data:', formattedData.annualTaxAmount ? 'Available' : 'Not available');

    return formattedData;

  } catch (error) {
    console.error('❌ Zillow API Error:', error.message);

    // Return partial data structure with error info
    return {
      rent: null,
      rentRangeLow: null,
      rentRangeHigh: null,
      photos: null,
      taxAssessment: null,
      annualTaxAmount: null,
      error: error.message,
      errorDetails: error.response?.data || null
    };
  }
};

/**
 * Get rent estimate only (faster, uses less API calls)
 * @param {string} address - Property address
 * @param {string} city - City
 * @param {string} state - State code
 * @param {string} zipCode - ZIP code
 * @returns {Promise<object>} Rent estimate data
 */
export const getRentEstimate = async (address, city, state, zipCode) => {
  try {
    const propertyData = await searchPropertyZpid(address, city, state, zipCode);
    
    if (!propertyData || !propertyData.zpid) {
      throw new Error('Property not found on Zillow');
    }

    const rentEstimate = propertyData.rentZestimate || propertyData.resoFacts?.totalActualRent || propertyData.zestimate;

    return {
      rent: rentEstimate || null,
      rentRangeLow: propertyData.rentZestimateLow || (rentEstimate ? Math.round(rentEstimate * 0.9) : null),
      rentRangeHigh: propertyData.rentZestimateHigh || (rentEstimate ? Math.round(rentEstimate * 1.1) : null),
      zpid: propertyData.zpid
    };
  } catch (error) {
    console.error('❌ Error getting rent estimate:', error.message);
    return {
      rent: null,
      rentRangeLow: null,
      rentRangeHigh: null,
      error: error.message
    };
  }
};

/**
 * Clear the response cache (useful for testing or manual refresh)
 */
export const clearCache = () => {
  responseCache.clear();
  console.log('🗑️ Zillow API cache cleared');
};

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
export const getCacheStats = () => {
  return {
    size: responseCache.size,
    keys: Array.from(responseCache.keys())
  };
};

// Default export with all functions
export default {
  getPropertyData,
  getRentEstimate,
  clearCache,
  getCacheStats
};