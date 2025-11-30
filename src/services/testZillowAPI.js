// TEST SCRIPT - Run this to verify Zillow API is working
// Run: node testZillowAPI.js

import axios from 'axios';

// ⚠️ PASTE YOUR RAPIDAPI KEY HERE:
const RAPIDAPI_KEY = 'a1a8a39939mshc5fce7ab294dcabp194b23jsn3e9a18954167';

const RAPIDAPI_HOST = 'real-time-zillow-data.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

const getConfig = () => ({
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST
  }
});

async function testZillowAPI() {
  if (RAPIDAPI_KEY === 'YOUR_RAPIDAPI_KEY_HERE') {
    console.error('\n❌ ERROR: Set your RapidAPI key first!\n');
    console.error('Steps:');
    console.error('  1. Open testZillowAPI.js');
    console.error('  2. Replace YOUR_RAPIDAPI_KEY_HERE with your actual key');
    console.error('  3. Save and run: node testZillowAPI.js\n');
    return;
  }

  console.log('🧪 Testing Real-Time Zillow Data API\n');

  const testAddress = {
    address: '2114 Bigelow Ave N',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98109'
  };

  console.log('📍 Test address:');
  console.log(`   ${testAddress.address}`);
  console.log(`   ${testAddress.city}, ${testAddress.state} ${testAddress.zipCode}\n`);

  try {
    const location = `${testAddress.address}, ${testAddress.city}, ${testAddress.state} ${testAddress.zipCode}`;
    
    console.log('🔍 Calling /search endpoint...');
    const response = await axios.get(`${BASE_URL}/search`, {
      params: { location: location },
      ...getConfig()
    });

    console.log('✅ API Response received!\n');

    const results = response.data?.results || response.data;
    
    if (!results || (Array.isArray(results) && results.length === 0)) {
      console.error('❌ No properties found');
      console.error('   Try a different address\n');
      return;
    }

    const property = Array.isArray(results) ? results[0] : results;
    
    console.log('🏠 Property Found:');
    console.log('   ZPID:', property.zpid || 'N/A');
    console.log('   Address:', property.address?.streetAddress || 'N/A');
    
    // Extract rent
    const rent = property.rentZestimate || property.price?.rentZestimate || null;
    
    console.log('\n💰 Financial Data:');
    console.log('   Rent:', rent ? `$${rent.toLocaleString()}/mo` : '❌ NOT FOUND');
    console.log('   Zestimate:', property.zestimate ? `$${property.zestimate.toLocaleString()}` : 'N/A');
    console.log('   Status:', property.homeStatus || 'N/A');
    
    // Extract photos
    const photos = [];
    const photoArrays = [
      property.responsivePhotosOriginalRatio,
      property.responsivePhotos,
      property.photos
    ];
    
    for (const photoArray of photoArrays) {
      if (photoArray && Array.isArray(photoArray)) {
        photoArray.forEach(photo => {
          if (photo.mixedSources?.jpeg) {
            const sorted = photo.mixedSources.jpeg.sort((a, b) => (b.width || 0) - (a.width || 0));
            if (sorted[0]) photos.push({ url: sorted[0].url, width: sorted[0].width });
          }
        });
        if (photos.length > 0) break;
      }
    }
    
    console.log('\n📸 Photos:');
    if (photos.length > 0) {
      console.log(`   Found ${photos.length} HD images`);
      console.log('   First 3:');
      photos.slice(0, 3).forEach((photo, i) => {
        console.log(`   ${i + 1}. ${photo.url}`);
        console.log(`      ${photo.width}px wide`);
      });
    } else {
      console.log('   ❌ No photos found');
    }

    console.log('\n🏠 Property Details:');
    console.log('   Bedrooms:', property.bedrooms || 'N/A');
    console.log('   Bathrooms:', property.bathrooms || 'N/A');
    console.log('   Living Area:', property.livingArea ? `${property.livingArea.toLocaleString()} sqft` : 'N/A');

    // Verification
    console.log('\n\n🎯 VERIFICATION:');
    const checks = {
      'API connection': true,
      'ZPID found': !!property.zpid,
      'Rent estimate': !!rent,
      'Photos found': photos.length > 0,
      'HD images (>500px)': photos.length > 0 && photos[0]?.width > 500,
    };

    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });

    const allPassed = Object.values(checks).every(v => v);
    
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED!\n');
      console.log('✅ Next steps:');
      console.log('   1. Replace src/services/zillowAPI.js with the new file');
      console.log('   2. Restart: npm run dev');
      console.log('   3. Check property cards\n');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED\n');
      
      if (!rent) {
        console.log('💡 Rent missing: Property may not have rental data');
      }
      if (photos.length === 0) {
        console.log('💡 Photos missing: Try different property\n');
      }
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('\n🔐 Auth Error: Invalid API key');
      } else if (error.response.status === 429) {
        console.error('\n⏱️ Rate Limit: Wait 60 seconds');
      } else if (error.response.status === 403) {
        console.error('\n🚫 Access Denied: Subscribe to API first');
        console.error('   https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-zillow-data');
      }
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check API key is correct');
    console.error('   2. Verify subscription on RapidAPI');
    console.error('   3. Check you have credits\n');
  }
}

testZillowAPI();