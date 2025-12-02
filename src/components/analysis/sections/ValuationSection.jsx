export default function ValuationSection({ results, inputs, onInputChange }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const sqft = inputs.sqft || 1050; // fallback
  const pricePerSqFt = inputs.offerPrice / sqft;
  const arvPerSqFt = inputs.fairMarketValue / sqft;
  const rehabPerSqFt = inputs.repairs / sqft;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-6">VALUATION</h2>

        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* After Repair Value */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">After Repair Value:</span>
              </div>
              <span className="font-semibold">{formatCurrency(inputs.fairMarketValue)}</span>
            </div>

            {/* ARV Per Square Foot */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">ARV Per Square Foot:</span>
              <span className="font-semibold">{formatCurrency(arvPerSqFt)}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Price Per Square Foot */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Price Per Square Foot:</span>
              <span className="font-semibold">{formatCurrency(pricePerSqFt)}</span>
            </div>

            {/* Rehab Per Square Foot */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Rehab Per Square Foot:</span>
              <span className="font-semibold">{formatCurrency(rehabPerSqFt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}