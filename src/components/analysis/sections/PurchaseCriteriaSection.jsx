import { Check } from 'lucide-react';

export default function PurchaseCriteriaSection({ results }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Define criteria checks
  const cashNeededPass = results.cashRequirements.totalCashRequired < 50000;
  const cashFlowPass = results.cashflow.totalMonthlyProfitOrLoss > 150;
  const fiftyPercentPass = results.quickAnalysis.expenseToIncomeRatio <= 50;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-blue-600">PURCHASE CRITERIA</h2>
          <button className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Criteria
          </button>
        </div>

        <div className="space-y-3">
          {/* Total Cash Needed Criteria */}
          <div className={`flex items-center gap-3 p-3 rounded ${
            cashNeededPass ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              cashNeededPass ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className={`font-medium ${
              cashNeededPass ? 'text-green-700' : 'text-red-700'
            }`}>
              Total Cash Needed{' '}
              <span className={cashNeededPass ? 'text-green-600' : 'text-red-600'}>
                less than {formatCurrency(50000)}
              </span>
            </span>
          </div>

          {/* Cash Flow Criteria */}
          <div className={`flex items-center gap-3 p-3 rounded ${
            cashFlowPass ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              cashFlowPass ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className={`font-medium ${
              cashFlowPass ? 'text-green-700' : 'text-red-700'
            }`}>
              Cash Flow{' '}
              <span className={cashFlowPass ? 'text-green-600' : 'text-red-600'}>
                greater than {formatCurrency(150)}
              </span>
            </span>
          </div>

          {/* 50% Rule Criteria */}
          <div className={`flex items-center gap-3 p-3 rounded ${
            fiftyPercentPass ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              fiftyPercentPass ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className={`font-medium ${
              fiftyPercentPass ? 'text-green-700' : 'text-red-700'
            }`}>
              Passes 50% Rule
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}