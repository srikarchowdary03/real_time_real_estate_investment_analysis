/**
 * @file Purchase worksheet with comprehensive investment inputs
 * @module components/analysis/PurchaseWorksheet
 * @description Comprehensive input form for all investment calculation assumptions.
 * Provides interfaces for purchase price, financing, closing costs, rehab costs,
 * rental income, operating expenses, and projection settings. Supports both
 * percentage-based and itemized cost entry with toggle controls.
 * 
 * Key Features:
 * - Purchase price and After Repair Value (ARV) inputs
 * - Financing details (down payment, interest rate, loan term)
 * - Itemized vs percentage-based closing costs
 * - Itemized vs total rehab costs
 * - Rental income and vacancy rate
 * - Operating expenses (taxes, insurance, management, maintenance, CapEx, HOA)
 * - Projection settings (appreciation, income/expense growth, selling costs)
 * - Reset to defaults functionality
 * - Local state management for smooth number entry
 * 
 * INPUT COMPONENTS:
 * Three specialized input components with local state for smooth UX:
 * - CurrencyInput: Dollar amounts with $ prefix
 * - PercentInput: Percentages with % suffix
 * - NumberInput: Plain numbers with optional suffix
 * 
 * All inputs use local state during editing, only sync to parent onBlur.
 * This prevents cursor jumping and allows complete number entry.
 * 
 * @requires react
 * @requires lucide-react
 * @requires ../../utils/investmentCalculations
 * 
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Edit2, GripVertical, RotateCcw, Save, Info } from 'lucide-react';
import { DEFAULTS } from '../../utils/investmentCalculations';

// =============================================================================
// INPUT COMPONENTS - Use local state to allow full number entry
// =============================================================================

/**
 * Currency Input Component
 * 
 * Input field for dollar amounts with $ prefix and local state management.
 * Uses local state during editing to prevent cursor jumping, syncs to parent
 * state onBlur.
 * 
 * BEHAVIOR:
 * - Shows $ prefix always
 * - Allows digits and one decimal point
 * - Blocks all other characters
 * - Syncs value to parent only onBlur
 * - External updates only applied when not focused
 * 
 * @component
 * @param {Object} props - Component props
 * @param {number} props.value - Controlled value from parent
 * @param {Function} props.onChange - Callback to update parent (onBlur only)
 * @param {string} [props.placeholder='0'] - Placeholder text
 * @returns {React.ReactElement} Currency input field
 * 
 * @example
 * <CurrencyInput
 *   value={inputs.offerPrice}
 *   onChange={(val) => onInputChange('offerPrice', val)}
 *   placeholder="250000"
 * />
 */
function CurrencyInput({ value, onChange, placeholder = '0' }) {
    /**
   * Local state for input value during editing
   * Prevents cursor jumping by not syncing on every keystroke
   * @type {Array}
   */
  const [localValue, setLocalValue] = useState(value?.toString() || '');
    /**
   * Ref to input element for focus detection
   * @type {React.MutableRefObject}
   */
  const inputRef = useRef(null);
  
  // Sync when external value changes (but not during typing)
  /**
   * Sync external value to local state when not focused
   * Prevents overwriting user's typing with external updates
   */
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value ? value.toString() : '');
    }
  }, [value]);
  
    /**
   * Handle input change (during typing)
   * Validates input to allow only numbers and decimal point
   * @param {React.ChangeEvent} e - Change event
   */
  const handleChange = (e) => {
    const raw = e.target.value;
    // Allow empty, digits, and one decimal point
    if (raw === '' || /^[0-9]*\.?[0-9]*$/.test(raw)) {
      setLocalValue(raw);
    }
  };
  
    /**
   * Handle blur (when user leaves input)
   * Converts string to number and syncs to parent
   */
  const handleBlur = () => {
    const numValue = parseFloat(localValue) || 0;
    onChange(numValue);
    setLocalValue(numValue > 0 ? numValue.toString() : '');
  };
  
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

