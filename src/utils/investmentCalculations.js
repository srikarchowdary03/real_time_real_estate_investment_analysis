/**
 * Investment Calculation Engine
 * Calculates all real estate investment metrics matching Excel formulas
 * 
 * Data Priority:
 * 1. API Data (Zillow, Mortgage APIs)
 * 2. Formulas (when API data unavailable)
 * 3. Industry Standards (always used)
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Estimate annual property insurance
 * Formula: $1,200 base + ($3.50 per $1,000 of property value)
 */
function estimateInsurance(purchasePrice) {
  return 1200 + (purchasePrice / 1000) * 3.5;
}

/**
 * Estimate annual property tax
 * Formula: 1.1% of purchase price (national average)
 */
function estimatePropertyTax(purchasePrice) {
  return purchasePrice * 0.011;
}

/**
 * Calculate monthly mortgage payment (Principal + Interest)
 * Formula: P * [r(1+r)^n] / [(1+r)^n - 1]
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (e.g., 7.0 for 7%)
 * @param {number} years - Loan term in years
 */
function calculateMortgagePayment(principal, annualRate, years) {
  if (principal <= 0) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;
  
  if (monthlyRate === 0) return principal / numberOfPayments;
  
  const payment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  return payment;
}

/**
 * Format currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

// ============================================================================
// QUICK SCORE CALCULATION (For Property Cards)
// ============================================================================

/**
 * Calculate quick investment score for property cards
 * Uses API data when available, estimates when not
 * 
 * @param {number} purchasePrice - Property purchase price
 * @param {Object} zillowData - Data from Zillow API (optional)
 * @param {number} zillowData.rent - Monthly rent estimate
 * @param {Object} zillowData.taxData - Property tax data
 * @param {Object} zillowData.insurance - Insurance data
 * @param {Object} zillowData.marketData - Market data (vacancy rate)
 * @param {number} zillowData.hoaFee - HOA fee
 * @param {Object} currentRates - Current mortgage rates (optional)
 * @param {number} currentRates.rate30yr - 30-year fixed rate
 * 
 * @returns {Object} Quick score and metrics
 */
