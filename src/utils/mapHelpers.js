// src/utils/mapHelpers.js
// Map utilities with investment score-based colors - NO CLUSTERING

// ===== INVESTMENT SCORE CALCULATION =====
// Score based on actual property characteristics that vary
export const calculateInvestmentScore = (property) => {
  const price = property.list_price || property.price || 0;
  const beds = property.description?.beds || property.beds || 0;
  const baths = property.description?.baths || property.baths || 0;
  const sqft = property.description?.sqft || property.sqft || 0;
  const lotSqft = property.description?.lot_sqft || property.lot_sqft || 0;
  const yearBuilt = property.description?.year_built || property.year_built || 0;
  const propertyType = property.description?.type || property.type || '';
  
  if (!price || price <= 0) return 50;
  
  let score = 50; // Base score
  
  // === 1. PRICE PER SQFT SCORING (Lower = Better for investment) ===
  if (sqft > 0) {
    const pricePerSqft = price / sqft;
    if (pricePerSqft < 100) score += 20;        // Excellent value
    else if (pricePerSqft < 150) score += 15;   // Great value
    else if (pricePerSqft < 200) score += 10;   // Good value
    else if (pricePerSqft < 250) score += 5;    // Fair value
    else if (pricePerSqft < 300) score += 0;    // Average
    else if (pricePerSqft < 400) score -= 5;    // Above average price
    else if (pricePerSqft < 500) score -= 10;   // Expensive
    else score -= 15;                            // Very expensive
  }
  
  // === 2. BEDROOM VALUE SCORING (More beds per $100k = Better) ===
  if (beds > 0 && price > 0) {
    const bedsPerHundredK = beds / (price / 100000);
    if (bedsPerHundredK >= 1.5) score += 15;     // Excellent bed/price ratio
    else if (bedsPerHundredK >= 1.0) score += 10;
    else if (bedsPerHundredK >= 0.7) score += 5;
    else if (bedsPerHundredK >= 0.5) score += 0;
    else if (bedsPerHundredK >= 0.3) score -= 5;
    else score -= 10;                            // Few beds for price
  }
  
  // === 3. RENT POTENTIAL SCORING (Based on realistic rent estimates) ===
  // Rent-to-price ratio varies by price range (lower priced = higher ratio)
  let rentMultiplier;
  if (price < 150000) rentMultiplier = 0.009;      // 0.9% for cheap properties
  else if (price < 250000) rentMultiplier = 0.008; // 0.8%
  else if (price < 400000) rentMultiplier = 0.007; // 0.7%
  else if (price < 600000) rentMultiplier = 0.006; // 0.6%
  else if (price < 1000000) rentMultiplier = 0.005; // 0.5%
  else rentMultiplier = 0.004;                      // 0.4% for expensive
  
  // Adjust for bedrooms (more beds = more rent potential)
  if (beds >= 4) rentMultiplier *= 1.15;
  else if (beds >= 3) rentMultiplier *= 1.08;
  else if (beds <= 1) rentMultiplier *= 0.85;
  
  const estimatedRent = price * rentMultiplier;
  const grossYield = (estimatedRent * 12 / price) * 100;
  
  // Score based on gross yield
  if (grossYield >= 12) score += 15;
  else if (grossYield >= 10) score += 10;
  else if (grossYield >= 8) score += 5;
  else if (grossYield >= 6) score += 0;
  else if (grossYield >= 5) score -= 5;
  else score -= 10;
  
  // === 4. PROPERTY SIZE BONUS ===
  if (sqft >= 2500) score += 5;       // Large home - more rental appeal
  else if (sqft >= 1800) score += 3;
  else if (sqft < 800) score -= 5;    // Very small - limited appeal
  
  // === 5. MULTI-UNIT BONUS ===
  const typeStr = (propertyType || '').toLowerCase();
  if (typeStr.includes('multi') || typeStr.includes('duplex') || 
      typeStr.includes('triplex') || typeStr.includes('fourplex')) {
    score += 15; // Multi-family is great for investment
  } else if (typeStr.includes('townhouse') || typeStr.includes('condo')) {
    score -= 5; // HOA fees reduce cash flow
  }
  
  // === 6. AGE CONSIDERATION ===
  const currentYear = new Date().getFullYear();
  if (yearBuilt > 0) {
    const age = currentYear - yearBuilt;
    if (age <= 5) score += 5;          // New - less maintenance
    else if (age <= 15) score += 3;    // Relatively new
    else if (age >= 50) score -= 5;    // Old - more maintenance
    else if (age >= 80) score -= 10;   // Very old
  }
  
  // === 7. PRICE RANGE SWEET SPOT ===
  // Mid-range properties often have best rent-to-price ratios
  if (price >= 150000 && price <= 350000) {
    score += 5; // Sweet spot for rentals
  } else if (price < 100000) {
    score += 3; // Cheap but potentially high yield
  } else if (price > 750000) {
    score -= 5; // Luxury - harder to cash flow
  }
  
  // Clamp score between 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
};

