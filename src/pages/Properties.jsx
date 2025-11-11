// src/pages/Properties.jsx - FIXED VERSION

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PropertiesHeader from '../components/features/PropertiesHeader';
import PropertiesGrid from '../components/features/PropertiesGrid';
import PropertyMap from '../components/features/PropertyMap';
import { searchPropertiesForSale } from '../services/realtyAPI';

const Properties = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [allProperties, setAllProperties] = useState([]);
  const [currentBoundary, setCurrentBoundary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [searchMetadata, setSearchMetadata] = useState(null);
  const [viewMode, setViewMode] = useState('split');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const zip = searchParams.get('zip');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const search = searchParams.get('search');

    if (zip || city || search) {
      fetchProperties(zip, city, state, search);
    }
  }, [searchParams, filters]);

  const fetchProperties = async (zip, city, state, search) => {
    setLoading(true);
    setError(null);

    try {
      let data;
      
      const searchOptions = { 
        limit: 200,
        ...filters
      };

      if (zip) {
        setCurrentLocation(`ZIP ${zip}`);
        data = await searchPropertiesForSale(zip, null, searchOptions);
      } else if (city && state) {
        setCurrentLocation(`${city}, ${state}`);
        data = await searchPropertiesForSale(city, state, searchOptions);
      } else if (search) {
        setCurrentLocation(search);
        data = await searchPropertiesForSale(search, null, searchOptions);
      }

      const results = data?.data?.home_search?.results || 
                     data?.data?.results || 
                     data?.results || 
                     [];

      const metadata = data?.searchMetadata || null;
      setSearchMetadata(metadata);

      setAllProperties(results);
      
      const withCoords = results.filter(p => 
        p.location?.address?.coordinate?.lat && 
        p.location?.address?.coordinate?.lon
      );
      
      console.log(`📍 ${withCoords.length} out of ${results.length} properties have coordinates`);
      
      if (metadata?.isMultiZipcodeSearch) {
        console.log(`🎯 Multi-zipcode search completed:`);
        console.log(`   Location: ${metadata.location}`);
        console.log(`   Zipcodes searched: ${metadata.zipcodeCount}`);
        console.log(`   Properties found: ${metadata.propertiesFound}`);
      }
      
      if (results.length === 0) {
        setError('No properties found matching your criteria. Try adjusting your filters.');
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleNewSearch = (location) => {
    setCurrentBoundary(null);
    
    if (location.postal_code) {
      navigate(`/properties?zip=${location.postal_code}`);
    } else if (location.city && location.state_code) {
      navigate(`/properties?city=${location.city}&state=${location.state_code}`);
    }
  };

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    const element = document.getElementById(`property-${property.property_id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePropertyHover = (property) => {
    setSelectedProperty(property);
  };

  // Boundary handlers - now just updates state, PropertyMap handles filtering internally
  const handleBoundaryCreated = (boundary) => {
    console.log('🎨 New boundary created:', boundary);
    setCurrentBoundary(boundary);
  };

  const handleBoundaryEdited = (boundary) => {
    console.log('✏️ Boundary edited:', boundary);
    setCurrentBoundary(boundary);
  };

  const handleBoundaryDeleted = () => {
    console.log('🗑️ Boundary deleted');
    setCurrentBoundary(null);
  };

  const hasBoundary = currentBoundary !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <PropertiesHeader
        onSearch={handleNewSearch}
        onFilterChange={handleFilterChange}
        filters={filters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Content */}
      <div className={`${viewMode === 'split' ? '' : 'container mx-auto px-4 py-8'}`}>
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-gray-200 border-t-red-600 rounded-full mb-4" />
            <p className="text-lg text-gray-600">Searching for properties...</p>
            {searchMetadata?.isMultiZipcodeSearch && (
              <p className="text-sm text-gray-500 mt-2">
                Searching across {searchMetadata.zipcodeCount} ZIP codes...
              </p>
            )}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 text-lg">{error}</p>
          </div>
        )}

        {/* Properties Content */}
        {!loading && !error && allProperties.length > 0 && (
          <>
            {/* Enhanced Results Header */}
            {(viewMode === 'list' || viewMode === 'split') && currentLocation && (
              <div className={`${viewMode === 'split' ? 'px-4 pt-4' : 'mb-6'}`}>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Homes for sale in {currentLocation}
                </h1>
                <div className="flex flex-col gap-2">
                  <p className="text-gray-600">
                    <span className="font-semibold text-gray-900">
                      {allProperties.length} {allProperties.length === 1 ? 'property' : 'properties'}
                    </span>
                    {Object.keys(filters).length > 0 && (
                      <span className="ml-2 text-red-600 font-semibold">
                        (with {Object.keys(filters).length} filter{Object.keys(filters).length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </p>
                  
                  {/* Multi-zipcode badge */}
                  {searchMetadata?.isMultiZipcodeSearch && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Searching across {searchMetadata.zipcodeCount} ZIP codes</span>
                      </div>
                    </div>
                  )}

                  {/* Boundary filter indicator */}
                  {hasBoundary && (
                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium w-fit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Boundary filter active</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Property Grid */}
            {(viewMode === 'list' || viewMode === 'split') && (
              <PropertiesGrid
                properties={allProperties}
                currentLocation={viewMode === 'split' ? currentLocation : ''}
                filters={filters}
                viewMode={viewMode}
                selectedProperty={selectedProperty}
                onPropertyHover={handlePropertyHover}
              />
            )}

            {/* Map View */}
            {(viewMode === 'map' || viewMode === 'split') && (
              <div 
                className={`
                  transition-all duration-300
                  ${viewMode === 'split' 
                    ? 'fixed right-0' 
                    : 'w-full h-[calc(100vh-250px)]'
                  }
                `}
                style={{ 
                  top: viewMode === 'split' ? '150px' : undefined,
                  height: viewMode === 'split' ? 'calc(100vh - 150px)' : undefined,
                  width: viewMode === 'split' ? (() => {
                    if (typeof window !== 'undefined') {
                      const width = window.innerWidth;
                      if (width >= 1536) return '40%';
                      if (width >= 1280) return '42%';
                      if (width >= 1024) return '45%';
                      if (width >= 768) return '50%';
                      return '0';
                    }
                    return '50%';
                  })() : undefined,
                  display: viewMode === 'split' && typeof window !== 'undefined' && window.innerWidth < 768 ? 'none' : 'block'
                }}
              >
                <PropertyMap
                  properties={allProperties}
                  selectedProperty={selectedProperty}
                  onPropertyClick={handlePropertyClick}
                  onBoundaryCreated={handleBoundaryCreated}
                  onBoundaryEdited={handleBoundaryEdited}
                  onBoundaryDeleted={handleBoundaryDeleted}
                />
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && allProperties.length === 0 && !currentLocation && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏘️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your Search</h2>
            <p className="text-gray-600">Use the search bar above to find properties</p>
            <p className="text-sm text-gray-500 mt-2">
              Search by city (e.g., "Boston, MA") to see properties from all ZIP codes
            </p>
            <p className="text-sm text-blue-600 mt-2 font-medium">
              💡 Tip: Use the "Draw Boundary" tool on the map to find properties in custom areas!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;