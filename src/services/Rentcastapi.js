/**
 * RentCast API Service
 * 
 * Free Tier: 50 API calls/month
 * Docs: https://developers.rentcast.io
 * 
 * Get your API key: https://app.rentcast.io/app/api
 */

const RENTCAST_API_KEY = import.meta.env.VITE_RENTCAST_API_KEY;
const BASE_URL = 'https://api.rentcast.io/v1';

/**
 * Get rent estimate for a property by address
 * Endpoint: GET /avm/rent/long-term
 * 
 * @param {Object} params - Property parameters
 * @param {string} params.address - Street address (e.g., "123 Main St")
 * @param {string} params.city - City name
 * @param {string} params.state - State code (e.g., "CA")
 * @param {string} params.zipCode - ZIP code
 * @param {number} params.bedrooms - Number of bedrooms (optional)
 * @param {number} params.bathrooms - Number of bathrooms (optional)
 * @param {number} params.squareFootage - Square footage (optional)
 * @param {string} params.propertyType - Property type (optional): Single Family, Condo, Townhouse, etc.
 */
export const getRentEstimate = async ({ 
  address, 
  city, 
  state, 
  zipCode,
  bedrooms,
  bathrooms,
  squareFootage,
  propertyType
}) => {
  try {
    if (!RENTCAST_API_KEY) {
      console.warn('⚠️ RentCast API key not configured. Add VITE_RENTCAST_API_KEY to .env');
      return null;
    }

    // Build query parameters
    const params = new URLSearchParams({
      address: address,
      city: city,
      state: state,
      zipCode: zipCode,
    });

    // Add optional parameters if provided
    if (bedrooms) params.append('bedrooms', bedrooms);
    if (bathrooms) params.append('bathrooms', bathrooms);
    if (squareFootage) params.append('squareFootage', squareFootage);
    if (propertyType) params.append('propertyType', propertyType);

    console.log('🏠 RentCast API Request:', `${BASE_URL}/avm/rent/long-term?${params}`);

    const response = await fetch(`${BASE_URL}/avm/rent/long-term?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': RENTCAST_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ RentCast API Error:', response.status, errorData);
      
      if (response.status === 401) {
        console.error('Invalid API key or inactive subscription');
      } else if (response.status === 404) {
        console.error('Property not found');
      } else if (response.status === 429) {
        console.error('Rate limit exceeded');
      }
      
      return null;
    }

    const data = await response.json();
    console.log('✅ RentCast Response:', data);

    /**
     * Response format:
     * {
     *   "rent": 2500,           // Estimated monthly rent
     *   "rentRangeLow": 2200,   // Low end of rent range
     *   "rentRangeHigh": 2800,  // High end of rent range
     *   "latitude": 37.7749,
     *   "longitude": -122.4194,
     *   "comparables": [...]     // Similar rental properties nearby
     * }
     */

    return {
      rentEstimate: data.rent || null,
      rentRangeLow: data.rentRangeLow || null,
      rentRangeHigh: data.rentRangeHigh || null,
      latitude: data.latitude,
      longitude: data.longitude,
      comparables: data.comparables || [],
      source: 'RentCast'
    };

  } catch (error) {
    console.error('❌ RentCast API Error:', error);
    return null;
  }
};

/**
 * Get property details including value estimate
 * Endpoint: GET /properties
 */
export const getPropertyDetails = async ({
  address,
  city,
  state,
  zipCode
}) => {
  try {
    if (!RENTCAST_API_KEY) {
      console.warn('⚠️ RentCast API key not configured');
      return null;
    }

    const params = new URLSearchParams({
      address: address,
      city: city,
      state: state,
      zipCode: zipCode
    });

    const response = await fetch(`${BASE_URL}/properties?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': RENTCAST_API_KEY
      }
    });

    if (!response.ok) {
      console.error('❌ RentCast Properties Error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('✅ RentCast Property Details:', data);

    // Returns array of properties, get first match
    const property = Array.isArray(data) ? data[0] : data;
    
    if (!property) return null;

    return {
      propertyId: property.id,
      address: property.addressLine1,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFootage: property.squareFootage,
      lotSize: property.lotSize,
      yearBuilt: property.yearBuilt,
      propertyType: property.propertyType,
      
      // Tax info
      assessedValue: property.assessedValue,
      taxAmount: property.taxAmount,
      
      // Value estimate
      priceEstimate: property.price,
      priceRangeLow: property.priceRangeLow,
      priceRangeHigh: property.priceRangeHigh,
      
      lastSaleDate: property.lastSaleDate,
      lastSalePrice: property.lastSalePrice,
      
      source: 'RentCast'
    };

  } catch (error) {
    console.error('❌ RentCast Properties Error:', error);
    return null;
  }
};

/**
 * Get rent estimate with comparables
 * This is the MAIN function to use on Property Analysis Page
 * 
 * @param {Object} property - Property from Realty API
 * @returns {Object} - Rent data for calculations
 */
export const getPropertyRentData = async (property) => {
  try {
    // Extract address components from various property formats
    const address = property.location?.address?.line || 
                    property.address || 
                    '';
    const city = property.location?.address?.city || 
                 property.city || 
                 '';
    const state = property.location?.address?.state_code || 
                  property.state || 
                  '';
    const zipCode = property.location?.address?.postal_code || 
                    property.zipCode || 
                    property.zip || 
                    '';
    
    if (!address || !city || !state) {
      console.warn('⚠️ Incomplete address for RentCast lookup');
      return null;
    }

    console.log('🔍 Fetching rent estimate for:', { address, city, state, zipCode });

    const rentData = await getRentEstimate({
      address,
      city,
      state,
      zipCode,
      bedrooms: property.description?.beds || property.beds,
      bathrooms: property.description?.baths || property.baths,
      squareFootage: property.description?.sqft || property.sqft,
      propertyType: mapPropertyType(property.description?.type || property.propertyType)
    });

    return rentData;

  } catch (error) {
    console.error('❌ getPropertyRentData Error:', error);
    return null;
  }
};

/**
 * Map Realty API property types to RentCast format
 */
const mapPropertyType = (type) => {
  if (!type) return undefined;
  
  const typeMap = {
    'single_family': 'Single Family',
    'condo': 'Condo',
    'townhouse': 'Townhouse',
    'multi_family': 'Multi Family',
    'apartment': 'Apartment',
    'duplex': 'Duplex',
    'triplex': 'Triplex',
    'quadruplex': 'Quadruplex'
  };
  
  return typeMap[type.toLowerCase()] || type;
};

/**
 * Get market statistics for a zip code
 * Endpoint: GET /markets
 */
export const getMarketStats = async (zipCode) => {
  try {
    if (!RENTCAST_API_KEY) {
      console.warn('⚠️ RentCast API key not configured');
      return null;
    }

    const response = await fetch(`${BASE_URL}/markets?zipCode=${zipCode}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': RENTCAST_API_KEY
      }
    });

    if (!response.ok) {
      console.error('❌ RentCast Markets Error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('✅ RentCast Market Stats:', data);

    return {
      zipCode: data.zipCode,
      averageRent: data.averageRent,
      medianRent: data.medianRent,
      rentGrowth: data.rentGrowth,
      averagePrice: data.averagePrice,
      medianPrice: data.medianPrice,
      priceGrowth: data.priceGrowth,
      daysOnMarket: data.averageDaysOnMarket,
      totalListings: data.totalListings,
      source: 'RentCast'
    };

  } catch (error) {
    console.error('❌ RentCast Markets Error:', error);
    return null;
  }
};

export default {
  getRentEstimate,
  getPropertyDetails,
  getPropertyRentData,
  getMarketStats
};