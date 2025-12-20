import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calculator, TrendingUp, Home as HomeIcon, Building2, MapPin, DollarSign } from 'lucide-react';
import PropertySearchBar from '../components/features/PropertySearchBar';

const Home = () => {
  const navigate = useNavigate();

  const popularLocations = [
    { label: 'Boston, MA', city: 'Boston', state: 'MA' },
    { label: 'Los Angeles, CA', city: 'Los Angeles', state: 'CA' },
    { label: 'Miami, FL', city: 'Miami', state: 'FL' },
    { label: 'Austin, TX', city: 'Austin', state: 'TX' },
    { label: 'Denver, CO', city: 'Denver', state: 'CO' },
    { label: 'Seattle, WA', city: 'Seattle', state: 'WA' },
  ];

  const handlePopularLocationClick = (location) => {
    navigate(`/properties?city=${encodeURIComponent(location.city)}&state=${location.state}`);
  };

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

            {/* Search Bar with Autocomplete */}
            <div className="max-w-3xl mx-auto mb-8">
              <PropertySearchBar 
                size="large"
                placeholder="Enter an address, neighborhood, city, or ZIP code"
                autoFocus={false}
              />
            </div>

            {/* Popular Locations */}
            <div className="flex justify-center gap-3 mb-10 flex-wrap">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Popular:
              </span>
              {popularLocations.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handlePopularLocationClick(location)}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors px-2 py-1 rounded hover:bg-blue-50"
                >
                  {location.label}
                </button>
              ))}
            </div>

            {/* Stats */}
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

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Everything you need for smart investing
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Cash Flow Analysis</h3>
                  <p className="text-sm text-gray-600">
                    Calculate monthly cash flow, NOI, and all expenses with precision
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">ROI Projections</h3>
                  <p className="text-sm text-gray-600">
                    5-year and 10-year investment returns with appreciation modeling
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Rent Estimates</h3>
                  <p className="text-sm text-gray-600">
                    Accurate rental income estimates powered by market data
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Mortgage Calculator</h3>
                  <p className="text-sm text-gray-600">
                    Compare loan scenarios with different down payments and rates
                  </p>
                </div>
              </div>
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