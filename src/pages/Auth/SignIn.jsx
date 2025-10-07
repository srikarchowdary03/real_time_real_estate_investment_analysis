import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SignIn = () => {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'signup'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <div className="w-12 h-12 bg-red-600 rounded flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">RE</span>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'signin'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'signup'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Sign In Form */}
        {activeTab === 'signin' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-600 mt-1">Sign in to your account</p>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 rounded" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-red-600 hover:text-red-700 font-medium">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
              >
                Sign in
              </button>
            </form>
          </div>
        )}

        {/* Sign Up Form */}
        {activeTab === 'signup' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
              <p className="text-gray-600 mt-1">Get started with Real Estate Analyzer</p>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
              >
                Create account
              </button>
            </form>
          </div>
        )}

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-red-600 hover:text-red-700">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-red-600 hover:text-red-700">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignIn;