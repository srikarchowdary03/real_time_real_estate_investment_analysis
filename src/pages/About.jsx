import React from 'react';
import { 
  TrendingUp, Calculator, Building, PieChart, 
  Database, Zap, Shield, Target 
} from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Database,
      title: 'Real-Time Property Data',
      description: 'Access property listings across US markets via Realty-in-US API with comprehensive property details.'
    },
    {
      icon: TrendingUp,
      title: 'RentCast Integration',
      description: 'Get accurate rental estimates and unit counts from public records for precise investment analysis.'
    },
    {
      icon: Calculator,
      title: 'Investment Calculations',
      description: 'Calculate Cap Rate, Cash-on-Cash ROI, DCR, GRM, NOI, and 15+ financial metrics instantly.'
    },
    {
      icon: Building,
      title: 'Multi-Family Support',
      description: 'Analyze duplexes, triplexes, quadplexes, and apartment buildings with per-unit calculations.'
    },
    {
      icon: PieChart,
      title: '5-Year Projections',
      description: 'Model property appreciation, equity growth, and cash flow over your holding period.'
    },
    {
      icon: Target,
      title: 'Deal Scoring',
      description: 'Automatic investment scoring based on cap rate, cash flow, and key financial ratios.'
    }
  ];

  const techStack = [
    { name: 'React', description: 'Frontend Framework' },
    { name: 'Firebase', description: 'Auth & Database' },
    { name: 'Realty-in-US API', description: 'Property Listings' },
    { name: 'RentCast API', description: 'Rental Estimates' },
    { name: 'Tailwind CSS', description: 'Styling' },
    { name: 'Vercel', description: 'Deployment' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Real Estate Investment Analysis
            </h1>
            <p className="text-xl text-blue-100">
              Professional-grade tools to evaluate buy-and-hold rental properties with confidence
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Mission Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Our Mission
            </h2>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <p className="text-lg text-gray-600 leading-relaxed">
                To provide real estate investors with accurate, real-time investment analysis 
                by combining property listing data with rental estimates and automated financial 
                calculations. We eliminate the need for manual spreadsheet analysis by delivering 
                comprehensive metrics that match industry-standard tools like DealCheck.
              </p>
            </div>
          </section>

          {/* Features Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Key Features
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* How It Works Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              How It Works
            </h2>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Search Properties</h3>
                    <p className="text-gray-600">
                      Enter any US location to browse available properties from the Realty-in-US database.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Get Rental Estimates</h3>
                    <p className="text-gray-600">
                      Hover over properties to fetch RentCast rental estimates and unit counts from public records.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Analyze Investment</h3>
                    <p className="text-gray-600">
                      Click "Analyze" to see comprehensive financial metrics including Cap Rate, Cash Flow, ROI, and DCR.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Customize & Project</h3>
                    <p className="text-gray-600">
                      Adjust financing terms, expenses, and assumptions to model your specific investment scenario with 5-year projections.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tech Stack Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Built With
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {techStack.map((tech, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center"
                >
                  <div className="font-semibold text-gray-900">{tech.name}</div>
                  <div className="text-sm text-gray-500">{tech.description}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Metrics Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Financial Metrics Calculated
            </h2>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Returns & Yields</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Cap Rate (on Purchase Price & ARV)</li>
                    <li>• Cash-on-Cash ROI</li>
                    <li>• Total ROI with Appreciation</li>
                    <li>• Gross Rent Multiplier (GRM)</li>
                    <li>• Rent-to-Value Ratio</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Cash Flow & Ratios</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Net Operating Income (NOI)</li>
                    <li>• Monthly & Annual Cash Flow</li>
                    <li>• Debt Coverage Ratio (DCR)</li>
                    <li>• Operating Expense Ratio</li>
                    <li>• Break-Even Ratio</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 text-center text-white">
              <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
              <h2 className="text-2xl font-bold mb-4">Ready to Analyze Your Next Deal?</h2>
              <p className="text-blue-100 mb-6">
                Start evaluating investment properties with professional-grade tools.
              </p>
              <a 
                href="/properties"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Search Properties
              </a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default About;