import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Home, TrendingUp, PieChart, Calculator,
  Percent, Calendar, Wrench, Lightbulb, Droplet, Wind,
  Shield, Building2, Users, Receipt, AlertCircle
} from 'lucide-react';

const InvestmentCalculator = ({ property }) => {
  // Property details from props
  const propertyPrice = property?.list_price || property?.price || 0;
  const propertyTax = property?.tax_history?.[0]?.tax || 0;
  const sqft = property?.description?.sqft || 0;
  const yearBuilt = property?.description?.year_built || new Date().getFullYear();

  // Purchase & Financing
  const [purchasePrice, setPurchasePrice] = useState(propertyPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(7.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [closingCosts, setClosingCosts] = useState(Math.round(propertyPrice * 0.03));
  const [rehabCosts, setRehabCosts] = useState(0);

  // Income
  const [monthlyRent, setMonthlyRent] = useState(Math.round(purchasePrice * 0.008)); // ~1% rule
  const [otherMonthlyIncome, setOtherMonthlyIncome] = useState(0);
  const [vacancyRate, setVacancyRate] = useState(5);

  // Expenses
  const [propertyTaxMonthly, setPropertyTaxMonthly] = useState(Math.round(propertyTax / 12) || Math.round(purchasePrice * 0.012 / 12));
  const [insurance, setInsurance] = useState(Math.round(purchasePrice * 0.004 / 12));
  const [hoaFees, setHoaFees] = useState(0);
  const [utilities, setUtilities] = useState(0);
  const [maintenance, setMaintenance] = useState(Math.round(monthlyRent * 0.1));
  const [propertyManagement, setPropertyManagement] = useState(Math.round(monthlyRent * 0.1));
  const [capex, setCapex] = useState(Math.round(monthlyRent * 0.08));

  // Update purchase price when property changes
  useEffect(() => {
    if (propertyPrice > 0) {
      setPurchasePrice(propertyPrice);
      setClosingCosts(Math.round(propertyPrice * 0.03));
      setMonthlyRent(Math.round(propertyPrice * 0.008));
      setPropertyTaxMonthly(Math.round(propertyTax / 12) || Math.round(propertyPrice * 0.012 / 12));
      setInsurance(Math.round(propertyPrice * 0.004 / 12));
    }
  }, [propertyPrice, propertyTax]);

  // CALCULATIONS
  const downPayment = Math.round(purchasePrice * (downPaymentPercent / 100));
  const loanAmount = purchasePrice - downPayment;
  const totalCashNeeded = downPayment + closingCosts + rehabCosts;

  // Monthly mortgage payment (Principal & Interest)
  const monthlyInterestRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;
  const mortgagePayment = loanAmount > 0
    ? Math.round(loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1))
    : 0;

  // Income calculations
  const grossMonthlyIncome = monthlyRent + otherMonthlyIncome;
  const vacancyLoss = Math.round(grossMonthlyIncome * (vacancyRate / 100));
  const effectiveGrossIncome = grossMonthlyIncome - vacancyLoss;

  // Expense calculations
  const totalMonthlyExpenses = propertyTaxMonthly + insurance + hoaFees + utilities + 
                               maintenance + propertyManagement + capex;
  
  const monthlyNetOperatingIncome = effectiveGrossIncome - totalMonthlyExpenses;
  const monthlyCashFlow = monthlyNetOperatingIncome - mortgagePayment;
  const annualCashFlow = monthlyCashFlow * 12;

  // Return metrics
  const cashOnCashReturn = totalCashNeeded > 0 ? (annualCashFlow / totalCashNeeded) * 100 : 0;
  const capRate = purchasePrice > 0 ? ((monthlyNetOperatingIncome * 12) / purchasePrice) * 100 : 0;
  const grossYield = purchasePrice > 0 ? ((grossMonthlyIncome * 12) / purchasePrice) * 100 : 0;
  const totalMonthlyPayment = mortgagePayment + totalMonthlyExpenses;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (percent) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Expense breakdown for chart
  const expenseBreakdown = [
    { name: 'Mortgage', value: mortgagePayment, color: '#EF4444' },
    { name: 'Property Tax', value: propertyTaxMonthly, color: '#F59E0B' },
    { name: 'Insurance', value: insurance, color: '#10B981' },
    { name: 'Maintenance', value: maintenance, color: '#3B82F6' },
    { name: 'Property Mgmt', value: propertyManagement, color: '#8B5CF6' },
    { name: 'CapEx', value: capex, color: '#EC4899' },
  ];
  
  if (hoaFees > 0) expenseBreakdown.push({ name: 'HOA', value: hoaFees, color: '#6366F1' });
  if (utilities > 0) expenseBreakdown.push({ name: 'Utilities', value: utilities, color: '#14B8A6' });

  const total = expenseBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div className="text-sm font-medium text-green-900">Monthly Cash Flow</div>
          </div>
          <div className={`text-3xl font-bold ${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(monthlyCashFlow)}
          </div>
          <div className="text-xs text-green-700 mt-1">
            {formatCurrency(annualCashFlow)} / year
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-5 h-5 text-blue-600" />
            <div className="text-sm font-medium text-blue-900">Cash on Cash</div>
          </div>
          <div className={`text-3xl font-bold ${cashOnCashReturn >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatPercent(cashOnCashReturn)}
          </div>
          <div className="text-xs text-blue-700 mt-1">Annual return</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            <div className="text-sm font-medium text-purple-900">Cap Rate</div>
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {formatPercent(capRate)}
          </div>
          <div className="text-xs text-purple-700 mt-1">Net operating income</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-orange-600" />
            <div className="text-sm font-medium text-orange-900">Total Investment</div>
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {formatCurrency(totalCashNeeded)}
          </div>
          <div className="text-xs text-orange-700 mt-1">Cash needed to close</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN - INPUTS */}
        <div className="space-y-6">
          {/* Purchase & Financing */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Purchase & Financing</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price
                </label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Down Payment %
                  </label>
                  <input
                    type="number"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Down Payment $
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(downPayment)}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Term (years)
                  </label>
                  <input
                    type="number"
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Closing Costs
                  </label>
                  <input
                    type="number"
                    value={closingCosts}
                    onChange={(e) => setClosingCosts(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rehab/Repair Costs
                  </label>
                  <input
                    type="number"
                    value={rehabCosts}
                    onChange={(e) => setRehabCosts(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Loan Amount:</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(loanAmount)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-gray-700">Monthly Payment:</span>
                  <span className="text-lg font-bold text-red-600">{formatCurrency(mortgagePayment)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Income Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900">Monthly Income</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rent
                </label>
                <input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setMonthlyRent(value);
                    setMaintenance(Math.round(value * 0.1));
                    setPropertyManagement(Math.round(value * 0.1));
                    setCapex(Math.round(value * 0.08));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Monthly Income
                </label>
                <input
                  type="number"
                  value={otherMonthlyIncome}
                  onChange={(e) => setOtherMonthlyIncome(Number(e.target.value))}
                  placeholder="Parking, laundry, storage..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vacancy Rate (%)
                </label>
                <input
                  type="number"
                  value={vacancyRate}
                  onChange={(e) => setVacancyRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Gross Monthly Income:</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(grossMonthlyIncome)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-600">Vacancy Loss:</span>
                  <span className="text-red-600">-{formatCurrency(vacancyLoss)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-green-300">
                  <span className="text-sm font-medium text-gray-700">Effective Income:</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(effectiveGrossIncome)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - EXPENSES & ANALYSIS */}
        <div className="space-y-6">
          {/* Operating Expenses */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900">Monthly Operating Expenses</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="w-4 h-4" />
                  Property Tax
                </label>
                <input
                  type="number"
                  value={propertyTaxMonthly}
                  onChange={(e) => setPropertyTaxMonthly(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Shield className="w-4 h-4" />
                  Insurance
                </label>
                <input
                  type="number"
                  value={insurance}
                  onChange={(e) => setInsurance(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Users className="w-4 h-4" />
                  HOA Fees
                </label>
                <input
                  type="number"
                  value={hoaFees}
                  onChange={(e) => setHoaFees(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Droplet className="w-4 h-4" />
                  Utilities (if paid by owner)
                </label>
                <input
                  type="number"
                  value={utilities}
                  onChange={(e) => setUtilities(Number(e.target.value))}
                  placeholder="Water, gas, electric..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Wrench className="w-4 h-4" />
                  Maintenance & Repairs
                </label>
                <input
                  type="number"
                  value={maintenance}
                  onChange={(e) => setMaintenance(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Home className="w-4 h-4" />
                  Property Management
                </label>
                <input
                  type="number"
                  value={propertyManagement}
                  onChange={(e) => setPropertyManagement(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  CapEx Reserve
                </label>
                <input
                  type="number"
                  value={capex}
                  onChange={(e) => setCapex(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Monthly Expenses:</span>
                  <span className="text-lg font-bold text-orange-600">{formatCurrency(totalMonthlyExpenses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Breakdown Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Expense Breakdown</h3>
            </div>

            <div className="space-y-3">
              {expenseBreakdown.map((item, index) => {
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(item.value)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Monthly Payment:</span>
                <span className="text-xl font-bold text-red-600">{formatCurrency(totalMonthlyPayment)}</span>
              </div>
            </div>
          </div>

          {/* Investment Returns */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Investment Returns</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Monthly Net Operating Income:</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(monthlyNetOperatingIncome)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Monthly Debt Service:</span>
                <span className="text-lg font-bold text-red-600">-{formatCurrency(mortgagePayment)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4 border border-green-200">
                <span className="font-bold text-gray-900">Monthly Cash Flow:</span>
                <span className={`text-2xl font-bold ${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(monthlyCashFlow)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-xs text-gray-600 mb-1">Cap Rate</div>
                  <div className="text-2xl font-bold text-blue-600">{formatPercent(capRate)}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-xs text-gray-600 mb-1">Gross Yield</div>
                  <div className="text-2xl font-bold text-purple-600">{formatPercent(grossYield)}</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300 mt-4">
                <div className="text-sm text-gray-700 mb-2">Cash-on-Cash Return (Annual)</div>
                <div className={`text-3xl font-bold ${cashOnCashReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(cashOnCashReturn)}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  Annual cash flow: {formatCurrency(annualCashFlow)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Investment Analysis Disclaimer</p>
            <p className="text-blue-800">
              These calculations are estimates based on your inputs. Actual returns may vary. Always conduct thorough due diligence
              and consult with financial and real estate professionals before making investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentCalculator;