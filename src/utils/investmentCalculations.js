/**
 * Investment Calculations - Buy-Rent-Hold Analysis
 * ================================================
 * MATCHES THE EXCEL SPREADSHEET EXACTLY
 * Location: src/utils/investmentCalculations.js
 */

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate monthly mortgage payment using PMT formula
 */
function calculateMonthlyPayment(principal, annualRate, years) {
  if (!principal || principal === 0) return 0;
  if (!annualRate || annualRate === 0) return principal / (years * 12);
  if (!years || years === 0) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

/**
 * Calculate total principal paid in Year 1
 */
function calculatePrincipalPaidYear1(loanAmount, monthlyPayment, annualRate) {
  if (!loanAmount || !monthlyPayment) return 0;
  
  let totalPrincipal = 0;
  let balance = loanAmount;
  const monthlyRate = (annualRate || 0) / 100 / 12;
  
  for (let month = 1; month <= 12; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    totalPrincipal += Math.max(0, principalPayment);
    balance -= principalPayment;
  }
  
  return totalPrincipal;
}

// =============================================================================
// MAIN CALCULATOR CLASS
// =============================================================================

export class BuyRentHoldCalculator {
  constructor(property, inputs) {
    this.property = property || {};
    this.inputs = inputs || {};
  }

  // SECTION 1: Property Info
  getPropertyInfo() {
    return {
      address: this.property.address || '',
      fairMarketValue: this.inputs.fairMarketValue || this.inputs.offerPrice || this.property.price || 0,
      vacancyRate: this.inputs.vacancyRate ?? 5.0,
      managementRate: this.inputs.managementRate ?? 10.0,
      advertisingCost: this.inputs.advertisingCost ?? 100,
      numberOfUnits: this.inputs.numberOfUnits || 1,
      appreciationRate: this.inputs.appreciationRate ?? 3.0
    };
  }

  // SECTION 2: Purchase Info → Real Purchase Price (RPP)
  calculatePurchaseInfo() {
    const {
      offerPrice = 0,
      repairs = 0,
      repairsContingency = 0,
      lenderFee = 0,
      brokerFee = 0,
      environmentals = 0,
      inspections = 0,
      appraisals = 0,
      misc = 0,
      transferTax = 0,
      legal = 0
    } = this.inputs;

    const closingCosts = lenderFee + brokerFee + environmentals + inspections + 
                         appraisals + misc + transferTax + legal;

    const realPurchasePrice = offerPrice + repairs + repairsContingency + closingCosts;

    return {
      offerPrice,
      repairs,
      repairsContingency,
      lenderFee,
      brokerFee,
      environmentals,
      inspections,
      appraisals,
      misc,
      transferTax,
      legal,
      closingCosts,
      realPurchasePrice
    };
  }

  // SECTION 3: Financing → Cash Required to Close
  calculateFinancing() {
    const purchase = this.calculatePurchaseInfo();
    const { offerPrice } = this.inputs;

    const firstMtgLTV = this.inputs.firstMtgLTV ?? 80;
    const firstMtgRate = this.inputs.firstMtgRate ?? 7.0;
    const firstMtgAmortization = this.inputs.firstMtgAmortization ?? 30;
    const firstMtgCMHCFeePercent = this.inputs.firstMtgCMHCFee ?? 0;

    const firstMtgPrincipalBorrowed = offerPrice * (firstMtgLTV / 100);
    const firstMtgCMHCAmount = firstMtgPrincipalBorrowed * (firstMtgCMHCFeePercent / 100);
    const firstMtgTotalPrincipal = firstMtgPrincipalBorrowed + firstMtgCMHCAmount;
    const firstMtgMonthlyPayment = calculateMonthlyPayment(
      firstMtgTotalPrincipal,
      firstMtgRate,
      firstMtgAmortization
    );

    const secondMtgPrincipal = this.inputs.secondMtgPrincipal || 0;
    const secondMtgRate = this.inputs.secondMtgRate ?? 12.0;
    const secondMtgAmortization = this.inputs.secondMtgAmortization || 9999;
    const secondMtgMonthlyPayment = secondMtgPrincipal > 0
      ? calculateMonthlyPayment(secondMtgPrincipal, secondMtgRate, Math.min(secondMtgAmortization, 30))
      : 0;

    const interestOnlyPrincipal = this.inputs.interestOnlyPrincipal || 0;
    const interestOnlyRate = this.inputs.interestOnlyRate || 0;
    const interestOnlyMonthlyPayment = interestOnlyPrincipal > 0
      ? (interestOnlyPrincipal * interestOnlyRate / 100) / 12
      : 0;

    const otherMonthlyFinancingCosts = this.inputs.otherMonthlyFinancingCosts || 0;
    const cashRequiredToClose = purchase.realPurchasePrice - firstMtgPrincipalBorrowed - secondMtgPrincipal;

    return {
      firstMtg: {
        principalBorrowed: firstMtgPrincipalBorrowed,
        rate: firstMtgRate,
        amortization: firstMtgAmortization,
        cmhcFeePercent: firstMtgCMHCFeePercent,
        cmhcAmount: firstMtgCMHCAmount,
        totalPrincipal: firstMtgTotalPrincipal,
        monthlyPayment: firstMtgMonthlyPayment,
        ltv: firstMtgLTV
      },
      secondMtg: {
        principal: secondMtgPrincipal,
        rate: secondMtgRate,
        amortization: secondMtgAmortization,
        monthlyPayment: secondMtgMonthlyPayment
      },
      interestOnly: {
        principal: interestOnlyPrincipal,
        rate: interestOnlyRate,
        monthlyPayment: interestOnlyMonthlyPayment
      },
      otherMonthlyFinancingCosts,
      cashRequiredToClose
    };
  }

  // SECTION 4: Income Annual → Effective Gross Income
  calculateIncome() {
    const {
      grossRents = 0,
      parking = 0,
      storage = 0,
      laundry = 0,
      otherIncome = 0
    } = this.inputs;

    const propertyInfo = this.getPropertyInfo();
    const totalIncome = grossRents + parking + storage + laundry + otherIncome;
    const vacancyLoss = totalIncome * (propertyInfo.vacancyRate / 100);
    const effectiveGrossIncome = totalIncome - vacancyLoss;

    return {
      grossRents,
      parking,
      storage,
      laundry,
      otherIncome,
      totalIncome,
      vacancyLoss,
      vacancyRate: propertyInfo.vacancyRate,
      effectiveGrossIncome
    };
  }

  // SECTION 5: Operating Expenses Annual
  calculateOperatingExpenses() {
    const income = this.calculateIncome();
    const propertyInfo = this.getPropertyInfo();

    const {
      propertyTaxes = 0,
      insurance = 0,
      repairsPercent = 5.0,
      electricity = 0,
      gas = 0,
      lawnMaintenance = 0,
      waterSewer = 0,
      cable = 0,
      caretaking = 0,
      advertising = 0,
      associationFees = 0,
      pestControl = 0,
      security = 0,
      trashRemoval = 0,
      miscellaneous = 0,
      commonArea = 0,
      capitalImprovements = 0,
      accounting = 0,
      legalExpenses = 0,
      badDebts = 0,
      otherExpenses = 0,
      evictions = 0
    } = this.inputs;

    // Repairs and Management based on Gross Rents (Excel methodology)
    const repairs = income.grossRents * (repairsPercent / 100);
    const management = income.grossRents * (propertyInfo.managementRate / 100);

    const totalExpenses = 
      propertyTaxes + insurance + repairs + electricity + gas + 
      lawnMaintenance + waterSewer + cable + management + caretaking + 
      advertising + associationFees + pestControl + security + 
      trashRemoval + miscellaneous + commonArea + capitalImprovements + 
      accounting + legalExpenses + badDebts + otherExpenses + evictions;

    return {
      propertyTaxes,
      insurance,
      repairs,
      repairsPercent,
      electricity,
      gas,
      lawnMaintenance,
      waterSewer,
      cable,
      management,
      managementPercent: propertyInfo.managementRate,
      caretaking,
      advertising,
      associationFees,
      pestControl,
      security,
      trashRemoval,
      miscellaneous,
      commonArea,
      capitalImprovements,
      accounting,
      legalExpenses,
      badDebts,
      otherExpenses,
      evictions,
      totalExpenses
    };
  }

  // SECTION 6: Net Operating Income
  calculateNOI() {
    const income = this.calculateIncome();
    const expenses = this.calculateOperatingExpenses();
    const netOperatingIncome = income.effectiveGrossIncome - expenses.totalExpenses;
    
    return {
      effectiveGrossIncome: income.effectiveGrossIncome,
      totalExpenses: expenses.totalExpenses,
      netOperatingIncome
    };
  }

  // SECTION 7: Cash Requirements
  calculateCashRequirements() {
    const financing = this.calculateFinancing();
    const { deposits = 0, lessProRation = 0 } = this.inputs;
    const totalCashRequired = financing.cashRequiredToClose + deposits - lessProRation;

    return {
      deposits,
      lessProRation,
      cashRequiredToClose: financing.cashRequiredToClose,
      totalCashRequired
    };
  }

  // SECTION 8: Cashflow Summary Annual
  calculateCashflowSummary() {
    const income = this.calculateIncome();
    const expenses = this.calculateOperatingExpenses();
    const noiResult = this.calculateNOI();
    const financing = this.calculateFinancing();
    const propertyInfo = this.getPropertyInfo();

    const annualDebtService = (
      financing.firstMtg.monthlyPayment + 
      financing.secondMtg.monthlyPayment + 
      financing.interestOnly.monthlyPayment +
      financing.otherMonthlyFinancingCosts
    ) * 12;

    const annualProfitOrLoss = noiResult.netOperatingIncome - annualDebtService;
    const totalMonthlyProfitOrLoss = annualProfitOrLoss / 12;
    const cashflowPerUnitPerMonth = propertyInfo.numberOfUnits > 0 
      ? totalMonthlyProfitOrLoss / propertyInfo.numberOfUnits 
      : 0;

    return {
      effectiveGrossIncome: income.effectiveGrossIncome,
      operatingExpenses: expenses.totalExpenses,
      netOperatingIncome: noiResult.netOperatingIncome,
      debtServicingCosts: annualDebtService,
      annualProfitOrLoss,
      totalMonthlyProfitOrLoss,
      cashflowPerUnitPerMonth
    };
  }

  // SECTION 9: Quick Analysis - All Ratios
  calculateQuickAnalysis() {
    const propertyInfo = this.getPropertyInfo();
    const purchase = this.calculatePurchaseInfo();
    const financing = this.calculateFinancing();
    const income = this.calculateIncome();
    const expenses = this.calculateOperatingExpenses();
    const noiResult = this.calculateNOI();
    const cashflow = this.calculateCashflowSummary();
    const cashReq = this.calculateCashRequirements();

    const firstMtgLTV = propertyInfo.fairMarketValue > 0 
      ? (financing.firstMtg.principalBorrowed / propertyInfo.fairMarketValue) * 100 : 0;
    const firstMtgLTPP = purchase.offerPrice > 0 
      ? (financing.firstMtg.principalBorrowed / purchase.offerPrice) * 100 : 0;
    const secondMtgLTV = propertyInfo.fairMarketValue > 0 
      ? (financing.secondMtg.principal / propertyInfo.fairMarketValue) * 100 : 0;
    const secondMtgLTPP = purchase.offerPrice > 0 
      ? (financing.secondMtg.principal / purchase.offerPrice) * 100 : 0;

    const capRateOnPP = purchase.offerPrice > 0 
      ? (noiResult.netOperatingIncome / purchase.offerPrice) * 100 : 0;
    const capRateOnFMV = propertyInfo.fairMarketValue > 0 
      ? (noiResult.netOperatingIncome / propertyInfo.fairMarketValue) * 100 : 0;

    const averageRent = propertyInfo.numberOfUnits > 0 
      ? income.grossRents / propertyInfo.numberOfUnits / 12 : 0;
    const grm = income.grossRents > 0 
      ? purchase.offerPrice / income.grossRents : 0;
    const dcr = cashflow.debtServicingCosts > 0 
      ? noiResult.netOperatingIncome / cashflow.debtServicingCosts : 0;
    const cashOnCashROI = cashReq.totalCashRequired > 0 
      ? (cashflow.annualProfitOrLoss / cashReq.totalCashRequired) * 100 : 0;

    const firstMtgPrincipalYear1 = calculatePrincipalPaidYear1(
      financing.firstMtg.totalPrincipal,
      financing.firstMtg.monthlyPayment,
      financing.firstMtg.rate
    );
    const secondMtgPrincipalYear1 = financing.secondMtg.principal > 0
      ? calculatePrincipalPaidYear1(
          financing.secondMtg.principal,
          financing.secondMtg.monthlyPayment,
          financing.secondMtg.rate
        ) : 0;
    const totalPrincipalYear1 = firstMtgPrincipalYear1 + secondMtgPrincipalYear1;

    const equityROI = cashReq.totalCashRequired > 0 
      ? (totalPrincipalYear1 / cashReq.totalCashRequired) * 100 : 0;
    const appreciationValue = propertyInfo.fairMarketValue * (propertyInfo.appreciationRate / 100);
    const appreciationROI = cashReq.totalCashRequired > 0 
      ? (appreciationValue / cashReq.totalCashRequired) * 100 : 0;
    const totalROI = cashOnCashROI + equityROI + appreciationROI;
    const forcedAppROI = cashReq.totalCashRequired > 0 
      ? ((propertyInfo.fairMarketValue - purchase.realPurchasePrice) / cashReq.totalCashRequired) * 100 : 0;
    const expenseToIncomeRatio = income.totalIncome > 0 
      ? (expenses.totalExpenses / income.totalIncome) * 100 : 0;

    return {
      firstMtgLTV,
      firstMtgLTPP,
      secondMtgLTV,
      secondMtgLTPP,
      capRateOnPP,
      capRateOnFMV,
      averageRent,
      grm,
      dcr,
      cashOnCashROI,
      equityROI,
      appreciationROI,
      totalROI,
      forcedAppROI,
      expenseToIncomeRatio,
      principalPaidYear1: totalPrincipalYear1,
      appreciationValue
    };
  }

  // Investment Score Calculation
  calculateInvestmentScore() {
    const qa = this.calculateQuickAnalysis();
    const cashflow = this.calculateCashflowSummary();
    
    let score = 0;

    // Cash on Cash ROI (25 points)
    if (qa.cashOnCashROI >= 12) score += 25;
    else if (qa.cashOnCashROI >= 8) score += 20;
    else if (qa.cashOnCashROI >= 5) score += 15;
    else if (qa.cashOnCashROI >= 0) score += 10;
    else if (qa.cashOnCashROI >= -5) score += 5;

    // Cap Rate (20 points)
    if (qa.capRateOnPP >= 10) score += 20;
    else if (qa.capRateOnPP >= 8) score += 17;
    else if (qa.capRateOnPP >= 6) score += 14;
    else if (qa.capRateOnPP >= 5) score += 10;
    else if (qa.capRateOnPP >= 4) score += 7;
    else score += 3;

    // DCR (20 points)
    if (qa.dcr >= 1.5) score += 20;
    else if (qa.dcr >= 1.25) score += 16;
    else if (qa.dcr >= 1.1) score += 12;
    else if (qa.dcr >= 1.0) score += 8;
    else if (qa.dcr >= 0.9) score += 4;

    // Monthly Cash Flow (20 points)
    const monthlyCF = cashflow.totalMonthlyProfitOrLoss;
    if (monthlyCF >= 500) score += 20;
    else if (monthlyCF >= 300) score += 16;
    else if (monthlyCF >= 100) score += 12;
    else if (monthlyCF >= 0) score += 8;
    else if (monthlyCF >= -200) score += 4;

    // Total ROI (15 points)
    if (qa.totalROI >= 20) score += 15;
    else if (qa.totalROI >= 15) score += 12;
    else if (qa.totalROI >= 10) score += 9;
    else if (qa.totalROI >= 5) score += 6;
    else if (qa.totalROI >= 0) score += 3;

    let badge, description;
    if (score >= 85) {
      badge = 'excellent';
      description = 'Outstanding investment - Strong across all metrics';
    } else if (score >= 70) {
      badge = 'good';
      description = 'Good investment - Solid returns expected';
    } else if (score >= 50) {
      badge = 'fair';
      description = 'Fair investment - Average returns';
    } else if (score >= 30) {
      badge = 'risky';
      description = 'Risky investment - Below average metrics';
    } else {
      badge = 'avoid';
      description = 'Poor investment - Negative cash flow likely';
    }

    return { score, maxScore: 100, badge, description };
  }

  // Get Complete Analysis
  getCompleteAnalysis() {
    return {
      propertyInfo: this.getPropertyInfo(),
      purchase: this.calculatePurchaseInfo(),
      financing: this.calculateFinancing(),
      income: this.calculateIncome(),
      expenses: this.calculateOperatingExpenses(),
      noi: this.calculateNOI(),
      cashRequirements: this.calculateCashRequirements(),
      cashflow: this.calculateCashflowSummary(),
      quickAnalysis: this.calculateQuickAnalysis(),
      investmentScore: this.calculateInvestmentScore()
    };
  }
}

// Quick Score for Property Cards
export function calculateQuickScore(price, rentEstimate, propertyData = {}) {
  if (!price || !rentEstimate) {
    return { score: 0, badge: 'insufficient-data', monthlyCashFlow: null, capRate: null };
  }

  const downPayment = price * 0.20;
  const loanAmount = price * 0.80;
  const monthlyMortgage = calculateMonthlyPayment(loanAmount, 7.0, 30);
  
  const annualRent = rentEstimate * 12;
  const vacancyLoss = annualRent * 0.05;
  const effectiveIncome = annualRent - vacancyLoss;
  
  const propertyTax = price * 0.012;
  const insurance = price * 0.005;
  const repairs = annualRent * 0.05;
  const management = annualRent * 0.10;
  const totalExpenses = propertyTax + insurance + repairs + management;
  
  const noi = effectiveIncome - totalExpenses;
  const annualDebtService = monthlyMortgage * 12;
  const annualCashFlow = noi - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;
  
  const capRate = (noi / price) * 100;
  const totalCashRequired = downPayment + (price * 0.03);
  const cashOnCashROI = (annualCashFlow / totalCashRequired) * 100;
  const dcr = annualDebtService > 0 ? noi / annualDebtService : 0;
  
  let score = 0;
  if (cashOnCashROI >= 12) score += 25;
  else if (cashOnCashROI >= 8) score += 20;
  else if (cashOnCashROI >= 5) score += 15;
  else if (cashOnCashROI >= 0) score += 10;
  else score += 5;
  
  if (capRate >= 8) score += 20;
  else if (capRate >= 6) score += 15;
  else if (capRate >= 5) score += 12;
  else score += 8;
  
  if (dcr >= 1.25) score += 20;
  else if (dcr >= 1.1) score += 15;
  else if (dcr >= 1.0) score += 10;
  else score += 5;
  
  if (monthlyCashFlow >= 300) score += 20;
  else if (monthlyCashFlow >= 100) score += 15;
  else if (monthlyCashFlow >= 0) score += 10;
  else score += 5;
  
  score += 10;
  
  let badge;
  if (score >= 70) badge = 'excellent';
  else if (score >= 55) badge = 'good';
  else if (score >= 40) badge = 'fair';
  else if (score >= 25) badge = 'risky';
  else badge = 'avoid';

  return {
    score,
    badge,
    monthlyCashFlow: Math.round(monthlyCashFlow),
    annualCashFlow: Math.round(annualCashFlow),
    capRate: Math.round(capRate * 100) / 100,
    cashOnCashROI: Math.round(cashOnCashROI * 100) / 100,
    dcr: Math.round(dcr * 100) / 100,
    noi: Math.round(noi),
    totalCashRequired: Math.round(totalCashRequired)
  };
}

export default { BuyRentHoldCalculator, calculateQuickScore };