export function calculateQuickScore(
  purchasePrice,
  zillowData = {},
  currentRates = null
) {
  // Get rent (required for quick score)
  const monthlyRent = zillowData.rent || 0;
  
  if (!monthlyRent) {
    return {
      score: 'unknown',
      monthlyCashFlow: 0,
      capRate: 0,
      passesOnePercent: false,
      message: 'Rent data unavailable',
      dataSource: {}
    };
  }

  // 🥇 FIRST: Use API Data
  // 🥈 SECOND: Use Formulas
  // 🥉 THIRD: Industry Standards
  const assumptions = {
    // From APIs or formulas
    interestRate: currentRates?.rate30yr || 7.0,
    annualPropertyTax: zillowData.taxData?.annualAmount || estimatePropertyTax(purchasePrice),
    annualInsurance: zillowData.insurance?.annual || estimateInsurance(purchasePrice),
    vacancyRate: zillowData.marketData?.vacancyRate || 0.05,
    hoaFee: zillowData.hoaFee || 0,
    
    // Industry Standards
    downPayment: 0.20,        // 20% down
    loanTerm: 30,             // 30 years
    managementRate: 0.10,     // 10% of rent
    repairRate: 0.05,         // 5% of rent
    capExRate: 0.05,          // 5% of rent (capital expenditures)
  };

  // Calculate loan details
  const downPaymentAmount = purchasePrice * assumptions.downPayment;
  const loanAmount = purchasePrice - downPaymentAmount;
  const monthlyMortgage = calculateMortgagePayment(
    loanAmount,
    assumptions.interestRate,
    assumptions.loanTerm
  );

  // Calculate monthly expenses using 50% rule for quick estimate
  const monthlyPropertyTax = assumptions.annualPropertyTax / 12;
  const monthlyInsurance = assumptions.annualInsurance / 12;
  const monthlyVacancy = monthlyRent * assumptions.vacancyRate;
  const monthlyManagement = monthlyRent * assumptions.managementRate;
  const monthlyRepairs = monthlyRent * assumptions.repairRate;
  const monthlyCapEx = monthlyRent * assumptions.capExRate;
  const monthlyHOA = assumptions.hoaFee;

  const totalMonthlyExpenses = 
    monthlyPropertyTax +
    monthlyInsurance +
    monthlyVacancy +
    monthlyManagement +
    monthlyRepairs +
    monthlyCapEx +
    monthlyHOA;

  // Calculate cash flow
  const monthlyCashFlow = monthlyRent - totalMonthlyExpenses - monthlyMortgage;
  
  // Calculate Net Operating Income (NOI)
  const monthlyNOI = monthlyRent - totalMonthlyExpenses;
  const annualNOI = monthlyNOI * 12;
  
  // Calculate Cap Rate
  const capRate = (annualNOI / purchasePrice) * 100;

  // Calculate Cash on Cash Return
  const annualCashFlow = monthlyCashFlow * 12;
  const cashInvested = downPaymentAmount;
  const cocReturn = (annualCashFlow / cashInvested) * 100;

  // Check 1% Rule: Monthly rent should be at least 1% of purchase price
  const onePercentTarget = purchasePrice * 0.01;
  const passesOnePercent = monthlyRent >= onePercentTarget;

  // Determine score based on metrics
  let score = 'poor';
  let scoreReason = [];

  if (passesOnePercent) scoreReason.push('Passes 1% rule');
  if (monthlyCashFlow > 200) scoreReason.push('Positive cash flow');
  if (capRate > 8) scoreReason.push('High cap rate');
  if (cocReturn > 8) scoreReason.push('Good CoC return');

  if (passesOnePercent && monthlyCashFlow > 200 && capRate > 8) {
    score = 'good';
  } else if (monthlyCashFlow > 0 && capRate > 5) {
    score = 'okay';
  } else {
    scoreReason = ['Low returns', 'May not cash flow'];
  }

  return {
    score,
    scoreReason: scoreReason.join(', '),
    monthlyCashFlow: Math.round(monthlyCashFlow),
    annualCashFlow: Math.round(annualCashFlow),
    capRate: Math.round(capRate * 10) / 10,
    cocReturn: Math.round(cocReturn * 10) / 10,
    passesOnePercent,
    onePercentTarget: Math.round(onePercentTarget),
    
    // Breakdown
    monthlyRent,
    monthlyExpenses: Math.round(totalMonthlyExpenses),
    monthlyMortgage: Math.round(monthlyMortgage),
    
    // Data sources (for transparency)
    dataSource: {
      rentFromAPI: !!zillowData.rent,
      taxFromAPI: !!zillowData.taxData?.annualAmount,
      insuranceFromAPI: !!zillowData.insurance?.annual,
      rateFromAPI: !!currentRates,
      vacancyFromAPI: !!zillowData.marketData?.vacancyRate,
      hoaFromAPI: !!zillowData.hoaFee
    }
  };
}

// ============================================================================
// FULL RENTAL PROPERTY CALCULATOR CLASS
// ============================================================================

/**
 * Complete rental property investment calculator
 * Implements all formulas from Excel spreadsheet
 */
export class RentalPropertyCalculator {
  constructor(propertyData, userInputs = {}) {
    this.property = propertyData;
    this.inputs = {
      // Purchase details
      purchasePrice: userInputs.purchasePrice || propertyData.price,
      closingCosts: userInputs.closingCosts || 0,
      rehabCosts: userInputs.rehabCosts || 0,
      
      // Financing
      downPaymentPercent: userInputs.downPaymentPercent || 20,
      interestRate: userInputs.interestRate || 7.0,
      loanTerm: userInputs.loanTerm || 30,
      
      // Income
      monthlyRent: userInputs.monthlyRent || propertyData.rent || 0,
      otherMonthlyIncome: userInputs.otherMonthlyIncome || 0,
      
      // Operating Expenses
      propertyTaxAnnual: userInputs.propertyTaxAnnual || estimatePropertyTax(propertyData.price),
      insuranceAnnual: userInputs.insuranceAnnual || estimateInsurance(propertyData.price),
      hoaMonthly: userInputs.hoaMonthly || 0,
      utilitiesMonthly: userInputs.utilitiesMonthly || 0,
      
      // Operating Expense Rates (as % of rent)
      vacancyRate: userInputs.vacancyRate || 5,
      managementRate: userInputs.managementRate || 10,
      repairsRate: userInputs.repairsRate || 5,
      capExRate: userInputs.capExRate || 5,
      
      // Appreciation/Growth
      appreciationRate: userInputs.appreciationRate || 3,
      rentGrowthRate: userInputs.rentGrowthRate || 2,
      expenseGrowthRate: userInputs.expenseGrowthRate || 2,
    };
  }

