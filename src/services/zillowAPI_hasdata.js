/**
 * zillowAPI.js - HasData Zillow API Client - FIXED & ENHANCED
 * 
 * IMPROVEMENTS:
 * - Multi-source rent estimation (Zillow + Rental Comps)
 * - Modern scoring (Cash-on-Cash, Cap Rate, DSCR)
 * - Confidence levels for rent estimates
 * - Fixed dangerous price→rent fallback
 * - Rental comps validation
 * - Added borderColor to BADGE_CONFIG
 */

import axios from 'axios';

// ==================== CONFIGURATION ====================
const HASDATA_API_KEY = import.meta.env.VITE_HASDATA_API_KEY;
const BASE_URL = 'https://api.hasdata.com/scrape/zillow';

// Rate limiting & caching
const MIN_REQUEST_INTERVAL = 1000; // 1 second
let lastRequestTime = 0;
const propertyCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ==================== HEADERS ====================
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-key': HASDATA_API_KEY
});

// ==================== RATE LIMITING ====================
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
};

// ==================== CACHE MANAGEMENT ====================
const getCacheKey = (address, city, state, zip) => {
  return `${address}_${city}_${state}_${zip}`.toLowerCase().replace(/\s+/g, '_');
};

const getFromCache = (key) => {
  const cached = propertyCache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    console.log(`✅ Cache hit: ${key}`);
    return cached.data;
  }
  if (cached) propertyCache.delete(key);
  return null;
};

