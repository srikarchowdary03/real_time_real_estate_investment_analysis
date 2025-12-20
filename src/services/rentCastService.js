/**
 * rentCastService.js - RentCast API Client
 * ON-DEMAND ONLY: Called when user clicks "Analyze Investment"
 */
import axios from 'axios';

const RENTCAST_API_KEY = import.meta.env.VITE_RENTCAST_API_KEY;
const BASE_URL = 'https://api.rentcast.io/v1';

const MIN_REQUEST_INTERVAL = 1000;
let lastRequestTime = 0;

const rentCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

const getCacheKey = (address, city, state, zip) => {
  return `${address}_${city}_${state}_${zip}`.toLowerCase().replace(/\s+/g, '_');
};

const getFromCache = (key) => {
  const cached = rentCache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    console.log(`✅ RentCast cache hit: ${key}`);
    return cached.data;
  }
  if (cached) rentCache.delete(key);
  return null;
};

const saveToCache = (key, data) => {
  rentCache.set(key, { data, timestamp: Date.now() });
};

export const getRentEstimate = async (address, city, state, zip, bedrooms, bathrooms, squareFootage) => {
  try {
    const cacheKey = getCacheKey(address, city, state, zip);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    console.log('🏠 Fetching RentCast data for:', address);
    await waitForRateLimit();

    const response = await axios.get(`${BASE_URL}/avm/rent/long-term`, {
      headers: {
        'X-Api-Key': RENTCAST_API_KEY,
        'Content-Type': 'application/json'
      },
      params: {
        address,
        city,
        state,
        zipCode: zip,
        bedrooms: bedrooms || undefined,
        bathrooms: bathrooms || undefined,
        squareFootage: squareFootage || undefined,
        propertyType: 'Single Family'
      }
    });

    const data = response.data;
    const result = {
      rent: data.rent || data.rentEstimate || null,
      rentRangeLow: data.rentRangeLow || null,
      rentRangeHigh: data.rentRangeHigh || null,
      pricePerSqFt: data.pricePerSqFt || null,
      confidence: data.confidence || 'medium',
      comparables: data.comparables || [],
      source: 'rentcast',
      fetchedAt: new Date().toISOString()
    };

    console.log('✅ RentCast response:', { rent: result.rent, confidence: result.confidence });
    saveToCache(cacheKey, result);
    return result;

  } catch (error) {
    console.error('❌ RentCast API error:', error.response?.data || error.message);
    return null;
  }
};

export const getCompletePropertyData = async (propertyOrAddress, city, state, zip, bedrooms, bathrooms, squareFootage) => {
  let address, propCity, propState, propZip, beds, baths, sqft;
  
  if (typeof propertyOrAddress === 'object') {
    const property = propertyOrAddress;
    address = property.address;
    propCity = property.city;
    propState = property.state;
    propZip = property.zip || property.zipCode;
    beds = property.beds || property.bedrooms;
    baths = property.baths || property.bathrooms;
    sqft = property.sqft || property.squareFootage;
  } else {
    address = propertyOrAddress;
    propCity = city;
    propState = state;
    propZip = zip;
    beds = bedrooms;
    baths = bathrooms;
    sqft = squareFootage;
  }

  try {
    const rentData = await getRentEstimate(address, propCity, propState, propZip, beds, baths, sqft);

    return {
      rentEstimate: rentData?.rent || null,
      rentRangeLow: rentData?.rentRangeLow || null,
      rentRangeHigh: rentData?.rentRangeHigh || null,
      rentConfidence: rentData?.confidence || 'unknown',
      rentSource: rentData ? 'rentcast' : 'estimate',
      comparables: rentData?.comparables || [],
      hasRentCastData: !!rentData?.rent,
      fetchedAt: rentData?.fetchedAt || null
    };
  } catch (error) {
    console.error('Failed to get RentCast data:', error.message);
    return {
      rentEstimate: null,
      rentRangeLow: null,
      rentRangeHigh: null,
      rentConfidence: 'none',
      rentSource: 'failed',
      comparables: [],
      hasRentCastData: false,
      error: error.message
    };
  }
};

export const clearCache = () => {
  rentCache.clear();
  console.log('🗑️ RentCast cache cleared');
};

export default {
  getRentEstimate,
  getCompletePropertyData,
  clearCache
};