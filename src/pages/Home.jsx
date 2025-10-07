import React from 'react';
import { Search, Calculator, FileText, Home as HomeIcon, DollarSign } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Clean White with Red Accent */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Heading */}
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Find your next investment property
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Search, analyze, and compare real estate investments with powerful tools
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter an address, neighborhood, city, or ZIP code"
                    className="flex-1 py-3 text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                </div>
                <button className="bg-red-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-red-700 transition-colors">
                  Search
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">10,000+</div>
                <div className="text-sm text-gray-600">Properties</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">50+</div>
                <div className="text-sm text-gray-600">Cities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">$2.5B</div>
                <div className="text-sm text-gray-600">Analyzed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              How it works
            </h2>
            <p className="text-lg text-gray-600">
              Analyze investment properties in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Search properties
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Browse thousands of properties with real-time data
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Run the numbers
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Calculate ROI, cash flow, and key investment metrics
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Get your report
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Download professional analysis reports to share
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculators Section */}
      <div className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Investment calculators
            </h2>
            <p className="text-lg text-gray-600">
              Coming soon - Powerful tools for every investment strategy
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Rental Calculator */}
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 relative">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                  Coming soon
                </span>
              </div>
              
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <HomeIcon className="w-6 h-6 text-gray-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Rental property calculator
              </h3>
              
              <p className="text-gray-600 mb-4">
                Analyze long-term rental investments with cash flow projections, ROI calculations, and cap rate analysis.
              </p>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                  Cash flow
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                  ROI
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                  Cap rate
                </span>
              </div>
            </div>

            {/* Fix & Flip Calculator */}
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 relative">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                  Coming soon
                </span>
              </div>
              
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-gray-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Fix & flip calculator
              </h3>
              
              <p className="text-gray-600 mb-4">
                Evaluate renovation projects with ARV estimates, repair cost tracking, and profit margin analysis.
              </p>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                  ARV
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                  Profit
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                  70% rule
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 lg:py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 max-w-3xl mx-auto">
            Start analyzing properties today
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join investors who are making smarter decisions with data
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors">
              Get started
            </button>
            <button className="px-8 py-3 bg-white text-gray-900 rounded-md font-semibold hover:bg-gray-100 transition-colors">
              Learn more
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;