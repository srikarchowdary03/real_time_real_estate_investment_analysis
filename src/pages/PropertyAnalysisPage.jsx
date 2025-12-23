/**
 * @file Property analysis page with comprehensive investment calculations
 * @module pages/PropertyAnalysisPage
 * @description Main page for detailed property investment analysis. Provides complete
 * investment analysis workflow including purchase worksheet, financial calculations,
 * and 5-year buy & hold projections. Manages complex state including property data,
 * calculation inputs, investor profile defaults, and analysis results.
 * 
 * Key Features:
 * - Auto-saves property to user's collection on page load
 * - Loads investor profile defaults for calculations
 * - Multi-family property detection and rent calculation
 * - Real-time calculation updates as inputs change
 * - Section navigation (Description, Worksheet, Photos, Analysis, Projections)
 * - Property sharing functionality
 * 
 * CRITICAL FIXES v2.0:
 * - Detects single units in buildings vs entire buildings
 * - Correctly calculates rent (no multiplication for condos)
 * - Shows unit detection reason
 * - Allows manual unit count override
 * 
 * Data Flow:
 * 1. Property data loaded from navigation state or Firebase
 * 2. Investor profile defaults fetched
 * 3. Calculation inputs initialized with property + profile data
 * 4. Multi-family detection applied (v2.0: now detects single units)
 * 5. Inputs flow to child components (PurchaseWorksheet, PropertyAnalysisContent)
 * 6. Results flow back from PropertyAnalysisContent
 * 7. Analysis can be saved to Firebase
 * 
 * @requires react
 * @requires react-router-dom
 * @requires lucide-react
 * @requires ../hooks/useAuth
 * @requires ../services/database
 * @requires ../services/Investorservice
 * @requires ../utils/investmentCalculations
 * 
 * @version 2.0.0
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Edit, Image, TrendingUp, BarChart3, 
  Share2, Trash2, ArrowLeft, Check, Loader2,
  Building, Info
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
  saveProperty, unsaveProperty, isPropertySaved, getSavedProperty
} from '../services/database';
import { getInvestorProfile, getFinancingDefaults, getExpenseDefaults } from '../services/Investorservice';
import { estimateRent, detectMultiFamily } from '../utils/investmentCalculations';

// Section Components
import PropertyAnalysisContent from '../components/analysis/PropertyAnalysisContent';
import PurchaseWorksheet from '../components/analysis/PurchaseWorksheet';
import BuyHoldProjections from '../components/analysis/Buyholdprojections';

/**
 * Property Analysis Page Component
 * 
 * Comprehensive investment analysis page with sidebar navigation and multiple
 * analysis sections. Handles property data loading, investor profile integration,
 * multi-family detection, automatic saving, and real-time calculation updates.
 * 
 * STATE MANAGEMENT:
 * - property: Full property data from navigation or Firebase
 * - inputs: All calculation inputs (purchase, financing, income, expenses)
 * - results: Calculation results from BuyRentHoldCalculator
 * - investorProfile: User's default assumptions
 * - activeSection: Current view (worksheet/analysis/projections)
 * - isSaved: Whether property is in user's saved collection
 * - manualUnitCount: User override for unit count (v2.0 NEW)
 * 
 * AUTO-BEHAVIORS:
 * - Auto-saves property when page loads (if user is authenticated)
 * - Auto-loads investor profile defaults
 * - Auto-detects multi-family properties (v2.0: detects single units)
 * - Auto-calculates total rent (v2.0: correctly for single units)
 * 
 * @component
 * @returns {React.ReactElement} Property analysis page
 * 
 * @example
 * // Navigate with property data
 * navigate(`/property/${propertyId}/analyze`, {
 *   state: { propertyData: property }
 * });
 * 
 * @example
 * // Route configuration
 * <Route path="/property/:propertyId/analyze" element={<PropertyAnalysisPage />} />
 */
