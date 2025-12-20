import { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function InvestmentReturnsSection({ results }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00%';
    return `${Number(value).toFixed(2)}%`;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Safe access to nested properties
  const qa = results?.quickAnalysis || {};
  const cashflow = results?.cashflow || {};
  const cashReq = results?.cashRequirements || {};

  // Investment return values
  const capRateOnPP = qa.capRateOnPP || 0;
  const capRateOnFMV = qa.capRateOnFMV || 0;
  const cashOnCashROI = qa.cashOnCashROI || 0;
  const equityROI = qa.equityROI || 0;
  const appreciationROI = qa.appreciationROI || 0;
  const totalROI = qa.totalROI || 0;
  
  // Supporting data
  const annualCashFlow = cashflow.annualProfitOrLoss || 0;
  const principalPaidYear1 = qa.principalPaidYear1 || 0;
  const appreciationValue = qa.appreciationValue || 0;
  const totalCashRequired = cashReq.totalCashRequired || 0;

  // Color coding for values
  const getValueColor = (value, isPercent = true) => {
    if (value < 0) return 'text-red-600';
    if (isPercent && value >= 10) return 'text-green-600';
    if (isPercent && value >= 5) return 'text-blue-600';
    return 'text-gray-900';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-blue-600">INVESTMENT RETURNS (Year 1)</h2>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            {showBreakdown ? 'Hide Breakdown' : 'Show Breakdown'}
            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          {/* Left Column - Cap Rates & Cash on Cash */}
          <div className="space-y-4">
            {/* Cap Rate (Purchase Price) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400 cursor-help" title="NOI / Purchase Price" />
                <span className="text-gray-700">Cap Rate (Purchase):</span>
              </div>
              <span className={`font-semibold ${getValueColor(capRateOnPP)}`}>
                {formatPercent(capRateOnPP)}
              </span>
            </div>

            {/* Cap Rate (Market Value) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400 cursor-help" title="NOI / Fair Market Value" />
                <span className="text-gray-700">Cap Rate (Market):</span>
              </div>
              <span className={`font-semibold ${getValueColor(capRateOnFMV)}`}>
                {formatPercent(capRateOnFMV)}
              </span>
            </div>

            {/* Cash on Cash Return */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400 cursor-help" title="Annual Cash Flow / Total Cash Invested" />
                <span className="text-gray-700">Cash on Cash ROI:</span>
              </div>
              <span className={`font-semibold ${getValueColor(cashOnCashROI)}`}>
                {formatPercent(cashOnCashROI)}
              </span>
            </div>
          </div>

          {/* Right Column - ROI Components */}
          <div className="space-y-4">
            {/* Equity ROI (Principal Paydown) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400 cursor-help" title="Principal Paid Year 1 / Total Cash Invested" />
                <span className="text-gray-700">Equity ROI (Paydown):</span>
              </div>
              <span className={`font-semibold ${getValueColor(equityROI)}`}>
                {formatPercent(equityROI)}
              </span>
            </div>

            {/* Appreciation ROI */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400 cursor-help" title="(FMV × Appreciation %) / Total Cash Invested" />
                <span className="text-gray-700">Appreciation ROI:</span>
              </div>
              <span className={`font-semibold ${getValueColor(appreciationROI)}`}>
                {formatPercent(appreciationROI)}
              </span>
            </div>

            {/* Total ROI */}
            <div className="flex items-center justify-between bg-blue-50 -mx-2 px-2 py-1 rounded">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500 cursor-help" title="Cash on Cash + Equity ROI + Appreciation ROI" />
                <span className="text-blue-700 font-semibold">Total ROI (Year 1):</span>
              </div>
              <span className={`font-bold text-lg ${totalROI >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatPercent(totalROI)}
              </span>
            </div>
          </div>
        </div>

        {/* ROI Breakdown Details */}
        {showBreakdown && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">ROI Breakdown (Year 1)</h3>
            
            {/* Visual breakdown */}
            <div className="space-y-3 text-sm">
              {/* Cash on Cash */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">Cash on Cash ROI</div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(annualCashFlow)} annual cash flow ÷ {formatCurrency(totalCashRequired)} invested
                  </div>
                </div>
                <span className={`font-semibold ${getValueColor(cashOnCashROI)}`}>
                  {formatPercent(cashOnCashROI)}
                </span>
              </div>

              {/* Plus sign */}
              <div className="text-center text-gray-400 font-bold">+</div>

              {/* Equity ROI */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">Equity ROI (Principal Paydown)</div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(principalPaidYear1)} principal paid ÷ {formatCurrency(totalCashRequired)} invested
                  </div>
                </div>
                <span className={`font-semibold ${getValueColor(equityROI)}`}>
                  {formatPercent(equityROI)}
                </span>
              </div>

              {/* Plus sign */}
              <div className="text-center text-gray-400 font-bold">+</div>

              {/* Appreciation ROI */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">Appreciation ROI</div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(appreciationValue)} appreciation ÷ {formatCurrency(totalCashRequired)} invested
                  </div>
                </div>
                <span className={`font-semibold ${getValueColor(appreciationROI)}`}>
                  {formatPercent(appreciationROI)}
                </span>
              </div>

              {/* Equals */}
              <div className="text-center text-blue-600 font-bold">=</div>

              {/* Total ROI */}
              <div className="flex items-center justify-between p-3 bg-blue-100 rounded">
                <div>
                  <div className="font-bold text-blue-900">Total ROI (Year 1)</div>
                  <div className="text-xs text-blue-700">
                    Sum of all return components
                  </div>
                </div>
                <span className={`font-bold text-lg ${totalROI >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatPercent(totalROI)}
                </span>
              </div>
            </div>

            {/* IRR Note */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800">About IRR (Internal Rate of Return)</div>
                  <div className="text-yellow-700 text-xs mt-1">
                    IRR requires multi-year projections and a defined exit/sale scenario. 
                    View the <strong>Buy & Hold Projections</strong> page for IRR calculations 
                    based on your holding period and expected sale price.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}