  // ==========================================================================
  // MORTGAGE CALCULATIONS
  // ==========================================================================

  calculateMortgage() {
    const { purchasePrice, downPaymentPercent, interestRate, loanTerm } = this.inputs;
    
    const downPaymentAmount = (purchasePrice * downPaymentPercent) / 100;
    const loanAmount = purchasePrice - downPaymentAmount;
    const monthlyPayment = calculateMortgagePayment(loanAmount, interestRate, loanTerm);
    
    // Calculate first month's interest and principal
    const monthlyInterestRate = interestRate / 100 / 12;
    const firstMonthInterest = loanAmount * monthlyInterestRate;
    const firstMonthPrincipal = monthlyPayment - firstMonthInterest;

    return {
      loanAmount,
      downPaymentAmount,
      monthlyPayment,
      annualPayment: monthlyPayment * 12,
      totalPayments: monthlyPayment * loanTerm * 12,
      totalInterest: (monthlyPayment * loanTerm * 12) - loanAmount,
      firstMonthInterest,
      firstMonthPrincipal,
    };
  }

  // ==========================================================================
  // INCOME CALCULATIONS
  // ==========================================================================

  calculateIncome() {
    const { monthlyRent, otherMonthlyIncome, vacancyRate } = this.inputs;
    
    const grossMonthlyIncome = monthlyRent + otherMonthlyIncome;
    const vacancyLoss = grossMonthlyIncome * (vacancyRate / 100);
    const effectiveMonthlyIncome = grossMonthlyIncome - vacancyLoss;

    return {
      grossMonthlyIncome,
      grossAnnualIncome: grossMonthlyIncome * 12,
      vacancyLoss,
      effectiveMonthlyIncome,
      effectiveAnnualIncome: effectiveMonthlyIncome * 12,
    };
  }

  // ==========================================================================
  // EXPENSE CALCULATIONS
  // ==========================================================================

  calculateExpenses() {
    const { 
      monthlyRent,
      propertyTaxAnnual,
      insuranceAnnual,
      hoaMonthly,
      utilitiesMonthly,
      managementRate,
      repairsRate,
      capExRate,
    } = this.inputs;

    // Fixed expenses
    const propertyTaxMonthly = propertyTaxAnnual / 12;
    const insuranceMonthly = insuranceAnnual / 12;

    // Variable expenses (% of rent)
    const managementMonthly = monthlyRent * (managementRate / 100);
    const repairsMonthly = monthlyRent * (repairsRate / 100);
    const capExMonthly = monthlyRent * (capExRate / 100);

    const totalMonthlyExpenses = 
      propertyTaxMonthly +
      insuranceMonthly +
      hoaMonthly +
      utilitiesMonthly +
      managementMonthly +
      repairsMonthly +
      capExMonthly;

    return {
      propertyTaxMonthly,
      insuranceMonthly,
      hoaMonthly,
      utilitiesMonthly,
      managementMonthly,
      repairsMonthly,
      capExMonthly,
      totalMonthlyExpenses,
      totalAnnualExpenses: totalMonthlyExpenses * 12,
      
      // Breakdown by category
      breakdown: {
        propertyTax: propertyTaxMonthly,
        insurance: insuranceMonthly,
        hoa: hoaMonthly,
        utilities: utilitiesMonthly,
        management: managementMonthly,
        repairs: repairsMonthly,
        capEx: capExMonthly,
      }
    };
  }

  // ==========================================================================
  // CASH FLOW CALCULATIONS
  // ==========================================================================

