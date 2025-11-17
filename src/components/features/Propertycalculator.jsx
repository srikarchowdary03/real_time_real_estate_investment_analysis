import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import CalculatorInputs from './CalculatorInputs';
import CalculatorResults from './CalculatorResults';
import { RentalPropertyCalculator } from '../../utils/investmentCalculations';

export default function PropertyCalculator({ property }) {
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const [inputs, setInputs] = useState({
    purchasePrice: property.price || property.list_price || 0,
    afterRepairValue: property.price || property.list_price || 0,
    downPayment: 20,
    loanInterestRate: 7.0,
    loanTerm: 30,
    closingCosts: 3,
    repairCosts: 0,
    estimatedRehabCosts: 0,

    monthlyRent: property.zillowData?.rent || 0,
    otherMonthlyIncome: 0,
    laundryIncome: 0,
    storageIncome: 0,
    parkingIncome: 0,

    propertyTaxes: (property.zillowData?.taxData?.annualAmount) || 0,
    totalInsurance: property.zillowData?.insurance?.annual || 1200,
    hoaFees: 0,
    utilities: 0,
    garbage: 0,
    waterSewer: 0,
    electricity: 0,
    gas: 0,
    landscaping: 0,
    snowRemoval: 0,
    management: 0,
    repairs: 0,
    capex: 0,
    legal: 0,
    accounting: 0,
    
    vacancyRate: 5,
    managementRate: 0,
    repairRate: 5,
    capexRate: 5,
    appreciationRate: 3,
    incomeGrowthRate: 2,
    expenseGrowthRate: 2,
    sellingCosts: 6,

    additionalCosts: 0,
    otherFees: 0
  });

  const [results, setResults] = useState(null);

  useEffect(() => {
    try {
      const calculator = new RentalPropertyCalculator(property, inputs);
      const analysis = calculator.getCompleteAnalysis();
      console.log('Analysis result:', analysis); // Debug
      setResults(analysis);
    } catch (error) {
      console.error('Calculation error:', error);
      setResults(null);
    }
  }, [inputs, property]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSaveAnalysis = async () => {
    if (!currentUser || !results) return;
    
    setSaving(true);
    try {
      const analysisRef = doc(db, 'propertyAnalyses', property.property_id || property.id);
      await setDoc(analysisRef, {
        propertyId: property.property_id || property.id,
        userId: currentUser.uid,
        inputs,
        results,
        savedAt: new Date().toISOString()
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('Failed to save analysis');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Investment Calculator</h2>
          {lastSaved && (
            <p className="text-sm text-gray-500 mt-1">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={handleSaveAnalysis}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Analysis'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 p-6">
        <div className="space-y-6">
          <CalculatorInputs 
            inputs={inputs}
            onChange={handleInputChange}
          />
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          {results && <CalculatorResults results={results} />}
        </div>
      </div>
    </div>
  );
}