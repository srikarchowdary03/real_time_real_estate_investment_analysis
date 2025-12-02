// /**
//  * zillowAPI.js - HasData Zillow API Client
//  * 
//  * PURPOSE: On-hover enrichment for investment analysis
//  * Called ONLY when user hovers over a property card
//  * 
//  * DATA PROVIDED:
//  * - rentZestimate (CRITICAL for investment analysis)
//  * - High-quality photos (10-60 images)
//  * - zestimate (price validation)
//  * - Investment score calculation
//  * 
//  * TRIGGER: User hovers over property card
//  * RESULT: Card updates with investment badge
//  */

// import axios from 'axios';

// // ==================== CONFIGURATION ====================
// const HASDATA_API_KEY = import.meta.env.VITE_HASDATA_API_KEY;
// const BASE_URL = 'https://api.hasdata.com/scrape/zillow';

// // Rate limiting & caching
// const MIN_REQUEST_INTERVAL = 1000; // 1 second
// let lastRequestTime = 0;
// const propertyCache = new Map();
// const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// // ==================== HEADERS ====================
// const getHeaders = () => ({
//   'Content-Type': 'application/json',
//   'x-api-key': HASDATA_API_KEY
// });

// // ==================== RATE LIMITING ====================
// const waitForRateLimit = async () => {
//   const now = Date.now();
//   const timeSinceLastRequest = now - lastRequestTime;
  
//   if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
//     const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
//     await new Promise(resolve => setTimeout(resolve, waitTime));
//   }
  
//   lastRequestTime = Date.now();
// };

// // ==================== CACHE MANAGEMENT ====================
// const getCacheKey = (address, city, state, zip) => {
//   return `${address}_${city}_${state}_${zip}`.toLowerCase().replace(/\s+/g, '_');
// };

// const getFromCache = (key) => {
//   const cached = propertyCache.get(key);
//   if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
//     console.log(`✅ Cache hit: ${key}`);
//     return cached.data;
//   }
//   if (cached) propertyCache.delete(key);
//   return null;
// };

// const saveToCache = (key, data) => {
//   propertyCache.set(key, {
//     data,
//     timestamp: Date.now()
//   });
// };

// // ==================== MAIN FUNCTION: GET PROPERTY DATA ON HOVER ====================
// /**
//  * Get Zillow data when user hovers over property card
//  * This is THE function you call from your PropertyCard component
//  * 
//  * @param {Object} property - Property object from Realty-in-US
//  * @returns {Promise<Object>} Enriched data with investment score
//  */
// export const getPropertyDataOnHover = async (property) => {
//   try {
//     const { address, city, state, zip } = property;
    
//     // Check cache first
//     const cacheKey = getCacheKey(address, city, state, zip);
//     const cached = getFromCache(cacheKey);
//     if (cached) return cached;

//     console.log(`🔍 [HOVER] Fetching Zillow data for: ${address}`);

//     await waitForRateLimit();

//     // Search Zillow via HasData
//     const searchLocation = `${address}, ${city}, ${state} ${zip}`;
    
//     const response = await axios.get(`${BASE_URL}/listing`, {
//       headers: getHeaders(),
//       params: {
//         keyword: searchLocation,
//         type: 'forSale',
//         // Add filters to narrow results
//         'price[min]': Math.floor(property.price * 0.8),
//         'price[max]': Math.ceil(property.price * 1.2)
//       },
//       timeout: 15000
//     });

//     const properties = response.data?.properties || [];
    
//     if (properties.length === 0) {
//       console.warn(`⚠️ No Zillow data found for: ${address}`);
//       return createFallbackData(property);
//     }

//     // Find best match by address
//     const match = findBestMatch(properties, property);
    
//     if (!match) {
//       console.warn(`⚠️ No matching property found in Zillow results`);
//       return createFallbackData(property);
//     }

//     // Format enriched data
//     const enrichedData = {
//       // From Zillow
//       rentEstimate: match.rentZestimate || null,
//       zestimate: match.zestimate || null,
//       photos: match.photos || [],
//       daysOnZillow: match.daysOnZillow || 0,
      
//       // Original property data
//       ...property,
      
//       // Investment Analysis
//       investmentScore: null,
//       investmentBadge: null,
//       cashFlow: null,
//       roi: null,
      
//       // Metadata
//       hasZillowData: true,
//       zillowMatched: true,
//       _zillowRaw: match
//     };

//     // Calculate investment metrics
//     if (enrichedData.rentEstimate && enrichedData.price) {
//       const analysis = calculateInvestmentScore(enrichedData);
//       Object.assign(enrichedData, analysis);
//     }