  calculateCashFlow() {
    const income = this.calculateIncome();
    const expenses = this.calculateExpenses();
    const mortgage = this.calculateMortgage();

    // Net Operating Income (before debt service)
    const monthlyNOI = income.effectiveMonthlyIncome - expenses.totalMonthlyExpenses;
    const annualNOI = monthlyNOI * 12;

    // Cash Flow (after debt service)
    const monthlyCashFlow = monthlyNOI - mortgage.monthlyPayment;
    const annualCashFlow = monthlyCashFlow * 12;

    return {
      monthlyNOI,
      annualNOI,
      monthlyCashFlow,
      annualCashFlow,
      
      // Detailed breakdown
      income: income.effectiveMonthlyIncome,
      expenses: expenses.totalMonthlyExpenses,
      debtService: mortgage.monthlyPayment,
    };
  }

  // ==========================================================================
  // RETURN CALCULATIONS
  // ==========================================================================

  calculateReturns() {
    const { purchasePrice, closingCosts, rehabCosts } = this.inputs;
    const cashFlow = this.calculateCashFlow();
    const mortgage = this.calculateMortgage();
    const income = this.calculateIncome();
    const expenses = this.calculateExpenses();

    // Total cash invested
    const totalCashInvested = 
      mortgage.downPaymentAmount + 
      closingCosts + 
      rehabCosts;

    // Cap Rate = Annual NOI / Purchase Price
    const capRate = (cashFlow.annualNOI / purchasePrice) * 100;

    // Cash on Cash Return = Annual Cash Flow / Total Cash Invested
    const cocReturn = (cashFlow.annualCashFlow / totalCashInvested) * 100;

    // Gross Rent Multiplier = Purchase Price / Gross Annual Income
    const grm = purchasePrice / income.grossAnnualIncome;

    // Debt Coverage Ratio = NOI / Annual Debt Service
    const dcr = cashFlow.annualNOI / mortgage.annualPayment;

    // Total ROI (first year)
    const totalROI = (cashFlow.annualCashFlow / totalCashInvested) * 100;

    return {
      capRate,
      cocReturn,
      grm,
      dcr,
      totalROI,
      totalCashInvested,
      
      // Additional metrics
      monthlyROI: (cashFlow.monthlyCashFlow / totalCashInvested) * 100,
      breakEvenRatio: (expenses.totalAnnualExpenses + mortgage.annualPayment) / income.grossAnnualIncome,
    };
  }

  // ==========================================================================
  // INVESTMENT RULE CHECKS
  // ==========================================================================

  check1PercentRule() {
    const { purchasePrice, monthlyRent } = this.inputs;
    const target = purchasePrice * 0.01;
    const passes = monthlyRent >= target;

    return {
      passes,
      actualRent: monthlyRent,
      targetRent: target,
      percentage: (monthlyRent / purchasePrice) * 100,
      message: passes 
        ? `✅ Passes 1% rule (${formatCurrency(monthlyRent)} ≥ ${formatCurrency(target)})`
        : `❌ Fails 1% rule (${formatCurrency(monthlyRent)} < ${formatCurrency(target)})`
    };
  }

  check50PercentRule() {
    const income = this.calculateIncome();
    const expenses = this.calculateExpenses();
    
    const expenseRatio = (expenses.totalMonthlyExpenses / income.grossMonthlyIncome) * 100;
    const passes = expenseRatio <= 50;

    return {
      passes,
      expenseRatio,
      expectedExpenses: income.grossMonthlyIncome * 0.50,
      actualExpenses: expenses.totalMonthlyExpenses,
      message: passes
        ? `✅ Expenses are ${expenseRatio.toFixed(1)}% of income (≤ 50%)`
        : `⚠️ Expenses are ${expenseRatio.toFixed(1)}% of income (> 50%)`
    };
  }

  check2PercentRule() {
    // Monthly rent should be at least 2% of purchase price (stricter than 1%)
    const { purchasePrice, monthlyRent } = this.inputs;
    const target = purchasePrice * 0.02;
    const passes = monthlyRent >= target;

    return {
      passes,
      actualRent: monthlyRent,
      targetRent: target,
      percentage: (monthlyRent / purchasePrice) * 100,
      message: passes 
        ? `✅ Passes 2% rule (${formatCurrency(monthlyRent)} ≥ ${formatCurrency(target)})`
        : `❌ Fails 2% rule (${formatCurrency(monthlyRent)} < ${formatCurrency(target)})`
    };
  }

