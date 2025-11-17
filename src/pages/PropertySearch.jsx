// src/pages/PropertySearch.jsx - WITH INTEGRATED FILTERS

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PropertySearchBar from '../components/PropertySearchBar';
import PropertyMap from '../components/features/PropertyMap';
import { searchPropertiesForSale } from '../services/realtyAPI';
import { calculateQuickScore } from '../utils/investmentCalculations';
import { Bed, Bath, Square, Loader2, Map, List, LayoutGrid, Filter, X } from 'lucide-react';

const PropertySearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minBeds: '',
    maxBeds: '',
    minBaths: '',
    maxBaths: '',
    investmentScore: 'all', // 'all', 'good', 'okay', 'poor'
  });

  const query = searchParams.get('q') || searchParams.get('zip') || searchParams.get('search');

  useEffect(() => {
    if (query) {
      fetchProperties(query);
    }
  }, [query]);

  const fetchProperties = async (searchQuery) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await searchPropertiesForSale(searchQuery);
      
      if (results && results.length > 0) {
        setProperties(results);
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

  // Apply filters to get properties to display
  const getFilteredProperties = () => {
    let filtered = [...properties];

    // Price filters
    if (filters.minPrice) {
      filtered = filtered.filter(p => (p.list_price || 0) >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(p => (p.list_price || 0) <= parseInt(filters.maxPrice));
    }

    // Bed/Bath filters
    if (filters.minBeds) {
      filtered = filtered.filter(p => (p.description?.beds || 0) >= parseInt(filters.minBeds));
    }
    if (filters.maxBeds) {
      filtered = filtered.filter(p => (p.description?.beds || 0) <= parseInt(filters.maxBeds));
    }
    if (filters.minBaths) {
      filtered = filtered.filter(p => (p.description?.baths || 0) >= parseInt(filters.minBaths));
    }
    if (filters.maxBaths) {
      filtered = filtered.filter(p => (p.description?.baths || 0) <= parseInt(filters.maxBaths));
    }

    // Investment score filter
    if (filters.investmentScore !== 'all') {
      filtered = filtered.filter(p => {
        const score = calculateQuickScore(p.list_price || 0);
        return score.score === filters.investmentScore;
      });
    }

    return filtered;
  };

  const propertiesToShow = getFilteredProperties();

  const handleSearch = (searchQuery) => {
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    const element = document.getElementById(`property-${property.property_id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      minBeds: '',
      maxBeds: '',
      minBaths: '',
      maxBaths: '',
      investmentScore: 'all',
    });
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'investmentScore') return value !== 'all';
    return value !== '';
  }).length;

  const formatPrice = (price) => {
    if (!price) return 'Price not available';
    return `$${price.toLocaleString()}`;
  };

  const propertiesToShow = filteredProperties.length > 0 ? filteredProperties : properties;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* View Toggle */}
      <div style={{
        position: 'fixed', top: '80px', right: '20px', zIndex: 9999,
        backgroundColor: 'white', padding: '8px', borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setViewMode('list')} style={{
            padding: '12px 16px', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontWeight: '600', fontSize: '14px',
            backgroundColor: viewMode === 'list' ? '#EF4444' : '#F3F4F6',
            color: viewMode === 'list' ? 'white' : '#374151'
          }}>
            <List size={20} />
          </button>
          <button onClick={() => setViewMode('split')} style={{
            padding: '12px 16px', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontWeight: '600', fontSize: '14px',
            backgroundColor: viewMode === 'split' ? '#EF4444' : '#F3F4F6',
            color: viewMode === 'split' ? 'white' : '#374151'
          }}>
            <LayoutGrid size={20} />
          </button>
          <button onClick={() => setViewMode('map')} style={{
            padding: '12px 16px', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontWeight: '600', fontSize: '14px',
            backgroundColor: viewMode === 'map' ? '#EF4444' : '#F3F4F6',
            color: viewMode === 'map' ? 'white' : '#374151'
          }}>
            <Map size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <PropertySearchBar onSearch={handleSearch} />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter size={20} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
          
          {!loading && propertiesToShow.length > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-semibold">
                {propertiesToShow.length} {propertiesToShow.length === 1 ? 'property' : 'properties'}
                {propertiesToShow.length < properties.length && ` (filtered from ${properties.length})`}
              </span>
            </div>
          )}

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minBeds}
                      onChange={(e) => setFilters({...filters, minBeds: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxBeds}
                      onChange={(e) => setFilters({...filters, maxBeds: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minBaths}
                      onChange={(e) => setFilters({...filters, minBaths: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxBaths}
                      onChange={(e) => setFilters({...filters, maxBaths: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Investment Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Investment Score</label>
                  <select
                    value={filters.investmentScore}
                    onChange={(e) => setFilters({...filters, investmentScore: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">All Properties</option>
                    <option value="good">Good Deals</option>
                    <option value="okay">Okay Deals</option>
                    <option value="poor">Poor Deals</option>
                  </select>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Clear All Filters
                </button>
              )}
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
          </div>
        ) : propertiesToShow.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl font-semibold mb-2">No properties found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className={`flex gap-6 ${viewMode === 'split' ? 'h-[calc(100vh-220px)]' : ''}`}>
            {/* Property List */}
            {(viewMode === 'list' || viewMode === 'split') && (
              <div className={`${viewMode === 'split' ? 'w-1/2 overflow-y-auto pr-3' : 'w-full'}`}>
                <div className="grid grid-cols-1 gap-6">
                  {propertiesToShow.map((property) => {
                    const price = property.list_price || 0;
                    const address = property.location?.address?.line || 'Address not available';
                    const city = property.location?.address?.city || '';
                    const state = property.location?.address?.state_code || '';
                    const zipCode = property.location?.address?.postal_code || '';
                    const beds = property.description?.beds || 0;
                    const baths = property.description?.baths || 0;
                    const sqft = property.description?.sqft || 0;
                    const image = property.primary_photo?.href || 'https://via.placeholder.com/400x300?text=No+Image';
                    const isSelected = selectedProperty?.property_id === property.property_id;
                    
                    // Calculate investment score
                    const score = calculateQuickScore(price);
                    const scoreColor = score.score === 'good' ? 'green' : score.score === 'okay' ? 'yellow' : 'red';

                    return (
                      <div
                        key={property.property_id}
                        id={`property-${property.property_id}`}
                        onClick={() => navigate(`/property/${property.property_id}`)}
                        className={`bg-white rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-xl ${
                          isSelected ? 'ring-2 ring-red-600 shadow-xl' : 'border border-gray-200'
                        }`}
                      >
                        <div className="relative h-56 bg-gray-200">
                          <img src={image} alt={address} className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                          />
                          {/* Investment Score Badge */}
                          <div className={`absolute top-3 right-3 px-3 py-1 rounded text-xs font-bold text-white
                            ${scoreColor === 'green' ? 'bg-green-600' : scoreColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-600'}`}
                          >
                            {score.score.toUpperCase()}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="text-2xl font-bold text-gray-900 mb-3">{formatPrice(price)}</div>
                          <div className="flex items-center gap-4 mb-3 text-gray-600">
                            {beds > 0 && (<div className="flex items-center gap-1"><Bed className="w-4 h-4" /><span>{beds} bd</span></div>)}
                            {baths > 0 && (<div className="flex items-center gap-1"><Bath className="w-4 h-4" /><span>{baths} ba</span></div>)}
                            {sqft > 0 && (<div className="flex items-center gap-1"><Square className="w-4 h-4" /><span>{sqft.toLocaleString()} sqft</span></div>)}
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="font-medium text-gray-900 mb-1">{address}</div>
                            <div>{city}{city && state && ', '}{state} {zipCode}</div>
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
              <div className={`${viewMode === 'split' ? 'w-1/2 sticky top-[140px]' : 'w-full'} ${viewMode === 'map' ? 'h-[calc(100vh-200px)]' : 'h-full'}`}>
                <PropertyMap
                  properties={propertiesToShow}
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