/**
 * Percent Input Component
 * 
 * Input field for percentages with % suffix and local state management.
 * Same behavior as CurrencyInput but with % suffix instead of $ prefix.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {number} props.value - Controlled value from parent
 * @param {Function} props.onChange - Callback to update parent (onBlur only)
 * @param {string} [props.placeholder='0'] - Placeholder text
 * @returns {React.ReactElement} Percent input field
 * 
 * @example
 * <PercentInput
 *   value={inputs.vacancyRate}
 *   onChange={(val) => onInputChange('vacancyRate', val)}
 * />
 */
function PercentInput({ value, onChange, placeholder = '0' }) {
/**
   * Local state for input value during editing
   * @type {Array}
   */
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  
  /**
   * Ref to input element for focus detection
   * @type {React.MutableRefObject}
   */
  const inputRef = useRef(null);
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value ? value.toString() : '');
    }
  }, [value]);
  
  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === '' || /^[0-9]*\.?[0-9]*$/.test(raw)) {
      setLocalValue(raw);
    }
  };
  
  const handleBlur = () => {
    const numValue = parseFloat(localValue) || 0;
    onChange(numValue);
    setLocalValue(numValue > 0 ? numValue.toString() : '');
  };
  
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full pr-8 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
    </div>
  );
}

/**
 * Number Input Component
 * 
 * Input field for plain numbers with optional suffix (e.g., "Years").
 * Uses local state management like Currency and Percent inputs.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {number} props.value - Controlled value from parent
 * @param {Function} props.onChange - Callback to update parent (onBlur only)
 * @param {string} [props.suffix=''] - Suffix text (e.g., "Years", "Months")
 * @param {string} [props.placeholder='0'] - Placeholder text
 * @returns {React.ReactElement} Number input field
 * 
 * @example
 * <NumberInput
 *   value={inputs.firstMtgAmortization}
 *   onChange={(val) => onInputChange('firstMtgAmortization', val)}
 *   suffix="Years"
 * />
 */
