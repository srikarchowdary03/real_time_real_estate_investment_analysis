import React, { useState, useEffect } from 'react';
import { X, Heart, Calculator, MapPin, Bed, Bath, Square, DollarSign, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveProperty, unsaveProperty, isPropertySaved } from '../../services/database';
import { useAuth } from '../../hooks/useAuth';

/**
 * ExpandedPropertyView - Floating modal for property quick analysis
 * 
 * Uses LOCAL FORMULA-BASED calculations (no API calls on hover)
 * RentCast API is only called on the full PropertyAnalysisPage
 */
const ExpandedPropertyView = ({ property, onClose }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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
    
    // Base: 0.6% of property price monthly (conservative)
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
  };

  // ===== INVESTMENT CALCULATIONS =====
  const calculateQuickMetrics = () => {
    const rentEstimate = estimateRent(price, beds, sqft);
    
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

  const metrics = calculateQuickMetrics();
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
      price,
      beds,
      baths,
      sqft,
      thumbnail: highQualityImage,
      photos: property.photos,
      rentEstimate: metrics?.rentEstimate || 0,
      rentSource: 'estimate', // Will trigger RentCast fetch on analysis page
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

          {/* Quick Metrics */}
          {metrics ? (
            <div className="space-y-4">
              {/* Rent Estimate Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Estimated Monthly Rent</p>
                    <p className="text-2xl font-bold text-blue-700">{formatPrice(metrics.rentEstimate)}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                      <Calculator className="w-3 h-3" />
                      Formula Estimate
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
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

              {/* Monthly Expenses Breakdown */}
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

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Quick Estimate:</strong> Rent calculated using formula (0.6% of price). 
                  Click "Full Analysis" to get accurate rent data from RentCast API with market comparables.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
              Unable to calculate metrics. Price data may be missing.
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