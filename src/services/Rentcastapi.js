/**
 * RentCast API Service - UPDATED
 * 
 * FIXES:
 * - Now extracts features.unitCount from /properties endpoint
 * - Properly handles multi-family properties
 * - Rent estimate is PER UNIT (must multiply by unitCount for total)
 * 
 * Free Tier: 50 API calls/month
 * Docs: https://developers.rentcast.io
 */

const RENTCAST_API_KEY = import.meta.env.VITE_RENTCAST_API_KEY;
const BASE_URL = 'https://api.rentcast.io/v1';

/**
 * Get rent estimate for a property by address
 * Endpoint: GET /avm/rent/long-term
 * 
 * IMPORTANT: For multi-family properties, this returns rent PER UNIT
 * You must multiply by unitCount to get total rent
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

    console.log('🏠 RentCast Rent API Request:', `${BASE_URL}/avm/rent/long-term?${params}`);

    const response = await fetch(`${BASE_URL}/avm/rent/long-term?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': RENTCAST_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ RentCast Rent API Error:', response.status, errorData);
      
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
    console.log('✅ RentCast Rent Response:', data);

    return {
      rentEstimate: data.rent || null,        // This is PER UNIT rent
      rentRangeLow: data.rentRangeLow || null,
      rentRangeHigh: data.rentRangeHigh || null,
      latitude: data.latitude,
      longitude: data.longitude,
      comparables: data.comparables || [],
      source: 'RentCast',
      // Note: This is per-unit rent for multi-family
      isPerUnitRent: true
    };

  } catch (error) {
    console.error('❌ RentCast Rent API Error:', error);
    return null;
  }
};

/**
 * Get property details including unit count and tax info
 * Endpoint: GET /properties
 * 
 * CRITICAL: This endpoint returns features.unitCount for multi-family properties
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

    console.log('🏠 RentCast Property API Request:', `${BASE_URL}/properties?${params}`);

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
    console.log('✅ RentCast Property Details (raw):', data);

    // Returns array of properties, get first match
    const property = Array.isArray(data) ? data[0] : data;
    
    if (!property) return null;

    // ============================================================
    // CRITICAL FIX: Extract unitCount from features object
    // ============================================================
    const unitCount = property.features?.unitCount || 1;
    const isMultiFamily = detectMultiFamilyFromType(property.propertyType) || unitCount > 1;
    
    console.log('📊 Property Analysis:', {
      propertyType: property.propertyType,
      unitCount: unitCount,
      isMultiFamily: isMultiFamily,
      features: property.features
    });

    // Extract tax data from propertyTaxes object (newest year)
    let taxAmount = null;
    if (property.propertyTaxes) {
      const taxYears = Object.keys(property.propertyTaxes).sort().reverse();
      if (taxYears.length > 0) {
        taxAmount = property.propertyTaxes[taxYears[0]]?.total || null;
      }
    }

    // Extract assessed value from taxAssessments (newest year)
    let assessedValue = null;
    if (property.taxAssessments) {
      const assessmentYears = Object.keys(property.taxAssessments).sort().reverse();
      if (assessmentYears.length > 0) {
        assessedValue = property.taxAssessments[assessmentYears[0]]?.value || null;
      }
    }

    return {
      // Property ID
      propertyId: property.id,
      
      // Address info
      address: property.addressLine1,
      addressLine2: property.addressLine2,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      county: property.county,
      
      // Property characteristics
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFootage: property.squareFootage,
      lotSize: property.lotSize,
      yearBuilt: property.yearBuilt,
      propertyType: property.propertyType,
      
      // ============================================================
      // UNIT COUNT - THE KEY FIX
      // ============================================================
      unitCount: unitCount,
      isMultiFamily: isMultiFamily,
      
      // All features from public records
      features: {
        unitCount: unitCount,
        floorCount: property.features?.floorCount || null,
        roomCount: property.features?.roomCount || null,
        architectureType: property.features?.architectureType || null,
        garage: property.features?.garage || false,
        garageSpaces: property.features?.garageSpaces || 0,
        garageType: property.features?.garageType || null,
        pool: property.features?.pool || false,
        poolType: property.features?.poolType || null,
        heating: property.features?.heating || false,
        heatingType: property.features?.heatingType || null,
        cooling: property.features?.cooling || false,
        coolingType: property.features?.coolingType || null,
        fireplace: property.features?.fireplace || false,
        roofType: property.features?.roofType || null,
        exteriorType: property.features?.exteriorType || null,
        foundationType: property.features?.foundationType || null,
      },
      
      // Tax info
      assessedValue: assessedValue,
      taxAmount: taxAmount,
      propertyTaxes: property.propertyTaxes || null,
      taxAssessments: property.taxAssessments || null,
      
      // HOA info
      hoaFee: property.hoa?.fee || null,
      
      // Value estimate (if available)
      priceEstimate: property.price || null,
      priceRangeLow: property.priceRangeLow || null,
      priceRangeHigh: property.priceRangeHigh || null,
      
      // Sale history
      lastSaleDate: property.lastSaleDate,
      lastSalePrice: property.lastSalePrice,
      history: property.history || null,
      
      // Owner info (if available)
      owner: property.owner || null,
      ownerOccupied: property.ownerOccupied || null,
      
      // Metadata
      source: 'RentCast',
      rawData: property // Keep raw data for debugging
    };

  } catch (error) {
    console.error('❌ RentCast Properties Error:', error);
    return null;
  }
};

/**
 * Detect multi-family from property type string
 */
