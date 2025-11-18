import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calculator, TrendingUp, Home as HomeIcon } from 'lucide-react';
import PropertySearchBar from '../components/common/PropertySearchBar';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Find your next
              <span className="text-blue-600"> investment property</span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Search, analyze, and compare real estate investments with powerful tools
            </p>

            <div className="max-w-3xl mx-auto mb-8">
              <PropertySearchBar 
                size="large"
                placeholder="Enter an address, neighborhood, city, or ZIP code"
              />
            </div>

            <div className="flex justify-center gap-3 mb-10 flex-wrap">
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
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                >
                  {location.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-1">
                  10,000+
                </div>
                <div className="text-sm text-gray-600 font-medium">Properties</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-1">
                  50+
                </div>
                <div className="text-sm text-gray-600 font-medium">Cities</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-1">
                  $2.5B
                </div>
                <div className="text-sm text-gray-600 font-medium">Analyzed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-lg text-gray-600">
              Analyze investment properties in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Search properties
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Browse thousands of properties with real-time data from across the United States
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Calculator className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Run the numbers
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Calculate ROI, cash flow, mortgage payments, and key investment metrics instantly
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Track performance
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Save properties and monitor your portfolio with detailed analytics and insights
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to find your next investment?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Start searching for properties and analyzing investment opportunities today
          </p>
          <button
            onClick={() => navigate('/properties')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors inline-flex items-center gap-3 shadow-lg"
          >
            <Search className="w-6 h-6" />
            Browse Properties
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;