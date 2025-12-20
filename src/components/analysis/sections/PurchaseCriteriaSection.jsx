import { useState } from 'react';
import { Check, X, Edit2, Save, RotateCcw } from 'lucide-react';

// Default criteria thresholds - can be customized per investor
const DEFAULT_CRITERIA = {
  maxCashNeeded: 100000,
  minCashFlow: 200,
  maxExpenseRatio: 50,
  minCapRate: 6,
  minCoCROI: 8,
  minDCR: 1.2
};

export default function PurchaseCriteriaSection({ results, investorProfile, onCriteriaChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [criteria, setCriteria] = useState(investorProfile?.purchaseCriteria || DEFAULT_CRITERIA);
  const [tempCriteria, setTempCriteria] = useState(criteria);

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
    if (value === null || value === undefined || isNaN(value)) return '0%';
    return `${Number(value).toFixed(1)}%`;
  };

  // Safe access to nested properties
  const cashRequirements = results?.cashRequirements || {};
  const cashflow = results?.cashflow || {};
  const qa = results?.quickAnalysis || {};

  // Get actual values
  const totalCashRequired = cashRequirements.totalCashRequired || 0;
  const totalMonthlyProfitOrLoss = cashflow.totalMonthlyProfitOrLoss || 0;
  const expenseToIncomeRatio = qa.expenseToIncomeRatio || 0;
  const capRate = qa.capRateOnPP || 0;
  const cashOnCashROI = qa.cashOnCashROI || 0;
  const dcr = qa.dcr || 0;

  // Define criteria checks using current criteria values
  const criteriaChecks = [
    {
      id: 'cashNeeded',
      label: 'Total Cash Needed',
      actual: totalCashRequired,
      target: criteria.maxCashNeeded,
      comparison: 'less',
      format: 'currency',
      pass: totalCashRequired > 0 && totalCashRequired <= criteria.maxCashNeeded
    },
    {
      id: 'cashFlow',
      label: 'Monthly Cash Flow',
      actual: totalMonthlyProfitOrLoss,
      target: criteria.minCashFlow,
      comparison: 'greater',
      format: 'currency',
      pass: totalMonthlyProfitOrLoss >= criteria.minCashFlow
    },
    {
      id: 'expenseRatio',
      label: '50% Rule (Expense Ratio)',
      actual: expenseToIncomeRatio,
      target: criteria.maxExpenseRatio,
      comparison: 'less',
      format: 'percent',
      pass: expenseToIncomeRatio > 0 && expenseToIncomeRatio <= criteria.maxExpenseRatio
    },
    {
      id: 'capRate',
      label: 'Cap Rate',
      actual: capRate,
      target: criteria.minCapRate,
      comparison: 'greater',
      format: 'percent',
      pass: capRate >= criteria.minCapRate
    },
    {
      id: 'cocROI',
      label: 'Cash on Cash ROI',
      actual: cashOnCashROI,
      target: criteria.minCoCROI,
      comparison: 'greater',
      format: 'percent',
      pass: cashOnCashROI >= criteria.minCoCROI
    },
    {
      id: 'dcr',
      label: 'Debt Coverage Ratio',
      actual: dcr,
      target: criteria.minDCR,
      comparison: 'greater',
      format: 'number',
      pass: dcr >= criteria.minDCR
    }
  ];

  // Count passing criteria
  const passingCount = criteriaChecks.filter(c => c.pass).length;
  const totalCount = criteriaChecks.length;
  const passRate = (passingCount / totalCount) * 100;

  const handleSave = () => {
    setCriteria(tempCriteria);
    setIsEditing(false);
    if (onCriteriaChange) {
      onCriteriaChange(tempCriteria);
    }
  };

  const handleCancel = () => {
    setTempCriteria(criteria);
    setIsEditing(false);
  };

  const handleReset = () => {
    setTempCriteria(DEFAULT_CRITERIA);
  };

  const CriteriaItem = ({ check }) => {
    const formatValue = (value, format) => {
      if (format === 'currency') return formatCurrency(value);
      if (format === 'percent') return formatPercent(value);
      return value.toFixed(2);
    };

    const comparisonText = check.comparison === 'less' 
      ? `≤ ${formatValue(check.target, check.format)}` 
      : `≥ ${formatValue(check.target, check.format)}`;

    return (
      <div className={`flex items-center gap-3 p-3 rounded ${check.pass ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          check.pass ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {check.pass ? <Check className="w-4 h-4 text-white" /> : <X className="w-4 h-4 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${check.pass ? 'text-green-700' : 'text-red-700'}`}>
            {check.label}
          </div>
          <div className={`text-sm ${check.pass ? 'text-green-600' : 'text-red-600'}`}>
            Actual: {formatValue(check.actual, check.format)} | Target: {comparisonText}
          </div>
        </div>
      </div>
    );
  };

  const CriteriaInput = ({ id, label, value, onChange, prefix = '', suffix = '' }) => (
    <div className="flex items-center justify-between py-2">
      <label className="text-gray-700 text-sm">{label}:</label>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-gray-500">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, '');
            onChange(id, parseFloat(val) || 0);
          }}
          className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {suffix && <span className="text-gray-500">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-600">PURCHASE CRITERIA</h2>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit Criteria
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={handleReset}
                className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm px-2 py-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
              <button 
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-800 text-sm px-3 py-1 border border-gray-300 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1 text-sm px-3 py-1 rounded"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
            </div>
          )}
        </div>

        {/* Summary Bar */}
        <div className={`mb-4 p-3 rounded-lg ${
          passRate >= 80 ? 'bg-green-100' : passRate >= 50 ? 'bg-yellow-100' : 'bg-red-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`font-medium ${
              passRate >= 80 ? 'text-green-800' : passRate >= 50 ? 'text-yellow-800' : 'text-red-800'
            }`}>
              {passingCount} of {totalCount} criteria met
            </span>
            <span className={`text-sm ${
              passRate >= 80 ? 'text-green-600' : passRate >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {passRate.toFixed(0)}% pass rate
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                passRate >= 80 ? 'bg-green-500' : passRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${passRate}%` }}
            />
          </div>
        </div>

        {/* Criteria List or Edit Form */}
        {!isEditing ? (
          <div className="space-y-3">
            {criteriaChecks.map(check => (
              <CriteriaItem key={check.id} check={check} />
            ))}
          </div>
        ) : (
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Edit Your Investment Criteria</h3>
            
            <CriteriaInput 
              id="maxCashNeeded"
              label="Max Cash Needed"
              value={tempCriteria.maxCashNeeded}
              onChange={(id, val) => setTempCriteria({...tempCriteria, [id]: val})}
              prefix="≤ $"
            />
            <CriteriaInput 
              id="minCashFlow"
              label="Min Monthly Cash Flow"
              value={tempCriteria.minCashFlow}
              onChange={(id, val) => setTempCriteria({...tempCriteria, [id]: val})}
              prefix="≥ $"
              suffix="/mo"
            />
            <CriteriaInput 
              id="maxExpenseRatio"
              label="Max Expense Ratio"
              value={tempCriteria.maxExpenseRatio}
              onChange={(id, val) => setTempCriteria({...tempCriteria, [id]: val})}
              prefix="≤"
              suffix="%"
            />
            <CriteriaInput 
              id="minCapRate"
              label="Min Cap Rate"
              value={tempCriteria.minCapRate}
              onChange={(id, val) => setTempCriteria({...tempCriteria, [id]: val})}
              prefix="≥"
              suffix="%"
            />
            <CriteriaInput 
              id="minCoCROI"
              label="Min Cash on Cash ROI"
              value={tempCriteria.minCoCROI}
              onChange={(id, val) => setTempCriteria({...tempCriteria, [id]: val})}
              prefix="≥"
              suffix="%"
            />
            <CriteriaInput 
              id="minDCR"
              label="Min Debt Coverage Ratio"
              value={tempCriteria.minDCR}
              onChange={(id, val) => setTempCriteria({...tempCriteria, [id]: val})}
              prefix="≥"
            />
          </div>
        )}

        {/* Help text */}
        <p className="mt-4 text-sm text-gray-500">
          Use the Offer Calculator to determine a purchase price that will satisfy your criteria.
          {investorProfile && (
            <span className="block mt-1">
              Criteria synced with your <a href="#" className="text-blue-600 hover:underline">Investor Profile</a>.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}