const detectMultiFamilyFromType = (propertyType) => {
  if (!propertyType) return false;
  
  const multiTypes = [
    'multi family', 'multi-family', 'multifamily',
    'apartment', 'duplex', 'triplex', 'quadplex', 'fourplex',
    'multi unit', 'multi-unit', 'multiunit'
  ];
  
  const typeLower = propertyType.toLowerCase();
  return multiTypes.some(t => typeLower.includes(t));
};

/**
 * Get complete property data with rent estimate AND unit count
 * This is the MAIN function to use on Property Analysis Page
 * 
 * @param {Object} property - Property from Realty API
 * @returns {Object} - Complete data for calculations including unitCount
 */
export const getCompletePropertyData = async (property) => {
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

    console.log('🔍 Fetching complete property data for:', { address, city, state, zipCode });

    // Fetch both rent estimate AND property details (for unit count)
    const [rentData, propertyDetails] = await Promise.all([
      getRentEstimate({
        address,
        city,
        state,
        zipCode,
        bedrooms: property.description?.beds || property.beds,
        bathrooms: property.description?.baths || property.baths,
        squareFootage: property.description?.sqft || property.sqft,
        propertyType: mapPropertyType(property.description?.type || property.propertyType)
      }),
      getPropertyDetails({ address, city, state, zipCode })
    ]);

    // Get unit count from property details (THE KEY FIX)
    const unitCount = propertyDetails?.unitCount || 
                      property.units || 
                      estimateUnitsFromProperty(property);
    
    const isMultiFamily = propertyDetails?.isMultiFamily || 
                          unitCount > 1 ||
                          detectMultiFamilyFromType(property.propertyType);

    // Calculate total rent (per unit × number of units)
    const perUnitRent = rentData?.rentEstimate || null;
    const totalMonthlyRent = perUnitRent ? perUnitRent * unitCount : null;

    console.log('📊 Rent Calculation:', {
      perUnitRent,
      unitCount,
      totalMonthlyRent,
      isMultiFamily
    });

    return {
      // Rent data
      rentEstimate: perUnitRent,           // Per unit rent
      totalMonthlyRent: totalMonthlyRent,  // Total rent (per unit × units)
      rentRangeLow: rentData?.rentRangeLow || null,
      rentRangeHigh: rentData?.rentRangeHigh || null,
      comparables: rentData?.comparables || [],
      
      // Unit information (THE KEY FIX)
      unitCount: unitCount,
      isMultiFamily: isMultiFamily,
      
      // Property details from RentCast
      propertyDetails: propertyDetails,
      
      // Tax info
      taxAmount: propertyDetails?.taxAmount || null,
      assessedValue: propertyDetails?.assessedValue || null,
      hoaFee: propertyDetails?.hoaFee || null,
      
      // Features
      features: propertyDetails?.features || null,
      
      // Metadata
      source: 'RentCast',
      hasRentData: !!perUnitRent,
      hasPropertyData: !!propertyDetails
    };

  } catch (error) {
    console.error('❌ getCompletePropertyData Error:', error);
    return null;
  }
};

/**
 * Estimate units from property data when RentCast doesn't have it
 * This is a fallback using property type and bed/bath counts
 */
const estimateUnitsFromProperty = (property) => {
  const propertyType = (property.propertyType || property.description?.type || '').toLowerCase();
  const beds = property.beds || property.description?.beds || 0;
  const baths = property.baths || property.description?.baths || 0;
  
  // Explicit types
  if (propertyType.includes('duplex')) return 2;
  if (propertyType.includes('triplex')) return 3;
  if (propertyType.includes('quadplex') || propertyType.includes('fourplex')) return 4;
  
  // For apartment/multi-family, estimate from beds
  if (propertyType.includes('apartment') || propertyType.includes('multi')) {
    // Assume average of 2 beds per unit
    const estimatedUnits = Math.max(2, Math.round(beds / 2));
    console.log(`📊 Estimated ${estimatedUnits} units from ${beds} beds`);
    return estimatedUnits;
  }
  
  // Single family default
  return 1;
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

// Legacy alias for backward compatibility
export const getPropertyRentData = getCompletePropertyData;

export default {
  getRentEstimate,
  getPropertyDetails,
  getCompletePropertyData,
  getPropertyRentData,
  getMarketStats
};