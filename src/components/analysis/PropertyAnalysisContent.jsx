import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';

// ✅ CORRECT PATH: investmentCalculations is in src/utils/
import { BuyRentHoldCalculator } from '../../utils/investmentCalculations';

// ✅ CORRECT PATHS: All section components are in ./sections/ subfolder
import PurchaseRehabSection from './sections/PurchaseRehabSection';
import FinancingSection from './sections/FinancingSection';
import ValuationSection from './sections/ValuationSection';
import CashFlowSection from './sections/CashFlowSection';
import InvestmentReturnsSection from './sections/InvestmentReturnsSection';
import FinancialRatiosSection from './sections/FinancialRatiosSection';
import PurchaseCriteriaSection from './sections/PurchaseCriteriaSection';

export default function PropertyAnalysisContent({ property, inputs, onInputChange, onSave, onResultsChange }) {
  const [results, setResults] = useState(null);
  const [viewMode, setViewMode] = useState('monthly');

  // Calculate whenever inputs change
  useEffect(() => {
    try {
      const calculator = new BuyRentHoldCalculator(property, inputs);
      const analysis = calculator.getCompleteAnalysis();
      setResults(analysis);
      if (onResultsChange) {
        onResultsChange(analysis);
      }
      console.log('📊 Analysis Results:', analysis);
    } catch (error) {
      console.error('❌ Calculation error:', error);
    }
  }, [inputs, property]);

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
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Calculating analysis...</div>
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
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Save Analysis
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Buy & Hold Projections
            </button>
          </div>
        </div>
        <p className="text-gray-600">
          This page shows the purchase breakdown, cash flow and investment returns for this property.
        </p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <div className="text-sm text-gray-600 mb-1">CASH NEEDED</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(results?.cashRequirements?.totalCashRequired ?? 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <div className="text-sm text-gray-600 mb-1">CASH FLOW</div>
          <div className={`text-2xl font-bold ${(results?.cashflow?.totalMonthlyProfitOrLoss ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(results?.cashflow?.totalMonthlyProfitOrLoss ?? 0)}/mo
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <div className="text-sm text-gray-600 mb-1">CAP RATE</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatPercent(results?.quickAnalysis?.capRateOnPP ?? 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <div className="text-sm text-gray-600 mb-1">COC ROI</div>
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
        />

        <FinancingSection 
          results={results}
          inputs={inputs}
          onInputChange={onInputChange}
        />

        <ValuationSection 
          results={results}
          inputs={inputs}
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