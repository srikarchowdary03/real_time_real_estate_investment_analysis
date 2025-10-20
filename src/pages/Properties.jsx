import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Bed, Bath, Square, Map, List, LayoutGrid } from 'lucide-react';
import PropertySearchBar from "../components/common/PropertySearchBar";
import PropertyMap from "../components/features/PropertyMap";
import { searchPropertiesForSale } from "../services/realtyAPI";

const Properties = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'split', 'map'
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Fetch properties when page loads or search params change
  useEffect(() => {
    const zip = searchParams.get('zip');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const search = searchParams.get('search');

    if (zip || city || search) {
      fetchProperties(zip, city, state, search);
    }
  }, [searchParams]);

  // Fetch properties from API
  const fetchProperties = async (zip, city, state, search) => {
    setLoading(true);
    setError(null);

    try {
      let data;
      
      if (zip) {
        setCurrentLocation(`ZIP ${zip}`);
        data = await searchPropertiesForSale(zip, null, { limit: 50 });
      } else if (city && state) {
        setCurrentLocation(`${city}, ${state}`);
        data = await searchPropertiesForSale(city, state, { limit: 50 });
      } else if (search) {
        setCurrentLocation(search);
        data = await searchPropertiesForSale(search, null, { limit: 50 });
      }

      // Extract properties from response
      const results = data?.data?.home_search?.results || 
                     data?.data?.results || 
                     data?.results || 
                     [];

      setProperties(results);
      
      // Debug coordinates
      const withCoords = results.filter(p => 
        p.location?.address?.coordinate?.lat && 
        p.location?.address?.coordinate?.lon
      );
      console.log(`📍 ${withCoords.length} out of ${results.length} properties have coordinates`);
      
      if (results.length === 0) {
        setError('No properties found for this location. Try a different search.');
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle new search from search bar
  const handleNewSearch = (location) => {
    if (location.postal_code) {
      navigate(`/properties?zip=${location.postal_code}`);
    } else if (location.city && location.state_code) {
      navigate(`/properties?city=${location.city}&state=${location.state_code}`);
    }
  };

  // Handle property click from map
  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    const element = document.getElementById(`property-${property.property_id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* FLOATING VIEW TOGGLE BUTTONS */}
      {properties.length > 0 && !loading && (
        <div 
          style={{
            position: 'fixed',
            top: '100px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            border: '3px solid #EF4444'
          }}
        >
          <div style={{ 
            marginBottom: '10px', 
            fontSize: '11px', 
            fontWeight: 'bold', 
            color: '#EF4444', 
            textAlign: 'center',
            letterSpacing: '0.5px'
          }}>
            VIEW MODE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                backgroundColor: viewMode === 'list' ? '#EF4444' : '#F3F4F6',
                color: viewMode === 'list' ? 'white' : '#374151',
                transition: 'all 0.2s',
                boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <List size={18} />
              <span>LIST</span>
            </button>
            
            <button
              onClick={() => setViewMode('split')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                backgroundColor: viewMode === 'split' ? '#EF4444' : '#F3F4F6',
                color: viewMode === 'split' ? 'white' : '#374151',
                transition: 'all 0.2s',
                boxShadow: viewMode === 'split' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <LayoutGrid size={18} />
              <span>SPLIT</span>
            </button>
            
            <button
              onClick={() => setViewMode('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                backgroundColor: viewMode === 'map' ? '#EF4444' : '#F3F4F6',
                color: viewMode === 'map' ? 'white' : '#374151',
                transition: 'all 0.2s',
                boxShadow: viewMode === 'map' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Map size={18} />
              <span>MAP</span>
            </button>
          </div>
          <div style={{ 
            marginTop: '10px', 
            padding: '6px',
            fontSize: '10px', 
            color: '#6B7280', 
            textAlign: 'center',
            backgroundColor: '#F9FAFB',
            borderRadius: '4px'
          }}>
            <strong style={{ color: '#EF4444' }}>{viewMode.toUpperCase()}</strong>
          </div>
        </div>
      )}

      {/* Sticky Header with Search Bar */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Logo/Home Link */}
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Home"
            >
              <HomeIcon className="w-6 h-6 text-red-600" />
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-3xl">
              <PropertySearchBar 
                size="medium" 
                placeholder="Search by city, address, or ZIP code"
                onSearch={handleNewSearch}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Results Header */}
        {currentLocation && !loading && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Homes for sale in {currentLocation}
            </h1>
            <p className="text-gray-600">
              {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
            </p>
          </div>
        )}

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

        {/* Properties Content - List/Split/Map Views */}
        {!loading && !error && properties.length > 0 && (
          <div className={`flex gap-6 ${viewMode === 'split' ? 'h-[calc(100vh-300px)]' : ''}`}>
            {/* Property List/Grid */}
            {(viewMode === 'list' || viewMode === 'split') && (
              <div className={`${viewMode === 'split' ? 'w-1/2 overflow-y-auto pr-3' : 'w-full'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {properties.map((property, index) => (
                    <PropertyCard 
                      key={property.property_id || index} 
                      property={property}
                      isSelected={selectedProperty?.property_id === property.property_id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Map View */}
            {(viewMode === 'map' || viewMode === 'split') && (
              <div className={`${viewMode === 'split' ? 'w-1/2 sticky top-[120px]' : 'w-full'} ${viewMode === 'map' ? 'h-[calc(100vh-250px)]' : 'h-full'}`}>
                <PropertyMap
                  properties={properties}
                  selectedProperty={selectedProperty}
                  onPropertyClick={handlePropertyClick}
                />
              </div>
            )}
          </div>
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

// Property Card Component
const PropertyCard = ({ property, isSelected }) => {
  const navigate = useNavigate();
  
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const address = property.location?.address?.line || 'Address not available';
  const city = property.location?.address?.city || '';
  const state = property.location?.address?.state_code || '';
  const zipCode = property.location?.address?.postal_code || '';
  const price = property.list_price || property.price;
  const beds = property.description?.beds || 0;
  const baths = property.description?.baths || 0;
  const sqft = property.description?.sqft || 0;
  const image = property.primary_photo?.href || property.photos?.[0]?.href || 'https://via.placeholder.com/400x300?text=No+Image';

  return (
    <div
      id={`property-${property.property_id}`}
      onClick={() => navigate(`/property/${property.property_id}`)}
      className={`bg-white rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isSelected ? 'ring-2 ring-red-600 shadow-xl' : 'border border-gray-200'
      }`}
    >
      {/* Property Image */}
      <div className="relative h-56 bg-gray-200 overflow-hidden">
        <img
          src={image}
          alt={address}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        {property.flags?.is_new_listing && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold">
            NEW
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-4">
        {/* Price */}
        <div className="text-2xl font-bold text-gray-900 mb-3">
          {formatPrice(price)}
        </div>

        {/* Beds, Baths, Sqft */}
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
              <span className="text-sm font-medium">{sqft.toLocaleString()} sqft</span>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="text-sm text-gray-600 leading-relaxed">
          <div className="font-medium text-gray-900 mb-1">
            {address}
          </div>
          <div>
            {city}{city && state && ', '}{state} {zipCode}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Properties;