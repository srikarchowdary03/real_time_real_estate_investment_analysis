import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PropertiesHeader from '../components/features/PropertiesHeader';
import PropertiesGrid from '../components/features/PropertiesGrid';
import PropertyCard from '../components/features/PropertyCard'; // ✅ Case-correct import
import PropertyMap from '../components/features/PropertyMap';
import { searchPropertiesForSale } from '../services/realtyAPI';

function getStableId(p) {
  return p?.property_id || p?.listing_id || p?.id;
}

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
  const [preFilterProperties, setPreFilterProperties] = useState([]);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapFilterActive, setMapFilterActive] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    const zip = searchParams.get('zip');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const search = searchParams.get('search');

    if (zip || city || search) {
      fetchProperties(zip, city, state, search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, filters]);

  const fetchProperties = async (zip, city, state, search) => {
    setLoading(true);
    setError(null);

    try {
      let data;

      const searchOptions = {
        limit: 50,
        ...filters,
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

      const results =
        data?.data?.home_search?.results ||
        data?.data?.results ||
        data?.results ||
        [];

      setProperties(results);
      setPreFilterProperties(results);

      const withCoords = results.filter(
        (p) =>
          p.location?.address?.coordinate?.lat &&
          p.location?.address?.coordinate?.lon
      );
      console.log(
        `📍 ${withCoords.length} out of ${results.length} properties have coordinates`
      );

      if (results.length === 0) {
        setError(
          'No properties found matching your criteria. Try adjusting your filters.'
        );
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

  const handleBoundsChange = useCallback((bounds) => {
    setMapBounds((prev) => {
      if (
        !prev ||
        prev.north !== bounds.north ||
        prev.south !== bounds.south ||
        prev.east !== bounds.east ||
        prev.west !== bounds.west
      ) {
        return bounds;
      }
      return prev;
    });
  }, []);

  const applyMapFilter = async () => {
    setMapLoading(true);
    try {
      const b = mapBounds;
      if (!b) return;
      const filtered = preFilterProperties.filter((p) => {
        const lat = p.location?.address?.coordinate?.lat;
        const lon = p.location?.address?.coordinate?.lon;
        return (
          lat &&
          lon &&
          lat <= b.north &&
          lat >= b.south &&
          lon <= b.east &&
          lon >= b.west
        );
      });
      setProperties(filtered);
      setMapFilterActive(true);
      setError(filtered.length === 0 ? 'No properties found in this area.' : null);
    } catch (err) {
      setError('Failed to apply map filter.');
    } finally {
      setMapLoading(false);
    }
  };

  const clearMapFilter = () => {
    setProperties(preFilterProperties);
    setMapFilterActive(false);
    setError(null);
  };

  const handlePropertyHover = (property) => {
    setSelectedProperty(property);
  };

  const handlePropertySelect = (id, property) => {
    const stableId = id || getStableId(property);
    if (!stableId) return;
    navigate(`/property/${stableId}`, { state: { property } });
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
                onPropertySelect={handlePropertySelect}
              // If your PropertiesGrid renders PropertyCard, make sure it forwards onSelect
              // e.g., <PropertyCard property={p} onSelect={onPropertySelect} ... />
              />
            )}

            {/* Map View - RESPONSIVE WIDTH BASED ON AVAILABLE SPACE */}
            {(viewMode === 'map' || viewMode === 'split') && (
              <div
                className={`
                  transition-all duration-300
                  ${viewMode === 'split'
                    ? 'fixed right-0 hidden md:block md:w-[45%] lg:w-[42%] xl:w-[40%] 2xl:w-[40%]'
                    : 'w-full h-[calc(100vh-250px)]'
                  }
                `}
                style={{
                  top: viewMode === 'split' ? '150px' : undefined,
                  height: viewMode === 'split' ? 'calc(100vh - 150px)' : undefined,
                }}
              >
                <PropertyMap
                  properties={properties}
                  selectedProperty={selectedProperty}
                  onPropertyClick={handlePropertyHover}
                  onBoundsChange={handleBoundsChange}
                  onApplyFilter={applyMapFilter}
                  onClearFilter={clearMapFilter}
                  mapFilterActive={mapFilterActive}
                  mapLoading={mapLoading}
                />
              </div>
            )}
          </>
        )}

        {/* Empty state when no results */}
        {!loading && !error && properties.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl font-semibold mb-2">No properties found</p>
            <p className="text-sm">Try adjusting filters or choosing a different area</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;
