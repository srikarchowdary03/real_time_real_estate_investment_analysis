import React, { useState } from 'react';
import { 
  autoCompleteLocations, 
  searchPropertiesForSale, 
  getPropertyDetails, 
  getPropertyPhotos 
} from '../services/realtyAPI';

const APITest = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [testMode, setTestMode] = useState('autocomplete'); // 'autocomplete' or 'properties'

  // Test getting property by address (using auto-complete + details)
  const testPropertyByAddress = async (address) => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      console.log('🏠 Testing property search by address:', address);
      
      // Step 1: Use auto-complete to find the property
      console.log('Step 1: Searching for address...');
      const autoCompleteData = await autoCompleteLocations(address, 5);
      
      console.log('📦 Auto-complete response:', autoCompleteData);
      
      if (!autoCompleteData?.autocomplete || autoCompleteData.autocomplete.length === 0) {
        setError('No locations found for that address');
        return;
      }
      
      // Find address-type results (not just cities)
      const addressResults = autoCompleteData.autocomplete.filter(
        item => item.area_type === 'address' || item.area_type === 'postal_code'
      );
      
      console.log('🏠 Found addresses:', addressResults);
      
      if (addressResults.length > 0) {
        setResults({
          type: 'address_search',
          data: addressResults,
          rawResponse: autoCompleteData
        });
        console.log('✅ Found addresses! You can now get property details using the property_id or mpr_id');
      } else {
        setResults({
          type: 'autocomplete',
          data: autoCompleteData.autocomplete
        });
      }
      
    } catch (err) {
      setError(`Address Search Error: ${err.message}`);
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };
  const testAutoComplete = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      console.log('🔍 Testing Auto-Complete...');
      const data = await autoCompleteLocations(searchInput || 'New York', 10);
      
      if (data?.autocomplete) {
        setResults({
          type: 'autocomplete',
          data: data.autocomplete
        });
        console.log('✅ Auto-complete SUCCESS!', data.autocomplete);
      } else {
        setError('No autocomplete results found');
      }
    } catch (err) {
      setError(`Auto-complete Error: ${err.message}`);
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Test Property Search
  const testPropertySearch = async (location, stateCode = null) => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      console.log(`🏠 Testing Property Search for ${location}...`);
      const data = await searchPropertiesForSale(location, stateCode, { limit: 10 });
      
      // Debug: Log the entire response structure
      console.log('📦 FULL API RESPONSE:', JSON.stringify(data, null, 2));
      console.log('📦 Response keys:', Object.keys(data || {}));
      
      // Check different possible response structures
      const properties = data?.data?.home_search?.results || 
                        data?.data?.results || 
                        data?.results || 
                        data?.properties ||
                        [];
      
      console.log('🔍 Properties found:', properties);
      console.log('🔍 Properties length:', properties.length);
      
      if (properties.length > 0) {
        setResults({
          type: 'properties',
          data: properties,
          rawResponse: data
        });
        console.log(`✅ SUCCESS! Found ${properties.length} properties`);
      } else {
        // Show the full response even when no properties found
        setError(`No properties found for ${location}. Check console for full API response.`);
        setResults({
          type: 'debug',
          data: data
        });
        console.log('⚠️ No properties in response. Full response:', data);
      }
    } catch (err) {
      setError(`Property Search Error: ${err.message}`);
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>🏡 Realty API Test</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Test the Realty in US API endpoints</p>

      {/* Test Mode Toggle */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 'bold' }}>Test Mode:</span>
        <button
          onClick={() => setTestMode('autocomplete')}
          style={{
            padding: '8px 16px',
            backgroundColor: testMode === 'autocomplete' ? '#2196F3' : '#ddd',
            color: testMode === 'autocomplete' ? 'white' : '#666',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          🔍 Auto-Complete
        </button>
        <button
          onClick={() => setTestMode('properties')}
          style={{
            padding: '8px 16px',
            backgroundColor: testMode === 'properties' ? '#2196F3' : '#ddd',
            color: testMode === 'properties' ? 'white' : '#666',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          🏠 Property List
        </button>
        <button
          onClick={() => setTestMode('address')}
          style={{
            padding: '8px 16px',
            backgroundColor: testMode === 'address' ? '#2196F3' : '#ddd',
            color: testMode === 'address' ? 'white' : '#666',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          📍 Property by Address
        </button>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter city, state, or address..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />
      </div>

      {/* Test Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {testMode === 'autocomplete' && (
          <button
            onClick={testAutoComplete}
            disabled={loading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontWeight: '500'
            }}
          >
            🔍 Test Auto-Complete
          </button>
        )}

        {testMode === 'properties' && (
          <>
            <button
              onClick={() => testPropertySearch('Los Angeles', 'CA')}
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontWeight: '500'
              }}
            >
              🏠 Test LA Properties
            </button>

            <button
              onClick={() => testPropertySearch('Miami', 'FL')}
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontWeight: '500'
              }}
            >
              🌴 Test Miami Properties
            </button>

            <button
              onClick={() => testPropertySearch('Austin', 'TX')}
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontWeight: '500'
              }}
            >
              🤠 Test Austin Properties
            </button>
          </>
        )}

        {testMode === 'address' && (
          <>
            <button
              onClick={() => testPropertyByAddress(searchInput || '350 5th Ave, New York, NY')}
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#E91E63',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontWeight: '500'
              }}
            >
              📍 Search Address
            </button>
            <button
              onClick={() => testPropertyByAddress('1600 Pennsylvania Ave, Washington DC')}
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#00BCD4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontWeight: '500'
              }}
            >
              🏛️ Test White House
            </button>
          </>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          padding: '20px',
          backgroundColor: '#E3F2FD',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '18px' }}>⏳ Loading...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          padding: '20px',
          backgroundColor: '#FFEBEE',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #EF5350'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#C62828' }}>❌ Error</h3>
          <p style={{ margin: 0, color: '#C62828' }}>{error}</p>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
            Check the browser console (F12) for detailed error logs
          </p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{
          padding: '20px',
          backgroundColor: results.type === 'debug' ? '#FFF3E0' : '#E8F5E9',
          borderRadius: '8px',
          border: results.type === 'debug' ? '2px solid #FF9800' : '2px solid #4CAF50'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: results.type === 'debug' ? '#E65100' : '#2E7D32' }}>
            {results.type === 'debug' ? '🔍 Debug: API Response' : '✅ Success!'}
            {results.type === 'autocomplete' && ' Auto-Complete Results'}
            {results.type === 'properties' && ' Properties Found'}
          </h3>

          {results.type === 'autocomplete' || results.type === 'address_search' ? (
            // Auto-complete or address search results
            <div>
              {results.type === 'address_search' && (
                <p style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#E3F2FD', borderRadius: '6px' }}>
                  ℹ️ Found {results.data.length} address(es). These have property IDs that can be used with other endpoints!
                </p>
              )}
              {results.data.map((item, index) => (
                <div key={index} style={{
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  border: '1px solid #ddd'
                }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                    {item.full_address?.[0] || item.line || item.area_name || item.city || 'Location'}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    Type: {item.area_type} • ID: {item._id}
                    {item.mpr_id && ` • Property ID: ${item.mpr_id}`}
                    {item.prop_status && ` • Status: ${item.prop_status.join(', ')}`}
                  </p>
                  {item.state_code && (
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                      {item.city && `${item.city}, `}{item.state_code} {item.postal_code}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : results.type === 'debug' ? (
            // Debug view for empty responses
            <div>
              <p style={{ marginBottom: '15px', color: '#E65100' }}>
                The API returned a response but no properties were found. Here's what came back:
              </p>
              <pre style={{
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '6px',
                overflow: 'auto',
                fontSize: '12px',
                border: '1px solid #ddd'
              }}>
                {JSON.stringify(results.data, null, 2)}
              </pre>
              <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                💡 This might mean the endpoint exists but doesn't have access to property data in your subscription plan.
              </p>
            </div>
          ) : (
            // Property results
            <div>
              {results.data.map((property, index) => (
                <div key={index} style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  marginBottom: '15px',
                  border: '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>
                    {property.location?.address?.line || 'Address not available'}
                  </h4>
                  <p style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>
                    ${property.list_price?.toLocaleString() || 'N/A'}
                  </p>
                  <p style={{ margin: 0, color: '#666' }}>
                    {property.description?.beds || 0} beds • 
                    {property.description?.baths || 0} baths • 
                    {property.description?.sqft?.toLocaleString() || 0} sqft
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#999' }}>
                    Property ID: {property.property_id}
                  </p>
                </div>
              ))}
            </div>
          )}

          <details style={{ marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#666' }}>
              📋 View Raw JSON Response
            </summary>
            <pre style={{
              marginTop: '10px',
              padding: '15px',
              backgroundColor: '#f5f5f5',
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(results.rawResponse || results.data, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Instructions */}
      {!loading && !results && !error && (
        <div style={{
          padding: '20px',
          backgroundColor: '#FFF3E0',
          borderRadius: '8px',
          border: '2px solid #FF9800'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>📝 Instructions</h3>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Make sure you've added your RapidAPI key to <code>src/services/realtyAPI.js</code></li>
            <li>Type a location in the search box or use the preset buttons</li>
            <li>Check the browser console (F12) for detailed logs</li>
            <li>If you see errors, verify your API subscription and endpoint access</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default APITest;