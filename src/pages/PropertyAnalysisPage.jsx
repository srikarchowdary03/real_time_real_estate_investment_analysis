import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import PropertySidebar from '../components/analysis/PropertySidebar';
import PropertyAnalysisContent from '../components/analysis/PropertyAnalysisContent';
import PurchaseWorksheet from '../components/analysis/PurchaseWorksheet';
import BuyHoldProjections from '../components/analysis/BuyHoldProjections';
import PropertyDescription from '../components/analysis/PropertyDescription';
import PropertyPhotos from '../components/analysis/PropertyPhotos';

export default function PropertyAnalysisPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('analysis');
  
  // State for all inputs (shared across all views)
  const [inputs, setInputs] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    // Check if property data was passed via navigation state
    if (location.state?.propertyData) {
      setProperty(location.state.propertyData);
      initializeInputs(location.state.propertyData);
      setLoading(false);
    } else {
      // Otherwise try to fetch from Firebase
      fetchProperty();
    }
  }, [propertyId, location.state]);

  const initializeInputs = (propertyData) => {
    // Initialize with default values from property data - DEALCHECK DEFAULTS
    const defaultInputs = {
      // Property Info
      fairMarketValue: propertyData.price || 0,
      vacancyRate: 10.0,  // DealCheck default (not 5%)
      managementRate: 10.0,
      advertisingCost: 100,
      numberOfUnits: propertyData.beds || 1,
      appreciationRate: 3.0,
      incomeGrowthRate: 2.0,
      expenseGrowthRate: 2.0,
      sellingCosts: 6.0,

      // Purchase Info
      offerPrice: propertyData.price || 0,
      purchaseCostsTotal: (propertyData.price || 0) * 0.03, // 3% default
      purchaseCostsPercent: 3, // 3% default
      repairs: 0,  // Start at 0, user can itemize
      repairsContingency: 0,
      lenderFee: 0,
      brokerFee: 0,
      environmentals: 0,
      inspections: 0,
      appraisals: 0,
      misc: 0,
      transferTax: 0,
      legal: 0,

      // Itemized costs (will sync with purchase worksheet)
      itemizedPurchaseCosts: [],
      itemizedRehabCosts: [],

      // Financing
      firstMtgLTV: 80,
      firstMtgRate: 6.0,  // More realistic default
      firstMtgAmortization: 30,
      firstMtgCMHCFee: 0,
      secondMtgPrincipal: 0,
      secondMtgRate: 12.0,
      secondMtgAmortization: 9999,
      interestOnlyPrincipal: 0,
      interestOnlyRate: 0,
      otherMonthlyFinancingCosts: 0,

      // Income (Annual)
      grossRents: (propertyData.zillowData?.rent || 0) * 12,
      parking: 0,
      storage: 0,
      laundry: 0,
      otherIncome: 0,

      // Operating Expenses (Annual) - DEALCHECK METHODOLOGY
      propertyTaxes: propertyData.zillowData?.taxData?.annualAmount || 0,
      insurance: propertyData.zillowData?.insurance?.annual || 0,
      maintenancePercent: 10.0,  // NEW - % of gross rents
      capExPercent: 5.0,         // NEW - % of gross rents
      electricity: 0,
      gas: 0,
      lawnMaintenance: 0,
      waterSewer: 0,
      cable: 0,
      caretaking: 0,
      advertising: 0,
      associationFees: 0,
      pestControl: 0,
      security: 0,
      trashRemoval: 0,
      miscellaneous: 0,
      commonArea: 0,
      capitalImprovements: 0,
      accounting: 0,
      legalExpenses: 0,
      badDebts: 0,
      otherExpenses: 0,
      evictions: 0,

      // Cash Requirements
      deposits: 0,
      lessProRation: 0,

      // Additional fields
      depreciationPeriod: 27.5,
      landValue: 0,
      sqft: propertyData.sqft || 1050
    };

    setInputs(defaultInputs);
  };

  const fetchProperty = async () => {
    try {
      const docRef = doc(db, 'savedProperties', propertyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const propertyData = { id: docSnap.id, ...docSnap.data() };
        setProperty(propertyData);
        initializeInputs(propertyData);
      } else {
        navigate('/properties');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!currentUser || !inputs) return;
    
    try {
      const analysisRef = doc(db, 'propertyAnalyses', propertyId);
      await setDoc(analysisRef, {
        propertyId: propertyId,
        userId: currentUser.uid,
        inputs,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      alert('Analysis saved successfully!');
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('Failed to save analysis');
    }
  };

  if (loading || !inputs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading property analysis...</div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  // Render appropriate content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'description':
        return <PropertyDescription property={property} />;
      case 'photos':
        return <PropertyPhotos property={property} />;
      case 'worksheet':
        return (
          <PurchaseWorksheet 
            property={property}
            inputs={inputs}
            onInputChange={handleInputChange}
            onSave={handleSave}
          />
        );
      case 'projections':
        return (
          <BuyHoldProjections 
            property={property}
            inputs={inputs}
            results={results}
          />
        );
      case 'analysis':
      default:
        return (
          <PropertyAnalysisContent 
            property={property}
            inputs={inputs}
            onInputChange={handleInputChange}
            onSave={handleSave}
            onResultsChange={setResults}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <PropertySidebar 
        property={property}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onBack={() => navigate('/properties')}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}