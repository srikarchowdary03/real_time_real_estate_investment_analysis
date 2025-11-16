/**
 * Test file for Investment Calculations
 * 
 * Run this to verify calculations match Excel formulas
 * 
 * Usage: node testInvestmentCalculations.js
 */

import { calculateQuickScore, RentalPropertyCalculator } from './investmentCalculations.js';

// ============================================================================
// TEST DATA - Based on 115 Salem St, Lowell Excel file
// ============================================================================

const testProperty = {
  address: '115 Salem St, Lowell, MA',
  price: 1800000,
  rent: 11500, // Combined rent from 7 units
  bedrooms: 7,
  bathrooms: 5,
  sqft: 6000,
};

const testInputs = {
  // Purchase
  purchasePrice: 1800000,
  closingCosts: 54000,      // 3% of purchase price
  rehabCosts: 0,

  // Financing
  downPaymentPercent: 20,   // 20% down
  interestRate: 7.0,        // 7% interest rate
  loanTerm: 30,             // 30 years

  // Income
  monthlyRent: 11500,       // (1500×7 + 2000) from Excel
  otherMonthlyIncome: 0,

  // Operating Expenses
  propertyTaxAnnual: 19800,  // $1,650/month from Excel
  insuranceAnnual: 7200,     // $600/month from Excel
  hoaMonthly: 0,
  utilitiesMonthly: 0,       // Tenant-paid

  // Expense Rates
  vacancyRate: 5,            // 5%
  managementRate: 10,        // 10%
  repairsRate: 5,            // 5%
  capExRate: 5,              // 5%

  // Growth
  appreciationRate: 3,
  rentGrowthRate: 2,
  expenseGrowthRate: 2,
};

// Zillow API mock data
const mockZillowData = {
  rent: 11500,
  taxData: {
    annualAmount: 19800,
    available: true
  },
  insurance: {
    annual: 7200,
    available: true
  },
  marketData: {
    vacancyRate: 0.05,
  },
  hoaFee: 0,
};

const mockRates = {
  rate30yr: 7.0
};

// ============================================================================
// TEST 1: Quick Score Calculation
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TEST 1: QUICK SCORE CALCULATION');
console.log('='.repeat(80));

const quickScore = calculateQuickScore(
  testProperty.price,
  mockZillowData,
  mockRates
);

console.log('\n📊 Quick Score Results:');
console.log('─'.repeat(80));
console.log(`Score: ${quickScore.score.toUpperCase()}`);
console.log(`Reason: ${quickScore.scoreReason}`);
console.log(`\nMonthly Cash Flow: $${quickScore.monthlyCashFlow.toLocaleString()}`);
console.log(`Annual Cash Flow: $${quickScore.annualCashFlow.toLocaleString()}`);
console.log(`Cap Rate: ${quickScore.capRate}%`);
console.log(`Cash-on-Cash Return: ${quickScore.cocReturn}%`);
console.log(`1% Rule: ${quickScore.passesOnePercent ? '✅ PASS' : '❌ FAIL'} (Need $${quickScore.onePercentTarget.toLocaleString()}, Have $${quickScore.monthlyRent.toLocaleString()})`);

console.log('\n📈 Breakdown:');
console.log(`Monthly Rent: $${quickScore.monthlyRent.toLocaleString()}`);
console.log(`Monthly Expenses: $${quickScore.monthlyExpenses.toLocaleString()}`);
console.log(`Monthly Mortgage: $${quickScore.monthlyMortgage.toLocaleString()}`);

console.log('\n🔍 Data Sources:');
Object.entries(quickScore.dataSource).forEach(([key, value]) => {
  console.log(`${key}: ${value ? '✅ From API' : '❌ Estimated'}`);
});

// ============================================================================
// TEST 2: Full Calculator Analysis
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TEST 2: FULL CALCULATOR ANALYSIS');
console.log('='.repeat(80));

const calculator = new RentalPropertyCalculator(testProperty, testInputs);
const fullAnalysis = calculator.getCompleteAnalysis();

