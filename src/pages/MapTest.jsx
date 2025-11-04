// src/pages/MapTest.jsx

import React, { useState } from 'react';
import PropertyMap from '../components/features/PropertyMap';

const MapTest = () => {
  // Sample property data for testing
  const [sampleProperties] = useState([
    {
      property_id: '1',
      list_price: 250000,
      location: {
        address: {
          line: '123 Main Street',
          city: 'Boston',
          state_code: 'MA',
          postal_code: '02101',
          coordinate: {
            lat: 42.3601,
            lon: -71.0589
          }
        }
      },
      description: {
        beds: 3,
        baths: 2,
        sqft: 1500
      },
      primary_photo: {
        href: 'https://via.placeholder.com/400x300?text=Property+1'
      }
    },
    {
      property_id: '2',
      list_price: 450000,
      location: {
        address: {
          line: '456 Oak Avenue',
          city: 'Cambridge',
          state_code: 'MA',
          postal_code: '02139',
          coordinate: {
            lat: 42.3736,
            lon: -71.1097
          }
        }
      },
      description: {
        beds: 4,
        baths: 3,
        sqft: 2200
      },
      primary_photo: {
        href: 'https://via.placeholder.com/400x300?text=Property+2'
      }
    },
    {
      property_id: '3',
      list_price: 650000,
      location: {
        address: {
          line: '789 Park Boulevard',
          city: 'Brookline',
          state_code: 'MA',
          postal_code: '02446',
          coordinate: {
            lat: 42.3317,
            lon: -71.1211
          }
        }
      },
      description: {
        beds: 5,
        baths: 4,
        sqft: 3000
      },
      primary_photo: {
        href: 'https://via.placeholder.com/400x300?text=Property+3'
      }
    },
    {
      property_id: '4',
      list_price: 850000,
      location: {
        address: {
          line: '321 Elm Street',
          city: 'Somerville',
          state_code: 'MA',
          postal_code: '02143',
          coordinate: {
            lat: 42.3876,
            lon: -71.0995
          }
        }
      },
      description: {
        beds: 4,
        baths: 3.5,
        sqft: 2800
      },
      primary_photo: {
        href: 'https://via.placeholder.com/400x300?text=Property+4'
      }
    },
    {
      property_id: '5',
      list_price: 1200000,
      location: {
        address: {
          line: '555 Harbor View',
          city: 'Boston',
          state_code: 'MA',
          postal_code: '02109',
          coordinate: {
            lat: 42.3605,
            lon: -71.0543
          }
        }
      },
      description: {
        beds: 6,
        baths: 5,
        sqft: 4500
      },
      primary_photo: {
        href: 'https://via.placeholder.com/400x300?text=Property+5'
      }
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Map Component Test</h1>
          <p className="text-gray-600 mt-2">
            Testing PropertyMap with {sampleProperties.length} sample properties
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Interactive Map View</h2>
          <div className="h-[600px]">
            <PropertyMap
              properties={sampleProperties}
              onPropertyClick={(property) => {
                console.log('Property clicked:', property);
                alert(`Clicked: ${property.location.address.line}`);
              }}
            />
          </div>
        </div>

        {/* Property List */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sample Properties</h2>
          <div className="space-y-4">
            {sampleProperties.map((property) => (
              <div
                key={property.property_id}
                className="border border-gray-200 rounded-lg p-4 hover:border-red-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg text-gray-900">
                      ${property.list_price.toLocaleString()}
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      {property.location.address.line}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {property.location.address.city}, {property.location.address.state_code}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {property.description.beds} bed • {property.description.baths} bath • {property.description.sqft} sqft
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Test Instructions</h3>
          <ul className="space-y-2 text-blue-800">
            <li>✅ Check if map loads correctly</li>
            <li>✅ Verify all 5 markers are visible</li>
            <li>✅ Click markers to see popups with property details</li>
            <li>✅ Verify marker colors match price ranges:
              <ul className="ml-6 mt-1 space-y-1">
                <li>🟢 Green: &lt; $300K</li>
                <li>🔵 Blue: $300K - $500K</li>
                <li>🟠 Orange: $500K - $750K</li>
                <li>🔴 Red: &gt; $750K</li>
              </ul>
            </li>
            <li>✅ Zoom out to see marker clustering</li>
            <li>✅ Click clusters to zoom in or spiderfy</li>
            <li>✅ Check price legend in bottom-left</li>
            <li>✅ Check property count badge in top-left</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MapTest;