import { ChevronDown } from 'lucide-react';

export default function FinancingSection({ results, inputs, onInputChange }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-6">FINANCING (Purchase)</h2>

        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Loan Amount */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Loan Amount:</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
              <span className="font-semibold">{formatCurrency(results.financing.firstMtg.totalPrincipal)}</span>
            </div>

            {/* Loan to Cost */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Loan to Cost:</span>
              </div>
              <span className="font-semibold">{formatPercent(results.quickAnalysis.firstMtgLTPP)}</span>
            </div>

            {/* Loan to Value */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Loan to Value:</span>
              </div>
              <span className="font-semibold">{formatPercent(results.quickAnalysis.firstMtgLTV)}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Financing Of */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Financing Of:</span>
              <span className="font-semibold">Price ({inputs.firstMtgLTV}%)</span>
            </div>

            {/* Loan Type */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Loan Type:</span>
              <span className="font-semibold">Amortizing, {inputs.firstMtgAmortization} Year</span>
            </div>

            {/* Interest Rate */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Interest Rate:</span>
              <span className="font-semibold">{formatPercent(inputs.firstMtgRate)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}