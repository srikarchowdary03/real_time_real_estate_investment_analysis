import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';

export default function PurchaseWorksheet({ property, inputs, onInputChange, onSave }) {
  const [useFinancing, setUseFinancing] = useState(true);
  const [loanType, setLoanType] = useState('amortizing');
  const [itemizePurchaseCosts, setItemizePurchaseCosts] = useState(false);
  const [itemizeRehabCosts, setItemizeRehabCosts] = useState(false);
  
  const [purchaseCostItems, setPurchaseCostItems] = useState([
    { name: 'Home Inspection', value: 0, unit: 'Per Building, Pay Upfront' },
    { name: 'Appraisal', value: 0, unit: 'Per Building, Pay Upfront' },
    { name: 'Loan Points', value: 0, unit: '% of Loan' },
    { name: 'Lender Fees', value: 0, unit: 'Per Building, Pay Upfront' },
    { name: 'Title & Escrow Fees', value: 0, unit: 'Per Building, Pay Upfront' },
    { name: 'Transfer Taxes', value: 0, unit: 'Per Building, Pay Upfront' },
    { name: 'Attorney Fees', value: 0, unit: 'Per Building, Pay Upfront' },
    { name: 'Wholesaler Fees', value: 0, unit: 'Per Building, Pay Upfront' }
  ]);

  const [rehabCostItems, setRehabCostItems] = useState([
    { name: 'Roof', value: 0, unit: 'Per Building' },
    { name: 'Exterior Siding', value: 0, unit: 'Per Building' },
    { name: 'Exterior Paint', value: 0, unit: 'Per Building' },
    { name: 'Windows', value: 0, unit: 'Per Building' },
    { name: 'Landscaping', value: 0, unit: 'Per Building' },
    { name: 'Interior Paint', value: 0, unit: 'Per Building' },
    { name: 'Flooring', value: 0, unit: 'Per Building' },
    { name: 'Kitchen', value: 0, unit: 'Per Building' },
    { name: 'Bathrooms', value: 0, unit: 'Per Building' },
    { name: 'Electrical', value: 0, unit: 'Per Building' },
    { name: 'Plumbing', value: 0, unit: 'Per Building' },
    { name: 'Appliances', value: 0, unit: 'Per Building' },
    { name: 'HVAC', value: 0, unit: 'Per Building' }
  ]);

  // Load saved itemized costs from inputs
  useEffect(() => {
    if (inputs.itemizedPurchaseCosts && inputs.itemizedPurchaseCosts.length > 0) {
      setPurchaseCostItems(inputs.itemizedPurchaseCosts);
      setItemizePurchaseCosts(true);
    }
    if (inputs.itemizedRehabCosts && inputs.itemizedRehabCosts.length > 0) {
      setRehabCostItems(inputs.itemizedRehabCosts);
      setItemizeRehabCosts(true);
    }
  }, []);

  // Reset worksheet to defaults
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all values to defaults?')) {
      // Reset to default values
      const defaultInputs = {
        // Purchase Info
        offerPrice: property.price || 0,
        purchaseCostsPercent: 3, // 3% default
        purchaseCostsTotal: (property.price || 0) * 0.03,
        repairs: 0,
        
        // Financing
        firstMtgLTV: 80,
        firstMtgRate: 6.0,
        firstMtgAmortization: 30,
        
        // Income
        grossRents: (property.zillowData?.rent || 0) * 12,
        
        // Expenses
        vacancyRate: 10.0,
        managementRate: 10.0,
        maintenancePercent: 10.0,
        capExPercent: 5.0,
        
        // Projections
        appreciationRate: 3.0,
        incomeGrowthRate: 2.0,
        expenseGrowthRate: 2.0,
        sellingCosts: 6.0
      };
      
      // Apply all defaults
      Object.entries(defaultInputs).forEach(([key, value]) => {
        onInputChange(key, value);
      });
      
      // Reset itemized costs
      setPurchaseCostItems([
        { name: 'Home Inspection', value: 0, unit: 'Per Building, Pay Upfront' },
        { name: 'Appraisal', value: 0, unit: 'Per Building, Pay Upfront' },
        { name: 'Loan Points', value: 0, unit: '% of Loan' },
        { name: 'Lender Fees', value: 0, unit: 'Per Building, Pay Upfront' },
        { name: 'Title & Escrow Fees', value: 0, unit: 'Per Building, Pay Upfront' },
        { name: 'Transfer Taxes', value: 0, unit: 'Per Building, Pay Upfront' },
        { name: 'Attorney Fees', value: 0, unit: 'Per Building, Pay Upfront' },
        { name: 'Wholesaler Fees', value: 0, unit: 'Per Building, Pay Upfront' }
      ]);
      
      setRehabCostItems([
        { name: 'Roof', value: 0, unit: 'Per Building' },
        { name: 'Exterior Siding', value: 0, unit: 'Per Building' },
        { name: 'Exterior Paint', value: 0, unit: 'Per Building' },
        { name: 'Windows', value: 0, unit: 'Per Building' },
        { name: 'Landscaping', value: 0, unit: 'Per Building' },
        { name: 'Interior Paint', value: 0, unit: 'Per Building' },
        { name: 'Flooring', value: 0, unit: 'Per Building' },
        { name: 'Kitchen', value: 0, unit: 'Per Building' },
        { name: 'Bathrooms', value: 0, unit: 'Per Building' },
        { name: 'Electrical', value: 0, unit: 'Per Building' },
        { name: 'Plumbing', value: 0, unit: 'Per Building' },
        { name: 'Appliances', value: 0, unit: 'Per Building' },
        { name: 'HVAC', value: 0, unit: 'Per Building' }
      ]);
      
      setItemizePurchaseCosts(false);
      setItemizeRehabCosts(false);
      
      alert('Worksheet reset to default values!');
    }
  };

  // Calculate total purchase costs
  const totalPurchaseCosts = purchaseCostItems.reduce((sum, item) => sum + (item.value || 0), 0);
  
  // Calculate total rehab costs
  const totalRehabCosts = rehabCostItems.reduce((sum, item) => sum + (item.value || 0), 0);

  const handlePurchaseCostChange = (index, value) => {
    const newItems = [...purchaseCostItems];
    newItems[index].value = value;
    setPurchaseCostItems(newItems);
    
    // Sync with parent state
    onInputChange('itemizedPurchaseCosts', newItems);
    
    // Update total purchase costs in calculations
    const total = newItems.reduce((sum, item) => sum + (item.value || 0), 0);
    onInputChange('purchaseCostsTotal', total);
  };

  const handleAddPurchaseCost = () => {
    const newItems = [...purchaseCostItems, { name: 'New Cost', value: 0, unit: 'Per Building' }];
    setPurchaseCostItems(newItems);
    onInputChange('itemizedPurchaseCosts', newItems);
  };

  const handleDeletePurchaseCost = (index) => {
    const newItems = purchaseCostItems.filter((_, i) => i !== index);
    setPurchaseCostItems(newItems);
    onInputChange('itemizedPurchaseCosts', newItems);
    
    // Update total
    const total = newItems.reduce((sum, item) => sum + (item.value || 0), 0);
    onInputChange('purchaseCostsTotal', total);
  };

  const handleRehabCostChange = (index, value) => {
    const newItems = [...rehabCostItems];
    newItems[index].value = value;
    setRehabCostItems(newItems);
    
    // Sync with parent state
    onInputChange('itemizedRehabCosts', newItems);
    
    // Update total rehab costs in calculations
    const total = newItems.reduce((sum, item) => sum + (item.value || 0), 0);
    onInputChange('repairs', total);
  };

  const handleAddRehabCost = () => {
    const newItems = [...rehabCostItems, { name: 'New Item', value: 0, unit: 'Per Building' }];
    setRehabCostItems(newItems);
    onInputChange('itemizedRehabCosts', newItems);
  };

  const handleDeleteRehabCost = (index) => {
    const newItems = rehabCostItems.filter((_, i) => i !== index);
    setRehabCostItems(newItems);
    onInputChange('itemizedRehabCosts', newItems);
    
    // Update total
    const total = newItems.reduce((sum, item) => sum + (item.value || 0), 0);
    onInputChange('repairs', total);
  };

  const handleTogglePurchaseCosts = () => {
    const newValue = !itemizePurchaseCosts;
    setItemizePurchaseCosts(newValue);
    
    if (newValue) {
      // Switching to itemized - save current items
      onInputChange('itemizedPurchaseCosts', purchaseCostItems);
    } else {
      // Switching to total - clear itemized and keep total
      onInputChange('itemizedPurchaseCosts', []);
    }
  };

  const handleToggleRehabCosts = () => {
    const newValue = !itemizeRehabCosts;
    setItemizeRehabCosts(newValue);
    
    if (newValue) {
      // Switching to itemized - save current items
      onInputChange('itemizedRehabCosts', rehabCostItems);
    } else {
      // Switching to total - clear itemized and keep total
      onInputChange('itemizedRehabCosts', []);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const InputField = ({ label, field, prefix = '', suffix = '', percentage = false, info = null }) => (
    <div className="mb-4">
      <label className="flex items-center gap-2 text-sm text-gray-700 mb-1">
        {label}:
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={inputs[field] || 0}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            onInputChange(field, parseFloat(value) || 0);
          }}
          className={`w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            prefix ? 'pl-8' : ''
          } ${suffix ? 'pr-16' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {suffix}
          </span>
        )}
        {percentage && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            %
          </span>
        )}
      </div>
      {info && <p className="text-xs text-gray-500 mt-1">{info}</p>}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Purchase Worksheet</h1>
          <button 
            onClick={onSave}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
        <p className="text-gray-600">
          Use this worksheet to customize the purchase, financing, closing costs, rent and expenses for this rental.{' '}
          <a href="#" className="text-blue-600 hover:underline">View tutorial</a>
        </p>
      </div>

      {/* Purchase Price Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <InputField 
          label="Purchase Price" 
          field="offerPrice" 
          prefix="$"
          info=""
        />

        <InputField 
          label="After Repair Value" 
          field="fairMarketValue" 
          prefix="$"
          info="If no repairs are necessary, the after repair value is the same as the current market value."
        />
        <div className="mt-2">
          <a href="#" className="text-blue-600 hover:underline text-sm">
            View recent sales comps
          </a>
          <span className="text-gray-600 text-sm"> to help you determine the after repair value of this property.</span>
        </div>
      </div>

      {/* Financing Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">FINANCING (Purchase)</h2>
        <p className="text-gray-600 text-sm mb-4">
          Customize traditional or creative financing you will use for this property.{' '}
          <a href="#" className="text-blue-600 hover:underline">View tutorial</a>
        </p>

        {/* Use Financing Toggle */}
        <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 rounded">
          <div>
            <div className="font-medium">Use Financing</div>
            <div className="text-sm text-gray-600">
              Enable to use financing to purchase this property. Disable for cash purchases.
            </div>
          </div>
          <button
            onClick={() => setUseFinancing(!useFinancing)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              useFinancing ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              useFinancing ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {useFinancing && (
          <div className="space-y-6">
            {/* Loan Label */}
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Loan Label:</label>
              <input
                type="text"
                placeholder="Enter an optional label to help you identify this loan."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Financing Of */}
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Financing Of:</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                <option>Purchase Price</option>
                <option>After Repair Value</option>
                <option>Custom Amount</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select what is being financed by this loan. You can also enter a custom loan amount manually.
              </p>
            </div>

            {/* Down Payment */}
            <div>
              <label className="text-sm text-gray-700 mb-1 block">
                Price Down Payment:
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={inputs.firstMtgLTV ? 100 - inputs.firstMtgLTV : 20}
                    onChange={(e) => onInputChange('firstMtgLTV', 100 - parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
                <div className="text-sm text-gray-600">
                  {(100 - (inputs.firstMtgLTV || 80))}% Financed
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the down payment on the purchase price, or the percentage financed. Click label to toggle inputs.
              </p>
            </div>

            {/* Loan Type */}
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Loan Type:</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setLoanType('amortizing')}
                  className={`px-6 py-2 rounded ${
                    loanType === 'amortizing'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Amortizing
                </button>
                <button
                  onClick={() => setLoanType('interest-only')}
                  className={`px-6 py-2 rounded ${
                    loanType === 'interest-only'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Interest-Only
                </button>
              </div>
            </div>

            {/* Interest Rate */}
            <InputField 
              label="Interest Rate" 
              field="firstMtgRate" 
              percentage={true}
            />
            <div className="text-sm">
              <a href="#" className="text-blue-600 hover:underline">🔧 Customize Compounding</a>
            </div>

            {/* Loan Term */}
            {loanType === 'amortizing' && (
              <>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">Loan Term:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={inputs.firstMtgAmortization || 30}
                      onChange={(e) => onInputChange('firstMtgAmortization', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-600 whitespace-nowrap">Years</span>
                  </div>
                </div>
                <div className="text-sm">
                  <a href="#" className="text-blue-600 hover:underline">🔧 Customize Amortization</a>
                </div>
              </>
            )}

            {/* Mortgage Insurance (PMI) */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-sm">Mortgage Insurance (PMI)</div>
                <div className="text-xs text-gray-600">
                  Enable to add private mortgage insurance payments for this loan.
                </div>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </button>
            </div>

            {/* Add a Loan */}
            <button className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-600">
              <Plus className="w-5 h-5" />
              Add a Loan
            </button>
            <p className="text-xs text-gray-500 text-center">
              You can add loan points, underwriting fees and other lender costs on the{' '}
              <a href="#" className="text-blue-600 hover:underline">purchase costs worksheet</a>.
            </p>
          </div>
        )}
      </div>

      {/* Purchase Costs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">PURCHASE COSTS</h2>
        
        <div className="mb-6">
          <label className="text-sm text-gray-700 mb-2 block">
            Costs and fees associated with purchasing a property, also called closing costs.
          </label>
        </div>

        {/* Itemize Toggle */}
        <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 rounded">
          <div>
            <div className="font-medium">Itemize Purchase Costs</div>
            <div className="text-sm text-gray-600">
              Enable to itemize purchase costs. Disable to enter a total amount.
            </div>
          </div>
          <button
            onClick={handleTogglePurchaseCosts}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              itemizePurchaseCosts ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              itemizePurchaseCosts ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {itemizePurchaseCosts ? (
          <>
            <h3 className="text-blue-600 font-semibold mb-4">ITEMIZED PURCHASE COSTS</h3>
            
            {/* Purchase Cost Items */}
            <div className="space-y-3 mb-4">
              {purchaseCostItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 border-b pb-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}:</div>
                  </div>
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      value={item.value}
                      onChange={(e) => handlePurchaseCostChange(index, parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="text-xs text-gray-500 w-32">
                    {item.unit}
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <span className="text-sm">≡</span>
                    </button>
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeletePurchaseCost(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddPurchaseCost}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              + Add
            </button>

            {/* Total */}
            <div className="mt-6 pt-4 border-t flex justify-between items-center">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-lg text-blue-600">
                ${purchaseCostItems.reduce((sum, item) => sum + (item.value || 0), 0).toLocaleString()}
              </span>
            </div>
          </>
        ) : (
          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm text-gray-700 mb-1 block">Percentage of Purchase Price:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={inputs.purchaseCostsPercent || 3}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                      onInputChange('purchaseCostsPercent', value);
                      // Auto-calculate total
                      const total = (inputs.offerPrice || 0) * (value / 100);
                      onInputChange('purchaseCostsTotal', total);
                    }}
                    className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">%</span>
                  <span className="text-gray-600 ml-4">=</span>
                  <span className="font-bold text-lg">
                    ${((inputs.offerPrice || 0) * ((inputs.purchaseCostsPercent || 3) / 100)).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Based on purchase price of ${(inputs.offerPrice || 0).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 items-end">
                <button
                  onClick={() => setItemizePurchaseCosts(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Itemize
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rehab Costs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">REHAB COSTS</h2>
        
        <div className="mb-6">
          <label className="text-sm text-gray-700 mb-2 block">
            Expenses you expect to pay to improve a property's condition or perform repairs.
          </label>
        </div>

        {/* Itemize Toggle */}
        <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 rounded">
          <div>
            <div className="font-medium">Itemize Rehab Costs</div>
            <div className="text-sm text-gray-600">
              Enable to itemize rehab costs. Disable to enter a total amount.
            </div>
          </div>
          <button
            onClick={handleToggleRehabCosts}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              itemizeRehabCosts ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              itemizeRehabCosts ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {itemizeRehabCosts ? (
          <>
            <h3 className="text-blue-600 font-semibold mb-4">ITEMIZED REHAB COSTS</h3>
            
            {/* Rehab Cost Items */}
            <div className="space-y-3 mb-4">
              {rehabCostItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 border-b pb-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}:</div>
                  </div>
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      value={item.value}
                      onChange={(e) => handleRehabCostChange(index, parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="text-xs text-gray-500 w-24">
                    {item.unit}
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <span className="text-sm">≡</span>
                    </button>
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteRehabCost(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddRehabCost}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              + Add
            </button>

            {/* Total */}
            <div className="mt-6 pt-4 border-t flex justify-between items-center">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-lg text-green-600">
                ${rehabCostItems.reduce((sum, item) => sum + (item.value || 0), 0).toLocaleString()} 
                <span className="text-sm text-gray-600 ml-2">
                  ($0/sq.ft.)
                </span>
              </span>
            </div>

            {/* Cost Overrun */}
            <div className="mt-4">
              <label className="text-sm text-gray-700 mb-1 block">Cost Overrun:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={10}
                  className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-600">%</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <InputField 
              label="Total" 
              field="repairs" 
              prefix="$"
            />

            <div className="mb-4">
              <label className="text-sm text-gray-700 mb-1 block">Cost Overrun:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 pr-8"
                />
                <span className="text-gray-600">%</span>
              </div>
            </div>

            <button 
              onClick={() => setItemizeRehabCosts(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Itemize
            </button>
          </>
        )}
      </div>

      {/* Rental Income */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">RENTAL INCOME</h2>

        <div className="mb-4">
          <label className="text-sm text-gray-700 mb-1 block">Gross Rent:</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={inputs.grossRents / 12 || 0}
                onChange={(e) => onInputChange('grossRents', parseFloat(e.target.value) * 12)}
                className="w-full px-3 py-2 pl-8 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-gray-600 whitespace-nowrap">Per Month</span>
          </div>
        </div>
        <div className="text-sm mb-4">
          <a href="#" className="text-blue-600 hover:underline">View recent rental comps</a>
          <span className="text-gray-600"> to help you determine the potential rent of this property.</span>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-700 mb-1 block">Vacancy Rate:</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={inputs.vacancyRate || 5}
              onChange={(e) => onInputChange('vacancyRate', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 pr-8"
            />
            <span className="text-gray-600">%</span>
          </div>
        </div>
        <div className="text-sm mb-4">
          <a href="#" className="text-blue-600 hover:underline">+ Add Year-Specific Value</a>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-700 mb-1 block">Other Income:</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={0}
                className="w-full px-3 py-2 pl-8 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-gray-600 whitespace-nowrap">Per Month</span>
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              📅
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Itemize
            </button>
          </div>
        </div>
      </div>

      {/* Operating Expenses */}
<div className="bg-white rounded-lg border border-gray-200 p-6">
  <h2 className="text-xl font-bold text-blue-600 mb-4">OPERATING EXPENSES</h2>
  
  <div className="grid grid-cols-2 gap-4">
    {/* Property Taxes */}
    <div>
      <label className="text-sm text-gray-700 mb-1 block">Property Taxes:</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={inputs.propertyTaxes || 0}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            onInputChange('propertyTaxes', parseFloat(value) || 0);
          }}
          className="w-full pl-8 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">Annual amount</p>
    </div>

    {/* Insurance */}
    <div>
      <label className="text-sm text-gray-700 mb-1 block">Insurance:</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={inputs.insurance || 0}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            onInputChange('insurance', parseFloat(value) || 0);
          }}
          className="w-full pl-8 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">Annual amount</p>
    </div>

    {/* Property Management */}
    <div>
      <label className="text-sm text-gray-700 mb-1 block">Property Management:</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={inputs.managementRate || 10}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            onInputChange('managementRate', parseFloat(value) || 0);
          }}
          className="w-full pr-8 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">% of Operating Income</p>
    </div>

    {/* Maintenance */}
    <div>
      <label className="text-sm text-gray-700 mb-1 block">Maintenance:</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={inputs.maintenancePercent || 10}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            onInputChange('maintenancePercent', parseFloat(value) || 0);
          }}
          className="w-full pr-8 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">% of Gross Rents</p>
    </div>

    {/* Capital Expenditures */}
    <div>
      <label className="text-sm text-gray-700 mb-1 block">Capital Expenditures:</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={inputs.capExPercent || 5}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            onInputChange('capExPercent', parseFloat(value) || 0);
          }}
          className="w-full pr-8 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">% of Gross Rents</p>
    </div>

    {/* HOA Fees */}
    <div>
      <label className="text-sm text-gray-700 mb-1 block">HOA Fees:</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={inputs.associationFees || 0}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            onInputChange('associationFees', parseFloat(value) || 0);
          }}
          className="w-full pl-8 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">Monthly amount</p>
    </div>

    {/* Utilities */}
    <div>
      <label className="text-sm text-gray-700 mb-1 block">Utilities:</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={(inputs.electricity || 0) + (inputs.gas || 0) + (inputs.waterSewer || 0)}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            const totalUtilities = parseFloat(value) || 0;
            // Distribute evenly or set electricity to full amount
            onInputChange('electricity', totalUtilities);
          }}
          className="w-full pl-8 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">Annual amount</p>
    </div>

    {/* Landscaping */}
    <div>
      <label className="text-sm text-gray-700 mb-1 block">Landscaping:</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={inputs.lawnMaintenance || 0}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            onInputChange('lawnMaintenance', parseFloat(value) || 0);
          }}
          className="w-full pl-8 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">Annual amount</p>
    </div>

    {/* Accounting & Legal */}
    <div>
      <label className="text-sm text-gray-700 mb-1 block">Accounting & Legal Fees:</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={(inputs.accounting || 0) + (inputs.legalExpenses || 0)}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            const total = parseFloat(value) || 0;
            onInputChange('accounting', total);
          }}
          className="w-full pl-8 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">Annual amount</p>
    </div>
  </div>

  <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
    <div className="text-sm text-blue-900">
      <strong>Note:</strong> Operating expenses are recurring costs of managing the property.
      <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
        <li>Property Management: Typically 8-12% of operating income</li>
        <li>Maintenance: Usually 10% of gross rents</li>
        <li>CapEx: Reserve fund for major repairs, typically 5% of gross rents</li>
      </ul>
    </div>
  </div>
</div>
      {/* Long-Term Projections */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">LONG-TERM PROJECTIONS</h2>

        <InputField 
          label="Appreciation" 
          field="appreciationRate" 
          suffix="% Per Year"
          percentage={true}
        />
        <div className="text-sm mb-4">
          <a href="#" className="text-blue-600 hover:underline">+ Add Year-Specific Value</a>
        </div>

        <InputField 
          label="Income Increase" 
          field="incomeGrowthRate" 
          suffix="% Per Year"
          percentage={true}
        />
        <div className="text-sm mb-4">
          <a href="#" className="text-blue-600 hover:underline">+ Add Year-Specific Value</a>
        </div>

        <InputField 
          label="Expense Increase" 
          field="expenseGrowthRate" 
          suffix="% Per Year"
          percentage={true}
        />
        <div className="text-sm mb-4">
          <a href="#" className="text-blue-600 hover:underline">+ Add Year-Specific Value</a>
        </div>

        <InputField 
          label="Selling Costs" 
          field="sellingCosts" 
          suffix="% of Sales Price"
          percentage={true}
        />
      </div>

      {/* Depreciation */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">DEPRECIATION</h2>

        <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 rounded">
          <div>
            <div className="font-medium">Depreciation Deduction</div>
            <div className="text-sm text-gray-600">
              Enable to include the depreciation tax deduction in the buy & hold projections. Disable to exclude it.
            </div>
          </div>
          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-500">
            <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
          </button>
        </div>

        <InputField 
          label="Depreciation Period" 
          field="depreciationPeriod" 
          suffix="Years"
        />

        <InputField 
          label="Land Value" 
          field="landValue" 
          prefix="$"
          info="Enter the land value of this property to improve the accuracy of the depreciation deduction."
        />
      </div>

      {/* Refinancing */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">REFINANCING</h2>
        <p className="text-gray-600 text-sm mb-4">
          Add and customize future refinance loans for this property.{' '}
          <a href="#" className="text-blue-600 hover:underline">View tutorial</a>
        </p>

        <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 rounded">
          <div>
            <div className="font-medium">Refinance in the Future</div>
            <div className="text-sm text-gray-600">
              Enable to refinance this property or its loans in future years.
            </div>
          </div>
          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
            <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
          </button>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-center">
        <button 
          onClick={handleReset}
          className="px-6 py-2 border-2 border-red-500 text-red-500 rounded hover:bg-red-50"
        >
          🔄 Reset Worksheet
        </button>
      </div>
    </div>
  );
}