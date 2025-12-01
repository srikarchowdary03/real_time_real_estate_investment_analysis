/**
 * Investment Calculations - Buy-Rent-Hold Analysis
 * Matches Excel spreadsheet formulas exactly
 */

/**
 * Calculate monthly mortgage payment using PMT formula
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (percentage, e.g., 7.0 for 7%)
 * @param {number} years - Loan term in years
 * @returns {number} Monthly payment amount
 */
function calculateMonthlyPayment(principal, annualRate, years) {
  if (principal === 0 || annualRate === 0 || years === 0) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  
  // PMT formula: [r × PV] / [1 - (1 + r)^-n]
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

/**
 * Calculate principal paid in Year 1 for amortized loan
 * @param {number} loanAmount - Initial loan amount
 * @param {number} monthlyPayment - Monthly payment amount
 * @param {number} annualRate - Annual interest rate (percentage)
 * @returns {number} Total principal paid in first 12 months
 */
function calculatePrincipalPaidYear1(loanAmount, monthlyPayment, annualRate) {
  if (loanAmount === 0 || monthlyPayment === 0) return 0;
  
  let totalPrincipal = 0;
  let balance = loanAmount;
  const monthlyRate = annualRate / 100 / 12;
  
  for (let month = 1; month <= 12; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    totalPrincipal += principalPayment;
    balance -= principalPayment;
  }
  
  return totalPrincipal;
}

/**
 * Main Calculator Class - Buy-Rent-Hold Analysis
 */
export class BuyRentHoldCalculator {
  constructor(property, inputs) {
    this.property = property;
    this.inputs = inputs;
  }

  /**
   * SECTION 1: Property Info
   * Data from API and user inputs
   */
  getPropertyInfo() {
    return {
      address: this.property.address || '',
      fairMarketValue: this.inputs.fairMarketValue || this.property.price || 0,
      vacancyRate: this.inputs.vacancyRate || 5.0,
      managementRate: this.inputs.managementRate || 10.0,
      advertisingCost: this.inputs.advertisingCost || 100,
      numberOfUnits: this.inputs.numberOfUnits || this.property.bedrooms || 1,
      appreciationRate: this.inputs.appreciationRate || 3.0
    };
  }

  /**
   * SECTION 2: Purchase Info
   * All closing costs and total purchase price
   */
  calculatePurchaseInfo() {
    const {
      offerPrice = 0,
      repairs = 0,
      repairsContingency = 0,
      purchaseCostsTotal = 0, // This will be either itemized total or percentage-based total
      lenderFee = 0,
      brokerFee = 0,
      environmentals = 0,
      inspections = 0,
      appraisals = 0,
      misc = 0,
      transferTax = 0,
      legal = 0
    } = this.inputs;

    // Use purchaseCostsTotal if available (from itemization), otherwise sum individual costs
    const closingCosts = purchaseCostsTotal > 0 
      ? purchaseCostsTotal 
      : (lenderFee + brokerFee + environmentals + inspections + appraisals + misc + transferTax + legal);

    // Real Purchase Price (RPP) = offer + closing costs + repairs
    const realPurchasePrice = offerPrice + closingCosts + repairs + repairsContingency;

    return {
      offerPrice,
      repairs,
      repairsContingency,
      purchaseCosts: closingCosts,
      lenderFee,
      brokerFee,
      environmentals,
      inspections,
      appraisals,
      misc,
      transferTax,
      legal,
      realPurchasePrice
    };
  }

  /**
   * SECTION 3: Financing (Monthly)
   * Calculates mortgage payments for 1st, 2nd, and interest-only loans
   */
  calculateFinancing() {
    const purchase = this.calculatePurchaseInfo();
    const { offerPrice } = this.inputs;

    // 1st Mortgage Calculations
    const firstMtgLTV = this.inputs.firstMtgLTV || 80;
    const firstMtgRate = this.inputs.firstMtgRate || 7.0;
    const firstMtgAmortization = this.inputs.firstMtgAmortization || 30;
    const firstMtgCMHCFee = this.inputs.firstMtgCMHCFee || 0;

    const firstMtgPrincipalBorrowed = offerPrice * (firstMtgLTV / 100);
    const firstMtgCMHCAmount = firstMtgPrincipalBorrowed * (firstMtgCMHCFee / 100);
    const firstMtgTotalPrincipal = firstMtgPrincipalBorrowed + firstMtgCMHCAmount;
    const firstMtgMonthlyPayment = calculateMonthlyPayment(
      firstMtgTotalPrincipal,
      firstMtgRate,
      firstMtgAmortization
    );

    // 2nd Mortgage Calculations
    const secondMtgPrincipal = this.inputs.secondMtgPrincipal || 0;
    const secondMtgRate = this.inputs.secondMtgRate || 12.0;
    const secondMtgAmortization = this.inputs.secondMtgAmortization || 9999;
    const secondMtgMonthlyPayment = secondMtgPrincipal > 0
      ? calculateMonthlyPayment(secondMtgPrincipal, secondMtgRate, secondMtgAmortization)
      : 0;

    // Interest Only Loan Calculations
    const interestOnlyPrincipal = this.inputs.interestOnlyPrincipal || 0;
    const interestOnlyRate = this.inputs.interestOnlyRate || 0;
    const interestOnlyMonthlyPayment = interestOnlyPrincipal > 0
      ? (interestOnlyPrincipal * interestOnlyRate / 100) / 12
      : 0;

    // Other Monthly Financing Costs
    const otherMonthlyFinancingCosts = this.inputs.otherMonthlyFinancingCosts || 0;

    // FIXED: Cash Required to Close calculation
    // Down payment + closing costs - NOT adding other costs
    const downPayment = offerPrice - firstMtgPrincipalBorrowed;
    const closingCosts = purchase.realPurchasePrice - offerPrice;
    const cashRequiredToClose = downPayment + closingCosts;

    return {
      firstMtg: {
        ltv: firstMtgLTV,
        rate: firstMtgRate,
        amortization: firstMtgAmortization,
        cmhcFeePercent: firstMtgCMHCFee,
        principalBorrowed: firstMtgPrincipalBorrowed,
        cmhcAmount: firstMtgCMHCAmount,
        totalPrincipal: firstMtgTotalPrincipal,
        monthlyPayment: firstMtgMonthlyPayment
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
      downPayment,
      closingCosts,
      cashRequiredToClose
    };
  }

  /**
   * SECTION 4: Income (Annual)
   * Gross income and vacancy loss
   */
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
      effectiveGrossIncome
    };
  }

  /**
   * SECTION 5: Operating Expenses (Annual)
   * All property operating costs - MATCHES DEALCHECK METHODOLOGY
   */
  calculateOperatingExpenses() {
    const income = this.calculateIncome();
    const propertyInfo = this.getPropertyInfo();

    const {
      propertyTaxes = 0,
      insurance = 0,
      maintenancePercent = 10, // % of GROSS RENTS (DealCheck default)
      capExPercent = 5,        // % of GROSS RENTS (DealCheck default)
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

    // DEALCHECK METHODOLOGY:
    // Maintenance = % of GROSS RENTS (not EGI, not total income)
    const maintenance = income.grossRents * (maintenancePercent / 100);
    
    // CapEx = % of GROSS RENTS (not EGI)
    const capEx = income.grossRents * (capExPercent / 100);
    
    // Management = % of OPERATING INCOME (effectiveGrossIncome = after vacancy)
    const management = income.effectiveGrossIncome * (propertyInfo.managementRate / 100);

    const totalExpenses = 
      propertyTaxes + insurance + maintenance + capEx + management + 
      electricity + gas + lawnMaintenance + waterSewer + cable + 
      caretaking + advertising + associationFees + pestControl + 
      security + trashRemoval + miscellaneous + commonArea + 
      capitalImprovements + accounting + legalExpenses + badDebts + 
      otherExpenses + evictions;

    return {
      propertyTaxes,
      insurance,
      maintenance,
      maintenancePercent,
      capEx,
      capExPercent,
      management,
      managementPercent: propertyInfo.managementRate,
      electricity,
      gas,
      lawnMaintenance,
      waterSewer,
      cable,
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
      legal: legalExpenses,
      badDebts,
      other: otherExpenses,
      evictions,
      totalExpenses
    };
  }

  /**
   * SECTION 6: Net Operating Income (Annual)
   * NOI = Effective Gross Income - Operating Expenses
   */
  calculateNOI() {
    const income = this.calculateIncome();
    const expenses = this.calculateOperatingExpenses();
    return income.effectiveGrossIncome - expenses.totalExpenses;
  }

  /**
   * SECTION 7: Cash Requirements
   * Total cash needed to close the deal
   */
  calculateCashRequirements() {
    const financing = this.calculateFinancing();
    const {
      deposits = 0,
      lessProRation = 0
    } = this.inputs;

    const totalCashRequired = financing.cashRequiredToClose;

    return {
      deposits,
      lessProRation,
      cashRequiredToClose: financing.cashRequiredToClose,
      totalCashRequired
    };
  }

  /**
   * SECTION 8: Cashflow Summary (Annual)
   * Complete cash flow analysis
   */
  calculateCashflowSummary() {
    const income = this.calculateIncome();
    const expenses = this.calculateOperatingExpenses();
    const noi = this.calculateNOI();
    const financing = this.calculateFinancing();
    const propertyInfo = this.getPropertyInfo();

    // Annual debt service = monthly payments × 12
    const annualDebtService = (
      financing.firstMtg.monthlyPayment + 
      financing.secondMtg.monthlyPayment + 
      financing.interestOnly.monthlyPayment +
      financing.otherMonthlyFinancingCosts
    ) * 12;

    const annualProfitOrLoss = noi - annualDebtService;
    const totalMonthlyProfitOrLoss = annualProfitOrLoss / 12;
    const cashflowPerUnitPerMonth = totalMonthlyProfitOrLoss / propertyInfo.numberOfUnits;

    return {
      effectiveGrossIncome: income.effectiveGrossIncome,
      operatingExpenses: expenses.totalExpenses,
      netOperatingIncome: noi,
      debtServicingCosts: annualDebtService,
      annualProfitOrLoss,
      totalMonthlyProfitOrLoss,
      cashflowPerUnitPerMonth
    };
  }

  /**
   * SECTION 9: Quick Analysis
   * Key investment metrics and ratios
   */
  calculateQuickAnalysis() {
    const purchase = this.calculatePurchaseInfo();
    const financing = this.calculateFinancing();
    const income = this.calculateIncome();
    const expenses = this.calculateOperatingExpenses();
    const noi = this.calculateNOI();
    const cashflow = this.calculateCashflowSummary();
    const cashReq = this.calculateCashRequirements();
    const propertyInfo = this.getPropertyInfo();

    // LTV and LTPP ratios
    const firstMtgLTV = (financing.firstMtg.principalBorrowed / propertyInfo.fairMarketValue) * 100;
    const firstMtgLTPP = (financing.firstMtg.principalBorrowed / purchase.realPurchasePrice) * 100;
    const secondMtgLTV = (financing.secondMtg.principal / propertyInfo.fairMarketValue) * 100;
    const secondMtgLTPP = (financing.secondMtg.principal / purchase.realPurchasePrice) * 100;

    // Cap Rates
    const capRateOnPP = purchase.realPurchasePrice > 0 
      ? (noi / purchase.realPurchasePrice) * 100 
      : 0;
    const capRateOnFMV = propertyInfo.fairMarketValue > 0 
      ? (noi / propertyInfo.fairMarketValue) * 100 
      : 0;

    // Rent metrics
    const averageRent = propertyInfo.numberOfUnits > 0 
      ? income.grossRents / propertyInfo.numberOfUnits / 12 
      : 0;

    // Financial ratios
    const grm = income.grossRents > 0 
      ? purchase.realPurchasePrice / income.grossRents 
      : 0;
    const dcr = cashflow.debtServicingCosts > 0 
      ? noi / cashflow.debtServicingCosts 
      : 0;

    // ROI Calculations
    const cashOnCashROI = cashReq.totalCashRequired > 0 
      ? (cashflow.annualProfitOrLoss / cashReq.totalCashRequired) * 100 
      : 0;

    // Calculate principal paid in Year 1
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
        )
      : 0;
    const totalPrincipalYear1 = firstMtgPrincipalYear1 + secondMtgPrincipalYear1;

    const equityROI = cashReq.totalCashRequired > 0 
      ? (totalPrincipalYear1 / cashReq.totalCashRequired) * 100 
      : 0;

    const appreciationROI = cashReq.totalCashRequired > 0 
      ? ((propertyInfo.fairMarketValue * propertyInfo.appreciationRate / 100) / cashReq.totalCashRequired) * 100 
      : 0;

    const totalROI = cashOnCashROI + equityROI + appreciationROI;

    const forcedAppROI = cashReq.totalCashRequired > 0 
      ? ((propertyInfo.fairMarketValue - purchase.realPurchasePrice) / cashReq.totalCashRequired) * 100 
      : 0;

    const expenseToIncomeRatio = income.effectiveGrossIncome > 0 
      ? (expenses.totalExpenses / income.effectiveGrossIncome) * 100 
      : 0;

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
      principalPaidYear1: totalPrincipalYear1
    };
  }

  /**
   * Get complete analysis with all sections
   */
  getCompleteAnalysis() {
    const propertyInfo = this.getPropertyInfo();
    const purchase = this.calculatePurchaseInfo();
    const financing = this.calculateFinancing();
    const income = this.calculateIncome();
    const expenses = this.calculateOperatingExpenses();
    const noi = this.calculateNOI();
    const cashRequirements = this.calculateCashRequirements();
    const cashflow = this.calculateCashflowSummary();
    const quickAnalysis = this.calculateQuickAnalysis();

    return {
      propertyInfo,
      purchase,
      financing,
      income,
      expenses,
      noi,
      cashRequirements,
      cashflow,
      quickAnalysis
    };
  }
}

/**
 * Quick Score Calculator (for property cards)
 * Simplified version for quick property evaluation
 */
export function calculateQuickScore(price, zillowData, mortgageRates = null) {
  // Use default values if data not available
  const monthlyRent = zillowData?.rent || price * 0.01; // 1% rule fallback
  const propertyTax = zillowData?.taxData?.annualAmount || price * 0.012; // 1.2% fallback
  const insurance = zillowData?.insurance?.annual || 1200;
  const interestRate = mortgageRates?.rate30yr || 7.0;

  // Simple calculations
  const downPayment = price * 0.20; // 20% down
  const loanAmount = price * 0.80;
  const monthlyMortgage = calculateMonthlyPayment(loanAmount, interestRate, 30);
  
  const monthlyTax = propertyTax / 12;
  const monthlyInsurance = insurance / 12;
  const monthlyExpenses = (monthlyRent * 0.50); // 50% rule
  
  const totalMonthlyExpenses = monthlyMortgage + monthlyTax + monthlyInsurance + monthlyExpenses;
  const monthlyCashFlow = monthlyRent - totalMonthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;
  
  const annualNOI = (monthlyRent * 12) - (monthlyExpenses * 12);
  const capRate = (annualNOI / price) * 100;
  const cocReturn = (annualCashFlow / downPayment) * 100;
  
  const onePercentTarget = price * 0.01;
  const passesOnePercent = monthlyRent >= onePercentTarget;

  // Scoring
  let score = 'poor';
  let scoreReason = 'Negative cash flow or poor returns';
  
  if (monthlyCashFlow > 0 && capRate >= 8 && cocReturn >= 10) {
    score = 'good';
    scoreReason = 'Strong cash flow and returns';
  } else if (monthlyCashFlow > 0 && (capRate >= 6 || cocReturn >= 8)) {
    score = 'okay';
    scoreReason = 'Moderate cash flow and returns';
  }

  return {
    score,
    scoreReason,
    monthlyCashFlow,
    annualCashFlow,
    capRate,
    cocReturn,
    monthlyRent,
    monthlyExpenses: totalMonthlyExpenses,
    monthlyMortgage,
    onePercentTarget,
    passesOnePercent,
    dataSource: {
      rent: !!zillowData?.rent,
      tax: !!zillowData?.taxData?.annualAmount,
      insurance: !!zillowData?.insurance?.annual
    }
  };
}