import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PropertiesHeader from '../components/features/PropertiesHeader';
import PropertiesGrid from '../components/features/PropertiesGrid';
import PropertyCard from '../components/features/propertycard';
import PropertyMap from '../components/features/PropertyMap';
import { searchPropertiesForSale } from '../services/realtyAPI';

const Properties = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
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
        limit: 50,
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

      setProperties(results);
      
      const withCoords = results.filter(p => 
        p.location?.address?.coordinate?.lat && 
        p.location?.address?.coordinate?.lon
      );
      console.log(`📍 ${withCoords.length} out of ${results.length} properties have coordinates`);
      
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
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 text-lg">{error}</p>
          </div>
        )}

        {/* Properties Content */}
        {!loading && !error && properties.length > 0 && (
          <>
            {/* Property Grid */}
            {(viewMode === 'list' || viewMode === 'split') && (
              <PropertiesGrid
                properties={properties}
                currentLocation={viewMode === 'split' ? currentLocation : ''}
                filters={filters}
                viewMode={viewMode}
                selectedProperty={selectedProperty}
                onPropertyHover={handlePropertyHover}
              />
            )}

            {/* Results Header for List View Only */}
            {viewMode === 'list' && currentLocation && (
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Homes for sale in {currentLocation}
                </h1>
                <p className="text-gray-600">
                  {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
                  {Object.keys(filters).length > 0 && (
                    <span className="ml-2 text-red-600 font-semibold">
                      (with {Object.keys(filters).length} filter{Object.keys(filters).length !== 1 ? 's' : ''})
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Map View - RESPONSIVE WIDTH BASED ON AVAILABLE SPACE */}
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
                      if (width >= 1536) return '40%';      // XL screens
                      if (width >= 1280) return '42%';      // Large screens  
                      if (width >= 1024) return '45%';      // Medium screens
                      if (width >= 768) return '50%';       // Tablet
                      return '0';                           // Mobile - hidden
                    }
                    return '50%';
                  })() : undefined,
                  display: viewMode === 'split' && typeof window !== 'undefined' && window.innerWidth < 768 ? 'none' : 'block'
                }}
              >
                <PropertyMap
                  properties={properties}
                  selectedProperty={selectedProperty}
                  onPropertyClick={handlePropertyClick}
                />
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && properties.length === 0 && !currentLocation && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏘️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your Search</h2>
            <p className="text-gray-600">Use the search bar above to find properties</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;