//     // Cache the result
//     saveToCache(cacheKey, enrichedData);
    
//     console.log(`✅ [HOVER] Zillow data fetched:`, {
//       rent: enrichedData.rentEstimate,
//       photos: enrichedData.photos?.length || 0,
//       badge: enrichedData.investmentBadge
//     });

//     return enrichedData;

//   } catch (error) {
//     console.error('❌ Zillow fetch error:', error.message);
//     return createFallbackData(property);
//   }
// };

// // ==================== FIND BEST MATCHING PROPERTY ====================
// /**
//  * Match Zillow property to Realty property by address
//  */
// const findBestMatch = (zillowProperties, realtyProperty) => {
//   const normalizeAddress = (addr) => {
//     return addr.toLowerCase()
//       .replace(/[^\w\s]/g, '')
//       .replace(/\s+/g, ' ')
//       .trim();
//   };

//   const targetAddress = normalizeAddress(realtyProperty.address);

//   // Try exact match first
//   let match = zillowProperties.find(p => {
//     const zillowAddr = normalizeAddress(p.address?.street || p.addressRaw || '');
//     return zillowAddr === targetAddress;
//   });

//   // If no exact match, find closest by price
//   if (!match && zillowProperties.length > 0) {
//     match = zillowProperties.reduce((closest, current) => {
//       const closestDiff = Math.abs((closest.price || 0) - realtyProperty.price);
//       const currentDiff = Math.abs((current.price || 0) - realtyProperty.price);
//       return currentDiff < closestDiff ? current : closest;
//     });
//   }

//   return match;
// };

// // ==================== INVESTMENT SCORE CALCULATION ====================
// /**
//  * Calculate investment metrics and determine badge
//  * 
//  * SCORING CRITERIA:
//  * - Monthly Rent / Purchase Price Ratio (1% rule)
//  * - Cash Flow (after expenses)
//  * - Cap Rate
//  * - ROI
//  */
// const calculateInvestmentScore = (property) => {
//   const {
//     price,
//     rentEstimate,
//     beds,
//     baths,
//     sqft
//   } = property;

//   if (!rentEstimate || !price) {
//     return {
//       investmentScore: 0,
//       investmentBadge: 'insufficient-data',
//       cashFlow: null,
//       roi: null
//     };
//   }

//   // Monthly Expenses Estimation
//   const monthlyExpenses = {
//     // Mortgage (20% down, 7% interest, 30 years)
//     mortgage: calculateMortgage(price, 0.20, 0.07, 30),
    
//     // Property Tax (estimate 1.2% annual)
//     tax: (price * 0.012) / 12,
    
//     // Insurance (estimate 0.5% annual)
//     insurance: (price * 0.005) / 12,
    
//     // HOA (estimate based on property type)
//     hoa: 0, // Usually provided, default to 0
    
//     // Maintenance (1% of price annually)
//     maintenance: (price * 0.01) / 12,
    
//     // Vacancy (5% of rent)
//     vacancy: rentEstimate * 0.05,
    
//     // Property Management (8% of rent if applicable)
//     management: rentEstimate * 0.08
//   };

//   const totalMonthlyExpenses = Object.values(monthlyExpenses).reduce((a, b) => a + b, 0);
//   const monthlyCashFlow = rentEstimate - totalMonthlyExpenses;
//   const annualCashFlow = monthlyCashFlow * 12;

//   // Investment Metrics
//   const downPayment = price * 0.20;
//   const closingCosts = price * 0.03;
//   const totalInvestment = downPayment + closingCosts;

//   const cashOnCashROI = (annualCashFlow / totalInvestment) * 100;
//   const capRate = (annualCashFlow / price) * 100;
//   const onePercentRule = (rentEstimate / price) * 100;

//   // Calculate Score (0-100)
//   let score = 0;
  
//   // 1% Rule (40 points max)
//   if (onePercentRule >= 1.0) score += 40;
//   else if (onePercentRule >= 0.8) score += 30;
//   else if (onePercentRule >= 0.6) score += 20;
//   else score += 10;

//   // Cash Flow (30 points max)
//   if (monthlyCashFlow >= 500) score += 30;
//   else if (monthlyCashFlow >= 200) score += 20;
//   else if (monthlyCashFlow >= 0) score += 10;
//   else score += 0; // Negative cash flow

//   // ROI (30 points max)
//   if (cashOnCashROI >= 10) score += 30;
//   else if (cashOnCashROI >= 7) score += 20;
//   else if (cashOnCashROI >= 5) score += 10;
//   else score += 0;

