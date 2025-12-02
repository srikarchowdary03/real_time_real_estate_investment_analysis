import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

export default function PurchaseRehabSection({ results, inputs, onInputChange }) {
  const [purchaseCostsExpanded, setPurchaseCostsExpanded] = useState(false);
  const [rehabCostsExpanded, setRehabCostsExpanded] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get purchase costs from results (which uses purchaseCostsTotal)
  const purchaseCosts = results.purchase.purchaseCosts || 0;
  const downPayment = results.financing.downPayment || 0;

  // Calculate percentages for pie chart
  const total = results.purchase.realPurchasePrice;
  const purchasePercent = (inputs.offerPrice / total) * 100;
  const downPaymentPercent = (downPayment / total) * 100;
  const costsPercent = (purchaseCosts / total) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-6">PURCHASE & REHAB</h2>

        <div className="grid grid-cols-2 gap-8">
          {/* Left Column - Numbers */}
          <div className="space-y-4">
            {/* Purchase Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Purchase Price:</span>
              </div>
              <span className="font-semibold">{formatCurrency(inputs.offerPrice)}</span>
            </div>

            {/* Amount Financed */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Amount Financed:</span>
              </div>
              <div className="flex items-center gap-2">
                <span>-</span>
                <span className="font-semibold">{formatCurrency(results.financing.firstMtg.totalPrincipal)}</span>
              </div>
            </div>

            {/* Down Payment */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-semibold">Down Payment:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">=</span>
                <span className="font-bold text-blue-600">{formatCurrency(downPayment)}</span>
              </div>
            </div>

            {/* Purchase Costs - Expandable */}
            <div className="border-t pt-4">
              <button
                onClick={() => setPurchaseCostsExpanded(!purchaseCostsExpanded)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">Purchase Costs:</span>
                  {purchaseCostsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                <div className="flex items-center gap-2">
                  <span>+</span>
                  <span className="font-semibold">{formatCurrency(purchaseCosts)}</span>
                  <Edit2 className="w-4 h-4 text-blue-600 cursor-pointer" />
                </div>
              </button>

              {purchaseCostsExpanded && (
                <div className="ml-6 mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Repairs:</span>
                    <span>{formatCurrency(inputs.repairs)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lender Fee:</span>
                    <span>{formatCurrency(inputs.lenderFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Broker Fee:</span>
                    <span>{formatCurrency(inputs.brokerFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inspections:</span>
                    <span>{formatCurrency(inputs.inspections)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Appraisals:</span>
                    <span>{formatCurrency(inputs.appraisals)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfer Tax:</span>
                    <span>{formatCurrency(inputs.transferTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Legal:</span>
                    <span>{formatCurrency(inputs.legal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Misc:</span>
                    <span>{formatCurrency(inputs.misc)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Rehab Costs - Expandable */}
            <div>
              <button
                onClick={() => setRehabCostsExpanded(!rehabCostsExpanded)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">Rehab Costs:</span>
                  {rehabCostsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                <div className="flex items-center gap-2">
                  <span>+</span>
                  <span className="font-semibold">{formatCurrency(0)}</span>
                  <Edit2 className="w-4 h-4 text-blue-600 cursor-pointer" />
                </div>
              </button>

              {rehabCostsExpanded && (
                <div className="ml-6 mt-2 space-y-2 text-sm text-gray-500">
                  <div>No rehab costs entered</div>
                </div>
              )}
            </div>

            {/* Total Cash Needed */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold">Total Cash Needed:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">=</span>
                  <span className="font-bold text-blue-600 text-xl">
                    {formatCurrency(results.cashRequirements.totalCashRequired)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Pie Chart */}
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {/* Down Payment - Blue */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="20"
                  strokeDasharray={`${downPaymentPercent * 2.51} ${251 - downPaymentPercent * 2.51}`}
                />
                {/* Purchase - Orange */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="20"
                  strokeDasharray={`${purchasePercent * 2.51} ${251 - purchasePercent * 2.51}`}
                  strokeDashoffset={`${-downPaymentPercent * 2.51}`}
                />
                {/* Costs - Purple */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="20"
                  strokeDasharray={`${costsPercent * 2.51} ${251 - costsPercent * 2.51}`}
                  strokeDashoffset={`${-(downPaymentPercent + purchasePercent) * 2.51}`}
                />
              </svg>
              
              {/* Legend */}
              <div className="absolute bottom-0 left-0 right-0 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
                  <span>{purchasePercent.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                  <span>{costsPercent.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  <span>{downPaymentPercent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}