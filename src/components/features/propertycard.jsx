import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed, Bath, Square, DollarSign, Calculator, Heart, TrendingUp, Percent } from 'lucide-react';
import { getPropertyData } from '../../services/zillowAPI';
import { saveProperty, unsaveProperty, isPropertySaved } from '../../services/database';
import { useAuth } from '../../hooks/useAuth';
import { calculateQuickScore, getScoreBadge, formatCurrency as formatCurrencyUtil } from '../../utils/investmentCalculations';

const PropertyCard = ({ property, isSelected, onHover, isExpanded, onExpand }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [zillowData, setZillowData] = useState(null);
  const [loadingZillow, setLoadingZillow] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false); // NEW
  const [savingProperty, setSavingProperty] = useState(false);
  const [quickMetrics, setQuickMetrics] = useState(null);
  
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleMouseEnter = () => {
    setShouldFetch(true);
    onHover();
  };

  const address = property.location?.address?.line || 'Address not available';
  const city = property.location?.address?.city || '';
  const state = property.location?.address?.state_code || '';
  const zipCode = property.location?.address?.postal_code || '';
  const price = property.list_price || property.price;
  const beds = property.description?.beds || 0;
  const baths = property.description?.baths || 0;
  const sqft = property.description?.sqft || 0;
  
  // 🎯 USE ZILLOW PHOTOS FIRST, then fallback to Realty API photos
  const image = (zillowData?.photos && zillowData.photos.length > 0) 
    ? zillowData.photos[0] 
    : (property.primary_photo?.href || property.photos?.[0]?.href || 'https://via.placeholder.com/400x300?text=No+Image');

  // Fetch Zillow data on mount
  useEffect(() => {
    if (!shouldFetch) return; 
    const fetchZillowData = async () => {
      if (!address || !city || !state || !zipCode) return;
      
      setLoadingZillow(true);
      try {
        console.log('🔍 Fetching Zillow data for:', address);
        const data = await getPropertyData(address, city, state, zipCode);
        setZillowData(data);
        console.log('✅ Zillow data received:', {
          rent: data.rent,
          photos: data.photoCount,
          tax: data.annualTaxAmount,
          hoa: data.hoaFee
        });
      } catch (error) {
        console.error('❌ Error fetching Zillow data:', error);
      } finally {
        setLoadingZillow(false);
      }
    };

    fetchZillowData();
  }, [shouldFetch, property.property_id]);

  // Check if property is saved
  useEffect(() => {
    const checkSaved = async () => {
      if (currentUser && property.property_id) {
        const saved = await isPropertySaved(currentUser.uid, property.property_id);
        setIsSaved(saved);
      }
    };
    checkSaved();
  }, [currentUser, property.property_id]);

  // Calculate investment metrics when Zillow data is available
  useEffect(() => {
    if (zillowData?.rent && price) {
      console.log('📊 Calculating investment metrics for:', address);
      const metrics = calculateQuickScore(price, zillowData);
      setQuickMetrics(metrics);
      console.log('✅ Investment score:', metrics.score, `(${metrics.scorePoints}/100)`);
    }
  }, [zillowData, price]);

  const formatCashFlow = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '+';
    return `${sign}$${absValue.toLocaleString()}`;
  };

  const rentEstimate = zillowData?.rent;
  const scoreBadge = quickMetrics ? getScoreBadge(quickMetrics.score) : null;

  const handleSaveClick = async (e) => {
    e.stopPropagation();
    
    if (!currentUser) {
      alert('Please sign in to save properties');
      navigate('/signin');
      return;
    }

    setSavingProperty(true);
    try {
      if (isSaved) {
        await unsaveProperty(currentUser.uid, property.property_id);
        setIsSaved(false);
      } else {
        await saveProperty(currentUser.uid, property, zillowData, quickMetrics);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Failed to save property. Please try again.');
    } finally {
      setSavingProperty(false);
    }
  };

  const handleAnalyzeClick = (e) => {
    e.stopPropagation();
    
    navigate(`/property/${property.property_id}/analyze`, {
      state: { 
        propertyData: {
          ...property,
          property_id: property.property_id,
          zillowData: zillowData,
          price: price,
          address: address,
          city: city,
          state: state,
          zipCode: zipCode,
          beds: beds,
          baths: baths,
          sqft: sqft,
          image: image
        }
      }
    });
  };

  const handleCardClick = () => {
    onExpand();
  };

  return (
    <div
      id={`property-${property.property_id}`}
      onMouseEnter={handleMouseEnter} 
      onClick={handleCardClick}
      className={`bg-white rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isSelected ? 'ring-2 ring-red-600 shadow-xl' : 'border border-gray-200'
      } ${isExpanded ? 'ring-2 ring-blue-600 shadow-xl' : ''}`}
      style={{
        borderLeft: scoreBadge ? `4px solid ${scoreBadge.borderColor}` : undefined
      }}
    >
      {/* Property Image */}
      <div className="relative h-56 bg-gray-200 overflow-hidden">
        <img
          src={image}
          alt={address}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        
        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {property.flags?.is_new_listing && (
            <div className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold shadow-lg">
              NEW
            </div>
          )}
          {isSaved && (
            <div className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow-lg">
              <Heart className="w-3 h-3 fill-current" />
              Saved
            </div>
          )}
        </div>

        {/* Save Button - Top Right */}
        <button
          onClick={handleSaveClick}
          disabled={savingProperty}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all shadow-lg ${
            isSaved 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-white/90 text-gray-700 hover:bg-white'
          } ${savingProperty ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Heart 
            className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`}
          />
        </button>

        {/* Investment Score Badge - Bottom Left */}
        {scoreBadge && (
          <div className="absolute bottom-3 left-3">
            <div className={`${scoreBadge.bgColor} ${scoreBadge.textColor} px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm`}>
              <span className="text-lg">{scoreBadge.icon}</span>
              <div>
                <div className="font-bold">{scoreBadge.label}</div>
                {quickMetrics && (
                  <div className="text-[10px] font-semibold opacity-90">
                    {quickMetrics.scorePoints}/100 {scoreBadge.emoji}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Rent Estimate - Bottom Right */}
        {rentEstimate && (
          <div className="absolute bottom-3 right-3 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span>{formatPrice(rentEstimate)}/mo</span>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loadingZillow && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white/90 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700">
              Loading data...
            </div>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-4">
        {/* Price */}
        <div className="text-2xl font-bold text-gray-900 mb-3">
          {formatPrice(price)}
        </div>

        {/* 🎯 INVESTMENT METRICS - Enhanced Display */}
        {quickMetrics && quickMetrics.monthlyCashFlow !== undefined && (
          <div className="mb-4 space-y-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
            {/* Cash Flow & Cap Rate */}
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className={`font-bold ${
                  quickMetrics.monthlyCashFlow > 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatCashFlow(quickMetrics.monthlyCashFlow)}
                </span>
                <span className="text-gray-600 text-xs">/ mo</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-purple-700">
                  {quickMetrics.capRate.toFixed(1)}%
                </span>
                <span className="text-gray-600 text-xs">cap</span>
              </div>
            </div>

            {/* CoC Return */}
            <div className="flex items-center gap-1.5 text-sm">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-gray-600 text-xs">CoC Return:</span>
              <span className={`font-bold ${
                quickMetrics.cocReturn > 8 ? 'text-green-700' : 'text-gray-700'
              }`}>
                {quickMetrics.cocReturn.toFixed(1)}%
              </span>
            </div>

            {/* Investment Rules */}
            <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
              {quickMetrics.passesOnePercent && (
                <div className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">
                  ✓ 1% Rule
                </div>
              )}
              {quickMetrics.dcr >= 1.25 && (
                <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                  ✓ Strong DCR
                </div>
              )}
              {quickMetrics.expenseRatio <= 50 && (
                <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                  ✓ Low Expenses
                </div>
              )}
            </div>

            {/* Top Score Reason */}
            {quickMetrics.scoreReasons && quickMetrics.scoreReasons[0] && (
              <div className="text-xs text-gray-600 italic pt-1">
                💡 {quickMetrics.scoreReasons[0]}
              </div>
            )}
          </div>
        )}

        {/* Property Specs */}
        <div className="flex items-center gap-4 mb-3 text-gray-600">
          {beds > 0 && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span className="text-sm font-medium">{beds} bd</span>
            </div>
          )}
          {baths > 0 && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span className="text-sm font-medium">{baths} ba</span>
            </div>
          )}
          {sqft > 0 && (
            <div className="flex items-center gap-1">
              <Square className="w-4 h-4" />
              <span className="text-sm font-medium">{sqft.toLocaleString()} sqft</span>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="text-sm text-gray-600 leading-relaxed mb-4">
          <div className="font-medium text-gray-900 mb-1">
            {address}
          </div>
          <div>
            {city}{city && state && ', '}{state} {zipCode}
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyzeClick}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          <Calculator className="w-4 h-4" />
          Analyze Investment
        </button>

        {/* Data Quality Indicator */}
        {quickMetrics && quickMetrics.dataQuality === 'estimated' && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            ⚠️ Some values estimated
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;