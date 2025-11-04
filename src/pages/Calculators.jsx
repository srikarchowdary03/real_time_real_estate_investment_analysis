import React from 'react';

const Calculators = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Investment Calculators
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Powerful tools for analyzing real estate investments
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Rental Property
              </h3>
              <p className="text-gray-600 mb-4">
                Calculate ROI, cash flow, and cap rate
              </p>
              <span className="text-sm text-gray-500">Coming soon</span>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-5xl mb-4">🔨</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Fix & Flip
              </h3>
              <p className="text-gray-600 mb-4">
                Analyze renovation projects and profits
              </p>
              <span className="text-sm text-gray-500">Coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculators;