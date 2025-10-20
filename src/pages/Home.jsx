import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calculator, FileText, Home as HomeIcon, DollarSign } from 'lucide-react';
import PropertySearchBar from '../components/common/PropertySearchBar';

const Home = () => {
  const navigate = useNavigate();

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

            {/* Functional Search Bar */}
            <div className="max-w-3xl mx-auto mb-8">
              <PropertySearchBar 
                size="large"
                placeholder="Enter an address, neighborhood, city, or ZIP code"
              />
            </div>

            {/* Quick Search Suggestions */}
            <div className="flex justify-center gap-3 mb-8 flex-wrap">
              <span className="text-sm text-gray-500">Popular:</span>
              {[
                { label: 'Boston, MA', zip: '02134' },
                { label: 'Los Angeles', zip: '90004' },
                { label: 'Miami Beach', zip: '33139' },
                { label: 'Austin, TX', city: 'Austin', state: 'TX' }
              ].map((location, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (location.zip) {
                      navigate(`/properties?zip=${location.zip}`);
                    } else if (location.city && location.state) {
                      navigate(`/properties?city=${location.city}&state=${location.state}`);
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline transition-colors"
                >
                  {location.label}
                </button>
              ))}
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
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Search properties
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Browse thousands of properties with real-time data from across the United States
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Run the numbers
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Calculate ROI, cash flow, mortgage payments, and key investment metrics instantly
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Get your report
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Download professional analysis reports with neighborhood data and comparables
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
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 relative hover:border-gray-300 transition-colors">
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
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 relative hover:border-gray-300 transition-colors">
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
      <div className="py-16 bg-gray-50 border-t">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to find your next investment?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Start searching for properties and analyzing investment opportunities today
          </p>
          <button
            onClick={() => navigate('/properties')}
            className="bg-red-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-red-700 transition-colors inline-flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Browse Properties
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