const saveToCache = (key, data) => {
  propertyCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// ==================== MAIN FUNCTION: GET PROPERTY DATA ON HOVER ====================
/**
 * Get Zillow data when user hovers over property card
 * ENHANCED: Multi-source rent estimation with validation
 * 
 * @param {Object} property - Property object from Realty-in-US
 * @returns {Promise<Object>} Enriched data with investment score
 */
export const getPropertyDataOnHover = async (property) => {
  try {
    const { address, city, state, zip, price } = property;
    
    // Check cache first
    const cacheKey = getCacheKey(address, city, state, zip);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    console.log(`🔍 [HOVER] Fetching Zillow data for: ${address}`);

    await waitForRateLimit();

    // STEP 1: Get FOR SALE property details
    const saleProperty = await fetchForSaleProperty(address, city, state, zip, price);
    
    if (!saleProperty) {
      console.warn(`⚠️ No Zillow data found for: ${address}`);
      return createFallbackData(property);
    }

    console.log('📊 Zillow FOR SALE property found:', {
      address: saleProperty.addressRaw || saleProperty.address?.street,
      price: saleProperty.price,
      rentZestimate: saleProperty.rentZestimate,
      photos: saleProperty.photos?.length || 0
    });

    // STEP 2: Get rental comps for validation (if no rentZestimate)
    let rentEstimate = null;
    let rentConfidence = 'unknown';
    let rentSource = 'none';

    if (saleProperty.rentZestimate) {
      rentEstimate = saleProperty.rentZestimate;
      rentSource = 'zillow';
      rentConfidence = 'medium';
      console.log(`💰 Using Zillow rentZestimate: $${rentEstimate}`);
    }

    // Always try to get rental comps for validation
    try {
      const rentalComps = await fetchRentalComps(city, state, zip, saleProperty);
      
      if (rentalComps && rentalComps.length > 0) {
        const compsMedianRent = calculateMedianRent(rentalComps);
        console.log(`🏘️ Found ${rentalComps.length} rental comps, median: $${compsMedianRent}`);
        
        if (rentEstimate) {
          // Validate Zillow with comps
          const agreement = Math.abs(rentEstimate - compsMedianRent) / rentEstimate;
          
          if (agreement < 0.10) {
            // Sources agree within 10%
            rentConfidence = 'high';
            console.log(`✅ High confidence: Zillow and comps agree within 10%`);
          } else if (agreement < 0.20) {
            // Sources agree within 20%
            rentConfidence = 'medium';
            // Weight both sources: 60% Zillow, 40% comps
            rentEstimate = Math.round(rentEstimate * 0.6 + compsMedianRent * 0.4);
            console.log(`📊 Medium confidence: Using weighted average $${rentEstimate}`);
          } else {
            // Sources disagree significantly
            rentConfidence = 'low';
            rentEstimate = Math.round(rentEstimate * 0.5 + compsMedianRent * 0.5);
            console.log(`⚠️ Low confidence: Large variance, using 50/50 blend $${rentEstimate}`);
          }
        } else {
          // No Zillow estimate, use comps
          rentEstimate = compsMedianRent;
          rentSource = 'comps';
          rentConfidence = rentalComps.length >= 3 ? 'medium' : 'low';
          console.log(`🏘️ Using rental comps (no Zillow data): $${rentEstimate}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch rental comps:', error.message);
    }

    // STEP 3: If still no rent, use algorithm-based estimate (NOT sale price!)
    if (!rentEstimate) {
      rentEstimate = estimateRentFromFeatures(saleProperty, city, state);
      rentSource = 'algorithm';
      rentConfidence = 'low';
      console.log(`🧮 Using algorithm-based estimate: $${rentEstimate}`);
    }

    // Format enriched data
    const enrichedData = {
      // From Zillow
      rentEstimate: rentEstimate,
      rentConfidence: rentConfidence, // ✅ NEW: Confidence level
      rentSource: rentSource,         // ✅ NEW: Data source
      zestimate: saleProperty.price || null,
      photos: saleProperty.photos || [],
      daysOnZillow: saleProperty.daysOnZillow || 0,
      
      // Additional Zillow data
      beds: saleProperty.beds || property.beds,
      baths: saleProperty.baths || property.baths,
      sqft: saleProperty.area || property.sqft,
      yearBuilt: saleProperty.yearBuilt,
      homeType: saleProperty.homeType,
      description: saleProperty.description,
      
      // Tax data if available
      taxData: saleProperty.taxData || null,
      insurance: saleProperty.insurance || null,
      
      // Original property data
      ...property,
      
      // ✅ FIXED: Use high-quality Zillow image
      thumbnail: saleProperty.image || saleProperty.photos?.[0] || property.thumbnail,
      
      // Investment Analysis (calculated below)
      investmentScore: null,
      investmentBadge: null,
      cashFlow: null,
      roi: null,
      
      // Metadata
      hasZillowData: true,
      zillowMatched: true,
      _zillowRaw: saleProperty
    };

    // Calculate investment metrics with MODERN SCORING
    if (enrichedData.rentEstimate && enrichedData.price) {
      const analysis = calculateModernInvestmentScore(enrichedData);
      Object.assign(enrichedData, analysis);
    }

    // Cache the result
    saveToCache(cacheKey, enrichedData);
    
    console.log(`✅ [HOVER] Analysis complete:`, {
      rent: enrichedData.rentEstimate,
      confidence: enrichedData.rentConfidence,
      source: enrichedData.rentSource,
      photos: enrichedData.photos?.length || 0,
      badge: enrichedData.investmentBadge,
      score: enrichedData.investmentScore
    });

    return enrichedData;

  } catch (error) {
    console.error('❌ Zillow fetch error:', error.message);
    if (error.response) {
      console.error('📦 Response data:', error.response.data);
      console.error('📊 Response status:', error.response.status);
    }
    return createFallbackData(property);
  }
};

// ==================== FETCH FOR SALE PROPERTY ====================
/**
 * Fetch the FOR SALE property from Zillow
 */
const fetchForSaleProperty = async (address, city, state, zip, price) => {
  try {
    const searchLocation = `${address}, ${city}, ${state} ${zip}`;
    
    const response = await axios.get(`${BASE_URL}/listing`, {
      headers: getHeaders(),
      params: {
        keyword: searchLocation,
        type: 'forSale',
        'price[min]': Math.floor(price * 0.8),
        'price[max]': Math.ceil(price * 1.2)
      },
      timeout: 15000
    });

    return response.data?.property || null;
  } catch (error) {
    console.error('❌ Error fetching FOR SALE property:', error.message);
    return null;
  }
};

// ==================== FETCH RENTAL COMPS ====================
/**
 * Fetch rental comps for validation
 * Search for similar FOR RENT properties in same area
 */
const fetchRentalComps = async (city, state, zip, saleProperty) => {
  try {
    await waitForRateLimit(); // Respect rate limits

    const response = await axios.get(`${BASE_URL}/listing`, {
      headers: getHeaders(),
      params: {
        keyword: `${city}, ${state} ${zip}`,
        type: 'forRent', // ✅ Search FOR RENT properties
        beds: saleProperty.beds || 2,
        baths: saleProperty.baths || 1,
        // Get properties within similar size
        'sqft[min]': saleProperty.area ? Math.floor(saleProperty.area * 0.8) : undefined,
        'sqft[max]': saleProperty.area ? Math.ceil(saleProperty.area * 1.2) : undefined,
      },
      timeout: 15000
    });

    // API might return single property or array
    const property = response.data?.property;
    if (property && property.price) {
      return [property]; // Return as array for consistency
    }

    return [];
  } catch (error) {
    console.warn('⚠️ Could not fetch rental comps:', error.message);
    return [];
  }
};

// ==================== CALCULATE MEDIAN RENT ====================
/**
 * Calculate median rent from rental comps
 */
const calculateMedianRent = (rentalComps) => {
  if (!rentalComps || rentalComps.length === 0) return null;
  
  const rents = rentalComps
    .map(comp => comp.price)
    .filter(price => price && price > 0)
    .sort((a, b) => a - b);
  
  if (rents.length === 0) return null;
  
  const mid = Math.floor(rents.length / 2);
  return rents.length % 2 === 0 
    ? Math.round((rents[mid - 1] + rents[mid]) / 2)
    : rents[mid];
};

// ==================== ESTIMATE RENT FROM FEATURES ====================
/**
 * Algorithm-based rent estimation using property features
 * Based on national averages and property characteristics
 */
const estimateRentFromFeatures = (property, city, state) => {
  const { beds, baths, area: sqft, price } = property;
  
  // Base rent per bedroom (national average)
  const baseRentPerBed = {
    1: 1200,
    2: 1500,
    3: 1800,
    4: 2200,
    5: 2600
  };
  
  let estimatedRent = baseRentPerBed[beds] || (beds * 600);
  
  // Adjust for bathrooms (add $100-150 per bath)
  if (baths) {
    estimatedRent += (baths - 1) * 125;
  }
  
  // Adjust for square footage (if available)
  if (sqft) {
    // National average: $1.20-1.50 per sqft for rent
    const sqftRent = sqft * 1.35;
    // Blend with bedroom-based estimate
    estimatedRent = Math.round((estimatedRent + sqftRent) / 2);
  }
  
  // ✅ CRITICAL: Cap at reasonable percentage of price (never use price directly!)
  // Typical rent is 0.7-0.9% of home value monthly
  if (price) {
    const maxReasonableRent = Math.round(price * 0.009); // 0.9% of price
    const minReasonableRent = Math.round(price * 0.005); // 0.5% of price
    
    estimatedRent = Math.max(minReasonableRent, Math.min(estimatedRent, maxReasonableRent));
  }
  
  return Math.round(estimatedRent);
};

// ==================== MODERN INVESTMENT SCORING ====================
/**
 * ENHANCED: Modern multi-metric scoring system
 * Replaces outdated 1% rule with DealCheck-style analysis
 * 
 * METRICS USED:
 * 1. Cash-on-Cash Return (35 points) - Year 1 return on investment
 * 2. Cap Rate (25 points) - NOI / Purchase Price
 * 3. DSCR (20 points) - Debt Service Coverage Ratio
 * 4. Monthly Cash Flow (20 points) - Dollars per month
 */
const calculateModernInvestmentScore = (property) => {
  const {
    price,
    rentEstimate,
    beds,
    baths,
    sqft
  } = property;

  if (!rentEstimate || !price) {
    return {
      investmentScore: 0,
      investmentBadge: 'insufficient-data',
      cashFlow: null,
      roi: null
    };
  }

  // ==================== CALCULATE EXPENSES ====================
  const monthlyExpenses = {
    // Mortgage (20% down, 7% interest, 30 years)
    mortgage: calculateMortgage(price, 0.20, 0.07, 30),
    
    // Property Tax (estimate 1.2% annual)
    propertyTax: (price * 0.012) / 12,
    
    // Insurance (estimate 0.5% annual)
    insurance: (price * 0.005) / 12,
    
    // Maintenance (1% of price annually = 8.33% of rent)
    maintenance: (price * 0.01) / 12,
    
    // Vacancy (5% of rent)
    vacancy: rentEstimate * 0.05,
    
    // Property Management (10% of rent)
    management: rentEstimate * 0.10,
    
    // HOA (if applicable - default 0)
    hoa: 0
  };

  const totalMonthlyExpenses = Object.values(monthlyExpenses).reduce((a, b) => a + b, 0);
  const monthlyCashFlow = rentEstimate - totalMonthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;

  // ==================== CALCULATE METRICS ====================
  
  // 1. NOI (Net Operating Income) - Income minus non-mortgage expenses
  const annualNOI = (rentEstimate * 12) - 
    ((monthlyExpenses.propertyTax + monthlyExpenses.insurance + 
      monthlyExpenses.maintenance + monthlyExpenses.vacancy + 
      monthlyExpenses.management + monthlyExpenses.hoa) * 12);
  
  // 2. Cap Rate = NOI / Purchase Price
  const capRate = (annualNOI / price) * 100;
  
  // 3. Total Investment (down payment + closing costs)
  const downPayment = price * 0.20;
  const closingCosts = price * 0.03;
  const totalInvestment = downPayment + closingCosts;
  
  // 4. Cash-on-Cash Return = Annual Cash Flow / Total Investment
  const cashOnCashReturn = (annualCashFlow / totalInvestment) * 100;
  
  // 5. DSCR (Debt Service Coverage Ratio) = NOI / Annual Debt Service
  const annualDebtService = monthlyExpenses.mortgage * 12;
  const dscr = annualDebtService > 0 ? annualNOI / annualDebtService : 0;

  // 6. 1% Rule
  const onePercentRule = (rentEstimate / price) * 100;

  // ==================== MODERN SCORING SYSTEM ====================
  let score = 0;
  
  // METRIC 1: Cash-on-Cash Return (35 points max)
  if (cashOnCashReturn >= 12) score += 35;      // Excellent: 12%+
  else if (cashOnCashReturn >= 8) score += 28;  // Great: 8-12%
  else if (cashOnCashReturn >= 5) score += 20;  // Good: 5-8%
  else if (cashOnCashReturn >= 2) score += 10;  // Fair: 2-5%
  else if (cashOnCashReturn >= 0) score += 5;   // Break-even: 0-2%
  else score += 0;                               // Negative: 0 points

  // METRIC 2: Cap Rate (25 points max)
  if (capRate >= 8) score += 25;          // Excellent: 8%+
  else if (capRate >= 6) score += 20;     // Great: 6-8%
  else if (capRate >= 4) score += 15;     // Good: 4-6%
  else if (capRate >= 2) score += 8;      // Fair: 2-4%
  else score += 0;                        // Poor: <2%

  // METRIC 3: DSCR (20 points max)
  if (dscr >= 1.5) score += 20;          // Excellent: 1.5+
  else if (dscr >= 1.25) score += 16;    // Great: 1.25-1.5
  else if (dscr >= 1.1) score += 12;     // Good: 1.1-1.25
  else if (dscr >= 1.0) score += 6;      // Marginal: 1.0-1.1
  else score += 0;                        // Risky: <1.0

  // METRIC 4: Monthly Cash Flow (20 points max)
  if (monthlyCashFlow >= 500) score += 20;      // Excellent: $500+
  else if (monthlyCashFlow >= 300) score += 16; // Great: $300-500
  else if (monthlyCashFlow >= 150) score += 12; // Good: $150-300
  else if (monthlyCashFlow >= 50) score += 6;   // Fair: $50-150
  else if (monthlyCashFlow >= 0) score += 2;    // Break-even: $0-50
  else score += 0;                               // Negative: 0 points

  // ==================== DETERMINE BADGE ====================
  let badge;
  let badgeDescription;
  
  if (score >= 85) {
    badge = 'excellent';
    badgeDescription = 'Outstanding investment - Multiple strong metrics';
  } else if (score >= 70) {
    badge = 'good';
    badgeDescription = 'Strong investment - Good returns expected';
  } else if (score >= 50) {
    badge = 'fair';
    badgeDescription = 'Average investment - Moderate returns';
  } else if (score >= 30) {
    badge = 'risky';
    badgeDescription = 'Below-average investment - Proceed with caution';
  } else {
    badge = 'avoid';
    badgeDescription = 'Poor investment - High risk, low returns';
  }

  return {
    investmentScore: Math.round(score),
    investmentBadge: badge,
    badgeDescription: badgeDescription,
    cashFlow: Math.round(monthlyCashFlow),
    roi: Math.round(cashOnCashReturn * 10) / 10,
    
    // ✅ ENHANCED: Detailed metrics for analysis page
    metrics: {
      // Income
      monthlyRent: rentEstimate,
      annualRent: rentEstimate * 12,
      
      // Key Performance Indicators
      cashOnCashReturn: Math.round(cashOnCashReturn * 10) / 10,
      capRate: Math.round(capRate * 10) / 10,
      dscr: Math.round(dscr * 100) / 100,
      onePercentRule: Math.round(onePercentRule * 100) / 100,
      
      // Cash Flow
      monthlyCashFlow: Math.round(monthlyCashFlow),
      annualCashFlow: Math.round(annualCashFlow),
      
      // NOI
      monthlyNOI: Math.round(annualNOI / 12),
      annualNOI: Math.round(annualNOI),
      
      // Investment
      totalInvestment: Math.round(totalInvestment),
      downPayment: Math.round(downPayment),
      closingCosts: Math.round(closingCosts),
      
      // Expenses
      monthlyExpenses: Math.round(totalMonthlyExpenses),
      annualExpenses: Math.round(totalMonthlyExpenses * 12),
      expenseBreakdown: {
        mortgage: Math.round(monthlyExpenses.mortgage),
        propertyTax: Math.round(monthlyExpenses.propertyTax),
        insurance: Math.round(monthlyExpenses.insurance),
        maintenance: Math.round(monthlyExpenses.maintenance),
        vacancy: Math.round(monthlyExpenses.vacancy),
        management: Math.round(monthlyExpenses.management),
        hoa: Math.round(monthlyExpenses.hoa)
      }
    }
  };
};

// ==================== MORTGAGE CALCULATION ====================
const calculateMortgage = (price, downPaymentPercent, interestRate, years) => {
  const principal = price * (1 - downPaymentPercent);
  const monthlyRate = interestRate / 12;
  const numberOfPayments = years * 12;
  
  if (monthlyRate === 0) return principal / numberOfPayments;
  
  const mortgage = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  return mortgage;
};

// ==================== FALLBACK DATA ====================
const createFallbackData = (property) => {
  // Use algorithm-based estimate (NOT 0.8% rule!)
  const estimatedRent = estimateRentFromFeatures(property, property.city, property.state);

  const enrichedData = {
    ...property,
    rentEstimate: estimatedRent,
    rentConfidence: 'low',
    rentSource: 'algorithm',
    zestimate: null,
    photos: property.photos || [property.thumbnail],
    
    investmentScore: 0,
    investmentBadge: 'insufficient-data',
    badgeDescription: 'Limited data - Analysis based on estimates',
    cashFlow: null,
    roi: null,
    
    hasZillowData: false,
    zillowMatched: false
  };

  // Calculate with estimated rent
  if (estimatedRent && property.price) {
    const analysis = calculateModernInvestmentScore({
      ...enrichedData,
      rentEstimate: estimatedRent
    });
    Object.assign(enrichedData, analysis);
    enrichedData.rentEstimated = true;
  }

  return enrichedData;
};

// ==================== UTILITY FUNCTIONS ====================
export const clearCache = () => {
  propertyCache.clear();
  console.log('🗑️ Zillow cache cleared');
};

export const getCacheStats = () => {
  return {
    size: propertyCache.size,
    keys: Array.from(propertyCache.keys())
  };
};

// ==================== BADGE CONFIGURATION ====================
// FIX: Added borderColor for each badge
export const BADGE_CONFIG = {
  'excellent': {
    label: 'Excellent Deal',
    icon: '🟢',
    color: 'bg-green-500',
    textColor: 'text-white',
    borderColor: '#22c55e',
    description: 'Outstanding investment opportunity'
  },
  'good': {
    label: 'Good Deal',
    icon: '🟢',
    color: 'bg-green-400',
    textColor: 'text-white',
    borderColor: '#4ade80',
    description: 'Strong investment potential'
  },
  'fair': {
    label: 'Fair Deal',
    icon: '🟡',
    color: 'bg-yellow-400',
    textColor: 'text-gray-800',
    borderColor: '#facc15',
    description: 'Average investment opportunity'
  },
  'risky': {
    label: 'Risky',
    icon: '🔴',
    color: 'bg-red-500',
    textColor: 'text-white',
    borderColor: '#ef4444',
    description: 'Below-average - Proceed with caution'
  },
  'avoid': {
    label: 'Avoid',
    icon: '🔴',
    color: 'bg-red-700',
    textColor: 'text-white',
    borderColor: '#b91c1c',
    description: 'Poor investment - High risk'
  },
  'insufficient-data': {
    label: 'Analyzing...',
    icon: '⏳',
    color: 'bg-gray-400',
    textColor: 'text-white',
    borderColor: '#9ca3af',
    description: 'Insufficient data for analysis'
  }
};

// ==================== EXPORT ====================
export default {
  getPropertyDataOnHover,
  clearCache,
  getCacheStats,
  BADGE_CONFIG
};