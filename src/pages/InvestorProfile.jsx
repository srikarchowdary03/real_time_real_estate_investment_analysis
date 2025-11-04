import React, { useEffect, useState } from "react";

const defaultData = {
  fullName: "",
  email: "",
  phone: "",
  targetCity: "",
  stateCode: "",
  strategy: "rental",
  purchaseBudget: "",
  downPayment: "20",
  interestRate: "7.0",
  loanTermYears: "30",
  monthlyHOA: "",
  annualTaxes: "",
  annualInsurance: "",
  maxRehabBudget: "",
  targetCapRate: "",
  targetCashOnCash: "",
  timeline: "0-3 months",
};

const required = ["targetCity", "stateCode", "strategy", "purchaseBudget"];

export default function InvestorProfile() {
  const [formData, setFormData] = useState(defaultData);
  const [mode, setMode] = useState("edit"); // 'edit' | 'review'
  const [errors, setErrors] = useState({});

  // Load any saved data (so it persists across refresh)
  useEffect(() => {
    const saved = localStorage.getItem("investorProfile");
    if (saved) {
      setFormData(JSON.parse(saved));
      setMode("review");
    }
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((d) => ({ ...d, [name]: value }));
  };

  const validate = () => {
    const e = {};
    for (const key of required) {
      if (!String(formData[key] || "").trim()) e[key] = "Required";
    }
    if (Number(formData.purchaseBudget) < 1) {
      e.purchaseBudget = "Enter a valid budget";
    }
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const eMap = validate();
    setErrors(eMap);
    if (Object.keys(eMap).length === 0) setMode("review");
  };

  const handleEdit = () => setMode("edit");

  const handleSave = () => {
    localStorage.setItem("investorProfile", JSON.stringify(formData));
    // (Later you can POST this to your backend.)
    alert("Profile saved for this device (localStorage).");
  };

  const handleReset = () => {
    setFormData(defaultData);
    setErrors({});
    setMode("edit");
    localStorage.removeItem("investorProfile");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Investor Profile</h1>
        <p className="text-gray-600 mb-8">
          Tell us about your budget and preferences. You can review and edit before saving.
        </p>

        {mode === "edit" ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6"
          >
            {/* Contact (optional) */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Contact (optional)</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Full Name" name="fullName" value={formData.fullName} onChange={onChange} />
                <Field label="Email" name="email" type="email" value={formData.email} onChange={onChange} />
                <Field label="Phone" name="phone" value={formData.phone} onChange={onChange} />
              </div>
            </section>

            {/* Market & Strategy */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Market & Strategy</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Field
                  label="Target City *"
                  name="targetCity"
                  value={formData.targetCity}
                  onChange={onChange}
                  error={errors.targetCity}
                  placeholder="e.g., Boston"
                />
                <Field
                  label="State *"
                  name="stateCode"
                  value={formData.stateCode}
                  onChange={onChange}
                  error={errors.stateCode}
                  placeholder="e.g., MA"
                />
                <Select
                  label="Strategy *"
                  name="strategy"
                  value={formData.strategy}
                  onChange={onChange}
                  error={errors.strategy}
                  options={[
                    { value: "rental", label: "Rental Property" },
                    { value: "fixflip", label: "Fix & Flip" },
                    { value: "wholesale", label: "Wholesaling" },
                    { value: "rehab", label: "Rehab Estimator" },
                  ]}
                />
              </div>
            </section>

            {/* Budget */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Budget & Financing</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <Field
                  label="Purchase Budget ($) *"
                  name="purchaseBudget"
                  type="number"
                  value={formData.purchaseBudget}
                  onChange={onChange}
                  error={errors.purchaseBudget}
                />
                <Field
                  label="Down Payment (%)"
                  name="downPayment"
                  type="number"
                  value={formData.downPayment}
                  onChange={onChange}
                />
                <Field
                  label="Interest Rate (%)"
                  name="interestRate"
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={onChange}
                />
                <Field
                  label="Loan Term (years)"
                  name="loanTermYears"
                  type="number"
                  value={formData.loanTermYears}
                  onChange={onChange}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <Field
                  label="Monthly HOA ($)"
                  name="monthlyHOA"
                  type="number"
                  value={formData.monthlyHOA}
                  onChange={onChange}
                />
                <Field
                  label="Annual Taxes ($)"
                  name="annualTaxes"
                  type="number"
                  value={formData.annualTaxes}
                  onChange={onChange}
                />
                <Field
                  label="Annual Insurance ($)"
                  name="annualInsurance"
                  type="number"
                  value={formData.annualInsurance}
                  onChange={onChange}
                />
              </div>
            </section>

            {/* Investment Targets */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Targets</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <Field
                  label="Max Rehab Budget ($)"
                  name="maxRehabBudget"
                  type="number"
                  value={formData.maxRehabBudget}
                  onChange={onChange}
                />
                <Field
                  label="Target Cap Rate (%)"
                  name="targetCapRate"
                  type="number"
                  step="0.1"
                  value={formData.targetCapRate}
                  onChange={onChange}
                />
                <Field
                  label="Target Cash-on-Cash (%)"
                  name="targetCashOnCash"
                  type="number"
                  step="0.1"
                  value={formData.targetCashOnCash}
                  onChange={onChange}
                />
                <Select
                  label="Timeline"
                  name="timeline"
                  value={formData.timeline}
                  onChange={onChange}
                  options={[
                    { value: "0-3 months", label: "0–3 months" },
                    { value: "3-6 months", label: "3–6 months" },
                    { value: "6-12 months", label: "6–12 months" },
                  ]}
                />
              </div>
            </section>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700"
              >
                Review
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </form>
        ) : (
          // REVIEW MODE
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Review Your Information</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <SummaryCard
                title="Contact"
                items={{
                  "Full Name": formData.fullName || "—",
                  Email: formData.email || "—",
                  Phone: formData.phone || "—",
                }}
              />
              <SummaryCard
                title="Market & Strategy"
                items={{
                  City: formData.targetCity,
                  State: formData.stateCode,
                  Strategy:
                    { rental: "Rental Property", fixflip: "Fix & Flip", wholesale: "Wholesaling", rehab: "Rehab Estimator" }[
                      formData.strategy
                    ],
                  Timeline: formData.timeline,
                }}
              />
              <SummaryCard
                title="Budget & Financing"
                items={{
                  "Purchase Budget": money(formData.purchaseBudget),
                  "Down Payment": pct(formData.downPayment),
                  "Interest Rate": pct(formData.interestRate),
                  "Loan Term": `${formData.loanTermYears || 0} years`,
                  "Monthly HOA": money(formData.monthlyHOA),
                  "Annual Taxes": money(formData.annualTaxes),
                  "Annual Insurance": money(formData.annualInsurance),
                }}
              />
              <SummaryCard
                title="Targets"
                items={{
                  "Max Rehab Budget": money(formData.maxRehabBudget),
                  "Target Cap Rate": pct(formData.targetCapRate),
                  "Target Cash-on-Cash": pct(formData.targetCashOnCash),
                }}
              />
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleEdit}
                className="inline-flex items-center rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700"
              >
                Confirm & Save
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- small helpers ---------- */

function Field({ label, name, value, onChange, type = "text", placeholder, error, step }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        step={step}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-red-500 ${
          error ? "border-red-400" : "border-gray-300"
        }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function Select({ label, name, value, onChange, options, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-red-500 ${
          error ? "border-red-400" : "border-gray-300"
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function SummaryCard({ title, items }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold mb-3">{title}</h3>
      <dl className="space-y-2">
        {Object.entries(items).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-gray-600">{k}</dt>
            <dd className="font-medium text-gray-900 text-right">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const money = (v) => (v ? `$${Number(v).toLocaleString()}` : "—");
const pct = (v) => (v ? `${Number(v)}%` : "—");
