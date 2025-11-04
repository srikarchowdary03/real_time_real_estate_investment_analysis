// src/pages/PropertySearch.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PropertySearchBar from '../components/PropertySearchBar';
import PropertyMap from '../components/features/PropertyMap';
import { searchPropertiesForSale } from '../services/realtyAPI';
import { Bed, Bath, Square, Loader2, Map, List, LayoutGrid } from 'lucide-react';

function getStableId(p) {
  return p?.property_id || p?.listing_id || p?.id;
}

const PropertySearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [selectedProperty, setSelectedProperty] = useState(null);

  const query = searchParams.get('q') || searchParams.get('zip') || searchParams.get('search');

  useEffect(() => {
    if (query) {
      fetchProperties(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchProperties = async (searchQuery) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Searching for:', searchQuery);
      const data = await searchPropertiesForSale(searchQuery);

      const results =
        data?.data?.home_search?.results ||
        data?.data?.results ||
        data?.results ||
        [];

      if (results && results.length > 0) {
        setProperties(results);
        console.log('✅ Found', results.length, 'properties');

        const withCoords = results.filter(
          (p) =>
            p.location?.address?.coordinate?.lat &&
            p.location?.address?.coordinate?.lon
        );
        console.log(`📍 ${withCoords.length} out of ${results.length} properties have coordinates`);
      } else {
        setProperties([]);
        setError('No properties found. Try a different search.');
      }
    } catch (err) {
      console.error('❌ Search error:', err);
      setError(err.message || 'Failed to fetch properties. Please try again.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery) => {
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    const id = getStableId(property);
    if (!id) return;
    const element = document.getElementById(`property-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Price not available';
    return `$${price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Floating View Toggle - ALWAYS VISIBLE */}
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: 'white',
          padding: '8px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '2px solid #EF4444',
        }}
      >
        <div
          style={{
            marginBottom: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#EF4444',
            textAlign: 'center',
          }}
        >
          VIEW MODE
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              console.log('📋 LIST clicked');
              setViewMode('list');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              backgroundColor: viewMode === 'list' ? '#EF4444' : '#F3F4F6',
              color: viewMode === 'list' ? 'white' : '#374151',
              transition: 'all 0.2s',
            }}
          >
            <List size={20} />
            <span>LIST</span>
          </button>

          <button
            onClick={() => {
              console.log('📊 SPLIT clicked');
              setViewMode('split');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              backgroundColor: viewMode === 'split' ? '#EF4444' : '#F3F4F6',
              color: viewMode === 'split' ? 'white' : '#374151',
              transition: 'all 0.2s',
            }}
          >
            <LayoutGrid size={20} />
            <span>SPLIT</span>
          </button>

          <button
            onClick={() => {
              console.log('🗺️ MAP clicked');
              setViewMode('map');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              backgroundColor: viewMode === 'map' ? '#EF4444' : '#F3F4F6',
              color: viewMode === 'map' ? 'white' : '#374151',
              transition: 'all 0.2s',
            }}
          >
            <Map size={20} />
            <span>MAP</span>
          </button>
        </div>
        <div
          style={{
            marginTop: '8px',
            fontSize: '11px',
            color: '#6B7280',
            textAlign: 'center',
          }}
        >
          Current: <strong style={{ color: '#EF4444' }}>{viewMode.toUpperCase()}</strong>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <PropertySearchBar onSearch={handleSearch} />

          {!loading && properties.length > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-semibold">
                {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
                {query && ` for "${query}"`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-red-600" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-red-600 text-lg font-semibold mb-2">{error}</div>
            <button
              onClick={() => fetchProperties(query)}
              className="text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl font-semibold mb-2">No properties found</p>
            <p className="text-sm">Try searching for a different location</p>
          </div>
        ) : (
          <div className={`flex gap-6 ${viewMode === 'split' ? 'h-[calc(100vh-220px)]' : ''}`}>
            {/* Property List */}
            {(viewMode === 'list' || viewMode === 'split') && (
              <div className={`${viewMode === 'split' ? 'w-1/2 overflow-y-auto pr-3' : 'w-full'}`}>
                <div className="grid grid-cols-1 gap-6">
                  {properties.map((property) => {
                    const price = property.list_price || 0;
                    const address = property.location?.address?.line || 'Address not available';
                    const city = property.location?.address?.city || '';
                    const state = property.location?.address?.state_code || '';
                    const zipCode = property.location?.address?.postal_code || '';
                    const beds = property.description?.beds || 0;
                    const baths = property.description?.baths || 0;
                    const sqft = property.description?.sqft || 0;
                    const image =
                      property.primary_photo?.href ||
                      property.photos?.[0]?.href ||
                      'https://via.placeholder.com/400x300?text=No+Image';
                    const id = getStableId(property);
                    const isSelected = getStableId(selectedProperty) === id;

                    return (
                      <div
                        key={id}
                        id={`property-${id}`}
                        onClick={() => id && navigate(`/property/${id}`, { state: { property } })}
                        className={`bg-white rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isSelected ? 'ring-2 ring-red-600 shadow-xl' : 'border border-gray-200'
                          }`}
                      >
                        <div className="relative h-56 bg-gray-200 overflow-hidden">
                          <img
                            src={image}
                            alt={address}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://via.placeholder.com/400x300?text=No+Image';
                            }}
                          />
                          {property.flags?.is_new_listing && (
                            <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold">
                              NEW
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="text-2xl font-bold text-gray-900 mb-3">
                            {formatPrice(price)}
                          </div>
                          <div className="flex items-center gap-4 mb-3 text-gray-600">
                            {beds > 0 && (
                              <div className="flex items-center gap-1">
                                <Bed className="w-4 h-4" />
                                <span className="text-sm font-medium">{beds} bd</span>
                              </div>
                            )}
                            {baths > 0 && (
                              <div className="flex items-center gap-1">
                                <Bath className="w-4 h-4" />
                                <span className="text-sm font-medium">{baths} ba</span>
                              </div>
                            )}
                            {sqft > 0 && (
                              <div className="flex items-center gap-1">
                                <Square className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {sqft.toLocaleString()} sqft
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 leading-relaxed">
                            <div className="font-medium text-gray-900 mb-1">{address}</div>
                            <div>
                              {city}
                              {city && state && ', '}
                              {state} {zipCode}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Map View */}
            {(viewMode === 'map' || viewMode === 'split') && (
              <div
                className={`${viewMode === 'split' ? 'w-1/2 sticky top-[140px]' : 'w-full'
                  } ${viewMode === 'map' ? 'h-[calc(100vh-200px)]' : 'h-full'}`}
              >
                <PropertyMap
                  properties={properties}
                  selectedProperty={selectedProperty}
                  onPropertyClick={handlePropertyClick}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertySearch;
