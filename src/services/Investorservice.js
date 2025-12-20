/**
 * Investorservice.js - Investor Profile & Defaults Service
 * 
 * COMPLETE VERSION with all exports needed by:
 * - PropertyAnalysisPage.jsx
 * - PropertySearch.jsx
 * - InvestorProfile.jsx
 * - Propertyservice.js
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'investorProfiles';

// ===== DEFAULT PROFILE =====
export const DEFAULT_PROFILE = {
  // Location preferences (OPTIONAL)
  preferredCity: '',
  preferredState: '',
  preferredZip: '',
  searchRadius: 25,
  
  // Financing defaults
  financing: {
    downPaymentPercent: 20,
    interestRate: 7.0,
    loanTermYears: 30,
    closingCostsPercent: 3,
    cmhcFeePercent: 0
  },
  
  // Expense defaults (as % of gross rent)
  expenses: {
    vacancyRate: 5,
    managementRate: 10,
    maintenanceRate: 5,
    capExRate: 5,
    propertyTaxRate: 1.2,
    insuranceRate: 0.5
  },
  
  // Investment targets
  targets: {
    minCapRate: 6,
    minCashOnCash: 8,
    minMonthlyCashFlow: 200,
    minDSCR: 1.25,
    maxPrice: 0,
    preferredPropertyTypes: ['single_family', 'multi_family', 'duplex', 'triplex']
  },
  
  preferences: {
    showPreliminaryScores: true,
    autoSaveOnAnalyze: true,
    defaultView: 'split'
  },
  
  // Scoring configuration - REQUIRED by InvestorProfile.jsx
  scoringConfig: {
    preset: 'moderate',
    metrics: {
      capRate: { enabled: true, weight: 25 },
      cashOnCashROI: { enabled: true, weight: 25 },
      monthlyCashFlow: { enabled: true, weight: 30 },
      dcr: { enabled: true, weight: 20 }
    },
    thresholds: {
      capRate: { excellent: 10, good: 7, fair: 5, risky: 3 },
      cashOnCashROI: { excellent: 12, good: 8, fair: 5, risky: 2 },
      monthlyCashFlow: { excellent: 500, good: 300, fair: 100, risky: 0 },
      dcr: { excellent: 1.5, good: 1.25, fair: 1.1, risky: 1.0 }
    }
  },
  
  scoringPreset: 'moderate',
  scoringWeights: {
    capRate: 0.25,
    cashOnCash: 0.25,
    cashFlow: 0.3,
    dscr: 0.2
  }
};

// ===== SCORING PRESETS =====
export const SCORING_PRESETS = {
  conservative: {
    name: 'Conservative',
    description: 'Focus on stable, lower-risk investments',
    weights: { capRate: 0.3, cashOnCash: 0.3, cashFlow: 0.25, dscr: 0.15 },
    thresholds: { minCapRate: 8, minCashOnCash: 10, minCashFlow: 300, minDSCR: 1.5 }
  },
  moderate: {
    name: 'Moderate',
    description: 'Balanced approach to risk and returns',
    weights: { capRate: 0.25, cashOnCash: 0.25, cashFlow: 0.3, dscr: 0.2 },
    thresholds: { minCapRate: 6, minCashOnCash: 8, minCashFlow: 200, minDSCR: 1.25 }
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Prioritize higher returns, accept more risk',
    weights: { capRate: 0.2, cashOnCash: 0.2, cashFlow: 0.4, dscr: 0.2 },
    thresholds: { minCapRate: 4, minCashOnCash: 6, minCashFlow: 100, minDSCR: 1.0 }
  }
};

// ===== FIREBASE FUNCTIONS =====

/**
 * Get investor profile from Firebase
 */
