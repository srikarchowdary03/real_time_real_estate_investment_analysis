/**
 * @file Buy and Hold projections component
 * @module components/analysis/BuyHoldProjections
 * @description 30-year investment projection analysis for buy-and-hold rental properties.
 * Calculates year-by-year projections for rental income, expenses, cash flow, equity,
 * property value appreciation, loan amortization, tax benefits, and investment returns.
 * 
 * Projection Components:
 * - Rental Income: Gross rents, vacancy, operating income
 * - Operating Expenses: Taxes, insurance, management, maintenance, CapEx
 * - Cash Flow: NOI, debt service, pre-tax and post-tax cash flow
 * - Tax Benefits: Deductions (expenses, interest, depreciation)
 * - Equity Accumulation: Property value, loan balance, total equity
 * - Sale Analysis: Proceeds, cumulative cash flow, total profit
 * - Investment Returns: Cap Rate, CoC, ROE, ROI, IRR
 * - Financial Ratios: Rent-to-value, GRM, DCR, Break-even, Debt yield, Equity multiple
 * 
 * Calculations Include:
 * - Annual property appreciation
 * - Rental income growth
 * - Operating expense inflation
 * - Monthly loan amortization
 * - 27.5-year straight-line depreciation
 * - Tax deductions and savings
 * - Cumulative cash flows
 * - Sale proceeds with selling costs
 * - IRR (Internal Rate of Return)
 * 
 * @requires react
 * @requires ../../utils/investmentCalculations
 * 
 * @version 1.0.0
 */
import { useState } from 'react';

/**
 * Simple SVG Line Chart Component
 * 
 * Fallback chart component for visualizing projections without external libraries.
 * Renders SVG line chart with multiple datasets, grid lines, axes, and legend.
 * 
 * Features:
 * - Auto-scales to data range
 * - Multiple dataset support (different colored lines)
 * - Grid lines and value labels
 * - X-axis labels (every 5 years)
 * - Interactive legend
 * 
 * @async
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.data - Chart data object
 * @param {Array<string>} props.data.labels - X-axis labels (year names)
 * @param {Array<Object>} props.data.datasets - Array of data series
 * @param {string} props.data.datasets[].label - Series label
 * @param {Array<number>} props.data.datasets[].data - Y values
 * @param {string} props.data.datasets[].borderColor - Line color
 * @param {string} props.title - Chart title
 * @returns {React.ReactElement} SVG line chart
 * 
 * @example
 * <SimpleLineChart
 *   data={{
 *     labels: ['Year 1', 'Year 2', 'Year 3'],
 *     datasets: [{
 *       label: 'Cash Flow',
 *       data: [5000, 5500, 6000],
 *       borderColor: '#10b981'
 *     }]
 *   }}
 *   title="Cash Flow Over Time"
 * />
 */

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
  
    /**
   * Scale Y value to SVG coordinates
   * @param {number} value - Data value
   * @returns {number} SVG Y coordinate
   */
  const scaleY = (value) => {
    return height - padding - ((value - minValue) / range) * (height - 2 * padding);
  };
  
    /**
   * Scale X index to SVG coordinates
   * @param {number} index - Data point index
   * @returns {number} SVG X coordinate
   */
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

/**
 * Buy & Hold Projections Component
 * 
 * Displays comprehensive 30-year projections for rental property investment.
 * Shows selected years (1, 2, 3, 5, 10, 20, 30) in tabular format with
 * charts for cash flow and equity over time.
 * 
 * PROJECTION METHODOLOGY:
 * - Property appreciates annually at specified rate
 * - Rental income grows annually
 * - Operating expenses inflate annually
 * - Loan amortizes monthly (principal + interest)
 * - Depreciation: 27.5-year straight-line (85% of value)
 * - Tax benefits: Deductions × 25% tax rate (simplified)
 * - Sale proceeds: Value - Loan - Selling costs
 * - IRR: Internal rate of return calculation
 * 
 * SECTIONS DISPLAYED:
 * 1. Projection Settings (top cards)
 * 2. Rental Income table
 * 3. Operating Expenses table
 * 4. Cash Flow table
 * 5. Tax Benefits & Deductions table
 * 6. Equity Accumulation table
 * 7. Sale Analysis table
 * 8. Investment Returns table
 * 9. Financial Ratios table
 * 10. Charts: Cash Flow Over Time, Equity Over Time
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.property - Property data
 * @param {Object} props.inputs - Calculation inputs
 * @param {number} props.inputs.appreciationRate - Annual appreciation %
 * @param {number} props.inputs.incomeGrowthRate - Annual rent growth %
 * @param {number} props.inputs.expenseGrowthRate - Annual expense inflation %
 * @param {number} props.inputs.sellingCosts - Selling costs %
 * @param {Object} props.results - Analysis results from BuyRentHoldCalculator
 * @returns {React.ReactElement} 30-year projections display
 * 
 * @example
 * <BuyHoldProjections
 *   property={propertyData}
 *   inputs={calculationInputs}
 *   results={analysisResults}
 * />
 */
