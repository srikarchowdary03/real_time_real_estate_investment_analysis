import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            About Real Estate Analyzer
          </h1>
          
          <div className="prose prose-lg">
            <p className="text-gray-600 text-lg mb-6">
              Real Estate Analyzer is a comprehensive platform designed to help real estate 
              investors make data-driven decisions with confidence.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">
              Our Mission
            </h2>
            <p className="text-gray-600 mb-6">
              To provide investors with professional-grade tools and real-time data 
              to evaluate investment properties quickly and accurately.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">
              What We Offer
            </h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>Real-time property data from Realtor.com</li>
              <li>Comprehensive investment calculators</li>
              <li>ROI and cash flow analysis</li>
              <li>Professional report generation</li>
              <li>Portfolio tracking and comparison tools</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">
              Coming Soon
            </h2>
            <p className="text-gray-600 mb-6">
              We're working hard to bring you powerful tools for real estate analysis. 
              Sign up to be notified when we launch!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;