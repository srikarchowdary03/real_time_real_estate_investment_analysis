import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import PropertiesHeader from '../components/features/PropertiesHeader';
import PropertiesGrid from '../components/features/PropertiesGrid';
import PropertyMap from '../components/features/PropertyMap';
import { searchProperties } from '../services/realtyAPI';
import { Search, MapPin, Building2, Loader2 } from 'lucide-react';

const Properties = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [allProperties, setAllProperties] = useState([]);
  const [currentBoundary, setCurrentBoundary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [searchMetadata, setSearchMetadata] = useState(null);
  const [viewMode, setViewMode] = useState('split');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filters, setFilters] = useState({});
  const [expandedPropertyId, setExpandedPropertyId] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Track last search to prevent duplicates
  const lastSearchRef = useRef(null);

  // Parse search params and fetch properties
  useEffect(() => {
    const zip = searchParams.get('zip');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const search = searchParams.get('search');

    // Build a search key to detect changes
    const searchKey = `${zip}-${city}-${state}-${search}-${JSON.stringify(filters)}`;

    // Only search if we have params and they've changed
    if ((zip || city || search) && searchKey !== lastSearchRef.current) {
      lastSearchRef.current = searchKey;
      fetchProperties(zip, city, state, search);
    }
  }, [searchParams, filters]);

  const fetchProperties = async (zip, city, state, search) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      let location;
      let displayLocation;
      
      if (zip) {
        location = zip;
        displayLocation = `ZIP ${zip}`;
      } else if (city && state) {
        location = `${city}, ${state}`;
        displayLocation = `${city}, ${state}`;
      } else if (search) {
        location = search;
        displayLocation = search;
      }

      setCurrentLocation(displayLocation);
      console.log('🔍 Searching:', location);
      
      const results = await searchProperties({
        location: location,
        limit: 200,
        status: 'for_sale',
        ...filters
      });

      setAllProperties(results || []);
      
      const withCoords = (results || []).filter(p => p.lat && p.lon);
      console.log(`📍 ${withCoords.length} out of ${(results || []).length} properties have coordinates`);
      
      if (!results || results.length === 0) {
        setError('No properties found matching your criteria. Try adjusting your filters or searching a different location.');
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

  // Handle new search from the search bar
  const handleNewSearch = (locationData) => {
    setCurrentBoundary(null);
    lastSearchRef.current = null; // Reset to allow new search
    
    let searchUrl = '/properties';
    
    if (locationData.postalCode) {
      searchUrl = `/properties?zip=${locationData.postalCode}`;
    } else if (locationData.city && locationData.state) {
      searchUrl = `/properties?city=${encodeURIComponent(locationData.city)}&state=${locationData.state}`;
    } else if (locationData.value) {
      searchUrl = `/properties?search=${encodeURIComponent(locationData.value)}`;
    }

    // Use navigate with replace to avoid building up history
    navigate(searchUrl);
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

  const handlePropertyExpand = (propertyId) => {
    if (expandedPropertyId === propertyId) {
      setExpandedPropertyId(null);
    } else {
      setExpandedPropertyId(propertyId);
      
      setTimeout(() => {
        const element = document.getElementById(`property-${propertyId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

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

  // Render empty state when no search has been performed
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <Search className="w-12 h-12 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Start Your Property Search</h2>
      <p className="text-gray-600 text-center max-w-md mb-8">
        Use the search bar above to find investment properties by city, ZIP code, or address
      </p>
      
      {/* Quick search suggestions */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <span className="text-sm text-gray-500">Try:</span>
        {[
          { label: 'Boston, MA', city: 'Boston', state: 'MA' },
          { label: 'Miami, FL', city: 'Miami', state: 'FL' },
          { label: 'Austin, TX', city: 'Austin', state: 'TX' },
          { label: 'Denver, CO', city: 'Denver', state: 'CO' },
        ].map((loc, idx) => (
          <button
            key={idx}
            onClick={() => handleNewSearch({ city: loc.city, state: loc.state })}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
          >
            <MapPin className="w-3 h-3" />
            {loc.label}
          </button>
        ))}
      </div>

      <div className="bg-blue-50 rounded-xl p-6 max-w-lg">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Pro Tip</h3>
            <p className="text-sm text-gray-600">
              Use the "Draw Boundary" tool on the map to find properties in custom areas, 
              or use filters to narrow down by price, bedrooms, and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertiesHeader
        onSearch={handleNewSearch}
        onFilterChange={handleFilterChange}
        filters={filters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className={`${viewMode === 'split' ? '' : 'container mx-auto px-4 py-8'}`}>
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-lg text-gray-600">Searching for properties...</p>
            {currentLocation && (
              <p className="text-sm text-gray-500 mt-2">Looking in {currentLocation}</p>
            )}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center max-w-2xl mx-auto my-8">
            <p className="text-yellow-800 text-lg mb-4">{error}</p>
            <button
              onClick={() => {
                lastSearchRef.current = null;
                const zip = searchParams.get('zip');
                const city = searchParams.get('city');
                const state = searchParams.get('state');
                const search = searchParams.get('search');
                fetchProperties(zip, city, state, search);
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State - No search performed yet */}
        {!loading && !error && !hasSearched && allProperties.length === 0 && renderEmptyState()}

        {/* Results */}
        {!loading && !error && allProperties.length > 0 && (
          <>
            {/* Results Header */}
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
                      <span className="ml-2 text-blue-600 font-semibold">
                        (with {Object.keys(filters).length} filter{Object.keys(filters).length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </p>

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

            {/* Properties Grid */}
            {(viewMode === 'list' || viewMode === 'split') && (
              <PropertiesGrid
                properties={allProperties}
                currentLocation={viewMode === 'split' ? currentLocation : ''}
                filters={filters}
                viewMode={viewMode}
                selectedProperty={selectedProperty}
                onPropertyHover={handlePropertyHover}
                expandedPropertyId={expandedPropertyId}
                onPropertyExpand={handlePropertyExpand}
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

        {/* No Results After Search */}
        {!loading && !error && hasSearched && allProperties.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Properties Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find any properties in {currentLocation || 'this area'}
            </p>
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-500">Try:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => handleNewSearch({ city: 'Boston', state: 'MA' })}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100"
                >
                  Boston, MA
                </button>
                <button
                  onClick={() => handleNewSearch({ city: 'Miami', state: 'FL' })}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100"
                >
                  Miami, FL
                </button>
                <button
                  onClick={() => handleNewSearch({ city: 'Austin', state: 'TX' })}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100"
                >
                  Austin, TX
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;