export const getInvestorProfile = async (userId) => {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return DEFAULT_PROFILE;
    }
    
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const saved = docSnap.data();
      console.log('✅ Loaded investor profile for:', userId);
      return {
        ...DEFAULT_PROFILE,
        ...saved,
        financing: { ...DEFAULT_PROFILE.financing, ...saved.financing },
        expenses: { ...DEFAULT_PROFILE.expenses, ...saved.expenses },
        targets: { ...DEFAULT_PROFILE.targets, ...saved.targets },
        preferences: { ...DEFAULT_PROFILE.preferences, ...saved.preferences },
        scoringWeights: { ...DEFAULT_PROFILE.scoringWeights, ...saved.scoringWeights },
        scoringConfig: {
          ...DEFAULT_PROFILE.scoringConfig,
          ...saved.scoringConfig,
          metrics: { 
            ...DEFAULT_PROFILE.scoringConfig.metrics, 
            ...(saved.scoringConfig?.metrics || {}) 
          },
          thresholds: { 
            ...DEFAULT_PROFILE.scoringConfig.thresholds, 
            ...(saved.scoringConfig?.thresholds || {}) 
          }
        }
      };
    }
    
    return DEFAULT_PROFILE;
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.log('📋 Using default profile (not authenticated)');
    } else {
      console.error('Error getting investor profile:', error);
    }
    return DEFAULT_PROFILE;
  }
};

/**
 * Save investor profile to Firebase
 */
export const saveInvestorProfile = async (userId, profile) => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid User ID required');
    }
    
    const docRef = doc(db, COLLECTION_NAME, userId);
    await setDoc(docRef, {
      ...profile,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Investor profile saved');
    return true;
  } catch (error) {
    console.error('Error saving investor profile:', error);
    throw error;
  }
};

// ===== HELPER FUNCTIONS (no Firebase) =====

/**
 * Get financing defaults from profile
 */
export const getFinancingDefaults = (profile = DEFAULT_PROFILE) => {
  const f = profile?.financing || DEFAULT_PROFILE.financing;
  return {
    downPaymentPercent: f.downPaymentPercent ?? 20,
    interestRate: f.interestRate ?? 7.0,
    loanTermYears: f.loanTermYears ?? 30,
    closingCostsPercent: f.closingCostsPercent ?? 3,
    cmhcFeePercent: f.cmhcFeePercent ?? 0,
    ltvPercent: 100 - (f.downPaymentPercent ?? 20)
  };
};

/**
 * Get expense defaults from profile
 */
export const getExpenseDefaults = (profile = DEFAULT_PROFILE) => {
  const e = profile?.expenses || DEFAULT_PROFILE.expenses;
  return {
    vacancyRate: e.vacancyRate ?? 5,
    managementRate: e.managementRate ?? 10,
    maintenanceRate: e.maintenanceRate ?? 5,
    capExRate: e.capExRate ?? 5,
    totalRate: (e.vacancyRate ?? 5) + (e.managementRate ?? 10) + (e.maintenanceRate ?? 5) + (e.capExRate ?? 5)
  };
};

/**
 * Get investment targets from profile
 */
export const getInvestmentTargets = (profile = DEFAULT_PROFILE) => {
  const t = profile?.targets || DEFAULT_PROFILE.targets;
  return {
    minCapRate: t.minCapRate ?? 6,
    minCashOnCash: t.minCashOnCash ?? 8,
    minMonthlyCashFlow: t.minMonthlyCashFlow ?? 200,
    minDSCR: t.minDSCR ?? 1.25,
    maxPrice: t.maxPrice ?? 0,
    preferredPropertyTypes: t.preferredPropertyTypes ?? ['single_family', 'multi_family']
  };
};

/**
 * Get investment thresholds (alias for getInvestmentTargets)
 */
export const getInvestmentThresholds = (profile = DEFAULT_PROFILE) => {
  const t = profile?.targets || DEFAULT_PROFILE.targets;
  return {
    minCapRate: t.minCapRate ?? 6,
    minCashOnCash: t.minCashOnCash ?? 8,
    minCashFlow: t.minMonthlyCashFlow ?? 200,
    minDSCR: t.minDSCR ?? 1.25
  };
};

/**
 * Check if profile has preferred location set
 */
export const hasPreferredLocation = (profile) => {
  return !!(profile?.preferredCity || profile?.preferredState || profile?.preferredZip);
};

/**
 * Get preferred location from profile
 */
export const getPreferredLocation = (profile = DEFAULT_PROFILE) => {
  return {
    city: profile.preferredCity || '',
    state: profile.preferredState || '',
    zip: profile.preferredZip || '',
    searchRadius: profile.searchRadius || 25
  };
};

