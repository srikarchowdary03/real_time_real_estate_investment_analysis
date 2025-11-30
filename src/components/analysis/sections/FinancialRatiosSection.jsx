export default function FinancialRatiosSection({ results }) {
  const formatPercent = (value) => {
    return `${value.toFixed(1)} %`;
  };

  const formatNumber = (value) => {
    return value.toFixed(2);
  };

  const rentToValue = (results.income.grossRents / 12 / results.propertyInfo.fairMarketValue) * 100;
  const breakEvenRatio = ((results.expenses.totalExpenses + (results.financing.firstMtg.monthlyPayment * 12)) / results.income.effectiveGrossIncome) * 100;
  const debtYield = (results.noi / results.financing.firstMtg.totalPrincipal) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-6">FINANCIAL RATIOS (At Purchase)</h2>

        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Rent to Value */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ⓘ</span>
                <span className="text-gray-700">Rent to Value:</span>
              </div>
              <span className="font-semibold">{formatPercent(rentToValue)}</span>
            </div>

            {/* Gross Rent Multiplier */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ⓘ</span>
                <span className="text-gray-700">Gross Rent Multiplier:</span>
              </div>
              <span className="font-semibold">{formatNumber(results.quickAnalysis.grm)}</span>
            </div>

            {/* Equity Multiple */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ⓘ</span>
                <span className="text-gray-700">Equity Multiple:</span>
              </div>
              <span className="font-semibold">1.47</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Break Even Ratio */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ⓘ</span>
                <span className="text-gray-700">Break Even Ratio:</span>
              </div>
              <span className="font-semibold">{formatPercent(breakEvenRatio)}</span>
            </div>

            {/* Debt Coverage Ratio */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ⓘ</span>
                <span className="text-gray-700">Debt Coverage Ratio:</span>
              </div>
              <span className="font-semibold">{formatNumber(results.quickAnalysis.dcr)}</span>
            </div>

            {/* Debt Yield */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ⓘ</span>
                <span className="text-gray-700">Debt Yield:</span>
              </div>
              <span className="font-semibold">{formatPercent(debtYield)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}