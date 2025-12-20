/**
 * InvestorProfile.jsx - Investor Profile & Scoring Configuration Page
 * ====================================================================
 * Allows users to configure:
 * - Financing defaults
 * - Expense assumptions  
 * - Investment targets (minimum requirements)
 * - Dynamic scoring configuration (metrics, weights, thresholds)
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Settings, Target, Calculator, TrendingUp, 
  Save, RotateCcw, ChevronDown, ChevronUp, Info,
  Shield, Scale, Rocket, Check, AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
  getInvestorProfile, 
  saveInvestorProfile, 
  applyScoringPreset,
  getScoringPresets,
  getAvailableMetrics,
  DEFAULT_PROFILE 
} from '../services/Investorservice';
import { calculateQuickScore, SCORING_PRESETS } from '../utils/investmentCalculations';

export default function InvestorProfile() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [activeSection, setActiveSection] = useState('scoring');
  const [expandedSections, setExpandedSections] = useState({
    financing: true,
    expenses: true,
    targets: true,
    scoring: true,
    thresholds: false
  });
  
  // Sample property for live score preview
  const sampleProperty = {
    price: 350000,
    rentEstimate: 2500,
    beds: 3,
    sqft: 1800
  };
  
  const presets = getScoringPresets();
  const availableMetrics = getAvailableMetrics();
  
  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        const userProfile = await getInvestorProfile(currentUser.uid);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [currentUser]);
  
  // Calculate live preview score
  const previewScore = calculateQuickScore(
    sampleProperty.price,
    sampleProperty.rentEstimate,
    { ...profile.financing, ...profile.expenses },
    profile.scoringConfig
  );
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const handleFinancingChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      financing: {
        ...prev.financing,
        [field]: parseFloat(value) || 0
      }
    }));
  };
  
  const handleExpenseChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      expenses: {
        ...prev.expenses,
        [field]: parseFloat(value) || 0
      }
    }));
  };
  
  const handleTargetChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      targets: {
        ...prev.targets,
        [field]: parseFloat(value) || 0
      }
    }));
  };
  
  const handleMetricToggle = (metricKey) => {
    setProfile(prev => ({
      ...prev,
      scoringConfig: {
        ...prev.scoringConfig,
        preset: 'custom',
        metrics: {
          ...prev.scoringConfig.metrics,
          [metricKey]: {
            ...prev.scoringConfig.metrics[metricKey],
            enabled: !prev.scoringConfig.metrics[metricKey].enabled
          }
        }
      }
    }));
  };
  
  const handleWeightChange = (metricKey, value) => {
    setProfile(prev => ({
      ...prev,
      scoringConfig: {
        ...prev.scoringConfig,
        preset: 'custom',
        metrics: {
          ...prev.scoringConfig.metrics,
          [metricKey]: {
            ...prev.scoringConfig.metrics[metricKey],
            weight: parseInt(value) || 0
          }
        }
      }
    }));
  };
  
  const handleThresholdChange = (metricKey, level, value) => {
    setProfile(prev => ({
      ...prev,
      scoringConfig: {
        ...prev.scoringConfig,
        preset: 'custom',
        thresholds: {
          ...prev.scoringConfig.thresholds,
          [metricKey]: {
            ...prev.scoringConfig.thresholds[metricKey],
            [level]: parseFloat(value) || 0
          }
        }
      }
    }));
  };
  
  const handleApplyPreset = async (presetKey) => {
    const preset = SCORING_PRESETS[presetKey];
    if (preset) {
      setProfile(prev => ({
        ...prev,
        scoringConfig: {
          preset: presetKey,
          ...preset
        }
      }));
    }
  };
  
  const handleSave = async () => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    
    setSaving(true);
    setSaveMessage(null);
    
    try {
      await saveInvestorProfile(currentUser.uid, profile);
      setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };
  
  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults? This cannot be undone.')) {
      setProfile(DEFAULT_PROFILE);
    }
  };
  
  // Calculate total weight for validation
  const totalWeight = Object.values(profile.scoringConfig.metrics)
    .filter(m => m.enabled)
    .reduce((sum, m) => sum + m.weight, 0);
  
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access your investor profile.</p>
          <button 
            onClick={() => navigate('/signin')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Investor Profile</h1>
                <p className="text-sm text-gray-500">Configure your investment criteria and scoring preferences</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Profile
              </button>
            </div>
          </div>
          
          {/* Save Message */}
          {saveMessage && (
            <div className={`mt-3 px-4 py-2 rounded-lg flex items-center gap-2 ${
              saveMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {saveMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {saveMessage.text}
            </div>
          )}
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content - Left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Scoring Configuration Section */}
            <div className="bg-white rounded-xl shadow-sm border">
              <button
                onClick={() => toggleSection('scoring')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="font-semibold text-gray-900">Scoring Configuration</h2>
                    <p className="text-sm text-gray-500">Choose which metrics matter to you</p>
                  </div>
                </div>
                {expandedSections.scoring ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {expandedSections.scoring && (
                <div className="px-6 pb-6 space-y-6">
                  {/* Presets */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Quick Presets</label>
                    <div className="grid grid-cols-3 gap-3">
                      {presets.map(preset => (
                        <button
                          key={preset.key}
                          onClick={() => handleApplyPreset(preset.key)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            profile.scoringConfig.preset === preset.key
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{preset.icon}</div>
                          <div className="font-medium text-gray-900">{preset.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Metrics Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Metrics & Weights</label>
                      <span className={`text-sm ${totalWeight === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                        Total Weight: {totalWeight}%
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {availableMetrics.map(metric => {
                        const config = profile.scoringConfig.metrics[metric.key];
                        return (
                          <div 
                            key={metric.key}
                            className={`p-4 rounded-lg border ${config.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={config.enabled}
                                  onChange={() => handleMetricToggle(metric.key)}
                                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div>
                                  <div className="font-medium text-gray-900">{metric.label}</div>
                                  <div className="text-xs text-gray-500">{metric.description}</div>
                                </div>
                              </div>
                              
                              {config.enabled && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    value={config.weight}
                                    onChange={(e) => handleWeightChange(metric.key, e.target.value)}
                                    className="w-24"
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={config.weight}
                                    onChange={(e) => handleWeightChange(metric.key, e.target.value)}
                                    className="w-16 px-2 py-1 border rounded text-center text-sm"
                                  />
                                  <span className="text-sm text-gray-500">%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Thresholds Section */}
            <div className="bg-white rounded-xl shadow-sm border">
              <button
                onClick={() => toggleSection('thresholds')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Settings className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="font-semibold text-gray-900">Scoring Thresholds</h2>
                    <p className="text-sm text-gray-500">Define what excellent, good, fair, and risky means to you</p>
                  </div>
                </div>
                {expandedSections.thresholds ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {expandedSections.thresholds && (
                <div className="px-6 pb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 font-medium text-gray-600">Metric</th>
                          <th className="text-center py-3 font-medium text-emerald-600">Excellent</th>
                          <th className="text-center py-3 font-medium text-green-600">Good</th>
                          <th className="text-center py-3 font-medium text-yellow-600">Fair</th>
                          <th className="text-center py-3 font-medium text-orange-600">Risky</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableMetrics.map(metric => {
                          const thresholds = profile.scoringConfig.thresholds[metric.key];
                          const isEnabled = profile.scoringConfig.metrics[metric.key].enabled;
                          return (
                            <tr key={metric.key} className={`border-b ${!isEnabled ? 'opacity-50' : ''}`}>
                              <td className="py-3">
                                <div className="font-medium text-gray-900">{metric.label}</div>
                                <div className="text-xs text-gray-500">{metric.unit}</div>
                              </td>
                              {['excellent', 'good', 'fair', 'risky'].map(level => (
                                <td key={level} className="text-center py-3">
                                  <input
                                    type="number"
                                    step={metric.key === 'dcr' ? '0.05' : metric.key === 'monthlyCashFlow' ? '50' : '0.5'}
                                    value={thresholds[level]}
                                    onChange={(e) => handleThresholdChange(metric.key, level, e.target.value)}
                                    disabled={!isEnabled}
                                    className="w-20 px-2 py-1 border rounded text-center text-sm disabled:bg-gray-100"
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      Thresholds define the boundaries between score levels. For example, if Cash on Cash ROI is ≥12%, 
                      that metric scores as "Excellent". Values between thresholds are interpolated for smoother scoring.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Financing Defaults Section */}
            <div className="bg-white rounded-xl shadow-sm border">
              <button
                onClick={() => toggleSection('financing')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calculator className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="font-semibold text-gray-900">Financing Defaults</h2>
                    <p className="text-sm text-gray-500">Default loan assumptions for calculations</p>
                  </div>
                </div>
                {expandedSections.financing ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {expandedSections.financing && (
                <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Down Payment %</label>
                    <input
                      type="number"
                      value={profile.financing.downPaymentPercent}
                      onChange={(e) => handleFinancingChange('downPaymentPercent', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Interest Rate %</label>
                    <input
                      type="number"
                      step="0.125"
                      value={profile.financing.interestRate}
                      onChange={(e) => handleFinancingChange('interestRate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Loan Term (Years)</label>
                    <input
                      type="number"
                      value={profile.financing.loanTermYears}
                      onChange={(e) => handleFinancingChange('loanTermYears', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Closing Costs %</label>
                    <input
                      type="number"
                      step="0.5"
                      value={profile.financing.closingCostsPercent}
                      onChange={(e) => handleFinancingChange('closingCostsPercent', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Expense Defaults Section */}
            <div className="bg-white rounded-xl shadow-sm border">
              <button
                onClick={() => toggleSection('expenses')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="font-semibold text-gray-900">Expense Assumptions</h2>
                    <p className="text-sm text-gray-500">Default operating expense percentages</p>
                  </div>
                </div>
                {expandedSections.expenses ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {expandedSections.expenses && (
                <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Vacancy Rate %</label>
                    <input
                      type="number"
                      value={profile.expenses.vacancyRate}
                      onChange={(e) => handleExpenseChange('vacancyRate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Management %</label>
                    <input
                      type="number"
                      value={profile.expenses.managementRate}
                      onChange={(e) => handleExpenseChange('managementRate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Maintenance %</label>
                    <input
                      type="number"
                      value={profile.expenses.maintenanceRate}
                      onChange={(e) => handleExpenseChange('maintenanceRate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">CapEx Reserve %</label>
                    <input
                      type="number"
                      value={profile.expenses.capExRate}
                      onChange={(e) => handleExpenseChange('capExRate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Property Tax Rate %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={profile.expenses.propertyTaxRate}
                      onChange={(e) => handleExpenseChange('propertyTaxRate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Insurance Rate %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={profile.expenses.insuranceRate}
                      onChange={(e) => handleExpenseChange('insuranceRate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Investment Targets Section */}
            <div className="bg-white rounded-xl shadow-sm border">
              <button
                onClick={() => toggleSection('targets')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="font-semibold text-gray-900">Minimum Requirements</h2>
                    <p className="text-sm text-gray-500">Your minimum acceptable investment criteria</p>
                  </div>
                </div>
                {expandedSections.targets ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {expandedSections.targets && (
                <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Min Cap Rate %</label>
                    <input
                      type="number"
                      step="0.5"
                      value={profile.targets.minCapRate}
                      onChange={(e) => handleTargetChange('minCapRate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Min Cash-on-Cash %</label>
                    <input
                      type="number"
                      step="0.5"
                      value={profile.targets.minCashOnCash}
                      onChange={(e) => handleTargetChange('minCashOnCash', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Min Monthly Cash Flow $</label>
                    <input
                      type="number"
                      step="50"
                      value={profile.targets.minMonthlyCashFlow}
                      onChange={(e) => handleTargetChange('minMonthlyCashFlow', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Min DSCR</label>
                    <input
                      type="number"
                      step="0.05"
                      value={profile.targets.minDSCR}
                      onChange={(e) => handleTargetChange('minDSCR', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Sidebar - Live Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border sticky top-24">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Live Score Preview</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Based on sample: ${sampleProperty.price.toLocaleString()} property, ${sampleProperty.rentEstimate}/mo rent
                </p>
              </div>
              
              <div className="p-6">
                {/* Score Circle */}
                <div className="text-center mb-6">
                  <div 
                    className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-white text-4xl font-bold ${
                      previewScore.color === 'emerald' ? 'bg-emerald-500' :
                      previewScore.color === 'green' ? 'bg-green-500' :
                      previewScore.color === 'yellow' ? 'bg-yellow-500' :
                      previewScore.color === 'orange' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                  >
                    {previewScore.score}
                  </div>
                  <div className={`mt-3 text-lg font-semibold capitalize ${
                    previewScore.color === 'emerald' ? 'text-emerald-600' :
                    previewScore.color === 'green' ? 'text-green-600' :
                    previewScore.color === 'yellow' ? 'text-yellow-600' :
                    previewScore.color === 'orange' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {previewScore.badge}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{previewScore.description}</p>
                </div>
                
                {/* Metrics Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Metrics Breakdown</h4>
                  
                  {previewScore.breakdown && Object.entries(previewScore.breakdown).map(([key, data]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{key}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-medium">
                          {typeof data.value === 'number' ? data.value.toFixed(1) : data.value}
                        </span>
                        <div 
                          className="w-8 h-2 rounded-full bg-gray-200 overflow-hidden"
                          title={`Score: ${data.score.toFixed(0)}`}
                        >
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${data.score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Quick Stats */}
                <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-500">Cash Flow</div>
                    <div className={`font-semibold ${previewScore.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${previewScore.monthlyCashFlow?.toLocaleString()}/mo
                    </div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-500">Cap Rate</div>
                    <div className="font-semibold text-gray-900">{previewScore.capRate}%</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-500">CoC ROI</div>
                    <div className="font-semibold text-gray-900">{previewScore.cashOnCashROI}%</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-500">DCR</div>
                    <div className="font-semibold text-gray-900">{previewScore.dcr}x</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}