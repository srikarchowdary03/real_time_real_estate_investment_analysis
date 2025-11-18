/**
 * Investment Calculation Engine - Complete Version
 * Based on Excel "Buy-Rent-Hold" spreadsheet formulas
 * 
 * Includes:
 * 1. Quick Score Calculation (for property cards)
 * 2. Full Rental Property Calculator (for detailed analysis)
 */

// ============================================================================
// INDUSTRY STANDARDS & ASSUMPTIONS
// ============================================================================

const INDUSTRY_STANDARDS = {
  downPaymentPercent: 20,
  loanTermYears: 30,
  defaultInterestRate: 7.0,
  
  vacancyRate: 5,
  managementRate: 10,
  repairsRate: 5,
  capExRate: 5,
  
  insuranceBase: 1200,
  insurancePerThousand: 3.5,
  propertyTaxRate: 1.1,
  
  appreciationRate: 3,
  incomeGrowthRate: 2,
  expenseGrowthRate: 2,
  sellingCosts: 6,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

function estimateInsurance(purchasePrice) {
  return INDUSTRY_STANDARDS.insuranceBase + 
         (purchasePrice / 1000) * INDUSTRY_STANDARDS.insurancePerThousand;
}

function estimatePropertyTax(purchasePrice) {
  return purchasePrice * (INDUSTRY_STANDARDS.propertyTaxRate / 100);
}

// ============================================================================
// RENTAL PROPERTY CALCULATOR CLASS
// ============================================================================

export class RentalPropertyCalculator {
  constructor(property, inputs) {
    this.property = property;
    this.inputs = inputs;
    
    // Initialize all calculations
    this.calculatePurchase();
    this.calculateFinancing();
    this.calculateIncome();
    this.calculateExpenses();
    this.calculateCashFlow();
    this.calculateReturns();
    this.calculateProjections();
  }

  // ========================================================================
  // PURCHASE CALCULATIONS
  // ========================================================================
  
  calculatePurchase() {
    const purchasePrice = this.inputs.purchasePrice || 0;
    const downPaymentPercent = this.inputs.downPayment || 20;
    const closingCostsPercent = this.inputs.closingCosts || 3;
    const repairCosts = this.inputs.repairCosts || 0;
    
    this.purchase = {
      price: purchasePrice,
      downPayment: purchasePrice * (downPaymentPercent / 100),
      downPaymentPercent: downPaymentPercent,
      closingCosts: purchasePrice * (closingCostsPercent / 100),
      repairCosts: repairCosts,
      totalCashNeeded: 0
    };
    
    this.purchase.totalCashNeeded = 
      this.purchase.downPayment + 
      this.purchase.closingCosts + 
      this.purchase.repairCosts;
  }

  // ========================================================================
  // FINANCING CALCULATIONS
  // ========================================================================
  
  calculateFinancing() {
    const loanAmount = this.purchase.price - this.purchase.downPayment;
    const interestRate = this.inputs.loanInterestRate || 7.0;
    const loanTerm = this.inputs.loanTerm || 30;
    
    const monthlyPayment = calculateMortgagePayment(loanAmount, interestRate, loanTerm);
    const totalPayments = monthlyPayment * loanTerm * 12;
    const totalInterest = totalPayments - loanAmount;
    
    this.financing = {
      loanAmount: loanAmount,
      interestRate: interestRate,
      loanTerm: loanTerm,
      monthlyPayment: monthlyPayment,
      annualPayment: monthlyPayment * 12,
      totalPayments: totalPayments,
      totalInterest: totalInterest
    };
  }

  // ========================================================================
  // INCOME CALCULATIONS
  // ========================================================================
  
  calculateIncome() {
    const monthlyRent = this.inputs.monthlyRent || 0;
    const otherIncome = (this.inputs.otherMonthlyIncome || 0) +
                        (this.inputs.laundryIncome || 0) +
                        (this.inputs.storageIncome || 0) +
                        (this.inputs.parkingIncome || 0);
    
    const vacancyRate = this.inputs.vacancyRate || 5;
    
    const grossMonthlyIncome = monthlyRent + otherIncome;
    const grossAnnualIncome = grossMonthlyIncome * 12;
    
    const vacancyLoss = grossMonthlyIncome * (vacancyRate / 100);
    const effectiveMonthlyIncome = grossMonthlyIncome - vacancyLoss;
    const effectiveAnnualIncome = effectiveMonthlyIncome * 12;
    
    this.income = {
      monthlyRent: monthlyRent,
      otherIncome: otherIncome,
      grossMonthlyIncome: grossMonthlyIncome,
      grossAnnualIncome: grossAnnualIncome,
      vacancyRate: vacancyRate,
      vacancyLoss: vacancyLoss,
      effectiveMonthlyIncome: effectiveMonthlyIncome,
      effectiveAnnualIncome: effectiveAnnualIncome
    };
  }

  // ========================================================================
  // EXPENSE CALCULATIONS
  // ========================================================================
  
  calculateExpenses() {
    // Fixed expenses
    const monthlyPropertyTax = (this.inputs.propertyTaxes || 0) / 12;
    const monthlyInsurance = (this.inputs.totalInsurance || 1200) / 12;
    const monthlyHOA = this.inputs.hoaFees || 0;
    
    // Utilities
    const monthlyUtilities = 
      (this.inputs.utilities || 0) +
      (this.inputs.garbage || 0) +
      (this.inputs.waterSewer || 0) +
      (this.inputs.electricity || 0) +
      (this.inputs.gas || 0);
    
    // Maintenance
    const monthlyMaintenance = 
      (this.inputs.landscaping || 0) +
      (this.inputs.snowRemoval || 0);
    
    // Variable expenses (as % of income)
    const monthlyRent = this.income.monthlyRent;
    const managementRate = this.inputs.managementRate || 0;
    const repairRate = this.inputs.repairRate || 5;
    const capexRate = this.inputs.capExRate || 5;
    
    const monthlyManagement = this.inputs.management || (monthlyRent * (managementRate / 100));
    const monthlyRepairs = this.inputs.repairs || (monthlyRent * (repairRate / 100));
    const monthlyCapEx = this.inputs.capex || (monthlyRent * (capexRate / 100));
    
    // Professional fees
    const monthlyLegal = (this.inputs.legal || 0) / 12;
    const monthlyAccounting = (this.inputs.accounting || 0) / 12;
    
    const totalMonthlyExpenses = 
      monthlyPropertyTax +
      monthlyInsurance +
      monthlyHOA +
      monthlyUtilities +
      monthlyMaintenance +
      monthlyManagement +
      monthlyRepairs +
      monthlyCapEx +
      monthlyLegal +
      monthlyAccounting;
    
    this.expenses = {
      propertyTax: monthlyPropertyTax,
      insurance: monthlyInsurance,
      hoa: monthlyHOA,
      utilities: monthlyUtilities,
      maintenance: monthlyMaintenance,
      management: monthlyManagement,
      repairs: monthlyRepairs,
      capex: monthlyCapEx,
      legal: monthlyLegal,
      accounting: monthlyAccounting,
      totalMonthly: totalMonthlyExpenses,
      totalAnnual: totalMonthlyExpenses * 12,
      
      // Breakdown for display
      breakdown: {
        fixed: monthlyPropertyTax + monthlyInsurance + monthlyHOA,
        utilities: monthlyUtilities,
        maintenance: monthlyMaintenance + monthlyRepairs,
        management: monthlyManagement,
        reserves: monthlyCapEx,
        professional: monthlyLegal + monthlyAccounting
      }
    };
  }

  // ========================================================================
  // CASH FLOW CALCULATIONS
  // ========================================================================
  
  calculateCashFlow() {
    // Net Operating Income (NOI)
    const monthlyNOI = this.income.effectiveMonthlyIncome - this.expenses.totalMonthly;
    const annualNOI = monthlyNOI * 12;
    
    // Cash Flow (after debt service)
    const monthlyCashFlow = monthlyNOI - this.financing.monthlyPayment;
    const annualCashFlow = monthlyCashFlow * 12;
    
    this.cashFlow = {
      monthlyNOI: monthlyNOI,
      annualNOI: annualNOI,
      monthlyCashFlow: monthlyCashFlow,
      annualCashFlow: annualCashFlow,
      
      // Break-even analysis
      breakEvenOccupancy: this.calculateBreakEvenOccupancy(),
      operatingExpenseRatio: (this.expenses.totalMonthly / this.income.grossMonthlyIncome) * 100
    };
  }

  calculateBreakEvenOccupancy() {
    const totalMonthlyExpenses = this.expenses.totalMonthly + this.financing.monthlyPayment;
    const grossMonthlyIncome = this.income.grossMonthlyIncome;
    
    if (grossMonthlyIncome === 0) return 100;
    
    return (totalMonthlyExpenses / grossMonthlyIncome) * 100;
  }

  // ========================================================================
  // RETURN METRICS
  // ========================================================================
  
  calculateReturns() {
    const purchasePrice = this.purchase.price;
    const totalCashInvested = this.purchase.totalCashNeeded;
    const annualNOI = this.cashFlow.annualNOI;
    const annualCashFlow = this.cashFlow.annualCashFlow;
    
    // Cap Rate
    const capRate = purchasePrice > 0 ? (annualNOI / purchasePrice) * 100 : 0;
    
    // Cash on Cash Return
    const cocReturn = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
    
    // Gross Rent Multiplier
    const grm = this.income.grossAnnualIncome > 0 ? purchasePrice / this.income.grossAnnualIncome : 0;
    
    // Debt Coverage Ratio
    const dcr = this.financing.annualPayment > 0 ? annualNOI / this.financing.annualPayment : 0;
    
    // 1% Rule
    const onePercentTarget = purchasePrice * 0.01;
    const passesOnePercent = this.income.monthlyRent >= onePercentTarget;
    
    // 50% Rule (expenses should be ~50% of income)
    const expenseRatio = (this.expenses.totalMonthly / this.income.grossMonthlyIncome) * 100;
    const passesFiftyPercent = expenseRatio <= 50;
    
    // Total ROI (including appreciation)
    const appreciationRate = this.inputs.appreciationRate || 3;
    const annualAppreciation = purchasePrice * (appreciationRate / 100);
    const totalAnnualReturn = annualCashFlow + annualAppreciation;
    const totalROI = totalCashInvested > 0 ? (totalAnnualReturn / totalCashInvested) * 100 : 0;
    
    this.returns = {
      capRate: capRate,
      cocReturn: cocReturn,
      grm: grm,
      dcr: dcr,
      totalROI: totalROI,
      
      // Investment rules
      onePercentRule: {
        passes: passesOnePercent,
        target: onePercentTarget,
        actual: this.income.monthlyRent,
        ratio: (this.income.monthlyRent / purchasePrice) * 100
      },
      
      fiftyPercentRule: {
        passes: passesFiftyPercent,
        expenseRatio: expenseRatio
      },
      
      // Additional metrics
      annualAppreciation: annualAppreciation,
      totalAnnualReturn: totalAnnualReturn
    };
  }

  // ========================================================================
  // PROJECTIONS (5-year and 10-year)
  // ========================================================================
  
  calculateProjections() {
    const years = [1, 5, 10, 15, 20, 25, 30];
    const appreciationRate = this.inputs.appreciationRate || 3;
    const incomeGrowthRate = this.inputs.incomeGrowthRate || 2;
    const expenseGrowthRate = this.inputs.expenseGrowthRate || 2;
    
    this.projections = years.map(year => {
      const propertyValue = this.purchase.price * Math.pow(1 + appreciationRate / 100, year);
      const annualIncome = this.income.effectiveAnnualIncome * Math.pow(1 + incomeGrowthRate / 100, year);
      const annualExpenses = this.expenses.totalAnnual * Math.pow(1 + expenseGrowthRate / 100, year);
      const annualNOI = annualIncome - annualExpenses;
      const annualCashFlow = annualNOI - this.financing.annualPayment;
      
      const equity = propertyValue - this.calculateRemainingLoanBalance(year);
      const totalCashFlow = annualCashFlow * year;
      const totalEquity = equity - this.purchase.totalCashNeeded;
      const totalReturn = totalCashFlow + totalEquity;
      const totalROI = (totalReturn / this.purchase.totalCashNeeded) * 100;
      
      return {
        year: year,
        propertyValue: propertyValue,
        equity: equity,
        annualIncome: annualIncome,
        annualExpenses: annualExpenses,
        annualNOI: annualNOI,
        annualCashFlow: annualCashFlow,
        cumulativeCashFlow: totalCashFlow,
        totalReturn: totalReturn,
        totalROI: totalROI
      };
    });
  }

  calculateRemainingLoanBalance(years) {
    const loanAmount = this.financing.loanAmount;
    const monthlyRate = (this.financing.interestRate / 100) / 12;
    const monthlyPayment = this.financing.monthlyPayment;
    const monthsPaid = years * 12;
    const totalMonths = this.financing.loanTerm * 12;
    
    if (monthsPaid >= totalMonths) return 0;
    
    const remainingMonths = totalMonths - monthsPaid;
    const remainingBalance = loanAmount * 
      (Math.pow(1 + monthlyRate, totalMonths) - Math.pow(1 + monthlyRate, monthsPaid)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    
    return Math.max(0, remainingBalance);
  }

  // ========================================================================
  // INVESTMENT SCORE
  // ========================================================================
  
  calculateInvestmentScore() {
    let score = 0;
    const reasons = [];
    
    // Cash Flow (0-30 points)
    const monthlyCashFlow = this.cashFlow.monthlyCashFlow;
    if (monthlyCashFlow >= 300) {
      score += 30;
      reasons.push('Excellent cash flow');
    } else if (monthlyCashFlow >= 200) {
      score += 25;
      reasons.push('Strong cash flow');
    } else if (monthlyCashFlow >= 100) {
      score += 20;
      reasons.push('Good cash flow');
    } else if (monthlyCashFlow >= 0) {
      score += 10;
      reasons.push('Positive cash flow');
    } else {
      reasons.push('Negative cash flow');
    }
    
    // Cap Rate (0-25 points)
    const capRate = this.returns.capRate;
    if (capRate >= 10) {
      score += 25;
      reasons.push('Outstanding cap rate');
    } else if (capRate >= 8) {
      score += 20;
      reasons.push('Excellent cap rate');
    } else if (capRate >= 6) {
      score += 15;
      reasons.push('Good cap rate');
    } else if (capRate >= 4) {
      score += 10;
      reasons.push('Fair cap rate');
    }
    
    // Cash on Cash (0-25 points)
    const cocReturn = this.returns.cocReturn;
    if (cocReturn >= 12) {
      score += 25;
      reasons.push('Superior CoC return');
    } else if (cocReturn >= 10) {
      score += 20;
      reasons.push('Excellent CoC return');
    } else if (cocReturn >= 8) {
      score += 15;
      reasons.push('Good CoC return');
    } else if (cocReturn >= 5) {
      score += 10;
      reasons.push('Fair CoC return');
    }
    
    // 1% Rule (0-15 points)
    if (this.returns.onePercentRule.ratio >= 1.5) {
      score += 15;
      reasons.push('Exceeds 1.5% rule');
    } else if (this.returns.onePercentRule.passes) {
      score += 12;
      reasons.push('Passes 1% rule');
    } else if (this.returns.onePercentRule.ratio >= 0.8) {
      score += 6;
    }
    
    // DCR (0-5 points)
    const dcr = this.returns.dcr;
    if (dcr >= 1.5) {
      score += 5;
    } else if (dcr >= 1.25) {
      score += 3;
    } else if (dcr >= 1.0) {
      score += 1;
    }
    
    let category;
    if (score >= 85) category = 'excellent';
    else if (score >= 70) category = 'good';
    else if (score >= 50) category = 'fair';
    else category = 'poor';
    
    return {
      score: score,
      category: category,
      reasons: reasons
    };
  }

  // ========================================================================
  // GET COMPLETE ANALYSIS
  // ========================================================================
  
  getCompleteAnalysis() {
    const investmentScore = this.calculateInvestmentScore();
    
    return {
      purchase: this.purchase,
      financing: this.financing,
      income: this.income,
      expenses: this.expenses,
      cashFlow: this.cashFlow,
      returns: this.returns,
      projections: this.projections,
      score: investmentScore,
      
      // Summary for quick view
      summary: {
        monthlyCashFlow: this.cashFlow.monthlyCashFlow,
        annualCashFlow: this.cashFlow.annualCashFlow,
        capRate: this.returns.capRate,
        cocReturn: this.returns.cocReturn,
        totalCashNeeded: this.purchase.totalCashNeeded,
        investmentScore: investmentScore.score,
        investmentCategory: investmentScore.category
      }
    };
  }
}

// ============================================================================
// QUICK SCORE CALCULATION (For Property Cards)
// ============================================================================

export function calculateQuickScore(purchasePrice, zillowData = {}, customAssumptions = {}) {
  const monthlyRent = zillowData.rent || 0;
  
  if (!monthlyRent || !purchasePrice) {
    return {
      score: 'unknown',
      scorePoints: 0,
      monthlyCashFlow: 0,
      capRate: 0,
      cocReturn: 0,
      passesOnePercent: false,
      message: 'Insufficient data for analysis',
      dataQuality: 'poor'
    };
  }

  const assumptions = {
    interestRate: customAssumptions.interestRate || INDUSTRY_STANDARDS.defaultInterestRate,
    downPaymentPercent: customAssumptions.downPaymentPercent || INDUSTRY_STANDARDS.downPaymentPercent,
    loanTermYears: customAssumptions.loanTermYears || INDUSTRY_STANDARDS.loanTermYears,
    
    annualPropertyTax: zillowData.annualTaxAmount || estimatePropertyTax(purchasePrice),
    annualInsurance: estimateInsurance(purchasePrice),
    monthlyHOA: zillowData.hoaFee || 0,
    
    vacancyRate: INDUSTRY_STANDARDS.vacancyRate,
    managementRate: INDUSTRY_STANDARDS.managementRate,
    repairsRate: INDUSTRY_STANDARDS.repairsRate,
    capExRate: INDUSTRY_STANDARDS.capExRate,
  };

  const downPaymentAmount = purchasePrice * (assumptions.downPaymentPercent / 100);
  const loanAmount = purchasePrice - downPaymentAmount;
  const monthlyMortgage = calculateMortgagePayment(
    loanAmount,
    assumptions.interestRate,
    assumptions.loanTermYears
  );

  const grossMonthlyIncome = monthlyRent;
  const monthlyVacancy = monthlyRent * (assumptions.vacancyRate / 100);
  const effectiveMonthlyIncome = grossMonthlyIncome - monthlyVacancy;

  const monthlyPropertyTax = assumptions.annualPropertyTax / 12;
  const monthlyInsurance = assumptions.annualInsurance / 12;
  const monthlyManagement = monthlyRent * (assumptions.managementRate / 100);
  const monthlyRepairs = monthlyRent * (assumptions.repairsRate / 100);
  const monthlyCapEx = monthlyRent * (assumptions.capExRate / 100);
  const monthlyHOA = assumptions.monthlyHOA;

  const totalMonthlyExpenses = 
    monthlyPropertyTax +
    monthlyInsurance +
    monthlyManagement +
    monthlyRepairs +
    monthlyCapEx +
    monthlyHOA;

  const monthlyNOI = effectiveMonthlyIncome - totalMonthlyExpenses;
  const annualNOI = monthlyNOI * 12;
  
  const monthlyCashFlow = monthlyNOI - monthlyMortgage;
  const annualCashFlow = monthlyCashFlow * 12;

  const capRate = (annualNOI / purchasePrice) * 100;
  const cashInvested = downPaymentAmount;
  const cocReturn = (annualCashFlow / cashInvested) * 100;
  const grm = purchasePrice / (monthlyRent * 12);
  const dcr = monthlyNOI / monthlyMortgage;

  const onePercentTarget = purchasePrice * 0.01;
  const passesOnePercent = monthlyRent >= onePercentTarget;
  const onePercentRatio = (monthlyRent / purchasePrice) * 100;
  const expenseRatio = (totalMonthlyExpenses / grossMonthlyIncome) * 100;

  let scorePoints = 0;
  const scoreReasons = [];

  if (monthlyCashFlow >= 300) {
    scorePoints += 30;
    scoreReasons.push('Excellent cash flow');
  } else if (monthlyCashFlow >= 200) {
    scorePoints += 25;
    scoreReasons.push('Strong cash flow');
  } else if (monthlyCashFlow >= 100) {
    scorePoints += 20;
    scoreReasons.push('Good cash flow');
  } else if (monthlyCashFlow >= 0) {
    scorePoints += 10;
    scoreReasons.push('Positive cash flow');
  } else {
    scoreReasons.push('Negative cash flow');
  }

  if (capRate >= 10) {
    scorePoints += 25;
    scoreReasons.push('Outstanding cap rate');
  } else if (capRate >= 8) {
    scorePoints += 20;
    scoreReasons.push('Excellent cap rate');
  } else if (capRate >= 6) {
    scorePoints += 15;
    scoreReasons.push('Good cap rate');
  } else if (capRate >= 4) {
    scorePoints += 10;
    scoreReasons.push('Fair cap rate');
  } else {
    scoreReasons.push('Low cap rate');
  }

  if (cocReturn >= 12) {
    scorePoints += 25;
    scoreReasons.push('Superior CoC return');
  } else if (cocReturn >= 10) {
    scorePoints += 20;
    scoreReasons.push('Excellent CoC return');
  } else if (cocReturn >= 8) {
    scorePoints += 15;
    scoreReasons.push('Good CoC return');
  } else if (cocReturn >= 5) {
    scorePoints += 10;
    scoreReasons.push('Fair CoC return');
  } else {
    scoreReasons.push('Low CoC return');
  }

  if (onePercentRatio >= 1.5) {
    scorePoints += 15;
    scoreReasons.push('Exceeds 1.5% rule');
  } else if (passesOnePercent) {
    scorePoints += 12;
    scoreReasons.push('Passes 1% rule');
  } else if (onePercentRatio >= 0.8) {
    scorePoints += 6;
    scoreReasons.push('Close to 1% rule');
  } else {
    scoreReasons.push('Below 1% rule');
  }

  if (dcr >= 1.5) {
    scorePoints += 5;
  } else if (dcr >= 1.25) {
    scorePoints += 3;
  } else if (dcr >= 1.0) {
    scorePoints += 1;
  }

  let scoreCategory;
  if (scorePoints >= 85) {
    scoreCategory = 'excellent';
  } else if (scorePoints >= 70) {
    scoreCategory = 'good';
  } else if (scorePoints >= 50) {
    scoreCategory = 'fair';
  } else {
    scoreCategory = 'poor';
  }

  let dataQuality = 'good';
  const dataIssues = [];

  if (!zillowData.annualTaxAmount) {
    dataQuality = 'estimated';
    dataIssues.push('Tax estimated');
  }

  if (!zillowData.rent) {
    dataQuality = 'poor';
    dataIssues.push('No rent data');
  }

  return {
    score: scoreCategory,
    scorePoints: Math.round(scorePoints),
    scoreReasons: scoreReasons.slice(0, 3),
    
    monthlyCashFlow: Math.round(monthlyCashFlow),
    annualCashFlow: Math.round(annualCashFlow),
    capRate: Math.round(capRate * 10) / 10,
    cocReturn: Math.round(cocReturn * 10) / 10,
    
    passesOnePercent,
    onePercentTarget: Math.round(onePercentTarget),
    onePercentRatio: Math.round(onePercentRatio * 10) / 10,
    
    monthlyNOI: Math.round(monthlyNOI),
    grm: Math.round(grm * 10) / 10,
    dcr: Math.round(dcr * 100) / 100,
    expenseRatio: Math.round(expenseRatio * 10) / 10,
    
    breakdown: {
      income: {
        grossMonthly: Math.round(grossMonthlyIncome),
        vacancy: Math.round(monthlyVacancy),
        effectiveMonthly: Math.round(effectiveMonthlyIncome),
      },
      expenses: {
        propertyTax: Math.round(monthlyPropertyTax),
        insurance: Math.round(monthlyInsurance),
        management: Math.round(monthlyManagement),
        repairs: Math.round(monthlyRepairs),
        capEx: Math.round(monthlyCapEx),
        hoa: Math.round(monthlyHOA),
        total: Math.round(totalMonthlyExpenses),
      },
      financing: {
        downPayment: Math.round(downPaymentAmount),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Math.round(monthlyMortgage),
      },
    },
    
    dataQuality,
    dataIssues,
    
    dataSources: {
      rentFromAPI: !!zillowData.rent,
      taxFromAPI: !!zillowData.annualTaxAmount,
      hoaFromAPI: !!zillowData.hoaFee,
    },
  };
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value, decimals = 1) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function getScoreBadge(scoreCategory) {
  const badges = {
    excellent: {
      label: 'Excellent Deal',
      icon: '🟢',
      emoji: '⭐⭐⭐',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: '#10b981',
      description: 'Strong cash flow, high returns'
    },
    good: {
      label: 'Good Deal',
      icon: '🔵',
      emoji: '⭐⭐',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: '#3b82f6',
      description: 'Solid investment potential'
    },
    fair: {
      label: 'Fair Deal',
      icon: '🟡',
      emoji: '⭐',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: '#eab308',
      description: 'Modest returns expected'
    },
    poor: {
      label: 'Poor Deal',
      icon: '🔴',
      emoji: '❌',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: '#ef4444',
      description: 'Low returns or negative cash flow'
    },
    unknown: {
      label: 'No Data',
      icon: '⚪',
      emoji: '❓',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: '#d1d5db',
      description: 'Insufficient data for analysis'
    }
  };
  
  return badges[scoreCategory] || badges.unknown;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  RentalPropertyCalculator,
  calculateQuickScore,
  formatCurrency,
  formatPercentage,
  getScoreBadge,
  INDUSTRY_STANDARDS,
};