console.log('\n💰 MORTGAGE');
console.log('─'.repeat(80));
console.log(`Down Payment: ${fullAnalysis.formatted.mortgage.downPayment} (${testInputs.downPaymentPercent}%)`);
console.log(`Loan Amount: ${fullAnalysis.formatted.mortgage.loanAmount}`);
console.log(`Monthly Payment: ${fullAnalysis.formatted.mortgage.monthlyPayment}`);
console.log(`Total Interest: ${fullAnalysis.formatted.mortgage.totalInterest}`);

console.log('\n📈 INCOME');
console.log('─'.repeat(80));
console.log(`Gross Monthly Income: ${fullAnalysis.formatted.income.monthlyGross}`);
console.log(`Vacancy Loss: $${Math.round(fullAnalysis.income.vacancyLoss).toLocaleString()} (${testInputs.vacancyRate}%)`);
console.log(`Effective Monthly Income: ${fullAnalysis.formatted.income.monthlyEffective}`);
console.log(`Annual Gross Income: ${fullAnalysis.formatted.income.annualGross}`);

console.log('\n💸 OPERATING EXPENSES');
console.log('─'.repeat(80));
console.log(`Property Tax: $${Math.round(fullAnalysis.expenses.propertyTaxMonthly).toLocaleString()}/mo ($${testInputs.propertyTaxAnnual.toLocaleString()}/yr)`);
console.log(`Insurance: $${Math.round(fullAnalysis.expenses.insuranceMonthly).toLocaleString()}/mo ($${testInputs.insuranceAnnual.toLocaleString()}/yr)`);
console.log(`Management: $${Math.round(fullAnalysis.expenses.managementMonthly).toLocaleString()}/mo (${testInputs.managementRate}%)`);
console.log(`Repairs: $${Math.round(fullAnalysis.expenses.repairsMonthly).toLocaleString()}/mo (${testInputs.repairsRate}%)`);
console.log(`CapEx: $${Math.round(fullAnalysis.expenses.capExMonthly).toLocaleString()}/mo (${testInputs.capExRate}%)`);
console.log(`HOA: $${Math.round(fullAnalysis.expenses.hoaMonthly).toLocaleString()}/mo`);
console.log(`Utilities: $${Math.round(fullAnalysis.expenses.utilitiesMonthly).toLocaleString()}/mo`);
console.log(`\nTotal Monthly: ${fullAnalysis.formatted.expenses.monthly}`);
console.log(`Total Annual: ${fullAnalysis.formatted.expenses.annual}`);

console.log('\n💵 CASH FLOW');
console.log('─'.repeat(80));
console.log(`Monthly NOI: ${fullAnalysis.formatted.cashFlow.monthlyNOI}`);
console.log(`Monthly Debt Service: $${Math.round(fullAnalysis.mortgage.monthlyPayment).toLocaleString()}`);
console.log(`Monthly Cash Flow: ${fullAnalysis.formatted.cashFlow.monthly}`);
console.log(`Annual Cash Flow: ${fullAnalysis.formatted.cashFlow.annual}`);

console.log('\n📊 INVESTMENT RETURNS');
console.log('─'.repeat(80));
console.log(`Total Cash Invested: $${fullAnalysis.returns.totalCashInvested.toLocaleString()}`);
console.log(`Cap Rate: ${fullAnalysis.formatted.returns.capRate}`);
console.log(`Cash-on-Cash Return: ${fullAnalysis.formatted.returns.cocReturn}`);
console.log(`Gross Rent Multiplier: ${fullAnalysis.formatted.returns.grm}`);
console.log(`Debt Coverage Ratio: ${fullAnalysis.formatted.returns.dcr}`);

console.log('\n✅ INVESTMENT RULES');
console.log('─'.repeat(80));
console.log(fullAnalysis.rules.onePercent.message);
console.log(fullAnalysis.rules.twoPercent.message);
console.log(fullAnalysis.rules.fiftyPercent.message);
console.log(fullAnalysis.rules.debtCoverage.message);

