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
 * Upgrade image URL to higher quality
 * Realty API uses rdcpix.com with URL parameters for sizing:
 * Pattern: -m{mode}xd-w{width}_h{height}_q{quality}
 */
const upgradeImageUrl = (url, size = 'large') => {
  if (!url) return null;
  
  // Only modify rdcpix.com URLs
  if (!url.includes('rdcpix.com')) return url;
  
  const sizeConfigs = {
    thumbnail: { width: 400, height: 300, quality: 80 },
    medium: { width: 640, height: 480, quality: 85 },
    large: { width: 1024, height: 768, quality: 90 },
    xlarge: { width: 1280, height: 960, quality: 95 }
  };
  
  const config = sizeConfigs[size] || sizeConfigs.large;
  
  // Replace existing size parameters or add new ones
  let newUrl = url;
  
  // Pattern to match size parameters: -m0xd-w1234_h567_q89
  const sizePattern = /-m\d*x?d?-w\d+_h\d+(_q\d+)?/;
  const newSize = `-m0xd-w${config.width}_h${config.height}_q${config.quality}`;
  
  if (sizePattern.test(url)) {
    newUrl = url.replace(sizePattern, newSize);
  } else {
    // Try to insert before file extension
    const extMatch = url.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i);
    if (extMatch) {
      const insertPos = url.indexOf(extMatch[0]);
      newUrl = url.slice(0, insertPos) + newSize + url.slice(insertPos);
    }
  }
  
  return newUrl;
};

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

    // Build the request body
    const requestBody = {
      limit: Math.min(limit, 200),
      offset: 0,
      status: [status],
      sort: {
        direction: 'desc',
        field: 'list_date'
      }
    };

    // Determine location type and set appropriate field
    const isZipCode = /^\d{5}(-\d{4})?$/.test(location.trim());
    const isCityState = /^[a-zA-Z\s]+,\s*[A-Z]{2}$/i.test(location.trim());

    if (isZipCode) {
      requestBody.postal_code = location.trim();
    } else if (isCityState) {
      const [city, state] = location.split(',').map(s => s.trim());
      requestBody.city = city;
      requestBody.state_code = state.toUpperCase();
    } else {
      // Try as a general search term
      requestBody.city = location.trim();
    }

    // Apply filters
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

    // Normalize the properties with upgraded images
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
 * Includes image quality upgrade
 */
const normalizeProperty = (property) => {
  const location = property.location || {};
  const address = location.address || {};
  const description = property.description || {};
  
  // Get primary photo and upgrade quality
  const primaryPhotoUrl = property.primary_photo?.href;
  const upgradedPrimaryPhoto = upgradeImageUrl(primaryPhotoUrl, 'large');
  
  // Get thumbnail (medium quality for grid view)
  const thumbnailUrl = upgradeImageUrl(primaryPhotoUrl, 'medium') || 
                       'https://placehold.co/640x480/e2e8f0/64748b?text=No+Image';
  
  // Process all photos if available
  const photos = property.photos?.map(photo => ({
    href: upgradeImageUrl(photo.href, 'xlarge'),
    thumbnail: upgradeImageUrl(photo.href, 'medium')
  })) || [];
  
  return {
    // IDs
    property_id: property.property_id,
    listing_id: property.listing_id,
    
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
    
    // Photos - UPGRADED QUALITY
    thumbnail: thumbnailUrl,
    primaryPhoto: upgradedPrimaryPhoto,
    photos: photos,
    
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
    console.log('🡠Getting property details:', propertyId);
    
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
 * Get property photos (high quality)
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
    
    const photos = response.data?.data?.home_photos || [];
    
    // Upgrade all photo URLs to high quality
    return photos.map(photo => ({
      href: upgradeImageUrl(photo.href, 'xlarge'),
      thumbnail: upgradeImageUrl(photo.href, 'medium'),
      tags: photo.tags || []
    }));
  } catch (error) {
    console.error('❌ Property photos error:', error.response?.data || error.message);
    return [];
  }
};

/**
 * Get similar properties
 */
export const getSimilarProperties = async (propertyId) => {
  try {
    console.log('🔄 Getting similar properties:', propertyId);
    
    await waitForRateLimit();
    
    const response = await axios.get(`${BASE_URL}/properties/v3/get-similar-listings`, {
      params: {
        property_id: propertyId
      },
      ...getConfig()
    });
    
    const properties = response.data?.data?.home_search?.results || [];
    return properties.map(prop => normalizeProperty(prop));
  } catch (error) {
    console.error('❌ Similar properties error:', error.response?.data || error.message);
    return [];
  }
};

/**
 * Get market statistics for a location
 */
export const getMarketStatistics = async (city, stateCode) => {
  try {
    console.log('📊 Getting market stats:', { city, stateCode });
    
    await waitForRateLimit();
    
    const response = await axios.get(`${BASE_URL}/market-statistics/v1/data`, {
      params: {
        city,
        state_code: stateCode
      },
      ...getConfig()
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Market statistics error:', error.response?.data || error.message);
    return null;
  }
};

export default {
  autoCompleteLocations,
  searchProperties,
  searchPropertiesForSale,
  getPropertyDetails,
  getPropertyPhotos,
  getSimilarProperties,
  getMarketStatistics,
  upgradeImageUrl
};