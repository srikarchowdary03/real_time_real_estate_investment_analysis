import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed, Bath, Square, MapPin, TrendingUp, Heart, Building2 } from 'lucide-react';
import { saveProperty, unsaveProperty, isPropertySaved } from '../../services/database';
import { useAuth } from '../../hooks/useAuth';

/**
 * PropertyCard Component
 * 
 * FIXED: No Firebase calls without auth check
 * - Only calls isPropertySaved if user is logged in
 * - No getInvestorProfile calls per card (profile loaded once at app level)
 */
const PropertyCard = ({ 
  property, 
  isSelected = false,
  onHover,
  isExpanded = false,
  onExpand,
  // Optionally pass in rent data if already loaded
  rentData = null
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Extract property data with fallbacks
  const address = property.location?.address?.line || property.address || 'Address not available';
  const city = property.location?.address?.city || property.city || '';
  const state = property.location?.address?.state_code || property.state || '';
  const zipCode = property.location?.address?.postal_code || property.zip || '';
  const price = property.list_price || property.price || 0;
  const beds = property.description?.beds || property.beds || 0;
  const baths = property.description?.baths || property.baths || 0;
  const sqft = property.description?.sqft || property.sqft || 0;
  const propertyType = property.description?.type || property.propertyType || '';

  // Detect multi-family from property type
  const isMultiFamily = useMemo(() => {
    const type = propertyType.toLowerCase();
    return type.includes('multi') || type.includes('duplex') || 
           type.includes('triplex') || type.includes('fourplex') ||
           type.includes('apartment');
  }, [propertyType]);

  // Get the best available image
  const imageUrl = useMemo(() => {
    if (imageError) return 'https://placehold.co/640x480/e2e8f0/64748b?text=No+Image';
    
    return property.primaryPhoto ||
           property.thumbnail ||
           property.primary_photo?.href ||
           property.photos?.[0]?.href ||
           'https://placehold.co/640x480/e2e8f0/64748b?text=No+Image';
  }, [property, imageError]);

  // ===== FORMULA-BASED RENT ESTIMATE (No API) =====
  const estimateRent = useMemo(() => {
    // If we have rent data passed in, use that
    if (rentData?.totalMonthlyRent) return rentData.totalMonthlyRent;
    if (rentData?.rentEstimate) return rentData.rentEstimate;
    
    if (!price || price <= 0) return 0;
    
    // Rent-to-price ratio varies by price range
    let rentMultiplier;
    if (price < 150000) rentMultiplier = 0.009;
    else if (price < 250000) rentMultiplier = 0.008;
    else if (price < 400000) rentMultiplier = 0.007;
    else if (price < 600000) rentMultiplier = 0.006;
    else if (price < 1000000) rentMultiplier = 0.005;
    else rentMultiplier = 0.004;
    
    let estimate = price * rentMultiplier;
    
    // Bedroom adjustments
    if (beds >= 4) estimate *= 1.15;
    else if (beds >= 3) estimate *= 1.08;
    else if (beds <= 1) estimate *= 0.85;
    
    // Square footage adjustments
    if (sqft > 2500) estimate *= 1.08;
    else if (sqft > 2000) estimate *= 1.05;
    else if (sqft < 1000) estimate *= 0.92;
    
    return Math.round(estimate / 50) * 50;
  }, [price, beds, sqft, rentData]);

  // ===== QUICK INVESTMENT METRICS =====
  const quickMetrics = useMemo(() => {
    if (!price || !estimateRent) return null;

    const grossYield = ((estimateRent * 12) / price) * 100;
    
    // Simple cash flow estimate
    const monthlyMortgage = (price * 0.80) * 0.006;
    const monthlyExpenses = (price * 0.012 / 12) + (price * 0.004 / 12);
    const monthlyCashFlow = estimateRent - monthlyMortgage - monthlyExpenses - (estimateRent * 0.18);
    
    // Cap rate (simplified)
    const annualNOI = (estimateRent * 12) * 0.65;
    const capRate = (annualNOI / price) * 100;

    // Score calculation
    let score = 50;
    
    // Price per sqft scoring
    if (sqft > 0) {
      const pricePerSqft = price / sqft;
      if (pricePerSqft < 100) score += 15;
      else if (pricePerSqft < 150) score += 10;
      else if (pricePerSqft < 200) score += 5;
      else if (pricePerSqft >= 400) score -= 10;
      else if (pricePerSqft >= 300) score -= 5;
    }
    
    // Gross yield scoring
    if (grossYield >= 12) score += 15;
    else if (grossYield >= 10) score += 10;
    else if (grossYield >= 8) score += 5;
    else if (grossYield < 5) score -= 10;
    
    // Bedroom value scoring
    if (beds > 0) {
      const bedsPerHundredK = beds / (price / 100000);
      if (bedsPerHundredK >= 1.5) score += 10;
      else if (bedsPerHundredK >= 1.0) score += 5;
      else if (bedsPerHundredK < 0.3) score -= 10;
    }
    
    // Price range sweet spot
    if (price >= 150000 && price <= 350000) score += 5;
    else if (price > 750000) score -= 5;
    
    score = Math.max(0, Math.min(100, Math.round(score)));

    let label, color;
    if (score >= 80) { label = 'Excellent'; color = 'emerald'; }
    else if (score >= 65) { label = 'Good'; color = 'green'; }
    else if (score >= 50) { label = 'Fair'; color = 'yellow'; }
    else if (score >= 35) { label = 'Risky'; color = 'orange'; }
    else { label = 'Poor'; color = 'red'; }

    return {
      grossYield,
      capRate,
      monthlyCashFlow,
      score,
      label,
      color
    };
  }, [price, estimateRent, beds, sqft]);

  // ===== CHECK IF SAVED - ONLY IF LOGGED IN =====
  useEffect(() => {
    const checkSaved = async () => {
      // CRITICAL: Only check if user is actually logged in
      if (!currentUser?.uid || !property.property_id) {
        setIsSaved(false);
        return;
      }
      
      try {
        const saved = await isPropertySaved(currentUser.uid, property.property_id);
        setIsSaved(saved);
      } catch (error) {
        // Silently fail - don't spam console
        setIsSaved(false);
      }
    };
    
    checkSaved();
  }, [currentUser?.uid, property.property_id]);

  // Format functions
  const formatPrice = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle card click - open expanded view
  const handleCardClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onExpand) {
      onExpand();
    }
  };

  // Handle mouse enter
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onHover) onHover();
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Handle save
  const handleSaveClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      navigate('/signin');
      return;
    }

    setSaving(true);
    try {
      const propertyData = {
        property_id: property.property_id,
        address,
        city,
        state,
        zip: zipCode,
        price,
        beds,
        baths,
        sqft,
        thumbnail: imageUrl,
        rentEstimate: estimateRent,
        rentSource: rentData ? 'RentCast' : 'estimate',
        metrics: quickMetrics ? {
          score: quickMetrics.score,
          capRate: quickMetrics.capRate,
          monthlyCashFlow: quickMetrics.monthlyCashFlow
        } : null
      };

      if (isSaved) {
        await unsaveProperty(currentUser.uid, property.property_id);
        setIsSaved(false);
      } else {
        await saveProperty(currentUser.uid, propertyData);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving property:', error);
    } finally {
      setSaving(false);
    }
  };

  // Score badge colors
  const getScoreColors = (color) => {
    const colors = {
      emerald: 'bg-emerald-500 text-white',
      green: 'bg-green-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      orange: 'bg-orange-500 text-white',
      red: 'bg-red-500 text-white',
      gray: 'bg-gray-400 text-white'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500 shadow-xl' : ''
      }`}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image Container */}
      <div className="relative h-48 bg-gray-200">
        <img
          src={imageUrl}
          alt={address}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
        
        {/* Score Badge */}
        {quickMetrics && (
          <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg ${getScoreColors(quickMetrics.color)} font-bold text-sm flex items-center gap-1`}>
            <span>{quickMetrics.score}</span>
            <span className="text-xs opacity-90">{quickMetrics.label}</span>
          </div>
        )}

        {/* Multi-family badge */}
        {isMultiFamily && (
          <div className="absolute top-3 right-12 px-2 py-1 rounded-lg bg-purple-600 text-white text-xs font-medium flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Multi
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSaveClick}
          disabled={saving}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
            isSaved 
              ? 'bg-red-500 text-white' 
              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
          } ${!currentUser ? 'opacity-60' : ''}`}
          title={!currentUser ? 'Sign in to save' : (isSaved ? 'Remove from saved' : 'Save property')}
        >
          <Heart className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
        </button>

        {/* Rent Data Badge */}
        {rentData && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-green-500/90 text-white text-xs font-medium">
            ✓ Rent Verified
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900">{formatPrice(price)}</h3>
          {quickMetrics && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              quickMetrics.monthlyCashFlow >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {quickMetrics.monthlyCashFlow >= 0 ? '+' : ''}{formatPrice(quickMetrics.monthlyCashFlow)}/mo
            </span>
          )}
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
          <span className="flex items-center gap-1">
            <Bed className="w-4 h-4" /> {beds}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-4 h-4" /> {baths}
          </span>
          <span className="flex items-center gap-1">
            <Square className="w-4 h-4" /> {sqft.toLocaleString()}
          </span>
        </div>

        {/* Address */}
        <p className="text-sm text-gray-600 flex items-center gap-1 truncate">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{address}</span>
        </p>
        <p className="text-xs text-gray-500 ml-5">{city}, {state} {zipCode}</p>

        {/* Quick Metrics on Hover */}
        {isHovered && quickMetrics && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <p className="text-gray-500">Cap Rate</p>
              <p className="font-semibold text-gray-900">{quickMetrics.capRate.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Gross Yield</p>
              <p className="font-semibold text-gray-900">{quickMetrics.grossYield.toFixed(1)}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;