// ===== SCORE-BASED COLORS =====
export const SCORE_COLORS = {
  EXCELLENT: '#10B981', // Emerald (80-100)
  GOOD: '#22C55E',      // Green (65-79)
  FAIR: '#EAB308',      // Yellow (50-64)
  RISKY: '#F97316',     // Orange (35-49)
  POOR: '#EF4444',      // Red (0-34)
};

export const getScoreColor = (score) => {
  if (score >= 80) return SCORE_COLORS.EXCELLENT;
  if (score >= 65) return SCORE_COLORS.GOOD;
  if (score >= 50) return SCORE_COLORS.FAIR;
  if (score >= 35) return SCORE_COLORS.RISKY;
  return SCORE_COLORS.POOR;
};

export const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 35) return 'Risky';
  return 'Poor';
};

export const getScoreConfig = (score) => ({
  color: getScoreColor(score),
  label: getScoreLabel(score),
  score: score,
});

// ===== MARKER STYLES =====
export const createMarkerStyle = (score, isSelected = false, isInBoundary = false) => {
  const color = getScoreColor(score);
  const size = isSelected ? 36 : 28;
  const borderWidth = isSelected ? 3 : isInBoundary ? 3 : 2;
  const borderColor = isInBoundary ? '#3B82F6' : 'white';
  const shadow = isSelected 
    ? '0 4px 12px rgba(0,0,0,0.4)' 
    : '0 2px 6px rgba(0,0,0,0.3)';
  
  return {
    width: ${size}px,
    height: ${size}px,
    backgroundColor: color,
    borderRadius: '50% 50% 50% 0',
    transform: 'rotate(-45deg)',
    border: ${borderWidth}px solid ${borderColor},
    boxShadow: shadow,
  };
};

// ===== FORMAT UTILITIES =====
export const formatPrice = (price) => {
  if (!price) return 'N/A';
  if (price >= 1000000) return $${(price / 1000000).toFixed(1)}M;
  if (price >= 1000) return $${(price / 1000).toFixed(0)}K;
  return $${price.toLocaleString()};
};

export const formatPriceShort = (price) => {
  if (!price) return 'N/A';
  if (price >= 1000000) return ${(price / 1000000).toFixed(1)}M;
  if (price >= 1000) return ${(price / 1000).toFixed(0)}K;
  return price.toLocaleString();
};

// ===== MAP BOUNDS =====
export const getMapBounds = (properties) => {
  if (!properties || properties.length === 0) return null;

  const validProperties = properties.filter(p => {
    const lat = p.location?.address?.coordinate?.lat || p.lat;
    const lng = p.location?.address?.coordinate?.lon || p.lon;
    return lat && lng;
  });

  if (validProperties.length === 0) return null;

  const lats = validProperties.map(p => p.location?.address?.coordinate?.lat || p.lat);
  const lngs = validProperties.map(p => p.location?.address?.coordinate?.lon || p.lon);

  return {
    sw: [Math.min(...lats), Math.min(...lngs)],
    ne: [Math.max(...lats), Math.max(...lngs)],
    center: [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ],
  };
};

export const getMapCenter = (properties, defaultCenter = [42.3601, -71.0589]) => {
  if (!properties || properties.length === 0) return defaultCenter;

  const bounds = getMapBounds(properties);
  if (!bounds) return defaultCenter;

  return bounds.center;
};

// ===== PROPERTY COORDINATES =====
export const getPropertyCoordinates = (property) => {
  const lat = property.location?.address?.coordinate?.lat || property.lat;
  const lng = property.location?.address?.coordinate?.lon || property.lon;
  
  if (!lat || !lng) return null;
  
  return { lat, lng };
};

export const hasValidCoordinates = (property) => {
  return getPropertyCoordinates(property) !== null;
};

// ===== LEGEND CONFIG =====
export const SCORE_LEGEND = [
  { range: '80-100', label: 'Excellent', color: SCORE_COLORS.EXCELLENT, description: 'Strong investment' },
  { range: '65-79', label: 'Good', color: SCORE_COLORS.GOOD, description: 'Above average' },
  { range: '50-64', label: 'Fair', color: SCORE_COLORS.FAIR, description: 'Average returns' },
  { range: '35-49', label: 'Risky', color: SCORE_COLORS.RISKY, description: 'Below average' },
  { range: '0-34', label: 'Poor', color: SCORE_COLORS.POOR, description: 'Not recommended' },
];

export default {
  calculateInvestmentScore,
  getScoreColor,
  getScoreLabel,
  getScoreConfig,
  createMarkerStyle,
  formatPrice,
  formatPriceShort,
  getMapBounds,
  getMapCenter,
  getPropertyCoordinates,
  hasValidCoordinates,
  SCORE_COLORS,
  SCORE_LEGEND,
};