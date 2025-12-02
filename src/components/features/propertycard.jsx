import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed, Bath, Square, MapPin, TrendingUp, Calculator, Heart } from 'lucide-react';
import { saveProperty, unsaveProperty, isPropertySaved } from '../../services/database';
import { useAuth } from '../../hooks/useAuth';

/**
 * PropertyCard Component
 * 
 * Displays property in grid view with:
 * - High quality image (upgraded from Realty API)
 * - Basic property details
 * - Quick metrics on hover (formula-based, NO API calls)
 * - Click to expand for more details
 */
const PropertyCard = ({ 
  property, 
  isSelected = false,
  onHover,
  isExpanded = false,
  onExpand
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

  // Get the best available image (already upgraded by realtyAPI)
  const imageUrl = useMemo(() => {
    if (imageError) return 'https://placehold.co/640x480/e2e8f0/64748b?text=No+Image';
    
    // Try different image sources in order of quality
    return property.primaryPhoto ||
           property.thumbnail ||
           property.primary_photo?.href ||
           property.photos?.[0]?.href ||
           'https://placehold.co/640x480/e2e8f0/64748b?text=No+Image';
  }, [property, imageError]);

  // ===== FORMULA-BASED RENT ESTIMATE (No API) =====
  const estimateRent = useMemo(() => {
    if (!price || price <= 0) return 0;
    
    // Base: 0.6% of property price monthly
    let estimate = price * 0.006;
    
    // Bedroom adjustments
    if (beds >= 4) estimate *= 1.10;
    else if (beds >= 3) estimate *= 1.05;
    else if (beds <= 1) estimate *= 0.90;
    
    // Square footage adjustments
    if (sqft > 2500) estimate *= 1.08;
    else if (sqft > 2000) estimate *= 1.05;
    else if (sqft < 1000) estimate *= 0.92;
    
    // Round to nearest $50
    return Math.round(estimate / 50) * 50;
  }, [price, beds, sqft]);

  // ===== QUICK INVESTMENT METRICS =====
  const quickMetrics = useMemo(() => {
    if (!price || !estimateRent) return null;

    const grossYield = ((estimateRent * 12) / price) * 100;
    
    // Simple cash flow estimate (rough)
    const monthlyMortgage = (price * 0.80) * 0.006; // ~7% rate, 30yr approx
    const monthlyExpenses = (price * 0.012 / 12) + (price * 0.004 / 12); // Tax + Insurance
    const monthlyCashFlow = estimateRent - monthlyMortgage - monthlyExpenses - (estimateRent * 0.18);
    
    // Cap rate (simplified)
    const annualNOI = (estimateRent * 12) * 0.65; // 35% expense ratio
    const capRate = (annualNOI / price) * 100;

    // Score based on gross yield
    let score, label, color;
    if (grossYield >= 12) { score = 85; label = 'Excellent'; color = 'emerald'; }
    else if (grossYield >= 10) { score = 75; label = 'Good'; color = 'green'; }
    else if (grossYield >= 8) { score = 60; label = 'Fair'; color = 'yellow'; }
    else if (grossYield >= 6) { score = 40; label = 'Risky'; color = 'orange'; }
    else { score = 25; label = 'Poor'; color = 'red'; }

    return {
      grossYield,
      capRate,
      monthlyCashFlow,
      score,
      label,
      color
    };
  }, [price, estimateRent]);

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
        rentSource: 'estimate'
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

  // Get score color classes
  const getScoreClasses = (color) => {
    const colors = {
      emerald: 'bg-emerald-500 text-white',
      green: 'bg-green-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      orange: 'bg-orange-500 text-white',
      red: 'bg-red-500 text-white'
    };
    return colors[color] || 'bg-gray-500 text-white';
  };

  return (
    <div
      id={`property-${property.property_id}`}
      className={`
        bg-white rounded-xl overflow-hidden cursor-pointer
        transition-all duration-300 ease-out
        hover:shadow-xl hover:-translate-y-1
        ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md border border-gray-100'}
      `}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image Container */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        <img
          src={imageUrl}
          alt={address}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        
        {/* New Listing Badge */}
        {property.isNewListing && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold shadow">
            NEW
          </div>
        )}

        {/* Investment Score Badge */}
        {quickMetrics && (
          <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold shadow ${getScoreClasses(quickMetrics.color)}`}>
            {quickMetrics.score} • {quickMetrics.label}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSaveClick}
          disabled={saving}
          className={`
            absolute bottom-3 right-3 p-2 rounded-full transition-all shadow-lg
            ${isSaved 
              ? 'bg-red-500 text-white' 
              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
            }
          `}
        >
          <Heart className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
        </button>

        {/* Hover Overlay with Quick Metrics */}
        {isHovered && quickMetrics && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4 transition-opacity duration-300">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4" />
                <span className="text-sm font-medium">Quick Estimate</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-white/70 text-xs">Est. Rent</p>
                  <p className="font-bold">{formatPrice(estimateRent)}/mo</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Cap Rate</p>
                  <p className="font-bold">{quickMetrics.capRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">
            {formatPrice(price)}
          </h3>
          {estimateRent > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              ~{formatPrice(estimateRent)}/mo rent
            </span>
          )}
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 text-gray-600 mb-3">
          {beds > 0 && (
            <span className="flex items-center gap-1 text-sm">
              <Bed className="w-4 h-4" /> {beds} bd
            </span>
          )}
          {baths > 0 && (
            <span className="flex items-center gap-1 text-sm">
              <Bath className="w-4 h-4" /> {baths} ba
            </span>
          )}
          {sqft > 0 && (
            <span className="flex items-center gap-1 text-sm">
              <Square className="w-4 h-4" /> {sqft.toLocaleString()} sqft
            </span>
          )}
        </div>

        {/* Address */}
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-800 truncate">{address}</p>
          <p className="text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {city}{city && state && ', '}{state} {zipCode}
          </p>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick(e);
          }}
          className="w-full mt-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          View Analysis
        </button>
      </div>
    </div>
  );
};

export default PropertyCard;