import { Info } from 'lucide-react';

export default function FinancialRatiosSection({ results }) {
  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00%';
    return `${Number(value).toFixed(2)}%`;
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00';
    return Number(value).toFixed(decimals);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Safe access to nested properties
  const qa = results?.quickAnalysis || {};
  const cashflow = results?.cashflow || {};
  const noi = results?.noi || {};
  const income = results?.income || {};
  const expenses = results?.expenses || {};
  const financing = results?.financing || {};
  const purchase = results?.purchase || {};

  // Calculate additional ratios not in quickAnalysis
  const grossRents = income.grossRents || 0;
  const effectiveGrossIncome = income.effectiveGrossIncome || 0;
  const totalExpenses = expenses.totalExpenses || 0;
  const noiValue = noi.netOperatingIncome || 0;
  const offerPrice = purchase.offerPrice || 0;
  const loanAmount = financing.firstMtg?.totalPrincipal || 0;
  const monthlyDebtService = cashflow.monthlyDebtService || 0;
  const annualDebtService = cashflow.debtServicingCosts || monthlyDebtService * 12;

  // Calculate Operating Expense Ratio (OER)
  const operatingExpenseRatio = effectiveGrossIncome > 0 
    ? (totalExpenses / effectiveGrossIncome) * 100 
    : 0;

  // Calculate Break-Even Ratio
  const breakEvenRatio = effectiveGrossIncome > 0 
    ? ((totalExpenses + annualDebtService) / effectiveGrossIncome) * 100 
    : 0;

  // Calculate Debt Yield
  const debtYield = loanAmount > 0 
    ? (noiValue / loanAmount) * 100 
    : 0;

  // Calculate Gross Yield
  const grossYield = offerPrice > 0 
    ? (grossRents / offerPrice) * 100 
    : 0;

  // Define ratio groups
  const ratioGroups = [
    {
      title: 'Profitability Ratios',
      ratios: [
        {
          name: 'Cap Rate (Purchase)',
          value: formatPercent(qa.capRateOnPP),
          tooltip: 'Net Operating Income / Purchase Price',
          benchmark: qa.capRateOnPP >= 6 ? 'good' : qa.capRateOnPP >= 4 ? 'fair' : 'poor'
        },
        {
          name: 'Cap Rate (Market)',
          value: formatPercent(qa.capRateOnFMV),
          tooltip: 'Net Operating Income / Fair Market Value',
          benchmark: qa.capRateOnFMV >= 6 ? 'good' : qa.capRateOnFMV >= 4 ? 'fair' : 'poor'
        },
        {
          name: 'Gross Yield',
          value: formatPercent(grossYield),
          tooltip: 'Annual Gross Rent / Purchase Price',
          benchmark: grossYield >= 10 ? 'good' : grossYield >= 7 ? 'fair' : 'poor'
        },
        {
          name: 'Cash on Cash ROI',
          value: formatPercent(qa.cashOnCashROI),
          tooltip: 'Annual Cash Flow / Total Cash Invested',
          benchmark: qa.cashOnCashROI >= 8 ? 'good' : qa.cashOnCashROI >= 4 ? 'fair' : 'poor'
        }
      ]
    },
    {
      title: 'Valuation Ratios',
      ratios: [
        {
          name: 'Gross Rent Multiplier',
          value: formatNumber(qa.grm),
          tooltip: 'Purchase Price / Annual Gross Rent (lower is better)',
          benchmark: qa.grm <= 10 ? 'good' : qa.grm <= 15 ? 'fair' : 'poor'
        },
        {
          name: 'Average Rent',
          value: formatCurrency(qa.averageRent) + '/mo',
          tooltip: 'Gross Rents / Number of Units / 12',
          benchmark: 'neutral'
        },
        {
          name: 'Price Per Unit',
          value: formatCurrency(qa.pricePerUnit),
          tooltip: 'Purchase Price / Number of Units',
          benchmark: 'neutral'
        }
      ]
    },
    {
      title: 'Leverage Ratios',
      ratios: [
        {
          name: '1st Mortgage LTV',
          value: formatPercent(qa.firstMtgLTV),
          tooltip: 'Loan Amount / Fair Market Value',
          benchmark: qa.firstMtgLTV <= 80 ? 'good' : qa.firstMtgLTV <= 90 ? 'fair' : 'poor'
        },
        {
          name: '1st Mortgage LTPP',
          value: formatPercent(qa.firstMtgLTPP),
          tooltip: 'Loan Amount / Purchase Price',
          benchmark: qa.firstMtgLTPP <= 80 ? 'good' : qa.firstMtgLTPP <= 90 ? 'fair' : 'poor'
        },
        {
          name: 'Debt Coverage Ratio',
          value: formatNumber(qa.dcr),
          tooltip: 'NOI / Annual Debt Service (higher is better)',
          benchmark: qa.dcr >= 1.25 ? 'good' : qa.dcr >= 1.0 ? 'fair' : 'poor'
        },
        {
          name: 'Debt Yield',
          value: formatPercent(debtYield),
          tooltip: 'NOI / Loan Amount',
          benchmark: debtYield >= 9 ? 'good' : debtYield >= 7 ? 'fair' : 'poor'
        }
      ]
    },
    {
      title: 'Expense Ratios',
      ratios: [
        {
          name: 'Expense to Income',
          value: formatPercent(qa.expenseToIncomeRatio),
          tooltip: 'Total Expenses / Total Income (lower is better)',
          benchmark: qa.expenseToIncomeRatio <= 40 ? 'good' : qa.expenseToIncomeRatio <= 50 ? 'fair' : 'poor'
        },
        {
          name: 'Operating Expense Ratio',
          value: formatPercent(operatingExpenseRatio),
          tooltip: 'Operating Expenses / Effective Gross Income',
          benchmark: operatingExpenseRatio <= 40 ? 'good' : operatingExpenseRatio <= 50 ? 'fair' : 'poor'
        },
        {
          name: 'Break-Even Ratio',
          value: formatPercent(breakEvenRatio),
          tooltip: '(Expenses + Debt Service) / EGI (lower is better)',
          benchmark: breakEvenRatio <= 85 ? 'good' : breakEvenRatio <= 95 ? 'fair' : 'poor'
        }
      ]
    }
  ];

  const getBenchmarkColor = (benchmark) => {
    switch (benchmark) {
      case 'good': return 'text-green-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-900';
    }
  };

  const getBenchmarkBg = (benchmark) => {
    switch (benchmark) {
      case 'good': return 'bg-green-50';
      case 'fair': return 'bg-yellow-50';
      case 'poor': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-6">FINANCIAL RATIOS</h2>

        <div className="grid grid-cols-2 gap-6">
          {ratioGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-3">
              <h3 className="font-semibold text-gray-800 border-b pb-2">{group.title}</h3>
              {group.ratios.map((ratio, ratioIndex) => (
                <div 
                  key={ratioIndex} 
                  className={`flex items-center justify-between p-2 rounded ${getBenchmarkBg(ratio.benchmark)}`}
                >
                  <div className="flex items-center gap-2">
                    <Info 
                      className="w-4 h-4 text-gray-400 cursor-help" 
                      title={ratio.tooltip}
                    />
                    <span className="text-gray-700 text-sm">{ratio.name}:</span>
                  </div>
                  <span className={`font-semibold ${getBenchmarkColor(ratio.benchmark)}`}>
                    {ratio.value}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <span className="font-medium">Benchmark Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Good</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Fair</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Needs Attention</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}