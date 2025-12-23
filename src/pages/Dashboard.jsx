import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, TrendingUp, DollarSign, Home, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getSavedProperties } from '../services/database';  // ✅ Correct import

/**
 * Dashboard Page Component
 * 
 * Main dashboard showing user statistics and quick actions.
 * Displays saved properties count, average cap rate, and total portfolio value.
 * 
 * @component
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [savedCount, setSavedCount] = useState(0);
  const [avgCapRate, setAvgCapRate] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
    }
  }, [currentUser, navigate]);

  // Load user statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        const properties = await getSavedProperties(currentUser.uid);  // ✅ FIXED: Changed from getUserSavedProperties
        setSavedCount(properties.length);

        // Calculate average cap rate
        const validCapRates = properties
          .map(p => p.estimatedCapRate || p.scoreData?.capRate || p.propertyData?.metrics?.capRate)
          .filter(rate => rate && rate > 0);

        const avgCap = validCapRates.length > 0
          ? validCapRates.reduce((sum, rate) => sum + rate, 0) / validCapRates.length
          : 0;

        setAvgCapRate(avgCap);

        // Calculate total value
        const total = properties.reduce((sum, p) => {
          const price = p.propertyData?.price || 0;
          return sum + price;
        }, 0);

        setTotalValue(total);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [currentUser]);

  // Format currency
  const formatPrice = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value) => {
    if (!value || isNaN(value)) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {currentUser.displayName || currentUser.email?.split('@')[0]}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Saved Properties Card */}
              <div
                onClick={() => navigate('/my-properties')}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {savedCount}
                </div>
                <div className="text-sm text-gray-600">Saved Properties</div>
              </div>

              {/* Average Cap Rate Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatPercent(avgCapRate)}
                </div>
                <div className="text-sm text-gray-600">Avg. Cap Rate</div>
              </div>

              {/* Total Value Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatPrice(totalValue)}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
            </div>

            {/* Empty State or Quick Actions */}
            {savedCount === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your dashboard is ready
                </h2>
                <p className="text-gray-600 mb-6">
                  Start saving properties to see analytics and insights here
                </p>
                <button
                  onClick={() => navigate('/properties')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Browse Properties
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/my-properties')}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-semibold text-gray-900 mb-1">
                      View Saved Properties
                    </div>
                    <div className="text-sm text-gray-600">
                      Manage your {savedCount} saved properties
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/properties')}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-semibold text-gray-900 mb-1">
                      Search Properties
                    </div>
                    <div className="text-sm text-gray-600">
                      Find new investment opportunities
                    </div>
                  </button>

                  <div className='md:col-span-2 flex justify-center'>
                  <button
                    onClick={() => navigate('/investor-profile')}
                    className="mx-auto block text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-semibold text-gray-900 mb-1">
                      Investor Profile
                    </div>
                    <div className="text-sm text-gray-600">
                      Update your investment preferences
                    </div>
                  </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;