//   // Determine Badge
//   let badge;
//   if (score >= 80) badge = 'excellent';      // 🟢 Excellent Deal
//   else if (score >= 60) badge = 'good';      // 🟢 Good Deal
//   else if (score >= 40) badge = 'fair';      // 🟡 Fair Deal
//   else badge = 'risky';                      // 🔴 Risky/Avoid

//   return {
//     investmentScore: Math.round(score),
//     investmentBadge: badge,
//     cashFlow: Math.round(monthlyCashFlow),
//     roi: Math.round(cashOnCashROI * 10) / 10,
    
//     // Detailed metrics (for analysis page)
//     metrics: {
//       monthlyRent: rentEstimate,
//       monthlyExpenses: Math.round(totalMonthlyExpenses),
//       monthlyCashFlow: Math.round(monthlyCashFlow),
//       annualCashFlow: Math.round(annualCashFlow),
//       cashOnCashROI: Math.round(cashOnCashROI * 10) / 10,
//       capRate: Math.round(capRate * 10) / 10,
//       onePercentRule: Math.round(onePercentRule * 100) / 100,
//       totalInvestment: Math.round(totalInvestment),
//       expenseBreakdown: {
//         mortgage: Math.round(monthlyExpenses.mortgage),
//         tax: Math.round(monthlyExpenses.tax),
//         insurance: Math.round(monthlyExpenses.insurance),
//         maintenance: Math.round(monthlyExpenses.maintenance),
//         vacancy: Math.round(monthlyExpenses.vacancy),
//         management: Math.round(monthlyExpenses.management)
//       }
//     }
//   };
// };

// // ==================== MORTGAGE CALCULATION ====================
// /**
//  * Calculate monthly mortgage payment
//  */
// const calculateMortgage = (price, downPaymentPercent, interestRate, years) => {
//   const principal = price * (1 - downPaymentPercent);
//   const monthlyRate = interestRate / 12;
//   const numberOfPayments = years * 12;
  
//   const mortgage = principal * 
//     (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
//     (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
//   return mortgage;
// };

// // ==================== FALLBACK DATA ====================
// /**
//  * Return property data with estimated rent when Zillow unavailable
//  */
// const createFallbackData = (property) => {
//   // Estimate rent using 0.8% rule as fallback
//   const estimatedRent = property.price ? Math.round(property.price * 0.008) : null;

//   const enrichedData = {
//     ...property,
//     rentEstimate: estimatedRent,
//     zestimate: null,
//     photos: [property.thumbnail],
    
//     investmentScore: 0,
//     investmentBadge: 'insufficient-data',
//     cashFlow: null,
//     roi: null,
    
//     hasZillowData: false,
//     zillowMatched: false
//   };

//   // Try to calculate with estimated rent
//   if (estimatedRent && property.price) {
//     const analysis = calculateInvestmentScore({
//       ...enrichedData,
//       rentEstimate: estimatedRent
//     });
//     Object.assign(enrichedData, analysis);
//     enrichedData.rentEstimated = true; // Flag that this is estimated
//   }

//   return enrichedData;
// };

// // ==================== UTILITY: CLEAR CACHE ====================
// export const clearCache = () => {
//   propertyCache.clear();
//   console.log('🗑️ Zillow cache cleared');
// };

// // ==================== UTILITY: GET CACHE STATS ====================
// export const getCacheStats = () => {
//   return {
//     size: propertyCache.size,
//     keys: Array.from(propertyCache.keys())
//   };
// };

// // ==================== EXPORT BADGE COLORS ====================
// export const BADGE_CONFIG = {
//   'excellent': {
//     label: 'Excellent Deal',
//     icon: '🟢',
//     color: 'bg-green-500',
//     textColor: 'text-white',
//     description: 'Outstanding investment opportunity'
//   },
//   'good': {
//     label: 'Good Deal',
//     icon: '🟢',
//     color: 'bg-green-400',
//     textColor: 'text-white',
//     description: 'Strong investment potential'
//   },
//   'fair': {
//     label: 'Fair Deal',
//     icon: '🟡',
//     color: 'bg-yellow-400',
//     textColor: 'text-gray-800',
//     description: 'Average investment opportunity'
//   },
//   'risky': {
//     label: 'Risky',
//     icon: '🔴',
//     color: 'bg-red-500',
//     textColor: 'text-white',
//     description: 'High risk - proceed with caution'
//   },
//   'insufficient-data': {
//     label: 'Analyzing...',
//     icon: '⏳',
//     color: 'bg-gray-400',
//     textColor: 'text-white',
//     description: 'Insufficient data for analysis'
//   }
// };

// // ==================== EXPORT ALL ====================
// export default {
//   getPropertyDataOnHover,
//   clearCache,
//   getCacheStats,
//   BADGE_CONFIG
// };