  checkDebtCoverageRatio() {
    const returns = this.calculateReturns();
    const passes = returns.dcr >= 1.25; // Lenders typically want 1.25+

    return {
      passes,
      dcr: returns.dcr,
      message: passes
        ? `✅ Strong debt coverage (${returns.dcr.toFixed(2)}x, ≥ 1.25x recommended)`
        : `⚠️ Weak debt coverage (${returns.dcr.toFixed(2)}x, < 1.25x recommended)`
    };
  }

  // ==========================================================================
  // COMPLETE ANALYSIS
  // ==========================================================================

  getCompleteAnalysis() {
    const mortgage = this.calculateMortgage();
    const income = this.calculateIncome();
    const expenses = this.calculateExpenses();
    const cashFlow = this.calculateCashFlow();
    const returns = this.calculateReturns();
    const rules = {
      onePercent: this.check1PercentRule(),
      twoPercent: this.check2PercentRule(),
      fiftyPercent: this.check50PercentRule(),
      debtCoverage: this.checkDebtCoverageRatio(),
    };

    return {
      property: this.property,
      inputs: this.inputs,
      mortgage,
      income,
      expenses,
      cashFlow,
      returns,
      rules,
      
      // Summary
      summary: {
        totalInvestment: returns.totalCashInvested,
        monthlyIncome: income.effectiveMonthlyIncome,
        monthlyExpenses: expenses.totalMonthlyExpenses,
        monthlyCashFlow: cashFlow.monthlyCashFlow,
        annualCashFlow: cashFlow.annualCashFlow,
        capRate: returns.capRate,
        cocReturn: returns.cocReturn,
        
        // Overall score
        overallScore: this.calculateOverallScore(returns, rules),
      },
      
      // Formatted for display
      formatted: this.formatAnalysis(mortgage, income, expenses, cashFlow, returns, rules),
    };
  }

  // ==========================================================================
  // SCORING & FORMATTING
  // ==========================================================================

  calculateOverallScore(returns, rules) {
    let score = 0;
    let maxScore = 0;

    // Cap Rate scoring (0-3 points)
    maxScore += 3;
    if (returns.capRate >= 10) score += 3;
    else if (returns.capRate >= 8) score += 2;
    else if (returns.capRate >= 6) score += 1;

    // Cash on Cash scoring (0-3 points)
    maxScore += 3;
    if (returns.cocReturn >= 12) score += 3;
    else if (returns.cocReturn >= 8) score += 2;
    else if (returns.cocReturn >= 5) score += 1;

    // 1% Rule (0-2 points)
    maxScore += 2;
    if (rules.onePercent.passes) score += 2;

    // Debt Coverage (0-2 points)
    maxScore += 2;
    if (rules.debtCoverage.passes) score += 2;

    const percentage = (score / maxScore) * 100;

    let rating = 'Poor';
    if (percentage >= 80) rating = 'Excellent';
    else if (percentage >= 60) rating = 'Good';
    else if (percentage >= 40) rating = 'Fair';

    return {
      score,
      maxScore,
      percentage,
      rating,
    };
  }

  formatAnalysis(mortgage, income, expenses, cashFlow, returns, rules) {
    return {
      mortgage: {
        downPayment: formatCurrency(mortgage.downPaymentAmount),
        loanAmount: formatCurrency(mortgage.loanAmount),
        monthlyPayment: formatCurrency(mortgage.monthlyPayment),
        totalInterest: formatCurrency(mortgage.totalInterest),
      },
      income: {
        monthlyGross: formatCurrency(income.grossMonthlyIncome),
        monthlyEffective: formatCurrency(income.effectiveMonthlyIncome),
        annualGross: formatCurrency(income.grossAnnualIncome),
      },
      expenses: {
        monthly: formatCurrency(expenses.totalMonthlyExpenses),
        annual: formatCurrency(expenses.totalAnnualExpenses),
      },
      cashFlow: {
        monthlyNOI: formatCurrency(cashFlow.monthlyNOI),
        monthly: formatCurrency(cashFlow.monthlyCashFlow),
        annual: formatCurrency(cashFlow.annualCashFlow),
      },
      returns: {
        capRate: formatPercentage(returns.capRate),
        cocReturn: formatPercentage(returns.cocReturn),
        grm: returns.grm.toFixed(2),
        dcr: returns.dcr.toFixed(2),
      }
    };
  }
}

// ============================================================================
// All exports are done inline above (export function, export class)
// ============================================================================