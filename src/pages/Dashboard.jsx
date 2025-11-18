import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, TrendingUp, DollarSign, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  if (!currentUser) {
    navigate('/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser.displayName || currentUser.email?.split('@')[0]}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/my-properties')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">-</h3>
            <p className="text-gray-600 text-sm">Saved Properties</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">-</h3>
            <p className="text-gray-600 text-sm">Avg. Cap Rate</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">-</h3>
            <p className="text-gray-600 text-sm">Total Value</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Your dashboard is ready</h3>
          <p className="text-gray-600 mb-6">Start saving properties to see analytics and insights here</p>
          <button
            onClick={() => navigate('/properties')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse Properties
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;