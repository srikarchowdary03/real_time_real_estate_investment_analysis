import React, { useState, useEffect, useMemo } from 'react';
import { X, Heart, MapPin, Bed, Bath, Square, TrendingUp, AlertCircle, ExternalLink, Loader2, Building2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveProperty, unsaveProperty, isPropertySaved, updatePropertyWithRentData } from '../../services/database';
import { useAuth } from '../../hooks/useAuth';
import { getPropertyRentData } from '../../services/rentcastAPI';

/**
 * ExpandedPropertyView - Floating modal for property quick analysis
 * 
 * FIXED:
 * - Uses RentCast API unit count (NOT bedroom estimation)
 * - Properly calculates metrics using TOTAL rent
 * - Shows correct source for unit detection
 * - No Firebase calls without auth
 */
const ExpandedPropertyView = ({ property, onClose, onRentDataLoaded }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // RentCast API states
  const [rentData, setRentData] = useState(null);
  const [rentLoading, setRentLoading] = useState(true);
  const [rentError, setRentError] = useState(null);

  // Extract property data
  const address = property.location?.address?.line || property.address || 'Address not available';
  const city = property.location?.address?.city || property.city || '';
  const state = property.location?.address?.state_code || property.state || '';
  const zipCode = property.location?.address?.postal_code || property.zip || '';
  const price = property.list_price || property.price || 0;
  const beds = property.description?.beds || property.beds || 0;
  const baths = property.description?.baths || property.baths || 0;
  const sqft = property.description?.sqft || property.sqft || 0;
  const propertyType = property.description?.type || property.propertyType || '';

  // Get best available image
  const image = property.primary_photo?.href || 
                property.photos?.[0]?.href || 
                property.thumbnail || 
                'https://placehold.co/800x500/png?text=No+Image';

  // Upgrade image quality
  const getHighQualityImage = (url) => {
    if (!url) return 'https://placehold.co/800x500/png?text=No+Image';
    if (url.includes('rdcpix.com') || url.includes('ap.rdcpix.com')) {
      return url.replace(/-w\d+_h\d+/, '-w1024_h768').replace(/_q\d+/, '_q90');
    }
    return url;
  };

  const highQualityImage = getHighQualityImage(image);

  // ===== UNIT COUNT FROM RENTCAST API =====
  const unitCount = rentData?.unitCount || 1;
  const isMultiFamily = rentData?.isMultiFamily || unitCount > 1;
  const unitSource = rentData?.unitCount ? 'RentCast API' : 'Default';

  // ===== RENT INFO FROM RENTCAST API =====
  const perUnitRent = rentData?.rentEstimate || rentData?.perUnitRent || 0;
  const totalMonthlyRent = rentData?.totalMonthlyRent || (perUnitRent * unitCount);

  // ===== INVESTMENT CALCULATIONS =====
  const metrics = useMemo(() => {
    // Must have price and rent data
    if (!price || price <= 0 || !totalMonthlyRent || totalMonthlyRent <= 0) {
      return null;
    }

    // Use TOTAL monthly rent for calculations
    const rentEstimate = totalMonthlyRent;

    // Financing assumptions
    const downPaymentPercent = 0.20;
    const interestRate = 0.07;
    const loanTermYears = 30;
    const closingCostPercent = 0.03;

    // Calculate financing
    const downPayment = price * downPaymentPercent;
    const loanAmount = price - downPayment;
    const closingCosts = price * closingCostPercent;
    const totalCashInvested = downPayment + closingCosts;

    // Monthly mortgage (P&I)
    const monthlyRate = interestRate / 12;
    const numPayments = loanTermYears * 12;
    const monthlyMortgage = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    // Monthly expenses (based on TOTAL rent)
    const propertyTax = (price * 0.012) / 12;     // 1.2% annually
    const insurance = (price * 0.004) / 12;        // 0.4% annually
    const maintenance = rentEstimate * 0.05;       // 5% of rent
    const vacancy = rentEstimate * 0.05;           // 5% vacancy
    const management = rentEstimate * 0.10;        // 10% management

    const totalMonthlyExpenses = monthlyMortgage + propertyTax + insurance + 
                                  maintenance + vacancy + management;

    // Cash flow
    const monthlyCashFlow = rentEstimate - totalMonthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;

    // NOI (before debt service)
    const operatingExpenses = (propertyTax + insurance + maintenance + vacancy + management) * 12;
    const annualNOI = (rentEstimate * 12) - operatingExpenses;

    // Key metrics
    const capRate = (annualNOI / price) * 100;
    const cashOnCashROI = (annualCashFlow / totalCashInvested) * 100;
    const dscr = annualNOI / (monthlyMortgage * 12);
    
    // Per-unit metrics
    const pricePerUnit = unitCount > 0 ? price / unitCount : price;
    const cashFlowPerUnit = unitCount > 0 ? monthlyCashFlow / unitCount : monthlyCashFlow;

    return {
      rentEstimate,
      monthlyMortgage,
      monthlyCashFlow,
      annualCashFlow,
      capRate,
      cashOnCashROI,
      dscr,
      totalCashInvested,
      // Per-unit metrics
      pricePerUnit,
      rentPerUnit: perUnitRent,
      cashFlowPerUnit,
      // Expense breakdown
      expenses: {
        mortgage: monthlyMortgage,
        propertyTax,
        insurance,
        maintenance,
        vacancy,
        management
      }
    };
  }, [price, totalMonthlyRent, unitCount, perUnitRent]);

  // Calculate investment score
  const scoreData = useMemo(() => {
    if (!metrics) return { score: 0, label: 'N/A', color: 'gray' };

    let score = 50;

    // Cash flow scoring
    if (metrics.monthlyCashFlow >= 500) score += 25;
    else if (metrics.monthlyCashFlow >= 300) score += 20;
    else if (metrics.monthlyCashFlow >= 100) score += 10;
    else if (metrics.monthlyCashFlow >= 0) score += 5;
    else score -= 15;

    // Cap rate scoring
    if (metrics.capRate >= 10) score += 15;
    else if (metrics.capRate >= 8) score += 10;
    else if (metrics.capRate >= 6) score += 5;
    else score -= 5;

    // Cash-on-cash scoring
    if (metrics.cashOnCashROI >= 12) score += 10;
    else if (metrics.cashOnCashROI >= 8) score += 5;
    else if (metrics.cashOnCashROI < 4) score -= 10;

    score = Math.max(0, Math.min(100, score));

    let label, color;
    if (score >= 80) { label = 'Excellent'; color = 'emerald'; }
    else if (score >= 65) { label = 'Good'; color = 'green'; }
    else if (score >= 50) { label = 'Fair'; color = 'yellow'; }
    else if (score >= 35) { label = 'Risky'; color = 'orange'; }
    else { label = 'Poor'; color = 'red'; }

    return { score, label, color };
  }, [metrics]);

  // Formatters
  const formatPrice = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${value.toFixed(decimals)}%`;
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return value.toFixed(decimals);
  };

  // Fetch rent data from RentCast API
  useEffect(() => {
    const fetchRentData = async () => {
      setRentLoading(true);
      setRentError(null);
      
      try {
        console.log('🏠 Fetching RentCast data for:', address);
        
        // Use the rent data function from rentcastAPI
        const data = await getPropertyRentData(property);
        
        if (data && (data.rentEstimate || data.perUnitRent)) {
          console.log('✅ RentCast rent estimate (per unit):', data.rentEstimate || data.perUnitRent);
          console.log('🏢 Property has', data.unitCount || 1, 'units');
          console.log('💰 Total monthly rent:', data.totalMonthlyRent || data.rentEstimate);
          
          setRentData(data);
          
          // Notify parent component
          if (onRentDataLoaded) {
            onRentDataLoaded(data);
          }
        } else {
          console.log('⚠️ No RentCast data available');
          setRentError('No data available');
        }
      } catch (error) {
        console.error('❌ RentCast API error:', error);
        setRentError(error.message || 'Failed to fetch rent data');
      } finally {
        setRentLoading(false);
      }
    };

    if (property) {
      fetchRentData();
    }
  }, [property]);

  // Check if saved - ONLY if user is logged in
  useEffect(() => {
    const checkSaved = async () => {
      // IMPORTANT: Only check if user is logged in
      if (!currentUser?.uid || !property.property_id) {
        return;
      }
      
      try {
        const saved = await isPropertySaved(currentUser.uid, property.property_id);
        setIsSaved(saved);
      } catch (error) {
        // Silently fail - don't spam console
        console.log('Could not check saved status');
      }
    };
    checkSaved();
  }, [currentUser, property.property_id]);

  // Handle save/unsave
  const handleSave = async () => {
    if (!currentUser) {
      alert('Please sign in to save properties');
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
        thumbnail: image,
        rentEstimate: totalMonthlyRent,
        rentSource: 'RentCast',
        unitCount: unitCount,
        isMultiFamily: isMultiFamily,
        metrics: metrics ? {
          capRate: metrics.capRate,
          cashOnCashROI: metrics.cashOnCashROI,
          monthlyCashFlow: metrics.monthlyCashFlow
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
      alert('Failed to save property');
    } finally {
      setSaving(false);
    }
  };

  // Navigate to full analysis
  const handleAnalyze = () => {
    const propertyData = {
      property_id: property.property_id,
      address,
      city,
      state,
      zip: zipCode,
      zipCode: zipCode,
      price,
      beds,
      baths,
      sqft,
      thumbnail: highQualityImage,
      photos: property.photos,
      // Pass RentCast data
      rentEstimate: perUnitRent,
      totalMonthlyRent: totalMonthlyRent,
      rentRangeLow: rentData?.rentRangeLow || null,
      rentRangeHigh: rentData?.rentRangeHigh || null,
      rentComparables: rentData?.comparables || [],
      rentSource: 'RentCast',
      // Unit info FROM RENTCAST API
      unitCount: unitCount,
      isMultiFamily: isMultiFamily,
      unitSource: unitSource,
      // Property details
      yearBuilt: property.description?.year_built || property.yearBuilt,
      lotSize: property.description?.lot_sqft || property.lotSize,
      propertyType: propertyType || 'single_family'
    };

    navigate(`/property/${property.property_id}/analyze`, {
      state: { propertyData }
    });
  };

  // Score color classes
  const getScoreColorClasses = (color) => {
    const colors = {
      emerald: { bg: 'bg-emerald-500', text: 'text-white' },
      green: { bg: 'bg-green-500', text: 'text-white' },
      yellow: { bg: 'bg-yellow-500', text: 'text-white' },
      orange: { bg: 'bg-orange-500', text: 'text-white' },
      red: { bg: 'bg-red-500', text: 'text-white' },
      gray: { bg: 'bg-gray-400', text: 'text-white' }
    };
    return colors[color] || colors.gray;
  };

  const scoreColors = getScoreColorClasses(scoreData.color);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image */}
        <div className="relative h-56 bg-gray-200">
          <img
            src={highQualityImage}
            alt={address}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://placehold.co/800x500/png?text=No+Image';
            }}
          />
          
          {/* Score Badge */}
          <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg ${scoreColors.bg} ${scoreColors.text} font-bold flex items-center gap-2`}>
            <span className="text-xl">{scoreData.score}</span>
            <span className="text-sm">{scoreData.label}</span>
            {rentData && <span className="text-xs opacity-75">✓ Verified</span>}
          </div>

          {/* Unit Count Badge */}
          {isMultiFamily && (
            <div className="absolute top-4 right-14 px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {unitCount} Units
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-224px)]">
          {/* Header */}
          <div className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{formatPrice(price)}</h2>
              <button
                onClick={handleSave}
                disabled={saving || !currentUser}
                className={`p-2 rounded-lg transition-colors ${
                  isSaved 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${!currentUser ? 'opacity-50' : ''}`}
                title={!currentUser ? 'Sign in to save properties' : ''}
              >
                <Heart className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            </div>
            
            <div className="flex items-center gap-4 text-gray-600 mb-2">
              <span className="flex items-center gap-1">
                <Bed className="w-4 h-4" /> {beds} bd
              </span>
              <span className="flex items-center gap-1">
                <Bath className="w-4 h-4" /> {baths} ba
              </span>
              <span className="flex items-center gap-1">
                <Square className="w-4 h-4" /> {sqft.toLocaleString()} sqft
              </span>
              {isMultiFamily && (
                <span className="flex items-center gap-1 text-purple-600 font-medium">
                  <Building2 className="w-4 h-4" /> {unitCount} units
                </span>
              )}
            </div>

            <p className="text-gray-600 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {address}, {city}, {state} {zipCode}
            </p>
          </div>

          {/* Rent Data Section */}
          {rentLoading ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Loading Rent Data...</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="text-gray-600">Fetching from RentCast API...</span>
                  </div>
                </div>
              </div>
            </div>
          ) : rentData ? (
            <div className="space-y-4">
              {/* Rent Banner */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-green-600">
                    Monthly Rent {isMultiFamily ? '(Per Unit)' : ''}
                  </p>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    ✓ RentCast
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {formatPrice(perUnitRent)}
                </p>
                {rentData.rentRangeLow && rentData.rentRangeHigh && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Range: {formatPrice(rentData.rentRangeLow)} - {formatPrice(rentData.rentRangeHigh)}
                  </p>
                )}
                
                {/* Total rent for multi-family */}
                {isMultiFamily && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-green-600">
                        Total Monthly Rent ({unitCount} units):
                      </span>
                      <span className="text-xl font-bold text-green-700">
                        {formatPrice(totalMonthlyRent)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-family info notice - FIXED: Shows correct source */}
              {isMultiFamily && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
                  <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-purple-700">
                    <strong>Multi-Family Property:</strong> {unitCount} units detected from {unitSource}. 
                    You can adjust the unit count in the full analysis.
                  </p>
                </div>
              )}

              {/* Key Metrics Grid */}
              {metrics ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Total Cash Flow</p>
                      <p className={`text-lg font-bold ${metrics.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPrice(metrics.monthlyCashFlow)}/mo
                      </p>
                      {isMultiFamily && (
                        <p className="text-xs text-gray-500">
                          {formatPrice(metrics.cashFlowPerUnit)}/unit
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Cap Rate</p>
                      <p className="text-lg font-bold text-gray-900">{formatPercent(metrics.capRate)}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Cash-on-Cash ROI</p>
                      <p className={`text-lg font-bold ${metrics.cashOnCashROI >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {formatPercent(metrics.cashOnCashROI)}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">DSCR</p>
                      <p className={`text-lg font-bold ${metrics.dscr >= 1.0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {formatNumber(metrics.dscr)}x
                      </p>
                    </div>
                  </div>

                  {/* Per-Unit Metrics for Multi-Family */}
                  {isMultiFamily && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-purple-700 mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Per Unit Metrics
                      </p>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center">
                          <p className="text-purple-600">Price/Unit</p>
                          <p className="font-bold">{formatPrice(metrics.pricePerUnit)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-purple-600">Rent/Unit</p>
                          <p className="font-bold">{formatPrice(metrics.rentPerUnit)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-purple-600">Cash Flow/Unit</p>
                          <p className={`font-bold ${metrics.cashFlowPerUnit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPrice(metrics.cashFlowPerUnit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-700">
                    Unable to calculate metrics. Click "Full Analysis" for detailed calculations.
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Error state
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Rent Data Unavailable</p>
                  <p className="text-gray-600 mt-1 text-sm">
                    {rentError || 'Unable to fetch rent data from RentCast API'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  Unavailable
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAnalyze}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Full Analysis
              <ExternalLink className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandedPropertyView;