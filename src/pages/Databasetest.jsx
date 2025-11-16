import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth'; // Assuming you have auth hook
import {
  saveProperty,
  getSavedProperties,
  getSavedProperty,
  unsaveProperty,
  updatePropertyAnalysis,
  updatePropertyNotes,
  updatePropertyTags,
  isPropertySaved
} from '../services/database';

const DatabaseTest = () => {
  const { user } = useAuth(); // Get current user
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Example test data
  const examplePropertyData = {
    property_id: 'test_abc123',
    location: {
      address: {
        line: '123 Main St',
        city: 'Boston',
        state_code: 'MA',
        postal_code: '02108'
      }
    },
    list_price: 450000,
    description: {
      beds: 3,
      baths: 2,
      sqft: 1500,
      type: 'Single Family',
      year_built: 2005
    },
    primary_photo: {
      href: 'https://photos.zillowstatic.com/fp/example.jpg'
    }
  };

  const exampleZillowData = {
    rent: 2850,
    rentRangeLow: 2600,
    rentRangeHigh: 3100,
    photos: ['https://photos.zillowstatic.com/fp/example1.jpg'],
    taxAssessment: 425000,
    annualTaxAmount: 4675
  };

  const exampleQuickMetrics = {
    score: 'good',
    cashFlow: 380,
    capRate: 7.2,
    roi: 8.5
  };

  const addResult = (test, status, message, data = null) => {
    setTestResults(prev => [...prev, { 
      test, 
      status, 
      message, 
      data, 
      timestamp: new Date() 
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: Save Property
  const testSaveProperty = async () => {
    if (!user?.uid) {
      addResult('Save Property', 'error', '❌ User not logged in');
      return;
    }

    setLoading(true);
    addResult('Save Property', 'running', 'Saving test property...');

    try {
      const docId = await saveProperty(
        user.uid,
        examplePropertyData,
        exampleZillowData,
        exampleQuickMetrics
      );

      addResult('Save Property', 'success', `✅ Property saved! Doc ID: ${docId}`);
    } catch (error) {
      addResult('Save Property', 'error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Get All Saved Properties
  const testGetSavedProperties = async () => {
    if (!user?.uid) {
      addResult('Get All Properties', 'error', '❌ User not logged in');
      return;
    }

    setLoading(true);
    addResult('Get All Properties', 'running', 'Fetching all properties...');

    try {
      const properties = await getSavedProperties(user.uid);
      addResult(
        'Get All Properties',
        'success',
        `✅ Retrieved ${properties.length} properties`,
        properties
      );
    } catch (error) {
      addResult('Get All Properties', 'error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Get Single Property
  const testGetSavedProperty = async () => {
    if (!user?.uid) {
      addResult('Get Single Property', 'error', '❌ User not logged in');
      return;
    }

    setLoading(true);
    addResult('Get Single Property', 'running', 'Fetching single property...');

    try {
      const property = await getSavedProperty(user.uid, examplePropertyData.property_id);
      
      if (property) {
        addResult(
          'Get Single Property',
          'success',
          `✅ Property found: ${property.propertyData.address}`,
          property
        );
      } else {
        addResult('Get Single Property', 'warning', '⚠️ Property not found');
      }
    } catch (error) {
      addResult('Get Single Property', 'error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Update Analysis
  const testUpdateAnalysis = async () => {
    if (!user?.uid) {
      addResult('Update Analysis', 'error', '❌ User not logged in');
      return;
    }

    setLoading(true);
    addResult('Update Analysis', 'running', 'Updating property analysis...');

    const userInputs = {
      downPayment: 90000,
      interestRate: 6.5,
      loanTerm: 30,
      monthlyRent: 2850
    };

    const calculations = {
      monthlyCashFlow: 130,
      capRate: 7.8,
      cashOnCash: 9.2
    };

    try {
      await updatePropertyAnalysis(
        user.uid,
        examplePropertyData.property_id,
        userInputs,
        calculations
      );

      addResult(
        'Update Analysis',
        'success',
        `✅ Analysis updated! Cash Flow: $${calculations.monthlyCashFlow}`
      );
    } catch (error) {
      addResult('Update Analysis', 'error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 5: Update Notes
  const testUpdateNotes = async () => {
    if (!user?.uid) {
      addResult('Update Notes', 'error', '❌ User not logged in');
      return;
    }

    setLoading(true);
    addResult('Update Notes', 'running', 'Updating notes...');

    const notes = 'Great investment opportunity! Close to schools.';

    try {
      await updatePropertyNotes(user.uid, examplePropertyData.property_id, notes);
      addResult('Update Notes', 'success', `✅ Notes updated`);
    } catch (error) {
      addResult('Update Notes', 'error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 6: Update Tags
  const testUpdateTags = async () => {
    if (!user?.uid) {
      addResult('Update Tags', 'error', '❌ User not logged in');
      return;
    }

    setLoading(true);
    addResult('Update Tags', 'running', 'Updating tags...');

    const tags = ['rental', 'investment', 'single-family', 'good-location'];

    try {
      await updatePropertyTags(user.uid, examplePropertyData.property_id, tags);
      addResult('Update Tags', 'success', `✅ Tags updated: ${tags.join(', ')}`);
    } catch (error) {
      addResult('Update Tags', 'error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 7: Check If Saved
  const testIsPropertySaved = async () => {
    if (!user?.uid) {
      addResult('Check If Saved', 'error', '❌ User not logged in');
      return;
    }

    setLoading(true);
    addResult('Check If Saved', 'running', 'Checking if property is saved...');

    try {
      const isSaved = await isPropertySaved(user.uid, examplePropertyData.property_id);
      addResult(
        'Check If Saved',
        'success',
        isSaved ? '✅ Property is saved' : '⚠️ Property is not saved'
      );
    } catch (error) {
      addResult('Check If Saved', 'error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 8: Delete Property
  const testUnsaveProperty = async () => {
    if (!user?.uid) {
      addResult('Delete Property', 'error', '❌ User not logged in');
      return;
    }

    setLoading(true);
    addResult('Delete Property', 'running', 'Deleting property...');

    try {
      await unsaveProperty(user.uid, examplePropertyData.property_id);
      addResult('Delete Property', 'success', '✅ Property deleted');
    } catch (error) {
      addResult('Delete Property', 'error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Run all tests in sequence
  const runAllTests = async () => {
    clearResults();
    await testSaveProperty();
    await new Promise(r => setTimeout(r, 1000));
    await testGetSavedProperties();
    await new Promise(r => setTimeout(r, 1000));
    await testGetSavedProperty();
    await new Promise(r => setTimeout(r, 1000));
    await testUpdateAnalysis();
    await new Promise(r => setTimeout(r, 1000));
    await testUpdateNotes();
    await new Promise(r => setTimeout(r, 1000));
    await testUpdateTags();
    await new Promise(r => setTimeout(r, 1000));
    await testIsPropertySaved();
    // Don't delete in auto-run
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🗄️ Firebase Firestore Database Test
        </h1>
        <p className="text-gray-600 mb-4">
          Test database operations for saved properties
        </p>

        {!user ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-semibold">
              ⚠️ You must be logged in to test database operations
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">
              ✅ Logged in as: <span className="font-semibold">{user.email || user.uid}</span>
            </p>
          </div>
        )}

        {/* Test Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <button
            onClick={testSaveProperty}
            disabled={loading || !user}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-sm"
          >
            1. Save Property
          </button>

          <button
            onClick={testGetSavedProperties}
            disabled={loading || !user}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold text-sm"
          >
            2. Get All Properties
          </button>

          <button
            onClick={testGetSavedProperty}
            disabled={loading || !user}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-semibold text-sm"
          >
            3. Get Single Property
          </button>

          <button
            onClick={testUpdateAnalysis}
            disabled={loading || !user}
            className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold text-sm"
          >
            4. Update Analysis
          </button>

          <button
            onClick={testUpdateNotes}
            disabled={loading || !user}
            className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 font-semibold text-sm"
          >
            5. Update Notes
          </button>

          <button
            onClick={testUpdateTags}
            disabled={loading || !user}
            className="px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-400 font-semibold text-sm"
          >
            6. Update Tags
          </button>

          <button
            onClick={testIsPropertySaved}
            disabled={loading || !user}
            className="px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 font-semibold text-sm"
          >
            7. Check If Saved
          </button>

          <button
            onClick={testUnsaveProperty}
            disabled={loading || !user}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-semibold text-sm"
          >
            8. Delete Property
          </button>

          <button
            onClick={runAllTests}
            disabled={loading || !user}
            className="px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 font-semibold text-sm"
          >
            🚀 Run All Tests
          </button>
        </div>

        <button
          onClick={clearResults}
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-sm"
        >
          Clear Results
        </button>
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

            <p className="text-gray-700">{result.message}</p>

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

export default DatabaseTest;