export default function PropertyAnalysisPage() {
  /**
   * Property ID from URL parameters
   * @type {string}
   */
  const { propertyId } = useParams();
  
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  /**
   * Property data state
   * Loaded from navigation state or fetched from Firebase if not provided
   * @type {Array}
   */
  const [property, setProperty] = useState(location.state?.propertyData || location.state?.property || null);
  
  /**
   * Loading state for property fetch
   * @type {Array}
   */
  const [loading, setLoading] = useState(!location.state?.propertyData && !location.state?.property);
  
  /**
   * Property saved status in user's collection
   * @type {Array}
   */
  const [isSaved, setIsSaved] = useState(false);
  
  /**
   * Saving operation in progress flag
   * @type {Array}
   */
  const [saving, setSaving] = useState(false);
  
  /**
   * User's investor profile with default calculation assumptions
   * @type {Array}
   */
  const [investorProfile, setInvestorProfile] = useState(null);
  
  /**
   * Active sidebar section (worksheet/analysis/projections/photos/description)
   * @type {Array}
   */
  const [activeSection, setActiveSection] = useState('analysis');
  
  /**
   * All calculation inputs for investment analysis
   * Includes purchase, financing, income, expenses, and projection settings
   * @type {Array}
   */
  const [inputs, setInputs] = useState({});
  
  /**
   * Calculation results from BuyRentHoldCalculator
   * @type {Array}
   */
  const [results, setResults] = useState(null);

  /**
   * Manual unit count override (v2.0 NEW)
   * Allows user to override auto-detected unit count
   * @type {Array}
   */
  const [manualUnitCount, setManualUnitCount] = useState(null);

  /**
   * Detect multi-family property and determine unit count
   * 
   * CRITICAL v2.0 UPDATE: Now uses data from RentCast API which includes:
   * - unitCount: Units BEING PURCHASED
   * - isSingleUnit: Whether this is a single condo/apartment
   * - totalUnitsInBuilding: Total units in building (for reference)
   * 
   * Checks multiple sources in priority order:
   * 1. property.unitCount (from RentCast API - most accurate)
   * 2. property.isSingleUnit flag (prevents condo multiplication error)
   * 3. detectMultiFamily utility function (type-based detection)
   * 
   * Used for:
   * - Calculating total rent (per-unit rent × units being purchased)
   * - Displaying unit count in UI
   * - Per-unit metric calculations
   * 
   * @type {Object}
   * @memoized
   * @property {boolean} isMultiFamily - True if buying entire multi-family building
   * @property {number} units - Number of rental units being purchased
   * @property {boolean} isSingleUnit - True if single unit in building (condo/apartment)
   * @property {number} totalUnitsInBuilding - Total units in building
   * @property {string} detectionReason - Why this unit count was chosen
   * 
   * @example
   * // Single condo in 120-unit building
   * // Returns: { isMultiFamily: false, units: 1, isSingleUnit: true, totalUnitsInBuilding: 120 }
   * 
   * // Entire duplex
   * // Returns: { isMultiFamily: true, units: 2, isSingleUnit: false, totalUnitsInBuilding: 2 }
   */
  const multiFamily = useMemo(() => {
    if (!property) return { 
      isMultiFamily: false, 
      units: 1, 
      isSingleUnit: false,
      totalUnitsInBuilding: 1,
      detectionReason: 'No property data'
    };
    
    // v2.0 CRITICAL FIX: Check if single unit in building
    if (property.isSingleUnit) {
      return {
        isMultiFamily: false,
        units: 1,
        isSingleUnit: true,
        totalUnitsInBuilding: property.totalUnitsInBuilding || 1,
        detectionReason: property.detectionReason || 'Single unit in building'
      };
    }
    
    // Check for RentCast-provided unit count
    if (property.unitCount) {
      return {
        isMultiFamily: property.unitCount > 1,
        units: property.unitCount,
        isSingleUnit: false,
        totalUnitsInBuilding: property.totalUnitsInBuilding || property.unitCount,
        detectionReason: property.detectionReason || 'RentCast API'
      };
    }
    
    // Fallback to old detection method
    const detected = detectMultiFamily(property);
    return {
      ...detected,
      isSingleUnit: false,
      totalUnitsInBuilding: detected.units,
      detectionReason: 'Property type detection'
    };
  }, [property]);

  /**
   * Number of rental units being purchased
   * Uses manual override if set, otherwise uses detected units
   * @type {number}
   */
  const units = manualUnitCount ?? multiFamily.units;

  /**
   * Load investor profile on component mount
   * 
   * Fetches user's saved investor profile from Firebase to get default
   * assumptions for financing, expenses, and projections. Profile is used
   * to initialize calculation inputs.
   * 
   * Runs when: currentUser changes (sign in/out)
   * 
   * @listens currentUser
   */
  useEffect(() => {
    /**
     * Async function to load investor profile
     * @async
     * @private
     */
    const loadProfile = async () => {
      if (currentUser) {
        try {
          const profile = await getInvestorProfile(currentUser.uid);
          setInvestorProfile(profile);
        } catch (error) {
          console.error('Error loading investor profile:', error);
        }
      }
    };
    loadProfile();
  }, [currentUser]);

  /**
   * Load property from Firebase if not in navigation state
   * 
   * If property data wasn't passed through navigation, attempts to load it
   * from user's saved properties in Firebase. Converts Firestore document
   * format to flat property object for use throughout page.
   * 
   * Runs when: propertyId or currentUser changes and property is not set
   * 
   * @listens propertyId
   * @listens currentUser
   * @listens property
   */
  useEffect(() => {
    /**
     * Async function to load property from Firebase
     * @async
     * @private
     */
    const loadProperty = async () => {
      if (!property && propertyId && currentUser) {
        try {
          setLoading(true);
          const savedProp = await getSavedProperty(currentUser.uid, propertyId);
          if (savedProp) {
            const flatProperty = {
              property_id: savedProp.propertyId,
              ...savedProp.propertyData,
              rentCastData: savedProp.rentCastData,
              scoreData: savedProp.scoreData,
              thumbnail: savedProp.thumbnail,
              photos: savedProp.photos,
              // v2.0: Include unit detection data
              unitCount: savedProp.propertyData?.unitCount,
              isSingleUnit: savedProp.propertyData?.isSingleUnit,
              totalUnitsInBuilding: savedProp.propertyData?.totalUnitsInBuilding,
              detectionReason: savedProp.propertyData?.detectionReason
            };
            setProperty(flatProperty);
            setIsSaved(true);
          }
        } catch (error) {
          console.error('Error loading property:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadProperty();
  }, [propertyId, currentUser, property]);

  /**
   * Auto-save property when page opens
   * 
   * CRITICAL FEATURE: Automatically saves property to user's collection when
   * they open the analysis page. This ensures all analyzed properties are
   * tracked in the portfolio.
   * 
   * Process:
   * 1. Check if user is authenticated
   * 2. Check if property is already saved
   * 3. If not saved, save property with basic data
   * 4. Update isSaved state to show "SAVED" badge
   * 
   * Runs when: currentUser, property, or units changes
   * 
   * @listens currentUser
   * @listens property
   * @listens units
   */
  useEffect(() => {
    /**
     * Async function to auto-save property
     * @async
     * @private
     */
    const autoSaveProperty = async () => {
      if (!currentUser || !property?.property_id) {
        console.log('⚠️ Cannot auto-save: missing user or property_id');
        return;
      }
      
      try {
        const alreadySaved = await isPropertySaved(currentUser.uid, property.property_id);
        if (alreadySaved) {
          setIsSaved(true);
          console.log('✅ Property already saved');
          return;
        }
        
        // Build property data for saving
        const propertyData = {
          property_id: property.property_id,
          address: property.address || property.location?.address?.line || '',
          city: property.city || property.location?.address?.city || '',
          state: property.state || property.location?.address?.state_code || '',
          zip: property.zipCode || property.zip || property.location?.address?.postal_code || '',
          price: property.price || property.list_price || 0,
          beds: property.beds || property.description?.beds || 0,
          baths: property.baths || property.description?.baths || 0,
          sqft: property.sqft || property.description?.sqft || 0,
          thumbnail: property.thumbnail || property.primary_photo?.href || '',
          propertyType: property.propertyType || property.description?.type || '',
          // v2.0: Save unit detection data
          units: units,
          unitCount: property.unitCount,
          isSingleUnit: property.isSingleUnit,
          totalUnitsInBuilding: property.totalUnitsInBuilding,
          detectionReason: property.detectionReason
        };
        
        console.log('💾 Auto-saving property:', propertyData.address);
        await saveProperty(currentUser.uid, propertyData, property.rentCastData || null, null);
        setIsSaved(true);
        console.log('✅ Property auto-saved successfully');
      } catch (error) {
        console.error('❌ Error auto-saving property:', error);
      }
    };
    
    autoSaveProperty();
  }, [currentUser, property, units]);

  /**
   * Initialize calculation inputs with property data and investor profile defaults
   * 
   * CRITICAL FOR MULTI-FAMILY v2.0: Calculates total annual rent correctly by
   * multiplying per-unit rent by number of units BEING PURCHASED (not total in building).
   * 
   * Input sources (priority order):
   * 1. Investor profile defaults (financing, expenses, projections)
   * 2. Property data (price, sqft, beds)
   * 3. RentCast data (rent estimate per unit)
   * 4. Hard-coded defaults (if profile not set)
   * 
   * Multi-family rent calculation v2.0:
   * - Gets per-unit rent from RentCast or estimation
   * - Multiplies by units BEING PURCHASED: totalAnnualRent = rentPerUnit × units × 12
   * - For single condo: units = 1, so no multiplication error
   * - For entire duplex: units = 2, correctly multiplies
   * 
   * Runs when: property, investorProfile, units, or multiFamily changes
   * 
   * @listens property
   * @listens investorProfile
   * @listens units
   * @listens multiFamily
   */
  useEffect(() => {
  if (!property) return;

  const financingDefaults = investorProfile ? getFinancingDefaults(investorProfile) : {};
  const expenseDefaults = investorProfile ? getExpenseDefaults(investorProfile) : {};

  const price = property.price || property.list_price || property.propertyData?.price || 0;
  const sqft = property.sqft || property.description?.sqft || property.propertyData?.sqft || 1000;
  const beds = property.beds || property.description?.beds || property.propertyData?.beds || 0;
  
  // v2.0: Use totalMonthlyRent if available (already correctly calculated)
  let rentPerUnit;
  if (property.totalMonthlyRent && units > 0) {
    // RentCast already calculated total rent correctly
    rentPerUnit = property.totalMonthlyRent / units;
  } else if (property.rentEstimate) {
    // This is per-unit rent from RentCast
    rentPerUnit = property.rentEstimate;
  } else {
    // Estimate per-unit rent
    rentPerUnit = estimateRent(price / units, beds / units, sqft / units);
  }

  const totalAnnualRent = rentPerUnit * units * 12;

  console.log('🏢 Multi-family detection:', multiFamily);
  console.log('💰 Rent per unit:', rentPerUnit);
  console.log('💰 Units being purchased:', units);
  console.log('💰 Total annual rent:', totalAnnualRent);

  setInputs({
    fairMarketValue: price,
    sqft: sqft,
    numberOfUnits: units,
    offerPrice: price,
    repairs: 0,
    repairsContingency: 0,
    purchaseCostsPercent: financingDefaults.closingCostsPercent || 3,
    lenderFee: 0,
    brokerFee: 0,
    environmentals: 0,
    inspections: 500,
    appraisals: 500,
    misc: 0,
    transferTax: 0,
    legal: 500,
    firstMtgLTV: 100 - (financingDefaults.downPaymentPercent || 20),
    firstMtgRate: financingDefaults.interestRate || 7.0,
    firstMtgAmortization: financingDefaults.loanTermYears || 30,
    firstMtgCMHCFee: 0,
    secondMtgPrincipal: 0,
    secondMtgRate: 12,
    secondMtgAmortization: 30,
    interestOnlyPrincipal: 0,
    interestOnlyRate: 0,
    otherMonthlyFinancingCosts: 0,
    grossRents: totalAnnualRent,
    parking: 0,
    storage: 0,
    laundry: 0,
    otherIncome: 0,
    vacancyRate: expenseDefaults.vacancyRate || 5,
    managementRate: expenseDefaults.managementRate || 8,
    repairsPercent: expenseDefaults.maintenanceRate || 5,
    propertyTaxes: Math.round(price * (expenseDefaults.propertyTaxRate || 1.2) / 100),
    insurance: Math.round(price * (expenseDefaults.insuranceRate || 0.5) / 100),
    electricity: 0,
    gas: 0,
    lawnMaintenance: 0,
    waterSewer: 0,
    cable: 0,
    caretaking: 0,
    advertising: 100,
    associationFees: 0,
    pestControl: 0,
    security: 0,
    trashRemoval: 0,
    miscellaneous: 0,
    commonArea: 0,
    capitalImprovements: Math.round(totalAnnualRent * (expenseDefaults.capExRate || 5) / 100),
    accounting: 0,
    legalExpenses: 0,
    badDebts: 0,
    otherExpenses: 0,
    evictions: 0,
    appreciationRate: 3.0,
    incomeGrowthRate: 2.0,
    expenseGrowthRate: 2.0,
    sellingCosts: 6.0,
    holdingPeriod: 5,
    deposits: 0,
    lessProRation: 0
  });
}, [property, investorProfile, units, multiFamily, manualUnitCount]); 

  /**
   * Handle input field change
   * 
   * Updates a single input field and triggers recalculation in child components.
   * All inputs are stored in inputs state object and passed to calculation components.
   * 
   * @function
   * @param {string} field - Input field name
   * @param {number|string} value - New field value
   * 
   * @example
   * handleInputChange('offerPrice', 250000);
   * handleInputChange('firstMtgRate', 6.5);
   */
  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handle unsave (remove property from saved collection)
   * 
   * Removes property from user's Firebase saved properties collection.
   * Updates isSaved state to hide "SAVED" badge.
   * 
   * @async
   * @function
   * 
   * @example
   * // User clicks "Remove from Saved" button
   * await handleUnsave();
   * // Property removed from Firebase, UI updated
   */
  const handleUnsave = async () => {
    if (!currentUser || !property?.property_id) return;

    setSaving(true);
    try {
      await unsaveProperty(currentUser.uid, property.property_id);
      setIsSaved(false);
      console.log('✅ Property removed from saved');
    } catch (error) {
      console.error('❌ Error removing property:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle share button click
   * 
   * Copies current page URL to clipboard for sharing the property analysis
   * with others. Shows alert confirmation when copied.
   * 
   * @function
   */
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  /**
   * Navigate back to previous page
   * @function
   */
  const handleBack = () => navigate(-1);
  
  /**
   * Handle results update from PropertyAnalysisContent
   * 
   * Callback function passed to PropertyAnalysisContent. Updates results state
   * when calculations complete, allowing other sections to display updated metrics.
   * 
   * @function
   * @param {Object} newResults - New calculation results from BuyRentHoldCalculator
   * @param {Object} newResults.quickAnalysis - Investment ratios (Cap Rate, CoC, etc.)
   * @param {Object} newResults.cashflow - Cash flow details
   * @param {Object} newResults.investmentScore - Investment score 0-100
   */
  const handleResultsChange = (newResults) => setResults(newResults);

  /**
   * Format number as USD currency
   * 
   * @function
   * @param {number} price - Price value in dollars
   * @returns {string} Formatted currency string (e.g., "$250,000")
   * 
   * @example
   * formatPrice(250000); // "$250,000"
   * formatPrice(null);   // "N/A"
   */
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(price);
  };

  /**
   * Format number as percentage
   * 
   * @function
   * @param {number} value - Percentage value
   * @returns {string} Formatted percentage (e.g., "7.5%")
   * 
   * @example
   * formatPercent(7.5);  // "7.5%"
   * formatPercent(null); // "0.0%"
   */
  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  /**
   * Extract property address with fallbacks
   * Tries multiple possible data formats
   * @type {string}
   */
  const address = property?.address || property?.location?.address?.line || property?.propertyData?.address || 'N/A';
  
  /**
   * Extract city name with fallbacks
   * @type {string}
   */
  const city = property?.city || property?.location?.address?.city || property?.propertyData?.city || '';
  
  /**
   * Extract state code with fallbacks
   * @type {string}
   */
  const state = property?.state || property?.location?.address?.state_code || property?.propertyData?.state || '';
  
  /**
   * Extract ZIP code with fallbacks
   * @type {string}
   */
  const zipCode = property?.zipCode || property?.zip || property?.location?.address?.postal_code || '';
  
  /**
   * Extract price with fallbacks
   * @type {number}
   */
  const price = property?.price || property?.list_price || property?.propertyData?.price || 0;
  
  /**
   * Extract bedrooms with fallbacks
   * @type {number}
   */
  const beds = property?.beds || property?.description?.beds || property?.propertyData?.beds || 0;
  
  /**
   * Extract bathrooms with fallbacks
   * @type {number}
   */
  const baths = property?.baths || property?.description?.baths || property?.propertyData?.baths || 0;
  
  /**
   * Extract square footage with fallbacks
   * @type {number}
   */
  const sqft = property?.sqft || property?.description?.sqft || property?.propertyData?.sqft || 0;
  
  /**
   * Get best available property image
   * 
   * Tries multiple image sources in priority order and returns first valid URL.
   * Falls back to placeholder if no images available.
   * 
   * @type {string}
   * @memoized
   */
  const image = useMemo(() => {
    const sources = [property?.primary_photo?.href, property?.primaryPhoto, property?.photos?.[0]?.href, property?.thumbnail];
    return sources.find(url => url && typeof url === 'string') || 'https://placehold.co/400x300/e5e7eb/6b7280?text=No+Image';
  }, [property]);

  /**
   * Calculate per-unit rent
   * Uses RentCast data if available, otherwise uses total rent divided by units
   * @type {number}
   */
  const rentPerUnit = property?.rentEstimate || (property?.totalMonthlyRent ? property.totalMonthlyRent / units : inputs.grossRents / units / 12) || 0;
  
  /**
   * Rent data source label
   * @type {string}
   */
  const rentSource = property?.rentEstimate ? 'RentCast' : 'Estimate';
  
  /**
   * Cap rate from analysis results
   * @type {number}
   */
  const capRate = results?.quickAnalysis?.capRateOnPP || 0;

  /**
   * Sidebar menu structure
   * 
   * Defines all navigation sections and their icons. Organized into
   * property information and analysis sections.
   * 
   * @constant {Array<Object>}
   * @property {string} [title] - Section title (uppercase)
   * @property {Array<Object>} items - Menu items in section
   * @property {string} items[].id - Section ID for routing
   * @property {string} items[].label - Display label
   * @property {React.Component} items[].icon - Lucide icon component
   */
  const menuSections = [
    { items: [
      { id: 'description', label: 'Property Description', icon: Home },
      { id: 'worksheet', label: 'Purchase Worksheet', icon: Edit },
      { id: 'photos', label: 'Photos', icon: Image }
    ]},
    { title: 'ANALYSIS', items: [
      { id: 'analysis', label: 'Property Analysis', icon: TrendingUp },
      { id: 'projections', label: 'Buy & Hold Projections', icon: BarChart3 }
    ]}
  ];

  /**
   * Loading state UI
   * Shown while fetching property from Firebase
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading property analysis...</p>
        </div>
      </div>
    );
  }

  /**
   * Property not found state UI
   * Shown when property couldn't be loaded
   */
  if (!property) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Property Not Found</h2>
          <button onClick={() => navigate('/properties')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Search Properties
          </button>
        </div>
      </div>
    );
  }

  /**
   * Extract and normalize property photos
   * 
   * Consolidates photos from multiple possible sources:
   * - property.photos array
   * - property.thumbnail
   * - property.primary_photo
   * - property.primaryPhoto
   * 
   * Removes duplicates and ensures all photos have href property.
   * 
   * @type {Array<Object>}
   * @memoized
   * @property {string} href - Photo URL
   * 
   * @example
   * // Returns: [{ href: 'url1' }, { href: 'url2' }, ...]
   */
  const propertyPhotos = useMemo(() => {
    const photos = [];
    
    // Check property.photos array
    if (property?.photos?.length > 0) {
      property.photos.forEach(p => {
        const url = typeof p === 'string' ? p : p?.href || p?.url;
        if (url) photos.push({ href: url });
      });
    }
    
    // Add thumbnail if not already included
    if (property?.thumbnail && !photos.some(p => p.href === property.thumbnail)) {
      photos.unshift({ href: property.thumbnail });
    }
    // Add primary_photo if not already included
if (property?.primary_photo?.href && !photos.some(p => p.href === property.primary_photo.href)) {
  photos.unshift({ href: property.primary_photo.href });
}

// Add primaryPhoto if not already included
if (property?.primaryPhoto && !photos.some(p => p.href === property.primaryPhoto)) {
  photos.unshift({ href: property.primaryPhoto });
}

return photos;
}, [property]);
/**

Render content based on active section

Routes to appropriate child component or renders content directly
based on activeSection state. Each section receives current inputs
and property data as props.

@function
@returns {React.ReactElement} Section content

Sections:


'worksheet': PurchaseWorksheet component for input editing




'projections': BuyHoldProjections component for 5-year forecast




'photos': Photo grid display




'description': Property details display




default: PropertyAnalysisContent for full analysis
*/
const renderContent = () => {
switch (activeSection) {
case 'worksheet':
return <PurchaseWorksheet property={property} inputs={inputs} onInputChange={handleInputChange} />;
case 'projections':
return <BuyHoldProjections property={property} inputs={inputs} results={results} />;
case 'photos':
return (
   <div className="max-w-7xl mx-auto p-6">
     <h1 className="text-2xl font-bold text-gray-900 mb-6">Property Photos</h1>
     <p className="text-gray-600 mb-4">{address}</p>
     {propertyPhotos.length > 0 ? (
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
         {propertyPhotos.map((photo, idx) => (
           <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
             <img 
               src={photo.href} 
               alt={`Photo ${idx + 1}`}
               className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
               onError={(e) => { 
                 e.target.onerror = null;
                 e.target.src = 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'; 
               }}
             />
             <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
               {idx + 1}/{propertyPhotos.length}
             </div>
           </div>
         ))}
       </div>
     ) : (
       <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
         <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
         <h3 className="text-lg font-medium text-gray-900 mb-2">No Photos Available</h3>
         <p className="text-gray-600">This property doesn't have any photos.</p>
       </div>
     )}
   </div>
 );


case 'description':
return (
<div className="max-w-7xl mx-auto p-6">
<h1 className="text-2xl font-bold text-gray-900 mb-6">Property Description</h1>
<div className="bg-white rounded-lg border p-6 space-y-4">
<div className="grid grid-cols-2 gap-4">
<div>
<p className="text-sm text-gray-500">Address</p>
<p className="font-medium">{address}</p>
<p className="text-gray-600">{city}, {state} {zipCode}</p>
</div>
<div>
<p className="text-sm text-gray-500">Price</p>
<p className="text-2xl font-bold text-blue-600">{formatPrice(price)}</p>
{multiFamily.isMultiFamily && (
<p className="text-sm text-gray-500">{formatPrice(price/units)}/unit</p>
)}
{/* v2.0 NEW: Show single unit info */}
{multiFamily.isSingleUnit && (
<p className="text-sm text-blue-600">Single unit in {multiFamily.totalUnitsInBuilding}-unit building</p>
)}
</div>
</div>
<div className="grid grid-cols-5 gap-4 pt-4 border-t">
<div><p className="text-sm text-gray-500">Beds</p><p className="text-lg font-semibold">{beds}</p></div>
<div><p className="text-sm text-gray-500">Baths</p><p className="text-lg font-semibold">{baths}</p></div>
<div><p className="text-sm text-gray-500">Sqft</p><p className="text-lg font-semibold">{sqft.toLocaleString()}</p></div>
<div><p className="text-sm text-gray-500">Units</p><p className="text-lg font-semibold">{units}</p></div>
<div><p className="text-sm text-gray-500">Year Built</p><p className="text-lg font-semibold">{property.yearBuilt || 'N/A'}</p></div>
</div>
{/* v2.0 NEW: Unit detection info */}
     {(multiFamily.isSingleUnit || multiFamily.isMultiFamily) && (
       <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${
         multiFamily.isSingleUnit ? 'bg-blue-50 border border-blue-200' : 'bg-purple-50 border border-purple-200'
       }`}>
         <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
           multiFamily.isSingleUnit ? 'text-blue-600' : 'text-purple-600'
         }`} />
         <div className={`text-sm ${multiFamily.isSingleUnit ? 'text-blue-700' : 'text-purple-700'}`}>
           <strong>Detection:</strong> {multiFamily.detectionReason}
           {multiFamily.isSingleUnit && ` - This is 1 unit in a ${multiFamily.totalUnitsInBuilding}-unit building`}
         </div>
       </div>
     )}
   </div>
 </div>
 );
default:
return <PropertyAnalysisContent property={property} inputs={inputs} onInputChange={handleInputChange} onResultsChange={handleResultsChange} />;
}
};

return (
<div className="flex h-screen bg-gray-50 overflow-hidden">
{/* Sidebar */}
<div className="w-72 bg-white border-r flex flex-col h-full overflow-y-auto flex-shrink-0">
<button onClick={handleBack} className="p-4 text-blue-600 hover:text-blue-800 flex items-center gap-2 border-b hover:bg-gray-50">
<ArrowLeft className="w-4 h-4" /> Back to property search
</button>
<div className="relative h-48 bg-gray-200">
      <img src={image} alt={address} className="w-full h-full object-cover"
        onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=No+Image'; }}
      />
      <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
        {isSaved && (
          <span className="inline-flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
            <Check className="w-3 h-3" /> SAVED
          </span>
        )}
        <span className={`px-2 py-1 rounded text-xs font-semibold ${rentSource === 'RentCast' ? 'bg-emerald-600 text-white' : 'bg-orange-600 text-white'}`}>
          {rentSource === 'RentCast' ? 'RENTCAST' : 'RENTAL'}
        </span>
        {/* v2.0 UPDATED: Show unit badge */}
        {multiFamily.isSingleUnit && (
          <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-600 text-white flex items-center gap-1">
            <Building className="w-3 h-3" /> 1/{multiFamily.totalUnitsInBuilding}
          </span>
        )}
        {multiFamily.isMultiFamily && !multiFamily.isSingleUnit && (
          <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-600 text-white flex items-center gap-1">
            <Building className="w-3 h-3" /> {units}
          </span>
        )}
      </div>
      <button onClick={handleShare}
        className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700 flex items-center gap-1">
        <Share2 className="w-3 h-3" /> Share
      </button>
    </div>

    <div className="p-4 border-b">
      <div className="text-sm font-semibold text-gray-900 mb-2">Investment Property Analysis</div>
      <div className="text-sm text-gray-600 space-y-1">
        <div className="font-medium text-gray-900">{address}</div>
        <div>{city}, {state} {zipCode}</div>
        <div className="flex items-center gap-3 text-xs mt-2">
          {beds > 0 && <span>{beds} BR</span>}
          {baths > 0 && <span>· {baths} BA</span>}
          {sqft > 0 && <span>· {sqft.toLocaleString()} Sq.Ft.</span>}
          {multiFamily.isSingleUnit && (
            <span className="text-blue-600 font-medium">· 1/{multiFamily.totalUnitsInBuilding} Units</span>
          )}
          {multiFamily.isMultiFamily && !multiFamily.isSingleUnit && (
            <span className="text-purple-600 font-medium">· {units} Units</span>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-blue-600">{formatPrice(price)}</span>
        {capRate > 0 && <span className="text-sm text-gray-500">{formatPercent(capRate)} Cap Rate</span>}
      </div>
      {rentPerUnit > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {multiFamily.isMultiFamily ? 'Rent/Unit:' : multiFamily.isSingleUnit ? 'Unit Rent:' : 'Est. Rent:'}
            </span>
            <span className={`text-sm font-semibold ${rentSource === 'RentCast' ? 'text-emerald-600' : 'text-blue-600'}`}>
              {formatPrice(rentPerUnit)}/mo
            </span>
            {rentSource === 'RentCast' && <span className="text-xs text-emerald-600">✓ API</span>}
          </div>
          {/* v2.0 UPDATED: Show total rent only for multi-family buildings */}
          {multiFamily.isMultiFamily && !multiFamily.isSingleUnit && (
            <div className="text-sm text-purple-600">
              Total: {formatPrice(rentPerUnit * units)}/mo
            </div>
          )}
        </div>
      )}
      
      {/* v2.0 NEW: Manual unit count override */}
      {(multiFamily.isMultiFamily || multiFamily.isSingleUnit) && (
        <div className="mt-3 pt-3 border-t">
          <label className="text-xs font-medium text-gray-700 block mb-1">
            Unit Count Override
          </label>
          <input
            type="number"
            min="1"
            value={manualUnitCount ?? units}
            onChange={(e) => setManualUnitCount(parseInt(e.target.value) || null)}
            className="w-full px-2 py-1 text-sm border rounded"
            placeholder="Auto-detected units"
          />
          <p className="text-xs text-gray-500 mt-1">
            Auto: {multiFamily.units} {multiFamily.isSingleUnit && `(1 of ${multiFamily.totalUnitsInBuilding})`}
          </p>
          {manualUnitCount && manualUnitCount !== multiFamily.units && (
            <button
              onClick={() => setManualUnitCount(null)}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              Reset to auto-detected
            </button>
          )}
        </div>
      )}
    </div>

    <nav className="flex-1 py-2 overflow-y-auto">
      {menuSections.map((section, idx) => (
        <div key={idx} className="mb-1">
          {section.title && (
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{section.title}</div>
          )}
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                }`}>
                <Icon className="w-4 h-4" /><span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>

    {/* Only show Remove button when saved */}
    {isSaved && (
      <div className="p-4 border-t bg-gray-50">
        <button onClick={handleUnsave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Remove from Saved
        </button>
      </div>
    )}
  </div>

  <div className="flex-1 overflow-y-auto">{renderContent()}</div>
</div>
);
}