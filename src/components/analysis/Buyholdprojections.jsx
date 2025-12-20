import { useState } from 'react';

// Simple SVG Line Chart Component (fallback until Chart.js is installed)
const SimpleLineChart = ({ data, title }) => {
  const datasets = data.datasets;
  const labels = data.labels;
  
  // Calculate min/max for scaling
  const allValues = datasets.flatMap(ds => ds.data);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues, 0);
  const range = maxValue - minValue || 1;
  
  const width = 800;
  const height = 300;
  const padding = 40;
  
  // Scale point to SVG coordinates
  const scaleY = (value) => {
    return height - padding - ((value - minValue) / range) * (height - 2 * padding);
  };
  
  const scaleX = (index) => {
    return padding + (index / (labels.length - 1)) * (width - 2 * padding);
  };
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 border border-gray-200 rounded bg-white" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((percent) => {
          const y = height - padding - percent * (height - 2 * padding);
          const value = minValue + percent * range;
          return (
            <g key={percent}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={padding - 5}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#6b7280"
              >
                ${(value / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}
        
        {/* Draw lines for each dataset */}
        {datasets.map((dataset, dsIndex) => {
          const points = dataset.data.map((value, index) => ({
            x: scaleX(index),
            y: scaleY(value)
          }));
          
          const pathData = points
            .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
            .join(' ');
          
          return (
            <path
              key={dsIndex}
              d={pathData}
              fill="none"
              stroke={dataset.borderColor}
              strokeWidth="2"
            />
          );
        })}
        
        {/* X-axis labels */}
        {labels.filter((_, i) => [0, 4, 9, 14, 19, 24, 29].includes(i)).map((label, i) => {
          const indices = [0, 4, 9, 14, 19, 24, 29];
          const actualIndex = indices[i];
          if (actualIndex < labels.length) {
            return (
              <text
                key={i}
                x={scaleX(actualIndex)}
                y={height - padding + 20}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {labels[actualIndex]}
              </text>
            );
          }
          return null;
        })}
      </svg>
      
      {/* Legend */}
      <div className="flex gap-4 justify-center mt-2 flex-wrap">
        {datasets.map((dataset, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-4 h-0.5"
              style={{ backgroundColor: dataset.borderColor }}
            />
            <span className="text-xs text-gray-600">{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function BuyHoldProjections({ property, inputs, results }) {
  const [selectedYears] = useState([1, 2, 3, 5, 10, 20, 30]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  // Safety check for results
  if (!results || !results.propertyInfo || !results.financing) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Projections...</h2>
          <p className="text-gray-500">Please wait while we calculate your investment projections.</p>
        </div>
      </div>
    );
  }

  // Calculate projections for 30 years
  const calculateProjections = () => {
    const projections = [];
    const appreciationRate = (inputs.appreciationRate || 3) / 100;
    const incomeGrowthRate = (inputs.incomeGrowthRate || 2) / 100;
    const expenseGrowthRate = (inputs.expenseGrowthRate || 2) / 100;

    let propertyValue = results.propertyInfo.fairMarketValue || inputs.offerPrice || 0;
    let loanBalance = results.financing?.firstMtg?.totalPrincipal || 0;
    
    const monthlyPayment = results.financing?.firstMtg?.monthlyPayment || 0;
    const monthlyRate = (results.financing?.firstMtg?.rate || 7) / 100 / 12;

    for (let year = 1; year <= 30; year++) {
      // Property value with appreciation
      propertyValue = propertyValue * (1 + appreciationRate);
      
      // Rental income with growth
      const grossRents = (results.income?.grossRents || inputs.grossRents || 0) * Math.pow(1 + incomeGrowthRate, year - 1);
      const vacancyLoss = grossRents * ((results.propertyInfo?.vacancyRate || inputs.vacancyRate || 5) / 100);
      const operatingIncome = grossRents - vacancyLoss;
      
      // Operating expenses with growth
      const propertyTaxes = (results.expenses?.propertyTaxes || inputs.propertyTaxes || 0) * Math.pow(1 + expenseGrowthRate, year - 1);
      const insurance = (results.expenses?.insurance || inputs.insurance || 0) * Math.pow(1 + expenseGrowthRate, year - 1);
      const propertyManagement = operatingIncome * ((results.propertyInfo?.managementRate || inputs.managementRate || 8) / 100);
      const maintenance = grossRents * ((inputs.maintenancePercent || inputs.repairsPercent || 5) / 100);
      const capEx = grossRents * ((inputs.capExPercent || 5) / 100);
      
      const operatingExpenses = propertyTaxes + insurance + propertyManagement + maintenance + capEx;
      
      // NOI and cash flow
      const noi = operatingIncome - operatingExpenses;
      const loanPayments = monthlyPayment * 12;
      const cashFlow = noi - loanPayments;
      
      // Loan amortization
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;
      let startingBalance = loanBalance;
      
      for (let month = 1; month <= 12; month++) {
        const interest = loanBalance * monthlyRate;
        const principal = monthlyPayment - interest;
        yearlyInterest += interest;
        yearlyPrincipal += principal;
        loanBalance = Math.max(0, loanBalance - principal);
      }
      
      // Tax benefits
      const depreciation = year <= 27.5 ? (propertyValue * 0.85) / 27.5 : 0;
      const totalDeductions = operatingExpenses + yearlyInterest + depreciation;
      
      // Post-tax cash flow (simplified - assumes 25% tax rate)
      const taxSavings = totalDeductions * 0.25;
      const postTaxCashFlow = cashFlow + taxSavings;
      
      // Equity
      const totalEquity = propertyValue - loanBalance;
      
      // Sale analysis
      const sellingCosts = propertyValue * ((inputs.sellingCosts || 6) / 100);
      const saleProceeds = propertyValue - sellingCosts - loanBalance;
      const cumulativeCashFlow = projections.reduce((sum, p) => sum + p.cashFlow, 0) + cashFlow;
      const totalCashInvested = results.cashRequirements?.totalCashRequired || 0;
      const totalProfit = saleProceeds + cumulativeCashFlow - totalCashInvested;
      
      // Investment returns
      const purchasePrice = results.purchase?.realPurchasePrice || inputs.offerPrice || propertyValue;
      const capRatePurchase = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
      const capRateMarket = propertyValue > 0 ? (noi / propertyValue) * 100 : 0;
      const cashOnCash = totalCashInvested > 0 ? (cashFlow / totalCashInvested) * 100 : 0;
      const returnOnEquity = totalEquity > 0 ? (cashFlow / totalEquity) * 100 : 0;
      const roi = totalCashInvested > 0 ? ((cashFlow + yearlyPrincipal) / totalCashInvested) * 100 : 0;
      
      // Calculate IRR (simplified)
      const totalReturn = totalCashInvested > 0 ? (saleProceeds + cumulativeCashFlow) / totalCashInvested : 0;
      const irr = totalReturn > 0 ? (Math.pow(totalReturn, 1 / year) - 1) * 100 : 0;
      
      // Financial ratios
      const rentToValue = propertyValue > 0 ? (grossRents / 12 / propertyValue) * 100 : 0;
      const grm = grossRents > 0 ? propertyValue / grossRents : 0;
      const dcr = loanPayments > 0 ? noi / loanPayments : 0;
      const breakEvenRatio = operatingIncome > 0 ? ((operatingExpenses + loanPayments) / operatingIncome) * 100 : 0;
      const debtYield = startingBalance > 0 ? (noi / startingBalance) * 100 : 0;
      const equityMultiple = totalCashInvested > 0 ? (saleProceeds + cumulativeCashFlow) / totalCashInvested : 0;
      
      projections.push({
        year,
        grossRents,
        vacancy: vacancyLoss,
        vacancyRate: results.propertyInfo?.vacancyRate || inputs.vacancyRate || 5,
        operatingIncome,
        incomeIncrease: incomeGrowthRate * 100,
        propertyTaxes,
        insurance,
        propertyManagement,
        maintenance,
        capEx,
        operatingExpenses,
        expenseIncrease: expenseGrowthRate * 100,
        expenseRatio: operatingIncome > 0 ? (operatingExpenses / operatingIncome) * 100 : 0,
        noi,
        loanPayments,
        cashFlow,
        postTaxCashFlow,
        operatingExpensesDeduction: operatingExpenses,
        loanInterest: yearlyInterest,
        depreciation,
        totalDeductions,
        propertyValue,
        appreciation: appreciationRate * 100,
        loanBalance,
        ltvRatio: propertyValue > 0 ? (loanBalance / propertyValue) * 100 : 0,
        totalEquity,
        principalPaid: yearlyPrincipal,
        sellingCosts,
        saleProceeds,
        cumulativeCashFlow,
        totalCashInvested,
        totalProfit,
        capRatePurchase,
        capRateMarket,
        cashOnCash,
        returnOnEquity,
        roi,
        irr,
        rentToValue,
        grm,
        dcr,
        breakEvenRatio,
        debtYield,
        equityMultiple
      });
    }

    return projections;
  };

  const projections = calculateProjections();

  // Prepare chart data for Cash Flow Over Time
  const cashFlowChartData = {
    labels: projections.map(p => `Year ${p.year}`),
    datasets: [
      {
        label: 'Operating Income',
        data: projections.map(p => p.operatingIncome),
        borderColor: '#3b82f6',
        tension: 0.4,
      },
      {
        label: 'Operating Expenses',
        data: projections.map(p => p.operatingExpenses),
        borderColor: '#ef4444',
        tension: 0.4,
      },
      {
        label: 'Cash Flow',
        data: projections.map(p => p.cashFlow),
        borderColor: '#10b981',
        tension: 0.4,
      },
    ],
  };

  // Prepare chart data for Equity Over Time
  const equityChartData = {
    labels: projections.map(p => `Year ${p.year}`),
    datasets: [
      {
        label: 'Property Value',
        data: projections.map(p => p.propertyValue),
        borderColor: '#3b82f6',
        tension: 0.4,
      },
      {
        label: 'Loan Balance',
        data: projections.map(p => p.loanBalance),
        borderColor: '#ef4444',
        tension: 0.4,
      },
      {
        label: 'Total Equity',
        data: projections.map(p => p.totalEquity),
        borderColor: '#10b981',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header - Simplified, no buttons */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy & Hold Projections</h1>
        <p className="text-gray-600">
          These projections show how this property will perform as a rental in the future.
        </p>
      </div>

      {/* Projection Settings */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">APPRECIATION</div>
          <div className="text-2xl font-bold text-blue-900">{inputs.appreciationRate || 3}% Per Year</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">INCOME INCREASE</div>
          <div className="text-2xl font-bold text-blue-900">{inputs.incomeGrowthRate || 2}% Per Year</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">EXPENSE INCREASE</div>
          <div className="text-2xl font-bold text-blue-900">{inputs.expenseGrowthRate || 2}% Per Year</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">SELLING COSTS</div>
          <div className="text-2xl font-bold text-blue-900">{inputs.sellingCosts || 6}% of Price</div>
        </div>
      </div>

      {/* Year Headers */}
      <div className="grid grid-cols-8 gap-2 mb-6 text-center font-bold text-gray-700">
        <div></div>
        {selectedYears.map(year => (
          <div key={year}>Year {year}</div>
        ))}
      </div>

      {/* RENTAL INCOME */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">RENTAL INCOME</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div className="font-medium">Gross Rent:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatCurrency(projections[year-1].grossRents)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div className="font-medium">Vacancy:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">
                - {formatCurrency(projections[year-1].vacancy)}
                <div className="text-xs text-gray-500">{projections[year-1].vacancyRate}%</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 bg-blue-50">
            <div className="font-bold text-blue-600">Operating Income:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right font-bold text-blue-600">
                = {formatCurrency(projections[year-1].operatingIncome)}
                <div className="text-xs text-blue-600">Income Increase: {projections[year-1].incomeIncrease}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OPERATING EXPENSES */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">OPERATING EXPENSES</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Property Taxes:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatCurrency(projections[year-1].propertyTaxes)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Insurance:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatCurrency(projections[year-1].insurance)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Property Management:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatCurrency(projections[year-1].propertyManagement)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Maintenance:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatCurrency(projections[year-1].maintenance)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Capital Expenditures:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatCurrency(projections[year-1].capEx)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 bg-blue-50">
            <div className="font-bold text-blue-600">Operating Expenses:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right font-bold text-blue-600">
                = {formatCurrency(projections[year-1].operatingExpenses)}
                <div className="text-xs text-blue-600">
                  Expense Increase: {projections[year-1].expenseIncrease}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <SimpleLineChart 
            data={cashFlowChartData} 
            title="Cash Flow Over Time"
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <SimpleLineChart 
            data={equityChartData} 
            title="Equity Over Time"
          />
        </div>
      </div>

      {/* CASH FLOW */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">CASH FLOW</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Operating Income:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatCurrency(projections[year-1].operatingIncome)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Operating Expenses:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">
                - {formatCurrency(projections[year-1].operatingExpenses)}
                <div className="text-xs text-gray-500">
                  {projections[year-1].expenseRatio.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b bg-gray-50">
            <div className="font-bold">Net Operating Income:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right font-bold">
                = {formatCurrency(projections[year-1].noi)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Loan Payments:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">- {formatCurrency(projections[year-1].loanPayments)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 bg-blue-50">
            <div className="font-bold text-blue-600">Cash Flow:</div>
            {selectedYears.map(year => {
              const cf = projections[year-1].cashFlow;
              return (
                <div key={year} className={`text-right font-bold ${cf >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  = {formatCurrency(cf)}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2">
            <div>Post-Tax Cash Flow:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatCurrency(projections[year-1].postTaxCashFlow)}</div>
            ))}
          </div>
        </div>
      </div>

      {/* TAX BENEFITS & DEDUCTIONS */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">TAX BENEFITS & DEDUCTIONS</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Operating Expenses:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatCurrency(projections[year-1].operatingExpensesDeduction)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Loan Interest:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatCurrency(projections[year-1].loanInterest)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Depreciation:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatCurrency(projections[year-1].depreciation)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 bg-blue-50">
            <div className="font-bold text-blue-600">Total Deductions:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right font-bold text-blue-600">
                = {formatCurrency(projections[year-1].totalDeductions)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EQUITY ACCUMULATION */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">EQUITY ACCUMULATION</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Property Value:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">
                {formatCurrency(projections[year-1].propertyValue)}
                <div className="text-xs text-gray-500">
                  Appreciation: {projections[year-1].appreciation.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Loan Balance:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">
                - {formatCurrency(projections[year-1].loanBalance)}
                <div className="text-xs text-gray-500">
                  LTV Ratio: {projections[year-1].ltvRatio.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 bg-blue-50">
            <div className="font-bold text-blue-600">Total Equity:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right font-bold text-blue-600">
                = {formatCurrency(projections[year-1].totalEquity)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SALE ANALYSIS */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">SALE ANALYSIS</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Equity:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatCurrency(projections[year-1].totalEquity)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Selling Costs ({inputs.sellingCosts || 6}%):</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">- {formatCurrency(projections[year-1].sellingCosts)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 bg-blue-50">
            <div className="font-bold text-blue-600">Sale Proceeds:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right font-bold text-blue-600">
                = {formatCurrency(projections[year-1].saleProceeds)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Cumulative Cash Flow:</div>
            {selectedYears.map(year => (
              <div key={year} className={`text-right ${projections[year-1].cumulativeCashFlow >= 0 ? '' : 'text-red-600'}`}>
                {formatCurrency(projections[year-1].cumulativeCashFlow)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Total Cash Invested:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">- {formatCurrency(projections[year-1].totalCashInvested)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 bg-green-50">
            <div className="font-bold text-green-600">Total Profit:</div>
            {selectedYears.map(year => (
              <div key={year} className={`text-right font-bold ${projections[year-1].totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                = {formatCurrency(projections[year-1].totalProfit)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* INVESTMENT RETURNS */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">INVESTMENT RETURNS</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Cap Rate (Purchase Price):</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatPercent(projections[year-1].capRatePurchase)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Cap Rate (Market Value):</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatPercent(projections[year-1].capRateMarket)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Cash on Cash Return:</div>
            {selectedYears.map(year => {
              const coc = projections[year-1].cashOnCash;
              return (
                <div key={year} className={`text-right ${coc >= 0 ? '' : 'text-red-600'}`}>
                  {formatPercent(coc)}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Return on Equity:</div>
            {selectedYears.map(year => {
              const roe = projections[year-1].returnOnEquity;
              return (
                <div key={year} className={`text-right ${roe >= 0 ? '' : 'text-red-600'}`}>
                  {formatPercent(roe)}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Return on Investment:</div>
            {selectedYears.map(year => {
              const roi = projections[year-1].roi;
              return (
                <div key={year} className={`text-right ${roi >= 0 ? '' : 'text-red-600'}`}>
                  {formatPercent(roi)}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 bg-blue-50">
            <div className="font-bold text-blue-600">Internal Rate of Return:</div>
            {selectedYears.map(year => {
              const irr = projections[year-1].irr;
              return (
                <div key={year} className={`text-right font-bold ${irr >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatPercent(irr)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FINANCIAL RATIOS */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">FINANCIAL RATIOS</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Rent to Value:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatPercent(projections[year-1].rentToValue)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Gross Rent Multiplier:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{projections[year-1].grm.toFixed(2)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Equity Multiple:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{projections[year-1].equityMultiple.toFixed(2)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Break Even Ratio:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatPercent(projections[year-1].breakEvenRatio)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2 border-b">
            <div>Debt Coverage Ratio:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{projections[year-1].dcr.toFixed(2)}</div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 py-2">
            <div>Debt Yield:</div>
            {selectedYears.map(year => (
              <div key={year} className="text-right">{formatPercent(projections[year-1].debtYield)}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}