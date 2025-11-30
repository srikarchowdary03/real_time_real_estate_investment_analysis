export default function InvestmentReturnsSection({ results }) {
  const formatPercent = (value) => {
    return `${value.toFixed(1)} %`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-6">INVESTMENT RETURNS (Year 1)</h2>

        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Cap Rate (Purchase Price) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ⓘ</span>
                <span className="text-gray-700">Cap Rate (Purchase Price):</span>
              </div>
              <span className="font-semibold">{formatPercent(results.quickAnalysis.capRateOnPP)}</span>
            </div>

            {/* Cap Rate (Market Value) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ⓘ</span>
                <span className="text-gray-700">Cap Rate (Market Value):</span>
              </div>
              <span className="font-semibold">{formatPercent(results.quickAnalysis.capRateOnFMV)}</span>
            </div>

            {/* Cash on Cash Return */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ⓘ</span>
                <span className="text-gray-700">Cash on Cash Return:</span>
              </div>
              <span className="font-semibold">{formatPercent(results.quickAnalysis.cashOnCashROI)}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Return on Equity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ⓘ</span>
                <span className="text-gray-700">Return on Equity:</span>
              </div>
              <span className="font-semibold">{formatPercent(results.quickAnalysis.equityROI)}</span>
            </div>

            {/* Return on Investment */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ⓘ</span>
                <span className="text-gray-700">Return on Investment:</span>
              </div>
              <span className="font-semibold">{formatPercent(results.quickAnalysis.totalROI)}</span>
            </div>

            {/* Internal Rate of Return */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ⓘ</span>
                <span className="text-gray-700">Internal Rate of Return:</span>
              </div>
              <span className="font-semibold">{formatPercent(results.quickAnalysis.totalROI)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}