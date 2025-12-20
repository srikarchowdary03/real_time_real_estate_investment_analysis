import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Edit, Image, TrendingUp, BarChart3, 
  Share2, Trash2, ArrowLeft, Check, Loader2,
  Building
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

export default function PropertyAnalysisPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const [property, setProperty] = useState(location.state?.propertyData || location.state?.property || null);
  const [loading, setLoading] = useState(!location.state?.propertyData && !location.state?.property);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [investorProfile, setInvestorProfile] = useState(null);
  const [activeSection, setActiveSection] = useState('analysis');
  const [inputs, setInputs] = useState({});
  const [results, setResults] = useState(null);

  // DETECT MULTI-FAMILY
  const multiFamily = useMemo(() => {
    if (!property) return { isMultiFamily: false, units: 1 };
    if (property.detectedUnits) {
      return { isMultiFamily: property.detectedUnits > 1, units: property.detectedUnits };
    }
    return detectMultiFamily(property);
  }, [property]);

  const units = multiFamily.units;

  // Load investor profile
  useEffect(() => {
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

  // Load property from database if not in navigation state
  useEffect(() => {
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
              photos: savedProp.photos
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

  // Auto-save property when page opens
  useEffect(() => {
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
          units: units
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

  // Initialize inputs - HANDLES MULTI-FAMILY RENT CORRECTLY
  useEffect(() => {
    if (!property) return;

    const financingDefaults = investorProfile ? getFinancingDefaults(investorProfile) : {};
    const expenseDefaults = investorProfile ? getExpenseDefaults(investorProfile) : {};

    const price = property.price || property.list_price || property.propertyData?.price || 0;
    const sqft = property.sqft || property.description?.sqft || property.propertyData?.sqft || 1000;
    const beds = property.beds || property.description?.beds || property.propertyData?.beds || 0;
    
    const rentPerUnit = property.rentCastData?.rentEstimate || 
                        property.rentEstimate || 
                        estimateRent(price / units, beds / units, sqft / units);

    const totalAnnualRent = rentPerUnit * units * 12;

    console.log('🏢 Multi-family detection:', multiFamily);
    console.log('💰 Rent per unit:', rentPerUnit);
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
  }, [property, investorProfile, units, multiFamily]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  // Handle unsave (remove from saved)
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleBack = () => navigate(-1);
  const handleResultsChange = (newResults) => setResults(newResults);

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(price);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  // Extract property details
  const address = property?.address || property?.location?.address?.line || property?.propertyData?.address || 'N/A';
  const city = property?.city || property?.location?.address?.city || property?.propertyData?.city || '';
  const state = property?.state || property?.location?.address?.state_code || property?.propertyData?.state || '';
  const zipCode = property?.zipCode || property?.zip || property?.location?.address?.postal_code || '';
  const price = property?.price || property?.list_price || property?.propertyData?.price || 0;
  const beds = property?.beds || property?.description?.beds || property?.propertyData?.beds || 0;
  const baths = property?.baths || property?.description?.baths || property?.propertyData?.baths || 0;
  const sqft = property?.sqft || property?.description?.sqft || property?.propertyData?.sqft || 0;
  
  const image = useMemo(() => {
    const sources = [property?.primary_photo?.href, property?.primaryPhoto, property?.photos?.[0]?.href, property?.thumbnail];
    return sources.find(url => url && typeof url === 'string') || 'https://placehold.co/400x300/e5e7eb/6b7280?text=No+Image';
  }, [property]);

  const rentPerUnit = property?.rentCastData?.rentEstimate || inputs.grossRents / units / 12 || 0;
  const rentSource = property?.rentCastData?.rentEstimate ? 'RentCast' : 'Estimate';
  const capRate = results?.quickAnalysis?.capRateOnPP || 0;

  const menuSections = [
    { items: [
      { id: 'description', label: 'Property Description', icon: Home },
      { id: 'worksheet', label: 'Purchase Worksheet', icon: Edit },
      { id: 'photos', label: 'Photos', icon: Image }
    ]}
  ];

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
            {property.photos?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.photos.map((photo, idx) => (
                  <img key={idx} src={photo.href || photo} alt={`Photo ${idx + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=No+Image'; }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No photos available.</p>
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
                </div>
              </div>
              <div className="grid grid-cols-5 gap-4 pt-4 border-t">
                <div><p className="text-sm text-gray-500">Beds</p><p className="text-lg font-semibold">{beds}</p></div>
                <div><p className="text-sm text-gray-500">Baths</p><p className="text-lg font-semibold">{baths}</p></div>
                <div><p className="text-sm text-gray-500">Sqft</p><p className="text-lg font-semibold">{sqft.toLocaleString()}</p></div>
                <div><p className="text-sm text-gray-500">Units</p><p className="text-lg font-semibold">{units}</p></div>
                <div><p className="text-sm text-gray-500">Year Built</p><p className="text-lg font-semibold">{property.yearBuilt || 'N/A'}</p></div>
              </div>
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
          <div className="absolute top-2 left-2 flex gap-1">
            {isSaved && (
              <span className="inline-flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                <Check className="w-3 h-3" /> SAVED
              </span>
            )}
            <span className={`px-2 py-1 rounded text-xs font-semibold ${rentSource === 'RentCast' ? 'bg-emerald-600 text-white' : 'bg-orange-600 text-white'}`}>
              {rentSource === 'RentCast' ? 'RENTCAST' : 'RENTAL'}
            </span>
            {multiFamily.isMultiFamily && (
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
              {multiFamily.isMultiFamily && <span className="text-purple-600 font-medium">· {units} Units</span>}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">{formatPrice(price)}</span>
            {capRate > 0 && <span className="text-sm text-gray-500">{formatPercent(capRate)} Cap Rate</span>}
          </div>
          {rentPerUnit > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {multiFamily.isMultiFamily ? 'Rent/Unit:' : 'Est. Rent:'}
              </span>
              <span className={`text-sm font-semibold ${rentSource === 'RentCast' ? 'text-emerald-600' : 'text-blue-600'}`}>
                {formatPrice(rentPerUnit)}/mo
              </span>
              {rentSource === 'RentCast' && <span className="text-xs text-emerald-600">✓ API</span>}
            </div>
          )}
          {multiFamily.isMultiFamily && (
            <div className="mt-1 text-sm text-purple-600">
              Total: {formatPrice(rentPerUnit * units)}/mo
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