function NumberInput({ value, onChange, suffix = '', placeholder = '0' }) {
    /**
   * Local state for input value during editing
   * @type {Array}
   */
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  
  /**
   * Ref to input element for focus detection
   * @type {React.MutableRefObject}
   */
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value ? value.toString() : '');
    }
  }, [value]);
  
  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === '' || /^[0-9]*\.?[0-9]*$/.test(raw)) {
      setLocalValue(raw);
    }
  };
  
  const handleBlur = () => {
    const numValue = parseFloat(localValue) || 0;
    onChange(numValue);
    setLocalValue(numValue > 0 ? numValue.toString() : '');
  };
  
  return (
    <div className="relative flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {suffix && <span className="text-gray-500 whitespace-nowrap">{suffix}</span>}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Purchase Worksheet Main Component
 * 
 * Comprehensive input form for all investment calculation assumptions. Organizes
 * inputs into logical sections: Purchase, Financing, Costs, Income, Expenses, Projections.
 * 
 * STATE MANAGEMENT:
 * - useFinancing: Toggle financing vs all-cash
 * - loanType: Amortizing vs interest-only
 * - itemizePurchaseCosts: Toggle percentage vs itemized closing costs
 * - itemizeRehabCosts: Toggle total vs itemized rehab
 * - purchaseCostItems: Array of itemized closing cost line items
 * - rehabCostItems: Array of itemized rehab line items
 * - isInitialized: Flag to prevent re-initialization
 * 
 * INITIALIZATION:
 * - Runs once on mount to set default values
 * - Pulls from property data, investor profile, and DEFAULTS
 * - Critical: Sets purchase costs to 3% default
 * - Loads saved itemizations if available
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.property - Property data
 * @param {Object} props.inputs - Current input values from parent
 * @param {Function} props.onInputChange - Callback to update parent inputs
 * @param {Function} [props.onSave] - Callback to save worksheet
 * @returns {React.ReactElement} Purchase worksheet form
 * 
 * @example
 * <PurchaseWorksheet
 *   property={propertyData}
 *   inputs={calculationInputs}
 *   onInputChange={(field, value) => setInputs({...inputs, [field]: value})}
 *   onSave={handleSaveAnalysis}
 * />
 */
export default function PurchaseWorksheet({ property, inputs, onInputChange, onSave }) {
 /**
   * Whether financing is enabled (vs all-cash)
   * @type {Array}
   */
  const [useFinancing, setUseFinancing] = useState(true);
  
  /**
   * Loan type selection (amortizing vs interest-only)
   * @type {Array}
   */
  const [loanType, setLoanType] = useState('amortizing');
  
  /**
   * Whether to itemize purchase/closing costs
   * @type {Array}
   */
  const [itemizePurchaseCosts, setItemizePurchaseCosts] = useState(false);
  
  /**
   * Whether to itemize rehab/repair costs
   * @type {Array}
   */
  const [itemizeRehabCosts, setItemizeRehabCosts] = useState(false);
  
  /**
   * Whether PMI (Private Mortgage Insurance) is enabled
   * @type {Array}
   */
  const [enablePMI, setEnablePMI] = useState(false);
  
  /**
   * Initialization flag to prevent re-initialization
   * @type {Array}
   */
  const [isInitialized, setIsInitialized] = useState(false);
  
  /**
   * Itemized purchase/closing cost line items
   * @type {Array}
   * @property {string} [].name - Cost item name
   * @property {number} [].value - Cost item value
   */
  const [purchaseCostItems, setPurchaseCostItems] = useState([
    { name: 'Home Inspection', value: 0 },
    { name: 'Appraisal', value: 0 },
    { name: 'Loan Points', value: 0 },
    { name: 'Lender Fees', value: 0 },
    { name: 'Title & Escrow', value: 0 },
    { name: 'Transfer Taxes', value: 0 },
    { name: 'Attorney Fees', value: 0 }
  ]);

    /**
   * Itemized rehab cost line items
   * @type {Array}
   * @property {string} [].name - Rehab item name
   * @property {number} [].value - Rehab item value
   */
  const [rehabCostItems, setRehabCostItems] = useState([
    { name: 'Roof', value: 0 },
    { name: 'Exterior', value: 0 },
    { name: 'Windows', value: 0 },
    { name: 'Interior Paint', value: 0 },
    { name: 'Flooring', value: 0 },
    { name: 'Kitchen', value: 0 },
    { name: 'Bathrooms', value: 0 },
    { name: 'HVAC', value: 0 },
    { name: 'Electrical', value: 0 },
    { name: 'Plumbing', value: 0 }
  ]);

/**
   * Get purchase price from multiple sources
   * 
   * Tries inputs, then property data, with fallback to 0.
   * 
   * @function
   * @callback
   * @returns {number} Purchase price
   */
  const getPurchasePrice = useCallback(() => {
    return inputs?.offerPrice || property?.price || property?.propertyData?.price || 0;
  }, [inputs?.offerPrice, property?.price, property?.propertyData?.price]);

  /**
   * Get monthly rent estimate
   * 
   * Priority order:
   * 1. RentCast data
   * 2. Property rent estimate
   * 3. Calculated from grossRents input
   * 4. Formula-based estimation (0.7% of price)
   * 
   * @function
   * @callback
   * @returns {number} Monthly rent estimate
   */
  const getRentValue = useCallback(() => {
    if (property?.rentCastData?.rentEstimate) return property.rentCastData.rentEstimate;
    if (property?.rentEstimate) return property.rentEstimate;
    if (inputs?.grossRents > 0) return inputs.grossRents / 12;
    const price = getPurchasePrice();
    return price > 0 ? Math.round((price * 0.007) / 50) * 50 : 0;
  }, [property, inputs?.grossRents, getPurchasePrice]);

  /**
   * Initialize defaults ONCE on mount
   * 
   * CRITICAL INITIALIZATION:
   * Sets all default values for inputs if not already set. Pulls from:
   * 1. Existing inputs (if already set)
   * 2. Property data (price, rent)
   * 3. DEFAULTS constant (financing, expenses, projections)
   * 
   * IMPORTANT: Sets purchaseCostsPercent to 3% and calculates total.
   * This ensures calculations have closing costs even if user doesn't edit.
   * 
   * Loads saved itemizations if available in inputs.
   * 
   * Runs only once when isInitialized is false.
   * 
   * @listens inputs
   * @listens property
   * @listens isInitialized
   */
  useEffect(() => {
    if (isInitialized) return;
    
    const price = getPurchasePrice();
    const monthlyRent = getRentValue();
    
    console.log('🔧 Initializing worksheet:', { price, monthlyRent });
    
    // Set purchase price
    if (!inputs?.offerPrice && price > 0) {
      onInputChange('offerPrice', price);
    }
    
    // Set ARV
    if (!inputs?.fairMarketValue && price > 0) {
      onInputChange('fairMarketValue', price);
    }
    
    // Set gross rents
    if (!inputs?.grossRents && monthlyRent > 0) {
      onInputChange('grossRents', monthlyRent * 12);
    }
    
    // CRITICAL: Set purchase costs to 3% default
    if (inputs?.purchaseCostsPercent === undefined || inputs?.purchaseCostsPercent === null) {
      onInputChange('purchaseCostsPercent', DEFAULTS.purchaseCostsPercent);
    }
    
    // Calculate and set total based on percentage
    const percent = inputs?.purchaseCostsPercent ?? DEFAULTS.purchaseCostsPercent;
    const calculatedTotal = price * (percent / 100);
    if (!inputs?.purchaseCostsTotal || inputs.purchaseCostsTotal === 0) {
      onInputChange('purchaseCostsTotal', calculatedTotal);
    }
    
    // Set other defaults using DEFAULTS from calculator
    const defaultsToSet = {
      firstMtgLTV: DEFAULTS.ltv,
      firstMtgRate: DEFAULTS.interestRate,
      firstMtgAmortization: DEFAULTS.amortization,
      vacancyRate: DEFAULTS.vacancyRate,
      managementRate: DEFAULTS.managementRate,
      maintenancePercent: DEFAULTS.repairsPercent,
      capExPercent: 5.0,
      appreciationRate: DEFAULTS.appreciationRate,
      incomeGrowthRate: 2.0,
      expenseGrowthRate: 2.0,
      sellingCosts: 6.0
    };
    
    Object.entries(defaultsToSet).forEach(([key, val]) => {
      if (inputs?.[key] === undefined || inputs?.[key] === null) {
        onInputChange(key, val);
      }
    });
    
    // Load any saved itemized costs
    if (inputs?.itemizedPurchaseCosts?.length > 0) {
      setPurchaseCostItems(inputs.itemizedPurchaseCosts);
      setItemizePurchaseCosts(true);
    }
    if (inputs?.itemizedRehabCosts?.length > 0) {
      setRehabCostItems(inputs.itemizedRehabCosts);
      setItemizeRehabCosts(true);
    }
    
    setIsInitialized(true);
  }, [inputs, property, onInputChange, getPurchasePrice, getRentValue, isInitialized]);

   /**
   * Format number as USD currency
   * @function
   * @param {number} value - Dollar amount
   * @returns {string} Formatted currency (e.g., "$250,000")
   */
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

/**
 * Purchase Worksheet - Handler Functions and Helper Components
 */

/**
 * Handle purchase price change
 * 
 * Updates offer price and automatically recalculates closing costs
 * based on current percentage setting.
 * 
 * @function
 * @param {number} value - New purchase price
 * 
 * @example
 * handlePurchasePriceChange(275000);
 * // -> Sets offerPrice to 275000
 * // -> Recalculates purchaseCostsTotal: 275000 * 3% = 8,250
 */
  const handlePurchasePriceChange = (value) => {
    onInputChange('offerPrice', value);
    const percent = inputs?.purchaseCostsPercent ?? DEFAULTS.purchaseCostsPercent;
    onInputChange('purchaseCostsTotal', value * (percent / 100));
  };

  /**
 * Handle purchase cost percentage change
 * 
 * Updates closing cost percentage and recalculates total based on
 * current purchase price.
 * 
 * @function
 * @param {number} percent - New percentage (e.g., 3.5 for 3.5%)
 * 
 * @example
 * handlePurchaseCostPercentChange(4.0);
 * // -> Sets purchaseCostsPercent to 4.0%
 * // -> Recalculates total: price * 4% = new total
 */
  const handlePurchaseCostPercentChange = (percent) => {
    onInputChange('purchaseCostsPercent', percent);
    onInputChange('purchaseCostsTotal', getPurchasePrice() * (percent / 100));
  };

/**
 * Handle itemized purchase cost value change
 * 
 * Updates specific line item and recalculates total from all items.
 * 
 * @function
 * @param {number} index - Item index in array
 * @param {number} value - New item value
 */
  const handlePurchaseCostChange = (index, value) => {
    const newItems = [...purchaseCostItems];
    newItems[index].value = value;
    setPurchaseCostItems(newItems);
    onInputChange('itemizedPurchaseCosts', newItems);
    onInputChange('purchaseCostsTotal', newItems.reduce((sum, item) => sum + (item.value || 0), 0));
  };

  /**
 * Add new itemized purchase cost
 * 
 * @function
 */
  const handleAddPurchaseCost = () => {
    const newItems = [...purchaseCostItems, { name: 'New Cost', value: 0 }];
    setPurchaseCostItems(newItems);
    onInputChange('itemizedPurchaseCosts', newItems);
  };

  /**
 * Delete itemized purchase cost
 * 
 * @function
 * @param {number} index - Item index to delete
 */
  const handleDeletePurchaseCost = (index) => {
    const newItems = purchaseCostItems.filter((_, i) => i !== index);
    setPurchaseCostItems(newItems);
    onInputChange('itemizedPurchaseCosts', newItems);
    onInputChange('purchaseCostsTotal', newItems.reduce((sum, item) => sum + (item.value || 0), 0));
  };

  /**
 * Handle itemized rehab cost value change
 * 
 * @function
 * @param {number} index - Item index
 * @param {number} value - New value
 */
  const handleRehabCostChange = (index, value) => {
    const newItems = [...rehabCostItems];
    newItems[index].value = value;
    setRehabCostItems(newItems);
    onInputChange('itemizedRehabCosts', newItems);
    onInputChange('repairs', newItems.reduce((sum, item) => sum + (item.value || 0), 0));
  };

  /**
 * Add new itemized rehab cost
 * 
 * @function
 */
  const handleAddRehabCost = () => {
    const newItems = [...rehabCostItems, { name: 'New Item', value: 0 }];
    setRehabCostItems(newItems);
    onInputChange('itemizedRehabCosts', newItems);
  };

  /**
 * Delete itemized rehab cost
 * 
 * @function
 * @param {number} index - Item index to delete
 */
  const handleDeleteRehabCost = (index) => {
    const newItems = rehabCostItems.filter((_, i) => i !== index);
    setRehabCostItems(newItems);
    onInputChange('itemizedRehabCosts', newItems);
    onInputChange('repairs', newItems.reduce((sum, item) => sum + (item.value || 0), 0));
  };

  /**
 * Toggle itemized purchase costs on/off
 * 
 * Switches between percentage-based and itemized closing costs.
 * When enabling: saves current items array
 * When disabling: clears items and reverts to percentage-based
 * 
 * @function
 */
  const handleTogglePurchaseCosts = () => {
    setItemizePurchaseCosts(!itemizePurchaseCosts);
    if (!itemizePurchaseCosts) {
      onInputChange('itemizedPurchaseCosts', purchaseCostItems);
    } else {
      onInputChange('itemizedPurchaseCosts', []);
      // Reset to percentage-based
      handlePurchaseCostPercentChange(DEFAULTS.purchaseCostsPercent);
    }
  };

  /**
 * Toggle itemized rehab costs on/off
 * 
 * Switches between total amount and itemized rehab costs.
 * 
 * @function
 */
  const handleToggleRehabCosts = () => {
    setItemizeRehabCosts(!itemizeRehabCosts);
    if (!itemizeRehabCosts) {
      onInputChange('itemizedRehabCosts', rehabCostItems);
    } else {
      onInputChange('itemizedRehabCosts', []);
    }
  };

  /**
 * Reset all values to defaults
 * 
 * Prompts for confirmation, then resets all inputs to default values.
 * Clears all itemizations and returns to percentage-based costs.
 * 
 * @function
 */
  const handleReset = () => {
    if (!window.confirm('Reset all values to defaults?')) return;
    
    const price = getPurchasePrice();
    const rent = getRentValue();
    
    const defaults = {
      offerPrice: price,
      fairMarketValue: price,
      purchaseCostsPercent: DEFAULTS.purchaseCostsPercent,
      purchaseCostsTotal: price * (DEFAULTS.purchaseCostsPercent / 100),
      repairs: 0,
      firstMtgLTV: DEFAULTS.ltv,
      firstMtgRate: DEFAULTS.interestRate,
      firstMtgAmortization: DEFAULTS.amortization,
      grossRents: rent * 12,
      vacancyRate: DEFAULTS.vacancyRate,
      managementRate: DEFAULTS.managementRate,
      maintenancePercent: DEFAULTS.repairsPercent,
      capExPercent: 5.0,
      appreciationRate: DEFAULTS.appreciationRate,
      propertyTaxes: 0,
      insurance: 0,
      associationFees: 0,
      electricity: 0,
      itemizedPurchaseCosts: [],
      itemizedRehabCosts: []
    };
    
    Object.entries(defaults).forEach(([key, val]) => onInputChange(key, val));
    setItemizePurchaseCosts(false);
    setItemizeRehabCosts(false);
    setPurchaseCostItems([
      { name: 'Home Inspection', value: 0 },
      { name: 'Appraisal', value: 0 },
      { name: 'Loan Points', value: 0 },
      { name: 'Lender Fees', value: 0 },
      { name: 'Title & Escrow', value: 0 },
      { name: 'Transfer Taxes', value: 0 },
      { name: 'Attorney Fees', value: 0 }
    ]);
    setRehabCostItems([
      { name: 'Roof', value: 0 },
      { name: 'Exterior', value: 0 },
      { name: 'Windows', value: 0 },
      { name: 'Interior Paint', value: 0 },
      { name: 'Flooring', value: 0 },
      { name: 'Kitchen', value: 0 },
      { name: 'Bathrooms', value: 0 },
      { name: 'HVAC', value: 0 },
      { name: 'Electrical', value: 0 },
      { name: 'Plumbing', value: 0 }
    ]);
  };

  /**
 * Calculate totals based on current mode
 * 
 * Purchase costs: Sum of items if itemized, otherwise percentage of price
 * Rehab costs: Sum of items if itemized, otherwise total input
 * 
 * @type {number}
 */
  const purchaseCostsTotal = itemizePurchaseCosts 
    ? purchaseCostItems.reduce((sum, item) => sum + (item.value || 0), 0)
    : (inputs?.purchaseCostsTotal || getPurchasePrice() * (DEFAULTS.purchaseCostsPercent / 100));
    
  const rehabCostsTotal = itemizeRehabCosts
    ? rehabCostItems.reduce((sum, item) => sum + (item.value || 0), 0)
    : (inputs?.repairs || 0);

    /**
 * Down payment percentage (100 - LTV)
 * @type {number}
 */
  const downPaymentPercent = 100 - (inputs?.firstMtgLTV || DEFAULTS.ltv);
  /**
 * Down payment dollar amount
 * @type {number}
 */
  const downPaymentAmount = (inputs?.offerPrice || 0) * (downPaymentPercent / 100);
  /**
 * Loan amount (price × LTV)
 * @type {number}
 */
  const loanAmount = (inputs?.offerPrice || 0) * ((inputs?.firstMtgLTV || DEFAULTS.ltv) / 100);

  /**
 * Toggle Switch Component
 * 
 * Reusable toggle switch for boolean settings.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.enabled - Current toggle state
 * @param {Function} props.onChange - Callback when toggled
 * @param {string} props.label - Toggle label text
 * @param {string} [props.desc] - Optional description text
 * @returns {React.ReactElement} Toggle switch
 */
  const Toggle = ({ enabled, onChange, label, desc }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        {desc && <div className="text-sm text-gray-500">{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );

  /**
 * Itemized Row Component
 * 
 * Single row in itemized costs list with editable value and delete button.
 * Uses local state for smooth editing experience.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.item - Cost item
 * @param {string} props.item.name - Item name
 * @param {number} props.item.value - Item value
 * @param {number} props.index - Item index in array
 * @param {Function} props.onValueChange - Callback when value changes
 * @param {Function} props.onDelete - Callback to delete item
 * @returns {React.ReactElement} Itemized cost row
 */
  const ItemRow = ({ item, index, onValueChange, onDelete }) => {
    const [localVal, setLocalVal] = useState(item.value?.toString() || '');
    
    return (
      <div className="flex items-center gap-2 py-2 border-b border-gray-100 group">
        <GripVertical className="w-4 h-4 text-gray-300" />
        <span className="flex-1 text-sm font-medium text-gray-700">{item.name}:</span>
        <div className="relative w-28">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={localVal}
            onChange={(e) => {
              if (e.target.value === '' || /^[0-9]*\.?[0-9]*$/.test(e.target.value)) {
                setLocalVal(e.target.value);
              }
            }}
            onBlur={() => {
              const num = parseFloat(localVal) || 0;
              onValueChange(index, num);
              setLocalVal(num > 0 ? num.toString() : '');
            }}
            className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded text-sm"
          />
        </div>
        <button 
          onClick={() => onDelete(index)} 
          className="p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Worksheet</h1>
          <p className="text-sm text-gray-500 mt-1">Customize purchase, financing, and expenses</p>
        </div>
        <button 
          onClick={onSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      {/* Purchase Price */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-blue-600 mb-4">PURCHASE PRICE</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price:</label>
            <CurrencyInput value={inputs?.offerPrice || 0} onChange={handlePurchasePriceChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">After Repair Value (ARV):</label>
            <CurrencyInput value={inputs?.fairMarketValue || 0} onChange={(v) => onInputChange('fairMarketValue', v)} />
          </div>
        </div>
      </div>

      {/* Financing */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-blue-600 mb-4">FINANCING</h2>
        <Toggle enabled={useFinancing} onChange={setUseFinancing} label="Use Financing" desc="Disable for all-cash purchase" />

        {useFinancing && (
          <div className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment:</label>
              <div className="flex items-center gap-3">
                <div className="w-24">
                  <PercentInput value={downPaymentPercent} onChange={(v) => onInputChange('firstMtgLTV', 100 - v)} />
                </div>
                <span className="text-gray-500">=</span>
                <span className="font-semibold">{formatCurrency(downPaymentAmount)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{inputs?.firstMtgLTV || DEFAULTS.ltv}% Financed = {formatCurrency(loanAmount)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loan Type:</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setLoanType('amortizing')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                    loanType === 'amortizing' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Amortizing
                </button>
                <button
                  onClick={() => setLoanType('interest-only')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                    loanType === 'interest-only' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Interest-Only
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate:</label>
              <PercentInput value={inputs?.firstMtgRate || DEFAULTS.interestRate} onChange={(v) => onInputChange('firstMtgRate', v)} />
            </div>

            {loanType === 'amortizing' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Term:</label>
                <NumberInput value={inputs?.firstMtgAmortization || DEFAULTS.amortization} onChange={(v) => onInputChange('firstMtgAmortization', v)} suffix="Years" />
              </div>
            )}

            <Toggle enabled={enablePMI} onChange={setEnablePMI} label="PMI" desc="Mortgage insurance for <20% down" />
          </div>
        )}
      </div>

      {/* Purchase Costs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-blue-600 mb-2">PURCHASE COSTS (Closing Costs)</h2>
        <p className="text-sm text-gray-500 mb-4">Default: 3% of purchase price</p>
        
        <Toggle enabled={itemizePurchaseCosts} onChange={handleTogglePurchaseCosts} label="Itemize Costs" desc="Toggle to itemize or use percentage" />

        {itemizePurchaseCosts ? (
          <div className="mt-4">
            {purchaseCostItems.map((item, i) => (
              <ItemRow key={i} item={item} index={i} onValueChange={handlePurchaseCostChange} onDelete={handleDeletePurchaseCost} />
            ))}
            <button onClick={handleAddPurchaseCost} className="mt-3 text-blue-600 text-sm font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Item
            </button>
            <div className="mt-4 pt-4 border-t flex justify-between">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-blue-600 text-lg">{formatCurrency(purchaseCostsTotal)}</span>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">% of Purchase Price:</label>
            <div className="flex items-center gap-3">
              <div className="w-24">
                <PercentInput 
                  value={inputs?.purchaseCostsPercent ?? DEFAULTS.purchaseCostsPercent} 
                  onChange={handlePurchaseCostPercentChange} 
                />
              </div>
              <span className="text-gray-500">=</span>
              <span className="font-bold text-blue-600 text-lg">{formatCurrency(purchaseCostsTotal)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Based on {formatCurrency(inputs?.offerPrice || 0)} purchase price</p>
          </div>
        )}
      </div>

      {/* Rehab Costs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-blue-600 mb-2">REHAB COSTS</h2>
        <Toggle enabled={itemizeRehabCosts} onChange={handleToggleRehabCosts} label="Itemize Repairs" desc="Toggle to itemize or enter total" />

        {itemizeRehabCosts ? (
          <div className="mt-4">
            {rehabCostItems.map((item, i) => (
              <ItemRow key={i} item={item} index={i} onValueChange={handleRehabCostChange} onDelete={handleDeleteRehabCost} />
            ))}
            <button onClick={handleAddRehabCost} className="mt-3 text-blue-600 text-sm font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Item
            </button>
            <div className="mt-4 pt-4 border-t flex justify-between">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-green-600 text-lg">{formatCurrency(rehabCostsTotal)}</span>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Rehab:</label>
            <CurrencyInput value={inputs?.repairs || 0} onChange={(v) => onInputChange('repairs', v)} />
          </div>
        )}
      </div>

      {/* Rental Income */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-blue-600 mb-4">RENTAL INCOME</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent:</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <CurrencyInput 
                  value={Math.round((inputs?.grossRents || 0) / 12)} 
                  onChange={(v) => onInputChange('grossRents', v * 12)} 
                />
              </div>
              <span className="text-gray-500">/ month</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Annual: {formatCurrency(inputs?.grossRents || 0)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vacancy Rate:</label>
            <PercentInput value={inputs?.vacancyRate || DEFAULTS.vacancyRate} onChange={(v) => onInputChange('vacancyRate', v)} />
          </div>
        </div>
      </div>

      {/* Operating Expenses */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-blue-600 mb-4">OPERATING EXPENSES</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Taxes (Annual):</label>
            <CurrencyInput value={inputs?.propertyTaxes || 0} onChange={(v) => onInputChange('propertyTaxes', v)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Insurance (Annual):</label>
            <CurrencyInput value={inputs?.insurance || 0} onChange={(v) => onInputChange('insurance', v)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Management (% of rent):</label>
            <PercentInput value={inputs?.managementRate || DEFAULTS.managementRate} onChange={(v) => onInputChange('managementRate', v)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance (% of rent):</label>
            <PercentInput value={inputs?.maintenancePercent || DEFAULTS.repairsPercent} onChange={(v) => onInputChange('maintenancePercent', v)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CapEx (% of rent):</label>
            <PercentInput value={inputs?.capExPercent || 5} onChange={(v) => onInputChange('capExPercent', v)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HOA (Monthly):</label>
            <CurrencyInput value={inputs?.associationFees || 0} onChange={(v) => onInputChange('associationFees', v)} />
          </div>
        </div>
      </div>

      {/* Projections */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-blue-600 mb-4">PROJECTIONS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Appreciation (% / year):</label>
            <PercentInput value={inputs?.appreciationRate || DEFAULTS.appreciationRate} onChange={(v) => onInputChange('appreciationRate', v)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Income Growth (% / year):</label>
            <PercentInput value={inputs?.incomeGrowthRate || 2} onChange={(v) => onInputChange('incomeGrowthRate', v)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expense Growth (% / year):</label>
            <PercentInput value={inputs?.expenseGrowthRate || 2} onChange={(v) => onInputChange('expenseGrowthRate', v)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Costs (%):</label>
            <PercentInput value={inputs?.sellingCosts || 6} onChange={(v) => onInputChange('sellingCosts', v)} />
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="flex justify-center pt-4">
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-2.5 border-2 border-red-400 text-red-500 rounded-lg hover:bg-red-50 font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}