export default function BuyHoldProjections({ property, inputs, results }) {
   /**
   * Selected years to display in tables
   * Shows key milestones: 1, 2, 3, 5, 10, 20, 30
   */
  const [selectedYears] = useState([1, 2, 3, 5, 10, 20, 30]);
    /**
   * Format number as USD currency
   * @function
   * @param {number} value - Dollar amount
   * @returns {string} Formatted currency
   */

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

    /**
   * Format number as percentage
   * @function
   * @param {number} value - Percentage value
   * @returns {string} Formatted percentage
   */
  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  // Safety check for results
    /**
   * Safety check for results
   * Returns loading state if results not ready
   */
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

   /**
   * Calculate 30-year projections
   * 
   * COMPREHENSIVE PROJECTION ALGORITHM:
   * 
   * For each year (1-30):
   * 1. Property Value: Previous value × (1 + appreciation rate)
   * 2. Gross Rents: Starting rent × (1 + income growth)^(year-1)
   * 3. Vacancy Loss: Gross rent × vacancy rate
   * 4. Operating Income: Gross rent - vacancy
   * 5. Operating Expenses: Each expense × (1 + expense growth)^(year-1)
   * 6. NOI: Operating income - operating expenses
   * 7. Loan Payments: Monthly payment × 12
   * 8. Cash Flow: NOI - loan payments
   * 9. Loan Amortization: Month-by-month principal/interest split
   * 10. Tax Benefits: Depreciation + deductions × tax rate
   * 11. Post-Tax Cash Flow: Cash flow + tax savings
   * 12. Equity: Property value - loan balance
   * 13. Sale Proceeds: Equity - selling costs
   * 14. Investment Metrics: Cap rate, CoC, ROE, ROI, IRR
   * 15. Financial Ratios: Rent-to-value, GRM, DCR, etc.
   * 
   * @function
   * @returns {Array<Object>} Array of 30 yearly projection objects
   * @returns {number} returns[].year - Year number (1-30)
   * @returns {number} returns[].propertyValue - Property value
   * @returns {number} returns[].grossRents - Annual gross rents
   * @returns {number} returns[].operatingExpenses - Annual operating expenses
   * @returns {number} returns[].noi - Net Operating Income
   * @returns {number} returns[].cashFlow - Annual cash flow
   * @returns {number} returns[].loanBalance - Remaining loan balance
   * @returns {number} returns[].totalEquity - Equity position
   * @returns {number} returns[].saleProceeds - Proceeds if sold this year
   * @returns {number} returns[].cumulativeCashFlow - Total cash flow to date
   * @returns {number} returns[].totalProfit - Total profit if sold this year
   * @returns {number} returns[].capRatePurchase - Cap rate on purchase price
   * @returns {number} returns[].cashOnCash - Cash-on-Cash return %
   * @returns {number} returns[].irr - Internal Rate of Return %
   * 
   * @example
   * const projections = calculateProjections();
   * console.log(projections[4]); // Year 5 data
   * // {
   * //   year: 5,
   * //   propertyValue: 289543,
   * //   cashFlow: 6234,
   * //   totalEquity: 94231,
   * //   capRatePurchase: 7.2,
   * //   ...
   * // }
   */
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

    /**
   * 30-year projection data
   */
  const projections = calculateProjections();

   /**
   * Cash flow chart data
   * Shows operating income, expenses, and net cash flow over 30 years
   * @type {Object}
   */
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

    /**
   * Equity chart data
   * Shows property value, loan balance, and total equity over 30 years
   * @type {Object}
   */
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