/**
 * Apply a scoring preset to profile
 */
export const applyScoringPreset = (profile, presetName) => {
  const preset = SCORING_PRESETS[presetName];
  if (!preset) {
    console.warn('Unknown preset:', presetName);
    return profile;
  }
  
  return {
    ...profile,
    scoringPreset: presetName,
    targets: {
      ...profile.targets,
      minCapRate: preset.thresholds.minCapRate,
      minCashOnCash: preset.thresholds.minCashOnCash,
      minMonthlyCashFlow: preset.thresholds.minCashFlow,
      minDSCR: preset.thresholds.minDSCR
    },
    scoringWeights: preset.weights
  };
};

/**
 * Get scoring weights from profile
 */
export const getScoringWeights = (profile = DEFAULT_PROFILE) => {
  return profile.scoringWeights || SCORING_PRESETS.moderate.weights;
};

/**
 * Get available scoring presets as array for UI
 */
export const getScoringPresets = () => {
  return [
    { 
      key: 'conservative', 
      icon: '🛡️', 
      label: 'Conservative', 
      description: 'Focus on stable, lower-risk investments',
      ...SCORING_PRESETS.conservative
    },
    { 
      key: 'moderate', 
      icon: '⚖️', 
      label: 'Moderate', 
      description: 'Balanced approach to risk and returns',
      ...SCORING_PRESETS.moderate
    },
    { 
      key: 'aggressive', 
      icon: '🚀', 
      label: 'Aggressive', 
      description: 'Prioritize higher returns, accept more risk',
      ...SCORING_PRESETS.aggressive
    }
  ];
};

/**
 * Get available metrics for scoring configuration
 */
export const getAvailableMetrics = () => {
  return [
    { key: 'capRate', label: 'Cap Rate', description: 'Net Operating Income / Purchase Price', unit: '%' },
    { key: 'cashOnCashROI', label: 'Cash-on-Cash ROI', description: 'Annual Cash Flow / Total Cash Invested', unit: '%' },
    { key: 'monthlyCashFlow', label: 'Monthly Cash Flow', description: 'Monthly Income - Monthly Expenses', unit: '$' },
    { key: 'dcr', label: 'Debt Coverage Ratio', description: 'NOI / Annual Debt Service', unit: 'x' }
  ];
};

/**
 * Calculate score based on profile settings
 */
