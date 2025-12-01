import axios from 'axios';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'realty-in-us.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

// Rate limiting
const MIN_REQUEST_INTERVAL = 250;
let lastRequestTime = 0;

const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
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
 * Auto-complete location suggestions
 */
export const autoCompleteLocations = async (input, limit = 10) => {
  try {
    console.log('🔍 Auto-completing:', { input, limit });
    
    await waitForRateLimit();
    
    const response = await axios.get(`${BASE_URL}/locations/v2/auto-complete`, {
      params: {
        input,
        limit
      },
      ...getConfig()
    });
    
    console.log('✅ Auto-complete response:', response.data);
    
    // Normalize the autocomplete results
    const locations = response.data?.autocomplete || [];
    return locations.map(loc => ({
      display: loc.area_type === 'city' 
        ? `${loc.city}, ${loc.state_code}`
        : loc.area_type === 'postal_code'
        ? `${loc.postal_code} - ${loc.city}, ${loc.state_code}`
        : loc._name || loc.name,
      
      value: loc.area_type === 'city' 
        ? `${loc.city}, ${loc.state_code}`
        : loc.area_type === 'postal_code'
        ? loc.postal_code
        : loc._name || loc.name,
      
      city: loc.city || null,
      state: loc.state_code || null,
      postalCode: loc.postal_code || null,
      type: loc.area_type || 'unknown',
      
      lat: loc.centroid?.lat || null,
      lon: loc.centroid?.lon || null,
      
      _raw: loc
    }));
  } catch (error) {
    console.error('❌ Auto-complete error:', error.response?.data || error.message);
    return [];
  }
};

/**
 * Search properties using POST v3/list endpoint
 * This is the CORRECT endpoint for Realty-in-US
 */
export const searchProperties = async (params = {}) => {
  try {
    const {
      location,
      limit = 200,
      status = 'for_sale',
      ...filters
    } = params;

    if (!location) {
      throw new Error('Location is required');
    }

    console.log('🏠 Searching properties (POST v3/list):', { location, limit, status });
    
    await waitForRateLimit();
    
    // Parse location into city/state or postal_code
    const isZipCode = /^\d{5}$/.test(location.trim());
    
    // Build the request body - CRITICAL: Must match API expectations
    const requestBody = {
      limit: limit,
      offset: 0,
      status: [status], // IMPORTANT: Must be an array!
      sort: {
        direction: "desc",
        field: "list_date"
      }
    };

    // Add location - either postal_code OR city+state_code
    if (isZipCode) {
      requestBody.postal_code = location.trim();
      console.log('📮 Using postal_code:', requestBody.postal_code);
    } else {
      // Parse "City, State" format
      const parts = location.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        requestBody.city = parts[0];
        requestBody.state_code = parts[1];
        console.log('🏙️ Using city/state:', requestBody.city, requestBody.state_code);
      } else {
        requestBody.city = location;
        console.log('🏙️ Using city only:', requestBody.city);
      }
    }

    // Add optional filters
    if (filters.beds_min || filters.beds_max) {
      requestBody.beds = {};
      if (filters.beds_min) requestBody.beds.min = filters.beds_min;
      if (filters.beds_max) requestBody.beds.max = filters.beds_max;
    }

    if (filters.baths_min || filters.baths_max) {
      requestBody.baths = {};
      if (filters.baths_min) requestBody.baths.min = filters.baths_min;
      if (filters.baths_max) requestBody.baths.max = filters.baths_max;
    }

    if (filters.price_min || filters.price_max) {
      requestBody.list_price = {};
      if (filters.price_min) requestBody.list_price.min = filters.price_min;
      if (filters.price_max) requestBody.list_price.max = filters.price_max;
    }

    if (filters.sqft_min || filters.sqft_max) {
      requestBody.sqft = {};
      if (filters.sqft_min) requestBody.sqft.min = filters.sqft_min;
      if (filters.sqft_max) requestBody.sqft.max = filters.sqft_max;
    }

    if (filters.property_type) {
      requestBody.type = filters.property_type;
    }

    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      `${BASE_URL}/properties/v3/list`,
      requestBody,
      getConfig()
    );
    
    console.log('📦 API Response status:', response.status);
    console.log('📦 Response data keys:', Object.keys(response.data || {}));
    
    // Extract properties from the response
    const properties = response.data?.data?.home_search?.results || 
                       response.data?.data?.results ||
                       response.data?.properties ||
                       [];
    
    console.log(`✅ Found ${properties.length} properties`);
    
    if (properties.length === 0) {
      console.warn('⚠️ No properties found');
      console.warn('Full response:', JSON.stringify(response.data, null, 2).substring(0, 1500));
    } else {
      console.log('📌 First property sample:', JSON.stringify(properties[0], null, 2).substring(0, 800));
    }

    // Normalize the properties
    return properties.map(prop => normalizeProperty(prop));
    
  } catch (error) {
    console.error('❌ Search properties error:');
    console.error('- Status:', error.response?.status);
    console.error('- Status Text:', error.response?.statusText);
    console.error('- Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('- Message:', error.message);
    
    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please wait a moment.');
    } else if (error.response?.status === 401) {
      throw new Error('Invalid API key. Check VITE_RAPIDAPI_KEY in .env');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Check your RapidAPI subscription.');
    }
    
    throw error;
  }
};

/**
 * Normalize property data from Realty-in-US API
 */