console.log('\n🎯 OVERALL SCORE');
console.log('─'.repeat(80));
console.log(`Rating: ${fullAnalysis.summary.overallScore.rating}`);
console.log(`Score: ${fullAnalysis.summary.overallScore.score}/${fullAnalysis.summary.overallScore.maxScore} (${Math.round(fullAnalysis.summary.overallScore.percentage)}%)`);

// ============================================================================
// TEST 3: Compare Different Scenarios
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TEST 3: SCENARIO COMPARISON');
console.log('='.repeat(80));

const scenarios = [
  {
    name: 'Base Case (20% down, 7% rate)',
    inputs: { ...testInputs },
  },
  {
    name: 'Lower Down Payment (10% down)',
    inputs: { ...testInputs, downPaymentPercent: 10 },
  },
  {
    name: 'Higher Interest Rate (8%)',
    inputs: { ...testInputs, interestRate: 8.0 },
  },
  {
    name: 'Higher Rent (+10%)',
    inputs: { ...testInputs, monthlyRent: 12650 },
  },
];

console.log('\n');
console.log('Scenario'.padEnd(40), 'Cash Flow'.padEnd(15), 'Cap Rate'.padEnd(12), 'CoC Return');
console.log('─'.repeat(80));

scenarios.forEach(scenario => {
  const calc = new RentalPropertyCalculator(testProperty, scenario.inputs);
  const analysis = calc.getCompleteAnalysis();
  
  console.log(
    scenario.name.padEnd(40),
    `$${analysis.cashFlow.monthlyCashFlow.toLocaleString()}`.padEnd(15),
    `${analysis.returns.capRate.toFixed(1)}%`.padEnd(12),
    `${analysis.returns.cocReturn.toFixed(1)}%`
  );
});

// ============================================================================
// TEST 4: Validation Against Excel
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TEST 4: EXCEL VALIDATION');
console.log('='.repeat(80));

// Expected values from Excel (115 Salem St, Lowell)
const expectedFromExcel = {
  monthlyMortgage: 9576,    // Approximate from 30-year loan
  monthlyCashFlow: 950,     // Approximate after expenses
  capRate: 6.5,             // Approximate
  cocReturn: 3.1,           // Approximate first year
};

console.log('\n⚖️  Comparing with Excel Values:');
console.log('─'.repeat(80));

const actualValues = {
  monthlyMortgage: Math.round(fullAnalysis.mortgage.monthlyPayment),
  monthlyCashFlow: Math.round(fullAnalysis.cashFlow.monthlyCashFlow),
  capRate: Math.round(fullAnalysis.returns.capRate * 10) / 10,
  cocReturn: Math.round(fullAnalysis.returns.cocReturn * 10) / 10,
};

Object.entries(expectedFromExcel).forEach(([key, expected]) => {
  const actual = actualValues[key];
  const difference = actual - expected;
  const percentDiff = Math.abs((difference / expected) * 100);
  const status = percentDiff < 5 ? '✅' : (percentDiff < 10 ? '⚠️' : '❌');
  
  console.log(`${status} ${key}:`);
  console.log(`   Expected: ${typeof expected === 'number' ? '$' + expected.toLocaleString() : expected}`);
  console.log(`   Actual:   ${typeof actual === 'number' ? '$' + actual.toLocaleString() : actual}`);
  console.log(`   Diff:     ${difference > 0 ? '+' : ''}${typeof difference === 'number' ? '$' + difference.toLocaleString() : difference} (${percentDiff.toFixed(1)}%)`);
  console.log('');
});

console.log('\n' + '='.repeat(80));
console.log('✅ ALL TESTS COMPLETE');
console.log('='.repeat(80));
console.log('\nNext Steps:');
console.log('1. Move investmentCalculations.js to src/utils/');
console.log('2. Integrate with PropertyCard component for quick scores');
console.log('3. Create full Calculator page using RentalPropertyCalculator');
console.log('4. Test with real API data from Zillow');
console.log('5. Add user input forms for custom calculations');