export const calculateProfileScore = (metrics, profile = DEFAULT_PROFILE) => {
  if (!metrics) return 0;
  
  const thresholds = getInvestmentThresholds(profile);
  const weights = getScoringWeights(profile);
  
  let score = 50;
  
  // Cap rate scoring
  if (metrics.capRate >= thresholds.minCapRate * 1.5) score += 25 * (weights.capRate || 0.25);
  else if (metrics.capRate >= thresholds.minCapRate) score += 15 * (weights.capRate || 0.25);
  else if (metrics.capRate >= thresholds.minCapRate * 0.75) score += 5 * (weights.capRate || 0.25);
  else score -= 10 * (weights.capRate || 0.25);
  
  // Cash on cash scoring
  if (metrics.cashOnCashROI >= thresholds.minCashOnCash * 1.5) score += 25 * (weights.cashOnCash || 0.25);
  else if (metrics.cashOnCashROI >= thresholds.minCashOnCash) score += 15 * (weights.cashOnCash || 0.25);
  else if (metrics.cashOnCashROI >= thresholds.minCashOnCash * 0.75) score += 5 * (weights.cashOnCash || 0.25);
  else score -= 10 * (weights.cashOnCash || 0.25);
  
  // Cash flow scoring
  const cashFlow = metrics.monthlyCashFlow || metrics.cashFlow || 0;
  if (cashFlow >= thresholds.minCashFlow * 2) score += 25 * (weights.cashFlow || 0.3);
  else if (cashFlow >= thresholds.minCashFlow) score += 15 * (weights.cashFlow || 0.3);
  else if (cashFlow >= 0) score += 5 * (weights.cashFlow || 0.3);
  else score -= 15 * (weights.cashFlow || 0.3);
  
  // DSCR scoring
  if (metrics.dscr >= thresholds.minDSCR * 1.5) score += 25 * (weights.dscr || 0.2);
  else if (metrics.dscr >= thresholds.minDSCR) score += 15 * (weights.dscr || 0.2);
  else if (metrics.dscr >= 1.0) score += 5 * (weights.dscr || 0.2);
  else score -= 15 * (weights.dscr || 0.2);
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Check if property meets investment criteria
 */
export const meetsInvestmentCriteria = (metrics, profile = DEFAULT_PROFILE) => {
  if (!metrics) return { meets: false, reasons: ['No metrics available'] };
  
  const targets = getInvestmentTargets(profile);
  const reasons = [];
  let meets = true;

  if (targets.minCapRate > 0 && metrics.capRate < targets.minCapRate) {
    meets = false;
    reasons.push(`Cap rate (${metrics.capRate?.toFixed(1)}%) below target (${targets.minCapRate}%)`);
  }

  if (targets.minCashOnCash > 0 && metrics.cashOnCashROI < targets.minCashOnCash) {
    meets = false;
    reasons.push(`Cash-on-cash (${metrics.cashOnCashROI?.toFixed(1)}%) below target (${targets.minCashOnCash}%)`);
  }

  if (targets.minMonthlyCashFlow > 0 && metrics.monthlyCashFlow < targets.minMonthlyCashFlow) {
    meets = false;
    reasons.push(`Cash flow ($${metrics.monthlyCashFlow?.toFixed(0)}) below target ($${targets.minMonthlyCashFlow})`);
  }

  if (targets.minDSCR > 0 && metrics.dscr < targets.minDSCR) {
    meets = false;
    reasons.push(`DSCR (${metrics.dscr?.toFixed(2)}) below target (${targets.minDSCR})`);
  }

  return { meets, reasons };
};

/**
 * Validate and sanitize profile data
 */
export const validateProfile = (profile) => {
  const validated = { ...DEFAULT_PROFILE };
  
  if (profile.financing) {
    validated.financing = {
      downPaymentPercent: Math.max(0, Math.min(100, profile.financing.downPaymentPercent || 20)),
      interestRate: Math.max(0, Math.min(30, profile.financing.interestRate || 7)),
      loanTermYears: Math.max(1, Math.min(40, profile.financing.loanTermYears || 30)),
      closingCostsPercent: Math.max(0, Math.min(10, profile.financing.closingCostsPercent || 3)),
      cmhcFeePercent: Math.max(0, Math.min(5, profile.financing.cmhcFeePercent || 0))
    };
  }
  
  if (profile.expenses) {
    validated.expenses = {
      vacancyRate: Math.max(0, Math.min(50, profile.expenses.vacancyRate || 5)),
      managementRate: Math.max(0, Math.min(50, profile.expenses.managementRate || 10)),
      maintenanceRate: Math.max(0, Math.min(50, profile.expenses.maintenanceRate || 5)),
      capExRate: Math.max(0, Math.min(50, profile.expenses.capExRate || 5))
    };
  }
  
  if (profile.targets) {
    validated.targets = {
      minCapRate: Math.max(0, profile.targets.minCapRate || 6),
      minCashOnCash: Math.max(0, profile.targets.minCashOnCash || 8),
      minMonthlyCashFlow: Math.max(0, profile.targets.minMonthlyCashFlow || 200),
      minDSCR: Math.max(0, profile.targets.minDSCR || 1.25),
      maxPrice: Math.max(0, profile.targets.maxPrice || 0),
      preferredPropertyTypes: profile.targets.preferredPropertyTypes || DEFAULT_PROFILE.targets.preferredPropertyTypes
    };
  }
  
  return validated;
};

export default {
  DEFAULT_PROFILE,
  SCORING_PRESETS,
  getInvestorProfile,
  saveInvestorProfile,
  getFinancingDefaults,
  getExpenseDefaults,
  getInvestmentTargets,
  getInvestmentThresholds,
  hasPreferredLocation,
  getPreferredLocation,
  applyScoringPreset,
  getScoringWeights,
  getScoringPresets,
  getAvailableMetrics,
  calculateProfileScore,
  meetsInvestmentCriteria,
  validateProfile
};