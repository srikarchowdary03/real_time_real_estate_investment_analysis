/**
 * API DIAGNOSTIC TOOL
 * 
 * Add this to a temporary test page to diagnose API issues
 * Usage: Create a button that calls testAPI()
 */

import axios from 'axios';

const RAPIDAPI_KEY = import.meta.env.VITE_REALTY_API_KEY;
const RAPIDAPI_HOST = 'realty-in-us.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

export const TestAPI = async () => {
  console.log('🧪 ========== API DIAGNOSTIC TEST ==========');
  console.log('🔑 API Key exists:', !!RAPIDAPI_KEY);
  console.log('🔑 API Key (first 10 chars):', RAPIDAPI_KEY?.substring(0, 10) + '...');
  console.log('🌐 Base URL:', BASE_URL);
  console.log('');
  
  // Test 1: Simple location autocomplete (should work even on free tier)
  console.log('📍 TEST 1: Location Autocomplete');
  try {
    const response = await axios.get(`${BASE_URL}/locations/v2/auto-complete`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      },
      params: {
        input: 'Boston',
        limit: 5
      }
    });
    
    console.log('✅ Autocomplete SUCCESS');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    console.error('❌ Autocomplete FAILED');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
  }
  
  console.log('');
  console.log('🏠 TEST 2: Properties Search (ZIP Code)');
  try {
    const response = await axios.get(`${BASE_URL}/properties/v2/list-for-sale`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      },
      params: {
        postal_code: '02134',
        limit: 10,
        offset: 0,
        sort: 'relevance'
      }
    });
    
    console.log('✅ Properties (ZIP) SUCCESS');
    console.log('Status:', response.status);
    console.log('Properties found:', response.data?.properties?.length || 0);
    console.log('Data keys:', Object.keys(response.data || {}));
    console.log('Full response:', JSON.stringify(response.data, null, 2).substring(0, 2000));
  } catch (error) {
    console.error('❌ Properties (ZIP) FAILED');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', error.response?.data);
    console.error('Error Message:', error.message);
  }
  
  console.log('');
  console.log('🏙️ TEST 3: Properties Search (City/State)');
  try {
    const response = await axios.get(`${BASE_URL}/properties/v2/list-for-sale`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      },
      params: {
        city: 'Boston',
        state_code: 'MA',
        limit: 10,
        offset: 0,
        sort: 'relevance'
      }
    });
    
    console.log('✅ Properties (City) SUCCESS');
    console.log('Status:', response.status);
    console.log('Properties found:', response.data?.properties?.length || 0);
    console.log('Data keys:', Object.keys(response.data || {}));
    console.log('Full response:', JSON.stringify(response.data, null, 2).substring(0, 2000));
  } catch (error) {
    console.error('❌ Properties (City) FAILED');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', error.response?.data);
    console.error('Error Message:', error.message);
  }
  
  console.log('');
  console.log('🧪 ========== DIAGNOSTIC TEST COMPLETE ==========');
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('1. Check if API key is valid (401 = invalid key)');
  console.log('2. Check subscription tier (403 = need to upgrade)');
  console.log('3. Verify endpoint structure matches your RapidAPI dashboard');
  console.log('4. Make sure you subscribed to the "Realty in US" API on RapidAPI');
};

export default TestAPI;