export default function CalculatorResults({ results }) {
  if (!results) {
    return (
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <p className="text-yellow-800">Calculating results...</p>
      </div>
    );
  }

  const MetricCard = ({ label, value, subtitle, color = 'gray' }) => {
    const colorClasses = {
      green: 'bg-green-50 border-green-200 text-green-900',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      red: 'bg-red-50 border-red-200 text-red-900',
      gray: 'bg-gray-50 border-gray-200 text-gray-900',
      blue: 'bg-blue-50 border-blue-200 text-blue-900'
    };

    return (
      <div className={`p-4 rounded-lg border-2 ${colorClasses[color]}`}>
        <div className="text-sm font-medium opacity-75">{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {subtitle && <div className="text-xs mt-1 opacity-75">{subtitle}</div>}
      </div>
    );
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatPercent = (val) => {
    return `${val.toFixed(2)}%`;
  };

  const getCashFlowColor = (cf) => {
    if (cf >= 200) return 'green';
    if (cf >= 0) return 'yellow';
    return 'red';
  };

  const getCapRateColor = (rate) => {
    if (rate >= 8) return 'green';
    if (rate >= 6) return 'yellow';
    return 'red';
  };

  const getRuleColor = (passes) => passes ? 'green' : 'red';

  return (
    <div className="space-y-6">
      {/* Investment Summary */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Investment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Overall Score:</span>
            <span className="font-bold text-2xl">{results?.summary?.investmentScore || 0}/10</span>
          </div>
          <div className="flex justify-between">
            <span>Rating:</span>
            <span className="font-bold">{(results?.summary?.rating || 'N/A').toUpperCase()}</span>
          </div>
          <div className="text-sm opacity-90 mt-2">
            {results?.summary?.recommendation || 'Analyzing...'}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <h3 className="text-lg font-bold mb-3">Key Metrics</h3>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Monthly Cash Flow"
            value={formatCurrency(results?.cashFlow?.monthlyCashFlow || 0)}
            color={getCashFlowColor(results?.cashFlow?.monthlyCashFlow || 0)}
          />
          <MetricCard
            label="Annual Cash Flow"
            value={formatCurrency(results?.cashFlow?.annualCashFlow || 0)}
            color={getCashFlowColor(results?.cashFlow?.monthlyCashFlow || 0)}
          />
          <MetricCard
            label="Cap Rate"
            value={formatPercent(results?.returns?.capRate || 0)}
            color={getCapRateColor(results?.returns?.capRate || 0)}
          />
          <MetricCard
            label="Cash on Cash"
            value={formatPercent(results?.returns?.cashOnCashReturn || 0)}
            color={getCapRateColor(results?.returns?.cashOnCashReturn || 0)}
          />
        </div>
      </div>

      {/* Investment Rules */}
      <div>
        <h3 className="text-lg font-bold mb-3">Investment Rules</h3>
        <div className="space-y-2">
          {results?.rules?.onePercent && (
            <MetricCard
              label="1% Rule"
              value={results.rules.onePercent.passes ? '✓ PASS' : '✗ FAIL'}
              subtitle={`Rent: ${formatCurrency(results.rules.onePercent.monthlyRent || 0)} / 1% Target: ${formatCurrency(results.rules.onePercent.onePercentTarget || 0)}`}
              color={getRuleColor(results.rules.onePercent.passes)}
            />
          )}
          {results?.rules?.fiftyPercent && (
            <MetricCard
              label="50% Rule"
              value={results.rules.fiftyPercent.passes ? '✓ PASS' : '✗ FAIL'}
              subtitle={`Operating Expenses: ${formatPercent(results.rules.fiftyPercent.expenseRatio || 0)}`}
              color={getRuleColor(results.rules.fiftyPercent.passes)}
            />
          )}
          {results?.rules?.seventyPercent && (
            <MetricCard
              label="70% Rule"
              value={results.rules.seventyPercent.passes ? '✓ PASS' : '✗ FAIL'}
              subtitle={`Max Offer: ${formatCurrency(results.rules.seventyPercent.maxOfferPrice || 0)}`}
              color={getRuleColor(results.rules.seventyPercent.passes)}
            />
          )}
        </div>
      </div>

      {/* Financial Ratios */}
      <div>
        <h3 className="text-lg font-bold mb-3">Financial Ratios</h3>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="GRM"
            value={(results?.returns?.grm || 0).toFixed(2)}
            subtitle="Gross Rent Multiplier"
            color="blue"
          />
          <MetricCard
            label="DSCR"
            value={(results?.returns?.debtServiceCoverageRatio || 0).toFixed(2)}
            subtitle="Debt Service Coverage"
            color={(results?.returns?.debtServiceCoverageRatio || 0) >= 1.25 ? 'green' : 'red'}
          />
          <MetricCard
            label="Total ROI"
            value={formatPercent(results?.returns?.totalROI || 0)}
            color="blue"
          />
          <MetricCard
            label="ROI (Annual)"
            value={formatPercent(results?.returns?.annualizedROI || 0)}
            color="blue"
          />
        </div>
      </div>

      {/* Purchase Details */}
      <div>
        <h3 className="text-lg font-bold mb-3">Purchase Details</h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Purchase Price:</span>
            <span className="font-semibold">{formatCurrency(results?.purchase?.purchasePrice || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Down Payment:</span>
            <span className="font-semibold">{formatCurrency(results?.purchase?.downPaymentAmount || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Closing Costs:</span>
            <span className="font-semibold">{formatCurrency(results?.purchase?.closingCosts || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Cash Needed:</span>
            <span className="font-bold text-lg">{formatCurrency(results?.purchase?.totalCashNeeded || 0)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span>Loan Amount:</span>
            <span className="font-semibold">{formatCurrency(results?.purchase?.loanAmount || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Monthly Payment (P&I):</span>
            <span className="font-semibold">{formatCurrency(results?.expenses?.mortgagePayment || 0)}</span>
          </div>
        </div>
      </div>

      {/* Income Breakdown */}
      <div>
        <h3 className="text-lg font-bold mb-3">Monthly Income</h3>
        <div className="bg-green-50 p-4 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Gross Rent:</span>
            <span className="font-semibold">{formatCurrency(results?.income?.monthlyRent || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Other Income:</span>
            <span className="font-semibold">{formatCurrency(results?.income?.otherMonthlyIncome || 0)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-green-200">
            <span className="font-bold">Gross Monthly Income:</span>
            <span className="font-bold">{formatCurrency(results?.income?.grossMonthlyIncome || 0)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>Vacancy Loss ({formatPercent(results?.income?.vacancyRate || 0)}):</span>
            <span>-{formatCurrency(results?.income?.vacancyLoss || 0)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-green-200">
            <span className="font-bold">Effective Income:</span>
            <span className="font-bold">{formatCurrency(results?.income?.effectiveMonthlyIncome || 0)}</span>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div>
        <h3 className="text-lg font-bold mb-3">Monthly Expenses</h3>
        <div className="bg-red-50 p-4 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Mortgage (P&I):</span>
            <span className="font-semibold">{formatCurrency(results?.expenses?.mortgagePayment || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Property Tax:</span>
            <span className="font-semibold">{formatCurrency(results?.expenses?.propertyTax || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Insurance:</span>
            <span className="font-semibold">{formatCurrency(results?.expenses?.insurance || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>HOA:</span>
            <span className="font-semibold">{formatCurrency(results?.expenses?.hoa || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Management:</span>
            <span className="font-semibold">{formatCurrency(results?.expenses?.management || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Maintenance:</span>
            <span className="font-semibold">{formatCurrency(results?.expenses?.maintenance || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>CapEx:</span>
            <span className="font-semibold">{formatCurrency(results?.expenses?.capex || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Utilities:</span>
            <span className="font-semibold">{formatCurrency(results?.expenses?.utilities || 0)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-red-200">
            <span className="font-bold">Total Expenses:</span>
            <span className="font-bold">{formatCurrency(results?.expenses?.totalMonthlyExpenses || 0)}</span>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      {results?.dataSources && (
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <div className="font-semibold mb-1">Data Sources:</div>
          {results.dataSources.rentEstimate && <div>• Rent: {results.dataSources.rentEstimate}</div>}
          {results.dataSources.propertyTax && <div>• Tax: {results.dataSources.propertyTax}</div>}
          {results.dataSources.insurance && <div>• Insurance: {results.dataSources.insurance}</div>}
        </div>
      )}
    </div>
  );
}