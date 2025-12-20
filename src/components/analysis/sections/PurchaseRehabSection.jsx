import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Info } from 'lucide-react';

export default function PurchaseRehabSection({ results, inputs, onInputChange, onNavigateToWorksheet }) {
  const [purchaseCostsExpanded, setPurchaseCostsExpanded] = useState(false);
  const [rehabCostsExpanded, setRehabCostsExpanded] = useState(false);

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Safe access to results
  const purchase = results?.purchase || {};
  const financing = results?.financing || {};
  const cashRequirements = results?.cashRequirements || {};

  // Get values with safe fallbacks
  const purchasePrice = inputs?.offerPrice || purchase?.offerPrice || 0;
  const loanAmount = financing?.firstMtg?.totalPrincipal || 0;
  
  // Calculate down payment = Purchase Price - Loan Amount
  const downPayment = purchasePrice - loanAmount;
  
  // Get closing costs - prioritize inputs, then calculated
  // Default: 3% of purchase price if nothing is set
  const defaultClosingCosts = purchasePrice * 0.03;
  const closingCosts = inputs?.purchaseCostsTotal || purchase?.closingCosts || defaultClosingCosts;
  
  // Rehab/Repair costs
  const rehabCosts = inputs?.repairs || purchase?.repairs || 0;
  
  // Total cash needed
  const totalCashRequired = cashRequirements?.totalCashRequired || 
    (downPayment + closingCosts + rehabCosts);

  // Calculate percentages for pie chart
  const total = totalCashRequired > 0 ? totalCashRequired : 1; // Avoid division by zero
  const downPaymentPercent = ((downPayment / total) * 100) || 0;
  const closingCostsPercent = ((closingCosts / total) * 100) || 0;
  const rehabPercent = ((rehabCosts / total) * 100) || 0;

  // Calculate stroke dash values for pie chart (circumference = 2 * π * r ≈ 251.33 for r=40)
  const circumference = 251.33;
  
  // Pie chart segments
  const segments = [
    { label: 'Down Payment', value: downPayment, percent: downPaymentPercent, color: '#3b82f6' },
    { label: 'Purchase Costs', value: closingCosts, percent: closingCostsPercent, color: '#8b5cf6' },
    { label: 'Rehab Costs', value: rehabCosts, percent: rehabPercent, color: '#10b981' },
  ].filter(s => s.value > 0);

  let cumulativePercent = 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-blue-600">PURCHASE & REHAB</h2>
          {onNavigateToWorksheet && (
            <button
              onClick={onNavigateToWorksheet}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Edit2 className="w-4 h-4" />
              Edit in Worksheet
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Numbers */}
          <div className="space-y-4">
            {/* Purchase Price */}
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700 font-medium">Purchase Price:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(purchasePrice)}</span>
            </div>

            {/* Amount Financed */}
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-gray-600">Amount Financed:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">-</span>
                <span className="font-medium text-gray-700">{formatCurrency(loanAmount)}</span>
              </div>
            </div>

            {/* Down Payment */}
            <div className="flex items-center justify-between py-2 bg-blue-50 px-3 rounded-lg -mx-3">
              <span className="text-blue-700 font-semibold">Down Payment:</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">=</span>
                <span className="font-bold text-blue-700">{formatCurrency(downPayment)}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            {/* Purchase Costs - Expandable */}
            <div>
              <button
                onClick={() => setPurchaseCostsExpanded(!purchaseCostsExpanded)}
                className="flex items-center justify-between w-full text-left py-2 hover:bg-gray-50 rounded -mx-2 px-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 font-medium">Purchase Costs:</span>
                  {purchaseCostsExpanded ? 
                    <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">+</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(closingCosts)}</span>
                  <Edit2 
                    className="w-4 h-4 text-blue-600 hover:text-blue-800 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToWorksheet && onNavigateToWorksheet();
                    }}
                  />
                </div>
              </button>

              {purchaseCostsExpanded && (
                <div className="ml-4 mt-2 space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                  {inputs?.itemizedPurchaseCosts && inputs.itemizedPurchaseCosts.length > 0 ? (
                    inputs.itemizedPurchaseCosts.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-600">{item.name}:</span>
                        <span className="text-gray-900">{formatCurrency(item.value)}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Closing Costs ({inputs?.purchaseCostsPercent || 3}%):</span>
                        <span className="text-gray-900">{formatCurrency(closingCosts)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                        <Info className="w-3 h-3" />
                        <span>Based on {inputs?.purchaseCostsPercent || 3}% of purchase price</span>
                      </div>
                    </>
                  )}
                  
                  {/* Show itemized breakdown if individual items exist */}
                  {(inputs?.lenderFee > 0 || inputs?.brokerFee > 0 || inputs?.inspections > 0) && (
                    <>
                      <div className="border-t border-gray-200 my-2 pt-2">
                        <div className="text-xs font-medium text-gray-500 mb-2">Itemized Costs:</div>
                      </div>
                      {inputs?.lenderFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lender Fee:</span>
                          <span>{formatCurrency(inputs.lenderFee)}</span>
                        </div>
                      )}
                      {inputs?.brokerFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Broker Fee:</span>
                          <span>{formatCurrency(inputs.brokerFee)}</span>
                        </div>
                      )}
                      {inputs?.inspections > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Inspections:</span>
                          <span>{formatCurrency(inputs.inspections)}</span>
                        </div>
                      )}
                      {inputs?.appraisals > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Appraisals:</span>
                          <span>{formatCurrency(inputs.appraisals)}</span>
                        </div>
                      )}
                      {inputs?.transferTax > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transfer Tax:</span>
                          <span>{formatCurrency(inputs.transferTax)}</span>
                        </div>
                      )}
                      {inputs?.legal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Legal:</span>
                          <span>{formatCurrency(inputs.legal)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Rehab Costs - Expandable */}
            <div>
              <button
                onClick={() => setRehabCostsExpanded(!rehabCostsExpanded)}
                className="flex items-center justify-between w-full text-left py-2 hover:bg-gray-50 rounded -mx-2 px-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 font-medium">Rehab Costs:</span>
                  {rehabCostsExpanded ? 
                    <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">+</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(rehabCosts)}</span>
                  <Edit2 
                    className="w-4 h-4 text-blue-600 hover:text-blue-800 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToWorksheet && onNavigateToWorksheet();
                    }}
                  />
                </div>
              </button>

              {rehabCostsExpanded && (
                <div className="ml-4 mt-2 space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                  {inputs?.itemizedRehabCosts && inputs.itemizedRehabCosts.length > 0 ? (
                    inputs.itemizedRehabCosts.filter(item => item.value > 0).map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-600">{item.name}:</span>
                        <span className="text-gray-900">{formatCurrency(item.value)}</span>
                      </div>
                    ))
                  ) : rehabCosts > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Rehab:</span>
                      <span className="text-gray-900">{formatCurrency(rehabCosts)}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">No rehab costs entered</div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 my-2"></div>

            {/* Total Cash Needed */}
            <div className="flex items-center justify-between py-3 bg-blue-50 px-3 rounded-lg -mx-3">
              <span className="text-blue-700 font-bold">Total Cash Needed:</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">=</span>
                <span className="font-bold text-blue-700 text-xl">
                  {formatCurrency(totalCashRequired)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Pie Chart */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-56 h-56">
              <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                />
                
                {/* Pie segments */}
                {segments.map((segment, index) => {
                  const dashArray = (segment.percent / 100) * circumference;
                  const dashOffset = -(cumulativePercent / 100) * circumference;
                  cumulativePercent += segment.percent;
                  
                  return (
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="20"
                      strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                      strokeDashoffset={dashOffset}
                      className="transition-all duration-500"
                    />
                  );
                })}
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalCashRequired)}
                </span>
                <span className="text-xs text-gray-500">Total Cash</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 space-y-2 w-full max-w-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  <span className="text-sm text-gray-600">Down Payment</span>
                </div>
                <span className="text-sm font-medium">{downPaymentPercent.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                  <span className="text-sm text-gray-600">Purchase Costs</span>
                </div>
                <span className="text-sm font-medium">{closingCostsPercent.toFixed(1)}%</span>
              </div>
              {rehabCosts > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                    <span className="text-sm text-gray-600">Rehab Costs</span>
                  </div>
                  <span className="text-sm font-medium">{rehabPercent.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}