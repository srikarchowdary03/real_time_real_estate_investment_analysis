import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed, Bath, Square, DollarSign, Calculator, Heart } from 'lucide-react';
import { getPropertyData } from '../../services/zillowAPI';
import { saveProperty, unsaveProperty, isPropertySaved } from '../../services/database';
import { useAuth } from '../../hooks/useAuth';
import { calculateQuickScore } from '../../utils/investmentCalculations';

const PropertyCard = ({ property, isSelected, onHover, isExpanded, onExpand }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [zillowData, setZillowData] = useState(null);
  const [loadingZillow, setLoadingZillow] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const address = property.location?.address?.line || 'Address not available';
  const city = property.location?.address?.city || '';
  const state = property.location?.address?.state_code || '';
  const zipCode = property.location?.address?.postal_code || '';
  const price = property.list_price || property.price;
  const beds = property.description?.beds || 0;
  const baths = property.description?.baths || 0;
  const sqft = property.description?.sqft || 0;
  
  const image = (zillowData?.photos && zillowData.photos.length > 0) 
    ? zillowData.photos[0] 
    : (property.primary_photo?.href || property.photos?.[0]?.href || 'https://via.placeholder.com/400x300?text=No+Image');

  // Fetch Zillow data
  useEffect(() => {
    const fetchZillowData = async () => {
      if (!address || !city || !state || !zipCode) return;
      
      setLoadingZillow(true);
      try {
        const data = await getPropertyData(address, city, state, zipCode);
        setZillowData(data);
      } catch (error) {
        console.error('Error fetching Zillow data:', error);
      } finally {
        setLoadingZillow(false);
      }
    };

    fetchZillowData();
  }, [property.property_id]);

  // Check if saved
  useEffect(() => {
    const checkSaved = async () => {
      if (currentUser && property.property_id) {
        const saved = await isPropertySaved(currentUser.uid, property.property_id);
        setIsSaved(saved);
      }
    };
    checkSaved();
  }, [currentUser, property.property_id]);

  // Calculate metrics - do this immediately with available data
  const rentEstimate = zillowData?.rent;
  const quickMetrics = (price && rentEstimate) 
    ? calculateQuickScore(price, zillowData) 
    : null;

  const getScoreBadge = (score) => {
    const badges = {
      good: {
        label: 'Good Deal',
        icon: '🟢',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: '#10b981'
      },
      okay: {
        label: 'Fair Deal',
        icon: '🟡',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: '#eab308'
      },
      poor: {
        label: 'Risky Deal',
        icon: '🔴',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: '#ef4444'
      },
      unknown: {
        label: 'Analyzing...',
        icon: '⚪',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: '#d1d5db'
      }
    };
    return badges[score] || badges.unknown;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '+';
    return `${sign}$${absValue.toLocaleString()}`;
  };

  const handleSaveClick = async (e) => {
    e.stopPropagation();
    
    if (!currentUser) {
      alert('Please sign in to save properties');
      navigate('/login');
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

  const handleAnalyzeClick = async (e) => {
    e.stopPropagation();
    
    // 🆕 AUTO-SAVE TO FAVORITES when analyzing
    if (currentUser && !isSaved) {
      try {
        await saveProperty(currentUser.uid, property, zillowData, quickMetrics);
        setIsSaved(true);
        console.log('✅ Property automatically added to favorites');
      } catch (error) {
        console.error('❌ Error auto-saving property:', error);
        // Don't block navigation even if save fails
      }
    }
    
    // Navigate to analysis page
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

  // Show badge even while loading - use "Analyzing..." badge
  const scoreBadge = quickMetrics 
    ? getScoreBadge(quickMetrics.score) 
    : getScoreBadge('unknown');

  return (
    <div
      id={`property-${property.property_id}`}
      onMouseEnter={onHover}
      onClick={handleCardClick}
      className={`bg-white rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isSelected ? 'ring-2 ring-red-600 shadow-xl' : 'border border-gray-200'
      } ${isExpanded ? 'ring-2 ring-blue-600 shadow-xl' : ''}`}
      style={{
        borderLeft: `4px solid ${scoreBadge.borderColor}`
      }}
    >
      <div className="relative h-56 bg-gray-200 overflow-hidden">
        <img
          src={image}
          alt={address}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        
        <div className="absolute top-3 left-3 flex gap-2">
          {property.flags?.is_new_listing && (
            <div className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold">
              NEW
            </div>
          )}
          {isSaved && (
            <div className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1">
              <Heart className="w-3 h-3 fill-current" />
              Saved
            </div>
          )}
        </div>

        <button
          onClick={handleSaveClick}
          disabled={savingProperty}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all ${
            isSaved 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-white/90 text-gray-700 hover:bg-white'
          } ${savingProperty ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Heart 
            className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`}
          />
        </button>

        {/* ALWAYS show investment badge */}
        <div className="absolute bottom-3 left-3">
          <div className={`${scoreBadge.bgColor} ${scoreBadge.textColor} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg`}>
            <span className="text-base">{scoreBadge.icon}</span>
            <span>{scoreBadge.label}</span>
          </div>
        </div>
        
        {rentEstimate && (
          <div className="absolute bottom-3 right-3 bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold">
            Rent: {formatPrice(rentEstimate)}/mo
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="text-2xl font-bold text-gray-900 mb-3">
          {formatPrice(price)}
        </div>

        {quickMetrics && quickMetrics.monthlyCashFlow !== undefined && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className={`font-semibold ${
                  quickMetrics.monthlyCashFlow > 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatCurrency(quickMetrics.monthlyCashFlow)}/mo
                </span>
                <span className="text-gray-500 text-xs">cash flow</span>
              </div>
              
              <div className="flex items-center gap-1">
                <span className="font-semibold text-blue-700">
                  {quickMetrics.capRate.toFixed(1)}%
                </span>
                <span className="text-gray-500 text-xs">cap rate</span>
              </div>
            </div>

            {quickMetrics.passesOnePercent && (
              <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
                ✓ 1% Rule
              </div>
            )}
          </div>
        )}

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

        <div className="text-sm text-gray-600 leading-relaxed mb-4">
          <div className="font-medium text-gray-900 mb-1">
            {address}
          </div>
          <div>
            {city}{city && state && ', '}{state} {zipCode}
          </div>
        </div>

        <button
          onClick={handleAnalyzeClick}
          className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          Analyze Investment
        </button>
      </div>
    </div>
  );
};

export default PropertyCard;