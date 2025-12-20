import { Building, Info } from 'lucide-react';

export default function ValuationSection({ results, inputs, property, onInputChange }) {
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) return '0';
    return Number(value).toFixed(decimals);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00%';
    return `${Number(value).toFixed(2)}%`;
  };

  // Get values from multiple sources with fallbacks
  const sqft = inputs?.sqft || 
               property?.sqft || 
               property?.description?.sqft || 
               property?.propertyData?.sqft || 
               0;
               
  const offerPrice = inputs?.offerPrice || 0;
  const fairMarketValue = inputs?.fairMarketValue || offerPrice || 0;
  const repairs = inputs?.repairs || 0;
  
  // Unit count from results or inputs
  const numberOfUnits = results?.propertyInfo?.numberOfUnits || 
                        inputs?.numberOfUnits || 
                        property?.unitCount ||
                        1;

  // Get financial metrics from results
  const qa = results?.quickAnalysis || {};
  const income = results?.income || {};
  
  // GRM and other metrics from quickAnalysis
  const grm = qa.grm || (income.grossRents > 0 ? offerPrice / income.grossRents : 0);
  const averageRent = qa.averageRent || (income.grossRents > 0 ? income.grossRents / numberOfUnits / 12 : 0);

  // Calculate per-sqft and per-unit metrics
  const pricePerSqFt = sqft > 0 ? offerPrice / sqft : 0;
  const arvPerSqFt = sqft > 0 ? fairMarketValue / sqft : 0;
  const rehabPerSqFt = sqft > 0 ? repairs / sqft : 0;
  const pricePerUnit = numberOfUnits > 0 ? offerPrice / numberOfUnits : offerPrice;
  const rentPerSqFt = sqft > 0 ? (averageRent / (sqft / numberOfUnits)) : 0;

  // Rent to Value ratio (1% rule check)
  const monthlyRent = averageRent * numberOfUnits;
  const rentToValueRatio = offerPrice > 0 ? (monthlyRent / offerPrice) * 100 : 0;
  const passesOnePercentRule = rentToValueRatio >= 1;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-6">VALUATION</h2>

        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          {/* Left Column - Value Metrics */}
          <div className="space-y-4">
            {/* After Repair Value */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">After Repair Value:</span>
              </div>
              <span className="font-semibold">{formatCurrency(fairMarketValue)}</span>
            </div>

            {/* ARV Per Square Foot */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">ARV Per Sq Ft:</span>
              <span className="font-semibold">
                {sqft > 0 ? formatCurrency(arvPerSqFt) : 'N/A'}
              </span>
            </div>

            {/* Price Per Square Foot */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Price Per Sq Ft:</span>
              <span className="font-semibold">
                {sqft > 0 ? formatCurrency(pricePerSqFt) : 'N/A'}
              </span>
            </div>

            {/* Rehab Per Square Foot */}
            {repairs > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Rehab Per Sq Ft:</span>
                <span className="font-semibold">
                  {sqft > 0 ? formatCurrency(rehabPerSqFt) : 'N/A'}
                </span>
              </div>
            )}
          </div>

          {/* Right Column - Rental & Unit Metrics */}
          <div className="space-y-4">
            {/* Price Per Unit (for multi-family) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">Price Per Unit:</span>
              </div>
              <span className="font-semibold">{formatCurrency(pricePerUnit)}</span>
            </div>

            {/* GRM - Gross Rent Multiplier */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" title="Price / Annual Gross Rent" />
                <span className="text-gray-700">Gross Rent Multiplier:</span>
              </div>
              <span className="font-semibold">{formatNumber(grm)}</span>
            </div>

            {/* Average Rent Per Unit */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Avg Rent Per Unit:</span>
              <span className="font-semibold">{formatCurrency(averageRent)}/mo</span>
            </div>

            {/* Number of Units */}
            {numberOfUnits > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Number of Units:</span>
                <span className="font-semibold">{numberOfUnits}</span>
              </div>
            )}
          </div>
        </div>

        {/* 1% Rule Check */}
        <div className={`mt-6 p-4 rounded-lg border ${
          passesOnePercentRule 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className={`w-4 h-4 ${passesOnePercentRule ? 'text-green-600' : 'text-yellow-600'}`} />
              <span className={`font-medium ${passesOnePercentRule ? 'text-green-700' : 'text-yellow-700'}`}>
                1% Rule (Rent-to-Value):
              </span>
            </div>
            <div className="text-right">
              <span className={`font-bold ${passesOnePercentRule ? 'text-green-600' : 'text-yellow-600'}`}>
                {formatPercent(rentToValueRatio)}
              </span>
              <span className={`ml-2 text-sm ${passesOnePercentRule ? 'text-green-600' : 'text-yellow-600'}`}>
                {passesOnePercentRule ? '✓ Passes' : '✗ Below 1%'}
              </span>
            </div>
          </div>
          <p className="text-xs mt-1 text-gray-600">
            Monthly rent ({formatCurrency(monthlyRent)}) ÷ Purchase price ({formatCurrency(offerPrice)})
          </p>
        </div>

        {/* Square Footage Note if missing */}
        {sqft === 0 && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
            <Info className="w-4 h-4 inline mr-2" />
            Square footage not available. Per sq ft calculations require this data.
          </div>
        )}
      </div>
    </div>
  );
}