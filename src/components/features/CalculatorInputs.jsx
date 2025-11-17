export default function CalculatorInputs({ inputs, onChange }) {
  const InputField = ({ label, field, prefix = '', suffix = '', step = '1' }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {prefix}
          </span>
        )}
        <input
          type="number"
          step={step}
          value={inputs[field]}
          onChange={(e) => onChange(field, e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            prefix ? 'pl-7' : ''
          } ${suffix ? 'pr-10' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Purchase Information */}
      <section className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4 text-blue-900">Purchase Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Purchase Price" field="purchasePrice" prefix="$" />
          <InputField label="After Repair Value (ARV)" field="afterRepairValue" prefix="$" />
          <InputField label="Down Payment" field="downPayment" suffix="%" step="0.1" />
          <InputField label="Loan Interest Rate" field="loanInterestRate" suffix="%" step="0.01" />
          <InputField label="Loan Term" field="loanTerm" suffix="years" />
          <InputField label="Closing Costs" field="closingCosts" suffix="%" step="0.1" />
          <InputField label="Repair Costs" field="repairCosts" prefix="$" />
          <InputField label="Rehab Costs" field="estimatedRehabCosts" prefix="$" />
        </div>
      </section>

      {/* Monthly Income */}
      <section className="bg-green-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4 text-green-900">Monthly Income</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Monthly Rent" field="monthlyRent" prefix="$" />
          <InputField label="Other Income" field="otherMonthlyIncome" prefix="$" />
          <InputField label="Laundry Income" field="laundryIncome" prefix="$" />
          <InputField label="Storage Income" field="storageIncome" prefix="$" />
          <InputField label="Parking Income" field="parkingIncome" prefix="$" />
        </div>
      </section>

      {/* Annual Expenses */}
      <section className="bg-red-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4 text-red-900">Annual Expenses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Property Taxes" field="propertyTaxes" prefix="$" />
          <InputField label="Total Insurance" field="totalInsurance" prefix="$" />
          <InputField label="HOA Fees" field="hoaFees" prefix="$" />
          <InputField label="Utilities (Total)" field="utilities" prefix="$" />
          <InputField label="Water/Sewer" field="waterSewer" prefix="$" />
          <InputField label="Electricity" field="electricity" prefix="$" />
          <InputField label="Gas" field="gas" prefix="$" />
          <InputField label="Garbage" field="garbage" prefix="$" />
          <InputField label="Landscaping" field="landscaping" prefix="$" />
          <InputField label="Snow Removal" field="snowRemoval" prefix="$" />
          <InputField label="Management Fees" field="management" prefix="$" />
          <InputField label="Repairs & Maintenance" field="repairs" prefix="$" />
          <InputField label="CapEx Reserve" field="capex" prefix="$" />
          <InputField label="Legal Fees" field="legal" prefix="$" />
          <InputField label="Accounting" field="accounting" prefix="$" />
          <InputField label="Additional Costs" field="additionalCosts" prefix="$" />
          <InputField label="Other Fees" field="otherFees" prefix="$" />
        </div>
      </section>

      {/* Operating Rates & Assumptions */}
      <section className="bg-purple-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4 text-purple-900">Operating Rates & Assumptions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Vacancy Rate" field="vacancyRate" suffix="%" step="0.1" />
          <InputField label="Management Rate" field="managementRate" suffix="%" step="0.1" />
          <InputField label="Repair Rate" field="repairRate" suffix="%" step="0.1" />
          <InputField label="CapEx Rate" field="capexRate" suffix="%" step="0.1" />
          <InputField label="Annual Appreciation" field="appreciationRate" suffix="%" step="0.1" />
          <InputField label="Income Growth" field="incomeGrowthRate" suffix="%" step="0.1" />
          <InputField label="Expense Growth" field="expenseGrowthRate" suffix="%" step="0.1" />
          <InputField label="Selling Costs" field="sellingCosts" suffix="%" step="0.1" />
        </div>
      </section>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Values auto-populate from Zillow data. Adjust as needed for accurate analysis.
        </p>
      </div>
    </div>
  );
}