const normalizeProperty = (property) => {
  const location = property.location || {};
  const address = location.address || {};
  const description = property.description || {};
  
  return {
    // IDs
    property_id: property.property_id,
    
    // Location
    address: address.line || '',
    city: address.city || '',
    state: address.state_code || '',
    zip: address.postal_code || '',
    
    // Coordinates
    lat: address.coordinate?.lat || null,
    lon: address.coordinate?.lon || null,
    
    // Price
    price: property.list_price || null,
    
    // Property Details
    beds: description.beds || 0,
    baths: description.baths || 0,
    sqft: description.sqft || description.lot_sqft || 0,
    lotSize: description.lot_sqft || null,
    yearBuilt: description.year_built || null,
    
    // Property Type
    propertyType: description.type || 'Unknown',
    
    // Status
    status: property.status || 'for_sale',
    
    // Photos
    thumbnail: property.primary_photo?.href || 
               (property.photos && property.photos[0]?.href) ||
               'https://placehold.co/400x300/png?text=No+Image',
    
    // Additional Info
    daysOnMarket: property.list_date ? 
      Math.floor((Date.now() - new Date(property.list_date).getTime()) / (1000 * 60 * 60 * 24)) : 
      null,
    
    isNewListing: property.flags?.is_new_listing || false,
    
    // Raw data for debugging
    _raw: property
  };
};

/**
 * Search properties for sale (wrapper for backward compatibility)
 */
export const searchPropertiesForSale = async (cityOrPostalCode, stateCode = null, options = {}) => {
  const location = stateCode 
    ? `${cityOrPostalCode}, ${stateCode}`
    : cityOrPostalCode;
    
  return searchProperties({
    location,
    ...options
  });
};

/**
 * Get property details by property ID
 */
export const getPropertyDetails = async (propertyId) => {
  try {
    console.log('🏡 Getting property details:', propertyId);
    
    await waitForRateLimit();
    
    const response = await axios.get(`${BASE_URL}/properties/v3/detail`, {
      params: {
        property_id: propertyId
      },
      ...getConfig()
    });
    
    console.log('✅ Property details:', response.data);
    
    const property = response.data?.data?.home || {};
    return normalizeProperty(property);
  } catch (error) {
    console.error('❌ Property details error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get property photos
 */
export const getPropertyPhotos = async (propertyId) => {
  try {
    console.log('📷 Getting property photos:', propertyId);
    
    await waitForRateLimit();
    
    const response = await axios.get(`${BASE_URL}/properties/v3/get-photos`, {
      params: {
        property_id: propertyId
      },
      ...getConfig()
    });
    
    console.log('✅ Property photos:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Property photos error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get similar homes for comparison
 */
export const getSimilarHomes = async (propertyId) => {
  try {
    console.log('🔄 Getting similar homes:', propertyId);
    
    await waitForRateLimit();
    
    const response = await axios.get(`${BASE_URL}/properties/v3/list-similar-homes`, {
      params: {
        property_id: propertyId
      },
      ...getConfig()
    });
    
    console.log('✅ Similar homes:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Similar homes error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get property surroundings
 */
export const getPropertySurroundings = async (propertyId) => {
  try {
    console.log('📍 Getting property surroundings:', propertyId);
    
    await waitForRateLimit();
    
    const response = await axios.get(`${BASE_URL}/properties/v3/get-surroundings`, {
      params: {
        property_id: propertyId
      },
      ...getConfig()
    });
    
    console.log('✅ Property surroundings:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Property surroundings error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get commute time from property
 */
export const getCommuteTime = async (propertyId) => {
  try {
    console.log('🚗 Getting commute time:', propertyId);
    
    await waitForRateLimit();
    
    const response = await axios.get(`${BASE_URL}/properties/v3/get-commute-time`, {
      params: {
        property_id: propertyId
      },
      ...getConfig()
    });
    
    console.log('✅ Commute time:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Commute time error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Calculate mortgage payment
 */
export const calculateMortgage = async (price, downpayment, term = 30, rate = 3.5, taxRate = 1.2, hoi = 100) => {
  try {
    console.log('💰 Calculating mortgage:', { price, downpayment, term, rate });
    
    await waitForRateLimit();
    
    const response = await axios.get(`${BASE_URL}/mortgage/v2/calculate`, {
      params: {
        price,
        downpayment,
        term,
        rate,
        tax_rate: taxRate,
        hoi
      },
      ...getConfig()
    });
    
    console.log('✅ Mortgage calculation:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Mortgage calculation error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get current mortgage rates
 */
export const getMortgageRates = async () => {
  try {
    console.log('📊 Getting mortgage rates...');
    
    await waitForRateLimit();
    
    const response = await axios.get(`${BASE_URL}/mortgage/v2/check-rates`, {
      ...getConfig()
    });
    
    console.log('✅ Mortgage rates:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Mortgage rates error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get schools near a location
 */
export const getSchools = async (lat, lon, radius = 5) => {
  try {
    console.log('🏫 Getting schools:', { lat, lon, radius });
    
    await waitForRateLimit();
    
    const response = await axios.get(`${BASE_URL}/schools/list`, {
      params: {
        lat,
        lon,
        radius
      },
      ...getConfig()
    });
    
    console.log('✅ Schools:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Schools error:', error.response?.data || error.message);
    throw error;
  }
};

// Helper function to build full address
export const getFullAddress = (property) => {
  return `${property.address}, ${property.city}, ${property.state} ${property.zip}`;
};

export default {
  autoCompleteLocations,
  searchProperties,
  searchPropertiesForSale,
  getPropertyDetails,
  getPropertyPhotos,
  getSimilarHomes,
  getPropertySurroundings,
  getCommuteTime,
  calculateMortgage,
  getMortgageRates,
  getSchools,
  getFullAddress
};