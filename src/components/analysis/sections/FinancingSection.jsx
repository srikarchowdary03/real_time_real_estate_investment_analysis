import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function FinancingSection({ results, inputs, onInputChange }) {
  const [expanded, setExpanded] = useState(false);

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
    if (value === null || value === undefined || isNaN(value)) return '0.00%';
    return `${Number(value).toFixed(2)}%`;
  };

  // Safe access to nested properties
  const financing = results?.financing || {};
  const firstMtg = financing.firstMtg || {};
  const secondMtg = financing.secondMtg || {};
  const quickAnalysis = results?.quickAnalysis || {};

  // Calculate values
  const loanAmount = firstMtg.totalPrincipal || firstMtg.principalBorrowed || 0;
  const monthlyPayment = firstMtg.monthlyPayment || 0;
  const annualDebtService = monthlyPayment * 12;
  const interestRate = firstMtg.rate || inputs?.firstMtgRate || 7;
  const loanTerm = firstMtg.amortization || inputs?.firstMtgAmortization || 30;
  const ltv = quickAnalysis.firstMtgLTV || inputs?.firstMtgLTV || 80;
  const ltpp = quickAnalysis.firstMtgLTPP || ltv;

  // Second mortgage info
  const hasSecondMtg = secondMtg.principal > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-blue-600">FINANCING (Purchase)</h2>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            {expanded ? 'Hide Details' : 'Show Details'}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Loan Amount */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">Loan Amount:</span>
              </div>
              <span className="font-semibold">{formatCurrency(loanAmount)}</span>
            </div>

            {/* Monthly P&I Payment - CRITICAL: This was missing! */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">Monthly P&I Payment:</span>
              </div>
              <span className="font-semibold text-blue-600">{formatCurrency(monthlyPayment)}</span>
            </div>

            {/* Loan to Cost (LTPP) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">Loan to Cost (LTPP):</span>
              </div>
              <span className="font-semibold">{formatPercent(ltpp)}</span>
            </div>

            {/* Loan to Value (LTV) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">Loan to Value (LTV):</span>
              </div>
              <span className="font-semibold">{formatPercent(ltv)}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Financing Of */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Financing Of:</span>
              <span className="font-semibold">Purchase Price ({100 - (100 - ltv)}% Down)</span>
            </div>

            {/* Loan Type */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Loan Type:</span>
              <span className="font-semibold">Amortizing, {loanTerm} Year</span>
            </div>

            {/* Interest Rate */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Interest Rate:</span>
              <span className="font-semibold">{formatPercent(interestRate)}</span>
            </div>

            {/* Annual Debt Service */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Annual Debt Service:</span>
              <span className="font-semibold">{formatCurrency(annualDebtService)}</span>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Loan Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Principal Borrowed:</span>
                  <span>{formatCurrency(firstMtg.principalBorrowed)}</span>
                </div>
                {firstMtg.cmhcAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">CMHC/PMI Fee:</span>
                    <span>{formatCurrency(firstMtg.cmhcAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Loan Amount:</span>
                  <span className="font-semibold">{formatCurrency(firstMtg.totalPrincipal)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Payment:</span>
                  <span>{formatCurrency(monthlyPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Annual Payment:</span>
                  <span>{formatCurrency(annualDebtService)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Interest (30yr):</span>
                  <span>{formatCurrency((monthlyPayment * loanTerm * 12) - loanAmount)}</span>
                </div>
              </div>
            </div>

            {/* Second Mortgage (if exists) */}
            {hasSecondMtg && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="font-medium text-gray-700 mb-2">Second Mortgage</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Principal:</span>
                    <span>{formatCurrency(secondMtg.principal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate:</span>
                    <span>{formatPercent(secondMtg.rate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Payment:</span>
                    <span>{formatCurrency(secondMtg.monthlyPayment)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cash Required Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200 bg-blue-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-900">Cash Required to Close:</span>
            <span className="font-bold text-xl text-blue-600">
              {formatCurrency(financing.cashRequiredToClose || results?.cashRequirements?.cashRequiredToClose)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}