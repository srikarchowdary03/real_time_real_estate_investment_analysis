/**
 * ZILLOW API TEST COMPONENT
 * Add this to your app temporarily to test the Zillow API in the browser
 * 
 * Usage: 
 * 1. Import this component in your App.jsx or any page
 * 2. Add <ZillowAPITest /> to your render
 * 3. Click the test buttons to verify API is working
 */

import React, { useState } from 'react';
import { getPropertyData, getRentEstimate, getCacheStats, clearCache } from '../services/zillowAPI';

const ZillowAPITest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState({ size: 0, keys: [] });

  const addResult = (test, status, message, data = null) => {
    setTestResults(prev => [...prev, { test, status, message, data, timestamp: new Date() }]);
  };

  // Test 1: Simple Property Lookup
  const testSimplePropertyLookup = async () => {
    setLoading(true);
    addResult('Simple Lookup', 'running', 'Fetching data for 115 Salem St, Lowell, MA...');

    try {
      const startTime = Date.now();
      const data = await getPropertyData('115 Salem St', 'Lowell', 'MA', '01854');
      const duration = Date.now() - startTime;

      if (data.error) {
        addResult('Simple Lookup', 'warning', `API returned with error: ${data.error}`, data);
      } else if (data.rent) {
        addResult('Simple Lookup', 'success', 
          `✅ Success! Rent: $${data.rent}, Photos: ${data.photos?.length || 0}, Duration: ${duration}ms`, 
          data
        );
      } else {
        addResult('Simple Lookup', 'warning', 
          `⚠️ Data fetched but no rent estimate found`, 
          data
        );
      }
    } catch (error) {
      addResult('Simple Lookup', 'error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
      updateCacheStats();
    }
  };

  // Test 2: Rent Estimate Only
  const testRentEstimate = async () => {
    setLoading(true);
    addResult('Rent Estimate', 'running', 'Fetching rent estimate...');

    try {
      const data = await getRentEstimate('123 Main St', 'Boston', 'MA', '02108');
      
      if (data.rent) {
        addResult('Rent Estimate', 'success', 
          `✅ Rent: $${data.rent} (Range: $${data.rentRangeLow} - $${data.rentRangeHigh})`
        );
      } else {
        addResult('Rent Estimate', 'warning', 'No rent data available');
      }
    } catch (error) {
      addResult('Rent Estimate', 'error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
      updateCacheStats();
    }
  };

  // Test 3: Cache Performance
  const testCaching = async () => {
    setLoading(true);
    addResult('Caching Test', 'running', 'Testing cache performance...');

    try {
      // First call
      const start1 = Date.now();
      await getPropertyData('115 Salem St', 'Lowell', 'MA', '01854');
      const duration1 = Date.now() - start1;

      // Second call (should be cached)
      const start2 = Date.now();
      await getPropertyData('115 Salem St', 'Lowell', 'MA', '01854');
      const duration2 = Date.now() - start2;

      const improvement = ((duration1 - duration2) / duration1 * 100).toFixed(1);
      
      addResult('Caching Test', 'success', 
        `✅ First call: ${duration1}ms, Second call: ${duration2}ms (${improvement}% faster)`
      );
    } catch (error) {
      addResult('Caching Test', 'error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
      updateCacheStats();
    }
  };

  // Test 4: Error Handling
  const testErrorHandling = async () => {
    setLoading(true);
    addResult('Error Handling', 'running', 'Testing with invalid address...');

    try {
      const data = await getPropertyData('Invalid Address', 'Fakecity', 'XX', '00000');
      
      if (data.error) {
        addResult('Error Handling', 'success', 
          `✅ Error handled gracefully: ${data.error}`
        );
      } else {
        addResult('Error Handling', 'warning', 
          '⚠️ Expected error but got data (property might actually exist!)'
        );
      }
    } catch (error) {
      addResult('Error Handling', 'success', 
        `✅ Error caught: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const updateCacheStats = () => {
    const stats = getCacheStats();
    setCacheStats(stats);
  };

  const handleClearCache = () => {
    clearCache();
    updateCacheStats();
    addResult('Cache', 'success', '🗑️ Cache cleared');
  };

  const handleClearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    handleClearResults();
    await testSimplePropertyLookup();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testRentEstimate();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testCaching();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testErrorHandling();
  };

  React.useEffect(() => {
    updateCacheStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧪 Zillow API Test Suite
        </h1>
        <p className="text-gray-600 mb-6">
          Test your Zillow API integration to ensure everything is working correctly
        </p>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <button
            onClick={testSimplePropertyLookup}
            disabled={loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
          >
            Test Property Lookup
          </button>
          <button
            onClick={testRentEstimate}
            disabled={loading}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
          >
            Test Rent Estimate
          </button>
          <button
            onClick={testCaching}
            disabled={loading}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-semibold"
          >
            Test Caching
          </button>
          <button
            onClick={testErrorHandling}
            disabled={loading}
            className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 font-semibold"
          >
            Test Error Handling
          </button>
          <button
            onClick={runAllTests}
            disabled={loading}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-semibold"
          >
            Run All Tests
          </button>
          <button
            onClick={handleClearResults}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
          >
            Clear Results
          </button>
        </div>

        {/* Cache Stats */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Cache Statistics</h3>
              <p className="text-sm text-blue-700">
                {cacheStats.size} {cacheStats.size === 1 ? 'entry' : 'entries'} cached
              </p>
            </div>
            <button
              onClick={handleClearCache}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`bg-white rounded-lg shadow p-4 border-l-4 ${
              result.status === 'success' ? 'border-green-500' :
              result.status === 'error' ? 'border-red-500' :
              result.status === 'warning' ? 'border-yellow-500' :
              'border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{result.test}</h3>
                <p className="text-sm text-gray-500">
                  {result.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                result.status === 'success' ? 'bg-green-100 text-green-800' :
                result.status === 'error' ? 'bg-red-100 text-red-800' :
                result.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {result.status}
              </span>
            </div>
            <p className="text-gray-700 mb-2">{result.message}</p>
            
            {result.data && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View Data
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}

        {testResults.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <p className="text-lg">No tests run yet</p>
            <p className="text-sm mt-2">Click a test button above to get started</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-lg font-semibold">Running test...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZillowAPITest;