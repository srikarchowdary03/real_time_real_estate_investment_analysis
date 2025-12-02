import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ✅ CORRECT PATH: Use your original import path
import { db } from '../config/firebase';

// ✅ RentCast API for accurate rent estimates on analysis page
import { getPropertyRentData } from '../services/rentcastAPI';
import { saveProperty, isPropertySaved } from '../services/database';
import { useAuth } from '../hooks/useAuth';
import PropertySidebar from '../components/analysis/PropertySidebar';
import PropertyAnalysisContent from '../components/analysis/PropertyAnalysisContent';
import PurchaseWorksheet from '../components/analysis/PurchaseWorksheet';
import BuyHoldProjections from '../components/analysis/Buyholdprojections';
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
  const [isSaved, setIsSaved] = useState(false);
  
  const [inputs, setInputs] = useState(null);
  const [results, setResults] = useState(null);

  // Auto-save property to favorites when analysis page opens
  const autoSaveProperty = async (propertyData) => {
    if (!currentUser) {
      console.log('⚠️ User not logged in, skipping auto-save');
      return;
    }

    try {
      // Check if already saved
      const alreadySaved = await isPropertySaved(currentUser.uid, propertyData.property_id || propertyId);
      
      if (alreadySaved) {
        console.log('✅ Property already saved to favorites');
        setIsSaved(true);
        return;
      }

      // Prepare property data for saving
      const saveData = {
        property_id: propertyData.property_id || propertyId,
        address: propertyData.address || propertyData.location?.address?.line || '',
        city: propertyData.city || propertyData.location?.address?.city || '',
        state: propertyData.state || propertyData.location?.address?.state_code || '',
        zip: propertyData.zipCode || propertyData.zip || propertyData.location?.address?.postal_code || '',
        price: propertyData.price || propertyData.list_price || 0,
        beds: propertyData.beds || propertyData.description?.beds || 0,
        baths: propertyData.baths || propertyData.description?.baths || 0,
        sqft: propertyData.sqft || propertyData.description?.sqft || 0,
        thumbnail: propertyData.thumbnail || propertyData.primary_photo?.href || propertyData.photos?.[0]?.href || '',
        rentEstimate: propertyData.rentEstimate || 0,
        rentSource: propertyData.rentSource || 'estimate'
      };

      console.log('💾 Auto-saving property to favorites:', saveData.address);
      await saveProperty(currentUser.uid, saveData);
      setIsSaved(true);
      console.log('✅ Property auto-saved to favorites');
    } catch (error) {
      console.error('❌ Error auto-saving property:', error);
    }
  };

  useEffect(() => {
    const loadPropertyData = async () => {
      if (location.state?.propertyData) {
        console.log('🏠 Property data from navigation:', location.state.propertyData);
        const propertyData = location.state.propertyData;
        
        // Check if we already have rent estimate
        let rentEstimate = propertyData.rentEstimate || 
                          propertyData.enrichedData?.rentEstimate || 
                          propertyData.zillowData?.rent || 0;
        
        // If no rent estimate, fetch from RentCast API
        if (!rentEstimate || rentEstimate === 0) {
          console.log('📡 No rent estimate found, fetching from RentCast...');
          const rentData = await getPropertyRentData(propertyData);
          
          if (rentData?.rentEstimate) {
            rentEstimate = rentData.rentEstimate;
            console.log('✅ RentCast rent estimate:', rentEstimate);
            
            // Enrich property with RentCast data
            propertyData.rentEstimate = rentEstimate;
            propertyData.rentRangeLow = rentData.rentRangeLow;
            propertyData.rentRangeHigh = rentData.rentRangeHigh;
            propertyData.rentComparables = rentData.comparables;
            propertyData.rentSource = 'RentCast';
          }
        } else {
          console.log('✅ Using existing rent estimate:', rentEstimate);
        }
        
        setProperty(propertyData);
        initializeInputs(propertyData);
        
        // Auto-save to favorites
        await autoSaveProperty(propertyData);
        
        setLoading(false);
      } else {
        fetchProperty();
      }
    };
    
    loadPropertyData();
  }, [propertyId, location.state, currentUser]);

  const initializeInputs = (propertyData) => {
    // ✅ FIXED: Extract rent estimate from multiple possible locations
    let monthlyRent = 0;
    
    if (propertyData.rentEstimate) {
      monthlyRent = propertyData.rentEstimate;
      console.log('✅ Found rentEstimate at top level:', monthlyRent);
    } else if (propertyData.enrichedData?.rentEstimate) {
      monthlyRent = propertyData.enrichedData.rentEstimate;
      console.log('✅ Found rentEstimate in enrichedData:', monthlyRent);
    } else if (propertyData.zillowData?.rent) {
      monthlyRent = propertyData.zillowData.rent;
      console.log('✅ Found rent in zillowData:', monthlyRent);
    } else if (propertyData.zillowData?.rentEstimate) {
      monthlyRent = propertyData.zillowData.rentEstimate;
      console.log('✅ Found rentEstimate in zillowData:', monthlyRent);
    }
    
    console.log('💰 Monthly rent being used:', monthlyRent);
    console.log('📈 Annual gross rents:', monthlyRent * 12);

    // Initialize with defaults matching Excel spreadsheet
    const defaultInputs = {
      // Property Info
      fairMarketValue: propertyData.price || 0,
      vacancyRate: 5.0,
      managementRate: 10.0,
      advertisingCost: 100,
      numberOfUnits: propertyData.beds || 1,
      appreciationRate: 3.0,
      incomeGrowthRate: 2.0,
      expenseGrowthRate: 2.0,
      sellingCosts: 6.0,

      // Purchase Info
      offerPrice: propertyData.price || 0,
      purchaseCostsTotal: 0,
      purchaseCostsPercent: 0,
      repairs: 0,
      repairsContingency: 0,
      lenderFee: 0,
      brokerFee: 0,
      environmentals: 0,
      inspections: 0,
      appraisals: 0,
      misc: 0,
      transferTax: 0,
      legal: 0,

      itemizedPurchaseCosts: [],
      itemizedRehabCosts: [],

      // Financing
      firstMtgLTV: 80,
      firstMtgRate: 7.0,
      firstMtgAmortization: 30,
      firstMtgCMHCFee: 0,
      secondMtgPrincipal: 0,
      secondMtgRate: 12.0,
      secondMtgAmortization: 9999,
      interestOnlyPrincipal: 0,
      interestOnlyRate: 0,
      otherMonthlyFinancingCosts: 0,

      // Income Annual - ✅ USES EXTRACTED RENT
      grossRents: monthlyRent * 12,
      parking: 0,
      storage: 0,
      laundry: 0,
      otherIncome: 0,

      // Operating Expenses Annual
      propertyTaxes: propertyData.zillowData?.taxData?.annualAmount || 
                     propertyData.enrichedData?.taxData?.annualAmount || 0,
      insurance: propertyData.zillowData?.insurance?.annual || 0,
      repairsPercent: 5.0,
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

    console.log('✅ Initialized inputs with gross rents:', defaultInputs.grossRents);
    setInputs(defaultInputs);
  };

  const fetchProperty = async () => {
    try {
      let docRef, docSnap;
      
      if (currentUser) {
        const fullDocId = `${currentUser.uid}_${propertyId}`;
        docRef = doc(db, 'savedProperties', fullDocId);
        docSnap = await getDoc(docRef);
      }
      
      if (!docSnap?.exists()) {
        docRef = doc(db, 'savedProperties', propertyId);
        docSnap = await getDoc(docRef);
      }
      
      if (docSnap?.exists()) {
        const data = docSnap.data();
        console.log('📁 Fetched property from Firebase:', data);
        
        const propertyData = {
          property_id: data.propertyId || propertyId,
          price: data.propertyData?.price || 0,
          address: data.propertyData?.address || '',
          city: data.propertyData?.city || '',
          state: data.propertyData?.state || '',
          zipCode: data.propertyData?.zipCode || '',
          beds: data.propertyData?.beds || 0,
          baths: data.propertyData?.baths || 0,
          sqft: data.propertyData?.sqft || 0,
          rentEstimate: data.rentEstimate,
          zillowData: {
            rent: data.rentEstimate,
            rentEstimate: data.rentEstimate,
            photos: data.photos,
            taxData: { annualAmount: data.annualTaxAmount }
          },
          enrichedData: {
            rentEstimate: data.rentEstimate,
            photos: data.photos
          },
          photos: data.photos || []
        };
        
        // If no rent estimate in Firebase, fetch from RentCast
        if (!propertyData.rentEstimate) {
          console.log('📡 No rent in Firebase, fetching from RentCast...');
          const rentData = await getPropertyRentData(propertyData);
          
          if (rentData?.rentEstimate) {
            propertyData.rentEstimate = rentData.rentEstimate;
            propertyData.rentRangeLow = rentData.rentRangeLow;
            propertyData.rentRangeHigh = rentData.rentRangeHigh;
            propertyData.rentSource = 'RentCast';
            console.log('✅ RentCast rent estimate:', rentData.rentEstimate);
          }
        }
        
        setProperty(propertyData);
        initializeInputs(propertyData);
        
        // Auto-save to favorites (property already exists in Firebase, just mark as saved)
        setIsSaved(true);
      } else {
        console.warn('Property not found, redirecting...');
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
      <PropertySidebar 
        property={property}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onBack={() => navigate('/properties')}
        isSaved={isSaved}
      />

      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}