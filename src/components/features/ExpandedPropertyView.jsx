import React, { useState, useEffect } from 'react';
import { X, Heart, Calculator, MapPin, Bed, Bath, Square, DollarSign, TrendingUp, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveProperty, unsaveProperty, isPropertySaved } from '../../services/database';
import { useAuth } from '../../hooks/useAuth';
import { getPropertyRentData } from '../../services/rentcastAPI';

/**
 * ExpandedPropertyView - Floating modal for property quick analysis
 * 
 * NOW FETCHES REAL RENT FROM RENTCAST API
 * Falls back to formula estimate if API fails
 */
const ExpandedPropertyView = ({ property, onClose }) => {
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

  // Get best available image
  const image = property.primary_photo?.href || 
                property.photos?.[0]?.href || 
                property.thumbnail || 
                'https://placehold.co/800x500/png?text=No+Image';

  // Upgrade image quality if it's a Realty API image
  const getHighQualityImage = (url) => {
    if (!url) return 'https://placehold.co/800x500/png?text=No+Image';
    
    // Realty API images use rdcpix.com and can be resized
    // Pattern: -m0xd-w{width}_h{height}_q{quality}
    if (url.includes('rdcpix.com') || url.includes('ap.rdcpix.com')) {
      // Replace small dimensions with larger ones
      return url
        .replace(/-w\d+_h\d+/, '-w1024_h768')
        .replace(/_q\d+/, '_q90');
    }
    return url;
  };

  const highQualityImage = getHighQualityImage(image);

  // ===== LOCAL RENT ESTIMATION (No API calls) =====
  const estimateRent = (price, beds, sqft) => {
    if (!price || price <= 0) return 0;
    
    // Rent-to-price ratio varies by price range (lower priced = higher ratio)
    // This reflects real market behavior
    let rentMultiplier;
    if (price < 150000) rentMultiplier = 0.009;      // 0.9% for cheap properties
    else if (price < 250000) rentMultiplier = 0.008; // 0.8%
    else if (price < 400000) rentMultiplier = 0.007; // 0.7%
    else if (price < 600000) rentMultiplier = 0.006; // 0.6%
    else if (price < 1000000) rentMultiplier = 0.005; // 0.5%
    else rentMultiplier = 0.004;                      // 0.4% for expensive
    
    let estimate = price * rentMultiplier;
    
    // Bedroom adjustments
    if (beds >= 4) estimate *= 1.15;
    else if (beds >= 3) estimate *= 1.08;
    else if (beds <= 1) estimate *= 0.85;
    
    // Square footage adjustments
    if (sqft > 2500) estimate *= 1.08;
    else if (sqft > 2000) estimate *= 1.05;
    else if (sqft < 1000) estimate *= 0.92;
    
    // Round to nearest $50
    return Math.round(estimate / 50) * 50;
  };

  // Get actual rent - ONLY from RentCast API, NO formula fallback
  const getActualRent = () => {
    if (rentData?.rentEstimate) {
      return rentData.rentEstimate;
    }
    return null; // Return null if no API data - don't use formula
  };

  // ===== INVESTMENT CALCULATIONS =====
  const calculateQuickMetrics = () => {
    // ONLY use RentCast API data
    const rentEstimate = getActualRent();
    
    // If still loading or no API data, return null
    if (!price || price <= 0 || !rentEstimate) {
      return null;
    }

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

    // Monthly expenses
    const propertyTax = (price * 0.012) / 12;     // 1.2% annually
    const insurance = (price * 0.004) / 12;        // 0.4% annually
    const maintenance = rentEstimate * 0.05;       // 5% of rent
    const vacancy = rentEstimate * 0.05;           // 5% vacancy
    const management = rentEstimate * 0.08;        // 8% management

    const totalMonthlyExpenses = monthlyMortgage + propertyTax + insurance + 
                                  maintenance + vacancy + management;

    // Cash flow
    const monthlyCashFlow = rentEstimate - totalMonthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;

    // NOI (before debt service)
    const annualNOI = (rentEstimate * 12) - ((propertyTax + insurance + maintenance + vacancy + management) * 12);

    // Key metrics
    const capRate = (annualNOI / price) * 100;
    const cashOnCashROI = (annualCashFlow / totalCashInvested) * 100;
    const grossYield = ((rentEstimate * 12) / price) * 100;
    const dscr = annualNOI / (monthlyMortgage * 12);
    const grm = price / (rentEstimate * 12);

    return {
      rentEstimate,
      monthlyMortgage,
      monthlyCashFlow,
      annualCashFlow,
      capRate,
      cashOnCashROI,
      grossYield,
      dscr,
      grm,
      totalCashInvested,
      // Rent source info
      rentSource: rentData?.rentEstimate ? 'RentCast' : 'Formula',
      rentRangeLow: rentData?.rentRangeLow || null,
      rentRangeHigh: rentData?.rentRangeHigh || null,
      expenses: {
        mortgage: monthlyMortgage,
        propertyTax,
        insurance,
        maintenance,
        vacancy,
        management
      }
    };
  };

  // Calculate investment score
  const calculateScore = (metrics) => {
    if (!metrics) return { score: 0, label: 'N/A', color: 'gray' };

    let score = 50; // Base score

    // Cash flow scoring (most important)
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

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine label and color
    let label, color;
    if (score >= 80) { label = 'Excellent'; color = 'emerald'; }
    else if (score >= 65) { label = 'Good'; color = 'green'; }
    else if (score >= 50) { label = 'Fair'; color = 'yellow'; }
    else if (score >= 35) { label = 'Risky'; color = 'orange'; }
    else { label = 'Poor'; color = 'red'; }

    return { score, label, color };
  };

  // Recalculate metrics when rentData changes
  const metrics = React.useMemo(() => calculateQuickMetrics(), [price, beds, sqft, rentData]);
  const scoreData = calculateScore(metrics);

  // Formatters
  const formatPrice = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${formatPrice(value)}`;
  };

  const formatPercent = (value, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${value.toFixed(decimals)}%`;
  };

  // Fetch rent data from RentCast API
  useEffect(() => {
    const fetchRentData = async () => {
      setRentLoading(true);
      setRentError(null);
      
      try {
        console.log('🏠 Fetching RentCast data for:', address);
        const data = await getPropertyRentData(property);
        
        if (data && data.rentEstimate) {
          console.log('✅ RentCast rent estimate:', data.rentEstimate);
          setRentData(data);
        } else {
          console.log('⚠️ No RentCast data available, using formula estimate');
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
  }, [property, address]);

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
        rentEstimate: metrics?.rentEstimate || 0,
        rentSource: 'estimate', // Mark as formula estimate
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
      // Pass RentCast data if available
      rentEstimate: rentData?.rentEstimate || metrics?.rentEstimate || 0,
      rentRangeLow: rentData?.rentRangeLow || null,
      rentRangeHigh: rentData?.rentRangeHigh || null,
      rentComparables: rentData?.comparables || [],
      rentSource: rentData?.rentEstimate ? 'RentCast' : 'estimate',
      yearBuilt: property.description?.year_built || property.yearBuilt,
      lotSize: property.description?.lot_sqft || property.lotSize,
      propertyType: property.description?.type || property.propertyType || 'single_family'
    };

    navigate(`/property/${property.property_id}/analyze`, {
      state: { propertyData }
    });
  };

  // Score color classes
  const getScoreColorClasses = (color) => {
    const colors = {
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-500' },
      green: { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-500' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-500' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-500' },
      red: { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-500' },
      gray: { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-500' }
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
          <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg ${scoreColors.bg} ${scoreColors.text} font-bold`}>
            {scoreData.score} - {scoreData.label}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-224px)]">
          {/* Header */}
          <div className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{formatPrice(price)}</h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`p-2 rounded-lg transition-colors ${
                  isSaved 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
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
            </div>

            <p className="text-gray-600 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {address}, {city}, {state} {zipCode}
            </p>
          </div>

          {/* Rent Data Section - API ONLY */}
          {rentLoading ? (
            // LOADING STATE
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Loading Rent Data...</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="text-gray-600">Fetching from RentCast API...</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading
                </span>
              </div>
            </div>
          ) : rentData?.rentEstimate ? (
            // SUCCESS STATE - API data available
            <div className="space-y-4">
              {/* Rent Banner */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Monthly Rent</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatPrice(rentData.rentEstimate)}
                    </p>
                    {rentData.rentRangeLow && rentData.rentRangeHigh && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Range: {formatPrice(rentData.rentRangeLow)} - {formatPrice(rentData.rentRangeHigh)}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    RentCast API
                  </span>
                </div>
                {rentData.comparables?.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    Based on {rentData.comparables.length} comparable rentals nearby
                  </p>
                )}
              </div>

              {/* Key Metrics Grid - Only show when we have API data */}
              {metrics && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Monthly Cash Flow</p>
                      <p className={`text-lg font-bold ${metrics.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(metrics.monthlyCashFlow)}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Cap Rate</p>
                      <p className="text-lg font-bold text-gray-900">{formatPercent(metrics.capRate)}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Cash-on-Cash ROI</p>
                      <p className="text-lg font-bold text-gray-900">{formatPercent(metrics.cashOnCashROI)}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">DSCR</p>
                      <p className="text-lg font-bold text-gray-900">{metrics.dscr.toFixed(2)}x</p>
                    </div>
                  </div>

                  {/* Monthly Expenses */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Monthly Expenses</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-gray-500">Mortgage</p>
                        <p className="font-semibold">{formatPrice(metrics.expenses.mortgage)}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-gray-500">Taxes</p>
                        <p className="font-semibold">{formatPrice(metrics.expenses.propertyTax)}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-gray-500">Insurance</p>
                        <p className="font-semibold">{formatPrice(metrics.expenses.insurance)}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Success Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-green-700">
                  <strong>Market Rent:</strong> Based on {rentData.comparables?.length || 'comparable'} similar rentals in the area via RentCast API.
                </p>
              </div>
            </div>
          ) : (
            // ERROR STATE - API failed or no data
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Rent Data Unavailable</p>
                    <p className="text-gray-600 mt-1 text-sm">
                      Unable to fetch rent data from RentCast API
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    Unavailable
                  </span>
                </div>
              </div>

              {/* Error Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> Rent data could not be retrieved. Click "Full Analysis" to try again or enter rent manually.
                </p>
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