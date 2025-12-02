import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

export default function CashFlowSection({ results, inputs, onInputChange }) {
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'yearly'
  const [expensesExpanded, setExpensesExpanded] = useState(false);
  const [loanExpanded, setLoanExpanded] = useState(false);
  const [showExpensesTab, setShowExpensesTab] = useState(true); // true = Expenses, false = Income

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const multiplier = viewMode === 'monthly' ? 1 / 12 : 1;

  // Calculate all values with null checks
  const grossRent = (results?.income?.grossRents || 0) * multiplier;
  const vacancy = (results?.income?.vacancyLoss || 0) * multiplier;
  const vacancyPercent = results?.propertyInfo?.vacancyRate || 0;
  const operatingIncome = (results?.income?.effectiveGrossIncome || 0) * multiplier;
  
  // Operating expenses with null checks
  const propertyTaxes = (results?.expenses?.propertyTaxes || 0) * multiplier;
  const insurance = (results?.expenses?.insurance || 0) * multiplier;
  const propertyManagement = (results?.expenses?.management || 0) * multiplier;
  const maintenance = (results?.expenses?.maintenance || 0) * multiplier;
  const capEx = (results?.expenses?.capEx || 0) * multiplier;
  const hoaFees = (results?.expenses?.associationFees || 0) * multiplier;
  const utilities = ((results?.expenses?.electricity || 0) + (results?.expenses?.gas || 0) + 
                     (results?.expenses?.waterSewer || 0) + (results?.expenses?.cable || 0)) * multiplier;
  const landscaping = (results?.expenses?.lawnMaintenance || 0) * multiplier;
  const accountingLegal = ((results?.expenses?.accounting || 0) + (results?.expenses?.legal || 0)) * multiplier;
  
  const operatingExpenses = (results?.expenses?.totalExpenses || 0) * multiplier;
  const expenseRatio = operatingIncome > 0 ? (operatingExpenses / operatingIncome) * 100 : 0;
  
  // FIX: Handle NOI whether it's an object or from cashflow summary
  const noiValue = results?.noi?.netOperatingIncome ?? results?.cashflow?.netOperatingIncome ?? 0;
  const noi = noiValue * multiplier;
  
  // Loan payments
  const firstMtgPayment = results?.financing?.firstMtg?.monthlyPayment || 0;
  const secondMtgPayment = results?.financing?.secondMtg?.monthlyPayment || 0;
  const interestOnlyPayment = results?.financing?.interestOnly?.monthlyPayment || 0;
  const otherFinancing = results?.financing?.otherMonthlyFinancingCosts || 0;
  
  const totalMonthlyLoanPayment = firstMtgPayment + secondMtgPayment + interestOnlyPayment + otherFinancing;
  const loanPayment = totalMonthlyLoanPayment * (viewMode === 'monthly' ? 1 : 12);
  
  const cashFlow = noi - loanPayment;
  const postTaxCashFlow = cashFlow; // Simplified - would need tax calculation

  // Calculate pie chart data
  const chartExpenses = [
    { name: 'Property Management', value: propertyManagement, color: '#8b5cf6', percent: 0 },
    { name: 'Maintenance', value: maintenance, color: '#f59e0b', percent: 0 },
    { name: 'Capital Expenditures', value: capEx, color: '#10b981', percent: 0 },
    { name: 'HOA Fees', value: hoaFees, color: '#3b82f6', percent: 0 },
    { name: 'Property Taxes', value: propertyTaxes, color: '#ef4444', percent: 0 },
    { name: 'Insurance', value: insurance, color: '#6366f1', percent: 0 },
  ].filter(item => item.value > 0);
  
  // Calculate percentages
  const totalForChart = chartExpenses.reduce((sum, item) => sum + item.value, 0);
  chartExpenses.forEach(item => {
    item.percent = totalForChart > 0 ? (item.value / totalForChart) * 100 : 0;
  });

  // Generate pie chart slices
  const generatePieChart = () => {
    if (totalForChart === 0) {
      return <circle cx="100" cy="100" r="80" fill="#e5e7eb" />;
    }

    let currentAngle = 0;
    return chartExpenses.map((item, i) => {
      const angle = (item.value / totalForChart) * 360;
      const startAngle = currentAngle - 90;
      const endAngle = currentAngle + angle - 90;

      const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
      const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
      const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
      const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);

      const largeArc = angle > 180 ? 1 : 0;
      const path = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;

      currentAngle += angle;

      return <path key={i} d={path} fill={item.color} />;
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        {/* Header with Monthly/Yearly toggle */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-blue-600">CASH FLOW (Year 1)</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded ${
                viewMode === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-4 py-2 rounded ${
                viewMode === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Cash Flow Breakdown */}
          <div className="space-y-3">
            {/* Gross Rent */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Gross Rent:</span>
              <span className="font-semibold">{formatCurrency(grossRent)}</span>
            </div>

            {/* Vacancy */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Vacancy:</span>
              <div className="text-right">
                <div className="font-semibold text-red-600">- {formatCurrency(vacancy)}</div>
                <div className="text-xs text-gray-500">{vacancyPercent}% of Rent</div>
              </div>
            </div>

            {/* Operating Income */}
            <div className="flex items-center justify-between py-2 border-t border-b bg-blue-50 px-2 rounded">
              <span className="text-blue-600 font-bold">Operating Income:</span>
              <span className="text-blue-600 font-bold">= {formatCurrency(operatingIncome)}</span>
            </div>

            {/* Operating Expenses - Collapsible */}
            <div>
              <button
                onClick={() => setExpensesExpanded(!expensesExpanded)}
                className="flex items-center justify-between w-full py-2 hover:bg-gray-50 rounded px-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">Operating Expenses:</span>
                  {expensesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-red-600">- {formatCurrency(operatingExpenses)}</div>
                  <div className="text-xs text-gray-500">{expenseRatio.toFixed(0)}% of Income</div>
                </div>
              </button>

              {expensesExpanded && (
                <div className="ml-6 space-y-2 mt-2 text-sm bg-gray-50 p-3 rounded">
                  {propertyTaxes > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Property Taxes:</span>
                      <span>{formatCurrency(propertyTaxes)}</span>
                    </div>
                  )}
                  {insurance > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Insurance:</span>
                      <span>{formatCurrency(insurance)}</span>
                    </div>
                  )}
                  {propertyManagement > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Property Management:</span>
                      <span>{formatCurrency(propertyManagement)}</span>
                    </div>
                  )}
                  {maintenance > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Maintenance:</span>
                      <span>{formatCurrency(maintenance)}</span>
                    </div>
                  )}
                  {capEx > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Capital Expenditures:</span>
                      <span>{formatCurrency(capEx)}</span>
                    </div>
                  )}
                  {hoaFees > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>HOA Fees:</span>
                      <span>{formatCurrency(hoaFees)}</span>
                    </div>
                  )}
                  {utilities > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Utilities:</span>
                      <span>{formatCurrency(utilities)}</span>
                    </div>
                  )}
                  {landscaping > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Landscaping:</span>
                      <span>{formatCurrency(landscaping)}</span>
                    </div>
                  )}
                  {accountingLegal > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Accounting & Legal Fees:</span>
                      <span>{formatCurrency(accountingLegal)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Net Operating Income */}
            <div className="flex items-center justify-between py-2 border-t border-b bg-gray-100 px-2 rounded">
              <span className="font-bold">Net Operating Income:</span>
              <span className="font-bold">= {formatCurrency(noi)}</span>
            </div>

            {/* Loan Payments - Collapsible */}
            <div>
              <button
                onClick={() => setLoanExpanded(!loanExpanded)}
                className="flex items-center justify-between w-full py-2 hover:bg-gray-50 rounded px-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">Loan Payments:</span>
                  {loanExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                <span className="font-semibold text-red-600">- {formatCurrency(loanPayment)}</span>
              </button>

              {loanExpanded && (
                <div className="ml-6 space-y-2 mt-2 text-sm bg-gray-50 p-3 rounded">
                  <div className="flex justify-between text-gray-600">
                    <span>1st Mortgage Payment:</span>
                    <span>{formatCurrency(firstMtgPayment * (viewMode === 'monthly' ? 1 : 12))}</span>
                  </div>
                  {secondMtgPayment > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>2nd Mortgage Payment:</span>
                      <span>{formatCurrency(secondMtgPayment * (viewMode === 'monthly' ? 1 : 12))}</span>
                    </div>
                  )}
                  {interestOnlyPayment > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Interest-Only Payment:</span>
                      <span>{formatCurrency(interestOnlyPayment * (viewMode === 'monthly' ? 1 : 12))}</span>
                    </div>
                  )}
                  {otherFinancing > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Other Financing:</span>
                      <span>{formatCurrency(otherFinancing * (viewMode === 'monthly' ? 1 : 12))}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cash Flow */}
            <div className={`flex items-center justify-between py-3 border-t border-b rounded px-2 ${
              cashFlow >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <span className={`font-bold text-lg ${cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Cash Flow:
              </span>
              <span className={`font-bold text-lg ${cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                = {formatCurrency(cashFlow)}
              </span>
            </div>

            {/* Post-Tax Cash Flow */}
            <div className="flex items-center justify-between px-2">
              <span className={`${postTaxCashFlow >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
                Post-Tax Cash Flow:
              </span>
              <span className={`${postTaxCashFlow >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
                {formatCurrency(postTaxCashFlow)}
              </span>
            </div>
          </div>

          {/* Right Column - Tabs and Pie Chart */}
          <div className="space-y-4">
            {/* Income/Expenses Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setShowExpensesTab(false)}
                className={`flex-1 py-2 text-sm font-medium ${
                  !showExpensesTab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setShowExpensesTab(true)}
                className={`flex-1 py-2 text-sm font-medium ${
                  showExpensesTab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Expenses ✏️
              </button>
            </div>

            {/* Content based on tab */}
            {showExpensesTab ? (
              <div className="flex flex-col items-center">
                {/* Pie Chart */}
                <svg viewBox="0 0 200 200" className="w-48 h-48">
                  {generatePieChart()}
                </svg>
                
                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                  {chartExpenses.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div className="text-xs">
                        <div className="text-gray-700">{item.name}</div>
                        <div className="font-semibold">{item.percent.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold text-gray-900">Income Breakdown</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gross Rents:</span>
                  <span className="font-medium">{formatCurrency(grossRent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Less Vacancy ({vacancyPercent}%):</span>
                  <span className="font-medium text-red-600">- {formatCurrency(vacancy)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-semibold">Effective Income:</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(operatingIncome)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}