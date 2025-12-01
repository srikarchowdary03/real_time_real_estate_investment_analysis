import React, { useState, useEffect } from 'react';
import { X, Heart, Calculator, MapPin, Bed, Bath, Square, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveProperty, unsaveProperty, isPropertySaved } from '../../services/database';
import { useAuth } from '../../hooks/useAuth';
import { getPropertyDataOnHover, BADGE_CONFIG } from '../../services/zillowAPI_hasdata';

const ExpandedPropertyView = ({ property, onClose }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [enrichedData, setEnrichedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const address = property.location?.address?.line || property.address || 'Address not available';
  const city = property.location?.address?.city || property.city || '';
  const state = property.location?.address?.state_code || property.state || '';
  const zipCode = property.location?.address?.postal_code || property.zip || '';
  const price = property.list_price || property.price;
  const beds = property.description?.beds || property.beds || 0;
  const baths = property.description?.baths || property.baths || 0;
  const sqft = property.description?.sqft || property.sqft || 0;

  const image = (enrichedData?.photos && enrichedData.photos.length > 0)
    ? enrichedData.photos[0]
    : (property.primary_photo?.href || property.photos?.[0]?.href || property.thumbnail || 
       'https://placehold.co/800x500/png?text=No+Image');

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '+';
    return `${sign}$${absValue.toLocaleString()}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const propertyForAPI = {
          address,
          city,
          state,
          zip: zipCode,
          price,
          beds,
          baths,
          sqft,
          property_id: property.property_id
        };

        const data = await getPropertyDataOnHover(propertyForAPI);
        setEnrichedData(data);

        if (currentUser) {
          const saved = await isPropertySaved(currentUser.uid, property.property_id);
          setIsSaved(saved);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [property.property_id]);

  const handleSave = async () => {
    if (!currentUser) {
      alert('Please sign in to save properties');
      navigate('/login');
      return;
    }

    setSaving(true);
    try {
      if (isSaved) {
        await unsaveProperty(currentUser.uid, property.property_id);
        setIsSaved(false);
      } else {
        await saveProperty(currentUser.uid, property, enrichedData, enrichedData?.metrics);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save property');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = () => {
    navigate(`/property/${property.property_id}/analyze`, {
      state: { 
        propertyData: {
          ...property,
          enrichedData,
          price,
          address,
          city,
          state,
          zipCode,
          beds,
          baths,
          sqft,
          image
        }
      }
    });
  };

  const badge = enrichedData?.investmentBadge || 'insufficient-data';
  const badgeInfo = BADGE_CONFIG[badge];

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8 animate-modalSlide">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">Quick Investment Analysis</span>
            {loading && (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Property Image and Basic Info */}
          <div className="grid md:grid-cols-5 gap-6">
            {/* Left: Image */}
            <div className="md:col-span-2">
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={image}
                  alt={address}
                  className="w-full h-80 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/800x500/png?text=No+Image';
                  }}
                />
                {badgeInfo && !loading && (
                  <div className="absolute top-3 left-3">
                    <div className={`${badgeInfo.color} ${badgeInfo.textColor} px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg`}>
                      <span className="text-2xl">{badgeInfo.icon}</span>
                      <span>{badgeInfo.label}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="mt-4">
                <div className="text-4xl font-bold text-gray-900 mb-3">
                  {formatPrice(price)}
                </div>
                
                <div className="flex items-start gap-2 text-gray-600 mb-3">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">{address}</div>
                    <div className="text-sm">{city}{city && state && ', '}{state} {zipCode}</div>
                  </div>
                </div>

                <div className="flex gap-4 text-gray-600">
                  {beds > 0 && (
                    <div className="flex items-center gap-1">
                      <Bed className="w-5 h-5" />
                      <span className="font-medium">{beds} bd</span>
                    </div>
                  )}
                  {baths > 0 && (
                    <div className="flex items-center gap-1">
                      <Bath className="w-5 h-5" />
                      <span className="font-medium">{baths} ba</span>
                    </div>
                  )}
                  {sqft > 0 && (
                    <div className="flex items-center gap-1">
                      <Square className="w-5 h-5" />
                      <span className="font-medium">{sqft.toLocaleString()} sqft</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Investment Metrics */}
            <div className="md:col-span-3">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin h-16 w-16 border-4 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Calculating investment metrics...</p>
                  </div>
                </div>
              ) : enrichedData && enrichedData.hasZillowData && enrichedData.metrics ? (
                <div className="space-y-4">
                  {/* Rent Estimate */}
                  {enrichedData.rentEstimate && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="text-sm font-medium text-green-700 mb-1">
                        Estimated Monthly Rent
                        {enrichedData.rentEstimated && (
                          <span className="ml-2 text-xs">(Estimated)</span>
                        )}
                      </div>
                      <div className="text-3xl font-bold text-green-900">
                        {formatPrice(enrichedData.rentEstimate)}/mo
                      </div>
                    </div>
                  )}

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Cash Flow */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <DollarSign className="w-4 h-4" />
                        Cash Flow
                      </div>
                      <div className={`text-2xl font-bold ${
                        enrichedData.cashFlow > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(enrichedData.cashFlow)}/mo
                      </div>
                    </div>

                    {/* Cap Rate */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2">Cap Rate</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {enrichedData.metrics.capRate.toFixed(1)}%
                      </div>
                    </div>

                    {/* CoC Return */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2">CoC Return</div>
                      <div className={`text-2xl font-bold ${
                        enrichedData.roi > 0 ? 'text-purple-600' : 'text-red-600'
                      }`}>
                        {enrichedData.roi}%
                      </div>
                    </div>

                    {/* 1% Rule */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2">1% Rule</div>
                      <div className={`text-2xl font-bold ${
                        enrichedData.metrics.onePercentRule >= 1.0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {enrichedData.metrics.onePercentRule >= 1.0 ? '✓ Pass' : '✗ Fail'}
                      </div>
                    </div>
                  </div>

                  {/* Investment Score */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-blue-700 mb-1">Investment Score</div>
                        <div className="text-3xl font-bold text-blue-900">
                          {enrichedData.investmentScore}/100
                        </div>
                      </div>
                      <div className={`${badgeInfo.color} ${badgeInfo.textColor} px-4 py-2 rounded-lg font-bold flex items-center gap-2`}>
                        <span className="text-2xl">{badgeInfo.icon}</span>
                        <span>{badgeInfo.label}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-blue-900">
                      {badgeInfo.description}
                    </div>
                  </div>

                  {/* Monthly Expenses Breakdown */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">Monthly Expenses Breakdown</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mortgage</span>
                        <span className="font-medium">${enrichedData.metrics.expenseBreakdown.mortgage.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Property Tax</span>
                        <span className="font-medium">${enrichedData.metrics.expenseBreakdown.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Insurance</span>
                        <span className="font-medium">${enrichedData.metrics.expenseBreakdown.insurance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Maintenance</span>
                        <span className="font-medium">${enrichedData.metrics.expenseBreakdown.maintenance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vacancy Reserve</span>
                        <span className="font-medium">${enrichedData.metrics.expenseBreakdown.vacancy.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Property Management</span>
                        <span className="font-medium">${enrichedData.metrics.expenseBreakdown.management.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-300">
                        <span className="font-semibold text-gray-900">Total Expenses</span>
                        <span className="font-bold text-gray-900">${enrichedData.metrics.monthlyExpenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-gray-500">
                  <div>
                    <div className="text-6xl mb-4">⚠️</div>
                    <p className="text-lg font-medium">Rent data not available</p>
                    <p className="text-sm mt-2">Cannot calculate investment metrics</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                isSaved
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
              {saving ? 'Saving...' : isSaved ? 'Saved' : 'Save Property'}
            </button>

            <button
              onClick={handleAnalyze}
              className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
            >
              <Calculator className="w-6 h-6" />
              Full Analysis
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlide {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modalSlide {
          animation: modalSlide 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ExpandedPropertyView;