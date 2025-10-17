import axios from 'axios';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;; // Replace with your actual key
const RAPIDAPI_HOST = 'realty-in-us.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

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
 * @param {string} input - States, cities, districts, addresses, zipcode
 * @param {number} limit - Number of results (default: 10)
 * @returns {Promise} API response with location suggestions
 */
export const autoCompleteLocations = async (input, limit = 10) => {
  try {
    console.log('🔍 Auto-completing:', { input, limit });
    
    const response = await axios.get(`${BASE_URL}/locations/v2/auto-complete`, {
      params: {
        input,
        limit
      },
      ...getConfig()
    });
    
    console.log('✅ Auto-complete response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Auto-complete error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Search properties using POST v3/list endpoint
 * This endpoint works best with postal_code OR city/state_code
 * @param {string} cityOrPostalCode - City name OR postal code
 * @param {string} stateCode - State code (e.g., 'MA', 'CA') - optional if using postal code
 * @param {object} options - Additional search options
 * @returns {Promise} API response with property listings
 */
export const searchPropertiesForSale = async (cityOrPostalCode, stateCode = null, options = {}) => {
  try {
    console.log('🏠 Searching properties (v3/list):', { cityOrPostalCode, stateCode, options });
    
    // Build the request body based on the parameters provided
    const requestBody = {
      limit: options.limit || 200,
      offset: options.offset || 0,
      status: options.status || ["for_sale", "ready_to_build"],
      sort: {
        direction: options.sortDirection || "desc",
        field: options.sortField || "list_date"
      }
    };

    // If it looks like a postal code (5 digits), use postal_code
    if (/^\d{5}$/.test(cityOrPostalCode)) {
      requestBody.postal_code = cityOrPostalCode;
    } 
    // Otherwise use city and state_code
    else {
      requestBody.city = cityOrPostalCode;
      if (stateCode) {
        requestBody.state_code = stateCode;
      }
    }

    // Add optional filters
    if (options.beds_min || options.beds_max) {
      requestBody.beds = {};
      if (options.beds_min) requestBody.beds.min = options.beds_min;
      if (options.beds_max) requestBody.beds.max = options.beds_max;
    }

    if (options.baths_min || options.baths_max) {
      requestBody.baths = {};
      if (options.baths_min) requestBody.baths.min = options.baths_min;
      if (options.baths_max) requestBody.baths.max = options.baths_max;
    }

    if (options.price_min || options.price_max) {
      requestBody.list_price = {};
      if (options.price_min) requestBody.list_price.min = options.price_min;
      if (options.price_max) requestBody.list_price.max = options.price_max;
    }

    if (options.sqft_min || options.sqft_max) {
      requestBody.sqft = {};
      if (options.sqft_min) requestBody.sqft.min = options.sqft_min;
      if (options.sqft_max) requestBody.sqft.max = options.sqft_max;
    }

    if (options.property_type) {
      requestBody.type = options.property_type; // e.g., ["single_family", "condo"]
    }

    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      `${BASE_URL}/properties/v3/list`,
      requestBody,
      getConfig()
    );
    
    console.log('✅ Properties response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Search properties error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get property details by property ID
 * @param {string} propertyId - The property ID
 * @returns {Promise} API response with property details
 */
export const getPropertyDetails = async (propertyId) => {
  try {
    console.log('🏡 Getting property details:', propertyId);
    
    const response = await axios.get(`${BASE_URL}/properties/v3/detail`, {
      params: {
        property_id: propertyId
      },
      ...getConfig()
    });
    
    console.log('✅ Property details:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Property details error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get property photos
 * @param {string} propertyId - The property ID
 * @returns {Promise} API response with property photos
 */
export const getPropertyPhotos = async (propertyId) => {
  try {
    console.log('📷 Getting property photos:', propertyId);
    
    const response = await axios.get(`${BASE_URL}/properties/get-photos`, {
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
 * Search properties for rent using GET method
 * @param {string} city - City name
 * @param {string} stateCode - State code (e.g., 'NY', 'CA')
 * @param {object} options - Additional search options
 * @returns {Promise} API response with rental property listings
 */
export const searchPropertiesForRent = async (city, stateCode, options = {}) => {
  try {
    console.log('🏠 Searching properties for rent:', { city, stateCode, options });
    
    const params = {
      city: city,
      state_code: stateCode,
      limit: options.limit || 10,
      offset: options.offset || 0,
      sort: options.sortField || 'relevance',
      ...(options.postal_code && { postal_code: options.postal_code }),
      ...(options.price_min && { price_min: options.price_min }),
      ...(options.price_max && { price_max: options.price_max }),
      ...(options.beds_min && { beds_min: options.beds_min }),
      ...(options.baths_min && { baths_min: options.baths_min })
    };

    const response = await axios.get(`${BASE_URL}/properties/list-for-rent`, {
      params: params,
      ...getConfig()
    });
    
    console.log('✅ Rental properties response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Search rental properties error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get similar homes for comparison
 * @param {string} propertyId - The property ID
 * @returns {Promise} API response with similar properties
 */
export const getSimilarHomes = async (propertyId) => {
  try {
    console.log('🔄 Getting similar homes:', propertyId);
    
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
 * Get property surroundings (nearby amenities, schools, etc.)
 * @param {string} propertyId - The property ID
 * @returns {Promise} API response with surrounding data
 */
export const getPropertySurroundings = async (propertyId) => {
  try {
    console.log('📍 Getting property surroundings:', propertyId);
    
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
 * Get commute time from property to a destination
 * @param {string} propertyId - The property ID
 * @returns {Promise} API response with commute data
 */
export const getCommuteTime = async (propertyId) => {
  try {
    console.log('🚗 Getting commute time:', propertyId);
    
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
 * @param {number} price - Property price
 * @param {number} downpayment - Down payment amount
 * @param {number} term - Loan term in years (default: 30)
 * @param {number} rate - Interest rate percentage
 * @param {number} taxRate - Property tax rate
 * @param {number} hoi - Home owner's insurance (monthly)
 * @returns {Promise} API response with mortgage calculations
 */
export const calculateMortgage = async (price, downpayment, term = 30, rate = 3.5, taxRate = 1.2, hoi = 100) => {
  try {
    console.log('💰 Calculating mortgage:', { price, downpayment, term, rate });
    
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
 * @returns {Promise} API response with current rates
 */
export const getMortgageRates = async () => {
  try {
    console.log('📊 Getting mortgage rates...');
    
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
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Search radius in miles (default: 5)
 * @returns {Promise} API response with school data
 */
export const getSchools = async (lat, lon, radius = 5) => {
  try {
    console.log('🏫 Getting schools:', { lat, lon, radius });
    
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

export default {
  autoCompleteLocations,
  searchPropertiesForSale,
  searchPropertiesForRent,
  getPropertyDetails,
  getPropertyPhotos,
  getSimilarHomes,
  getPropertySurroundings,
  getCommuteTime,
  calculateMortgage,
  getMortgageRates,
  getSchools
};