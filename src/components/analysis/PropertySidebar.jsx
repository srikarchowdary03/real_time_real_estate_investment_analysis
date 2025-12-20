import { useState, useEffect, useCallback } from 'react';
import { Save, BarChart3 } from 'lucide-react';

// Import calculator with DEFAULTS
import { BuyRentHoldCalculator, DEFAULTS } from '../../utils/investmentCalculations';

// Import section components
import PurchaseRehabSection from './sections/PurchaseRehabSection';
import FinancingSection from './sections/FinancingSection';
import ValuationSection from './sections/ValuationSection';
import CashFlowSection from './sections/CashFlowSection';
import InvestmentReturnsSection from './sections/InvestmentReturnsSection';
import FinancialRatiosSection from './sections/FinancialRatiosSection';
import PurchaseCriteriaSection from './sections/PurchaseCriteriaSection';

export default function PropertyAnalysisContent({ 
  property, 
  inputs, 
  onInputChange, 
  onSave, 
  onResultsChange,
  onNavigateToWorksheet,
  onNavigateToProjections 
}) {
  const [results, setResults] = useState(null);
  const [viewMode, setViewMode] = useState('monthly');
  const [isInitialized, setIsInitialized] = useState(false);

  // Get purchase price
  const getPurchasePrice = useCallback(() => {
    return inputs?.offerPrice || property?.price || property?.propertyData?.price || 0;
  }, [inputs?.offerPrice, property?.price, property?.propertyData?.price]);

  // Get rent estimate
  const getRentEstimate = useCallback(() => {
    if (property?.rentCastData?.rentEstimate) return property.rentCastData.rentEstimate;
    if (property?.rentEstimate) return property.rentEstimate;
    if (inputs?.grossRents > 0) return inputs.grossRents / 12;
    const price = getPurchasePrice();
    return price > 0 ? Math.round((price * 0.007) / 50) * 50 : 0;
  }, [property, inputs?.grossRents, getPurchasePrice]);

  // STEP 1: Initialize defaults FIRST (before any calculations)
  useEffect(() => {
    if (isInitialized) return;
    
    const price = getPurchasePrice();
    const monthlyRent = getRentEstimate();
    
    console.log('🔧 PropertyAnalysis: Initializing defaults...', { price, monthlyRent });
    
    // Set basic values
    if (!inputs?.offerPrice && price > 0) {
      onInputChange('offerPrice', price);
    }
    if (!inputs?.fairMarketValue && price > 0) {
      onInputChange('fairMarketValue', price);
    }
    if (!inputs?.grossRents && monthlyRent > 0) {
      onInputChange('grossRents', monthlyRent * 12);
    }
    
    // CRITICAL: Set purchase costs percentage and total with 3% default
    if (inputs?.purchaseCostsPercent === undefined || inputs?.purchaseCostsPercent === null) {
      console.log('💰 Setting purchaseCostsPercent to default:', DEFAULTS.purchaseCostsPercent);
      onInputChange('purchaseCostsPercent', DEFAULTS.purchaseCostsPercent);
    }
    
    // Calculate purchase costs total
    const percent = inputs?.purchaseCostsPercent ?? DEFAULTS.purchaseCostsPercent;
    const calculatedTotal = price * (percent / 100);
    
    // Only set if not already set or if suspiciously low
    if (!inputs?.purchaseCostsTotal || inputs.purchaseCostsTotal < 100) {
      console.log('💰 Setting purchaseCostsTotal:', calculatedTotal, '(', percent, '% of', price, ')');
      onInputChange('purchaseCostsTotal', calculatedTotal);
    }
    
    // Set other defaults
    const defaultsToApply = {
      firstMtgLTV: DEFAULTS.ltv,
      firstMtgRate: DEFAULTS.interestRate,
      firstMtgAmortization: DEFAULTS.amortization,
      vacancyRate: DEFAULTS.vacancyRate,
      managementRate: DEFAULTS.managementRate,
      repairsPercent: DEFAULTS.repairsPercent,
      maintenancePercent: DEFAULTS.repairsPercent,
      appreciationRate: DEFAULTS.appreciationRate,
      incomeGrowthRate: 2.0,
      expenseGrowthRate: 2.0,
      sellingCosts: 6.0
    };
    
    Object.entries(defaultsToApply).forEach(([key, value]) => {
      if (inputs?.[key] === undefined || inputs?.[key] === null) {
        onInputChange(key, value);
      }
    });
    
    setIsInitialized(true);
  }, [inputs, property, onInputChange, getPurchasePrice, getRentEstimate, isInitialized]);

  // STEP 2: Calculate results AFTER initialization
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      const price = getPurchasePrice();
      
      // Build inputs with guaranteed defaults
      const calculationInputs = {
        ...inputs,
        offerPrice: inputs?.offerPrice || price,
        fairMarketValue: inputs?.fairMarketValue || price,
        grossRents: inputs?.grossRents || getRentEstimate() * 12,
        purchaseCostsPercent: inputs?.purchaseCostsPercent ?? DEFAULTS.purchaseCostsPercent,
        purchaseCostsTotal: inputs?.purchaseCostsTotal || (price * (DEFAULTS.purchaseCostsPercent / 100)),
        firstMtgLTV: inputs?.firstMtgLTV ?? DEFAULTS.ltv,
        firstMtgRate: inputs?.firstMtgRate ?? DEFAULTS.interestRate,
        firstMtgAmortization: inputs?.firstMtgAmortization ?? DEFAULTS.amortization,
        vacancyRate: inputs?.vacancyRate ?? DEFAULTS.vacancyRate,
        managementRate: inputs?.managementRate ?? DEFAULTS.managementRate,
        repairsPercent: inputs?.repairsPercent ?? inputs?.maintenancePercent ?? DEFAULTS.repairsPercent,
        appreciationRate: inputs?.appreciationRate ?? DEFAULTS.appreciationRate,
      };
      
      console.log('📊 Calculating with inputs:', {
        price: calculationInputs.offerPrice,
        purchaseCostsPercent: calculationInputs.purchaseCostsPercent,
        purchaseCostsTotal: calculationInputs.purchaseCostsTotal,
        grossRents: calculationInputs.grossRents
      });
      
      const calculator = new BuyRentHoldCalculator(property, calculationInputs);
      const analysis = calculator.getCompleteAnalysis();
      
      setResults(analysis);
      
      if (onResultsChange) {
        onResultsChange(analysis);
      }
      
      console.log('📊 Analysis Results:', analysis);
    } catch (error) {
      console.error('❌ Calculation error:', error);
    }
  }, [inputs, property, isInitialized, getPurchasePrice, getRentEstimate, onResultsChange]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  if (!results) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Calculating analysis...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Property Analysis</h1>
          <div className="flex gap-2">
            <button 
              onClick={onSave}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2 font-medium"
            >
              <Save className="w-4 h-4" />
              Save Analysis
            </button>
            <button 
              onClick={onNavigateToProjections}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              <BarChart3 className="w-4 h-4" />
              Buy & Hold Projections
            </button>
          </div>
        </div>
        <p className="text-gray-600">
          This page shows the purchase breakdown, cash flow and investment returns for this property.
        </p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1 font-medium">CASH NEEDED</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(results?.cashRequirements?.totalCashRequired ?? 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1 font-medium">CASH FLOW</div>
          <div className={`text-2xl font-bold ${(results?.cashflow?.totalMonthlyProfitOrLoss ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(results?.cashflow?.totalMonthlyProfitOrLoss ?? 0)}/mo
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1 font-medium">CAP RATE</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatPercent(results?.quickAnalysis?.capRateOnPP ?? 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1 font-medium">COC ROI</div>
          <div className={`text-2xl font-bold ${(results?.quickAnalysis?.cashOnCashROI ?? 0) >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
            {formatPercent(results?.quickAnalysis?.cashOnCashROI ?? 0)}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-6">
        <PurchaseRehabSection 
          results={results}
          inputs={inputs}
          onInputChange={onInputChange}
          onNavigateToWorksheet={onNavigateToWorksheet}
        />

        <FinancingSection 
          results={results}
          inputs={inputs}
          onInputChange={onInputChange}
        />

        <ValuationSection 
          results={results}
          inputs={inputs}
          property={property}
          onInputChange={onInputChange}
        />

        <CashFlowSection 
          results={results}
          inputs={inputs}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onInputChange={onInputChange}
        />

        <InvestmentReturnsSection 
          results={results}
        />

        <FinancialRatiosSection 
          results={results}
        />

        <PurchaseCriteriaSection 
          results={results}
        />
      </div>
    </div>
  );
}