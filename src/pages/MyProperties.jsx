import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, Heart, Calculator, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getSavedProperties, unsaveProperty } from '../services/database';

const MyProperties = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    fetchSavedProperties();
  }, [currentUser]);

  const fetchSavedProperties = async () => {
    setLoading(true);
    try {
      const saved = await getSavedProperties(currentUser.uid);
      setProperties(saved);
      setFilteredProperties(saved);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...properties];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.propertyData?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.propertyData?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.propertyData?.zipCode?.includes(searchTerm)
      );
    }

    // Quality filter
    if (filterBy === 'good') {
      filtered = filtered.filter(p => p.quickScore === 'good');
    } else if (filterBy === 'positive-flow') {
      filtered = filtered.filter(p => p.estimatedCashFlow > 0);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        case 'price-high':
          return (b.propertyData?.price || 0) - (a.propertyData?.price || 0);
        case 'price-low':
          return (a.propertyData?.price || 0) - (b.propertyData?.price || 0);
        case 'cash-flow':
          return (b.estimatedCashFlow || 0) - (a.estimatedCashFlow || 0);
        case 'cap-rate':
          return (b.estimatedCapRate || 0) - (a.estimatedCapRate || 0);
        case 'best-deals':
          const scoreOrder = { good: 3, okay: 2, poor: 1, unknown: 0 };
          return (scoreOrder[b.quickScore] || 0) - (scoreOrder[a.quickScore] || 0);
        default:
          return 0;
      }
    });

    setFilteredProperties(filtered);
  }, [searchTerm, sortBy, filterBy, properties]);

  const handleRemove = async (propertyId) => {
    if (window.confirm('Remove this property from your saved list?')) {
      try {
        await unsaveProperty(currentUser.uid, propertyId);
        setProperties(prev => prev.filter(p => p.propertyId !== propertyId));
      } catch (error) {
        alert('Failed to remove property');
      }
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '+';
    return `${sign}$${absValue.toLocaleString()}`;
  };

  const getScoreBadge = (score) => {
    const badges = {
      good: { label: 'Good Deal', icon: '🟢', bg: 'bg-green-100', text: 'text-green-800' },
      okay: { label: 'Okay Deal', icon: '🟡', bg: 'bg-yellow-100', text: 'text-yellow-800' },
      poor: { label: 'Poor Deal', icon: '🔴', bg: 'bg-red-100', text: 'text-red-800' },
      unknown: { label: 'No Data', icon: '⚪', bg: 'bg-gray-100', text: 'text-gray-800' }
    };
    return badges[score] || badges.unknown;
  };

  // Get thumbnail from multiple possible sources
  const getThumbnail = (property) => {
    return property.thumbnail ||
           property.photos?.[0]?.href ||
           property.photos?.[0] ||
           property.propertyData?.primaryPhoto ||
           'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading your properties...</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">No saved properties yet</h2>
          <p className="text-gray-600 mb-8">
            Start building your portfolio by saving properties you're interested in
          </p>
          <button
            onClick={() => navigate('/properties')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Properties</h1>
          <p className="text-gray-600">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} saved
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by address, city, or ZIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="newest">Newest first</option>
                <option value="best-deals">Best deals first</option>
                <option value="cash-flow">Highest cash flow</option>
                <option value="cap-rate">Highest cap rate</option>
                <option value="price-high">Price (High to Low)</option>
                <option value="price-low">Price (Low to High)</option>
              </select>
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All properties</option>
                <option value="good">Good deals only</option>
                <option value="positive-flow">Positive cash flow</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {filteredProperties.length !== properties.length && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredProperties.length} of {properties.length} properties
          </div>
        )}

        {/* Properties Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProperties.map((property) => {
            const scoreBadge = getScoreBadge(property.quickScore);
            
            return (
              <div
                key={property.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={getThumbnail(property)}
                    alt={property.propertyData?.address || 'Property'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image';
                    }}
                  />
                  
                  {/* Score Badge */}
                  <div className="absolute top-3 left-3">
                    <div className={`${scoreBadge.bg} ${scoreBadge.text} px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg`}>
                      <span>{scoreBadge.icon}</span>
                      <span>{scoreBadge.label}</span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(property.propertyId)}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-4">
                  {/* Price */}
                  <div className="text-2xl font-bold text-gray-900 mb-3">
                    {formatPrice(property.propertyData?.price)}
                  </div>

                  {/* Metrics */}
                  {property.rentEstimate && (
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Rent Est.</span>
                        <span className="font-semibold text-green-700">
                          {formatPrice(property.rentEstimate)}/mo
                        </span>
                      </div>
                      
                      {property.estimatedCashFlow !== null && property.estimatedCashFlow !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Cash Flow</span>
                          <span className={`font-semibold ${
                            property.estimatedCashFlow > 0 ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {formatCurrency(property.estimatedCashFlow)}/mo
                          </span>
                        </div>
                      )}
                      
                      {property.estimatedCapRate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Cap Rate</span>
                          <span className="font-semibold text-blue-700">
                            {property.estimatedCapRate.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Address */}
                  <div className="text-sm text-gray-600 mb-4">
                    <div className="font-medium text-gray-900 mb-1">
                      {property.propertyData?.address}
                    </div>
                    <div>
                      {property.propertyData?.city}, {property.propertyData?.state} {property.propertyData?.zipCode}
                    </div>
                  </div>

                  {/* Beds/Baths */}
                  <div className="flex gap-4 text-sm text-gray-600 mb-4">
                    {property.propertyData?.beds > 0 && (
                      <span>{property.propertyData.beds} bd</span>
                    )}
                    {property.propertyData?.baths > 0 && (
                      <span>{property.propertyData.baths} ba</span>
                    )}
                    {property.propertyData?.sqft > 0 && (
                      <span>{property.propertyData.sqft.toLocaleString()} sqft</span>
                    )}
                  </div>

                  {/* Analyze Button */}
                  <button
                    onClick={() => navigate(`/property/${property.propertyId}/analyze`, {
                      state: { 
                        propertyData: {
                          property_id: property.propertyId,
                          rentCastData: property.rentCastData || { rentEstimate: property.rentEstimate },
                          price: property.propertyData?.price,
                          address: property.propertyData?.address,
                          city: property.propertyData?.city,
                          state: property.propertyData?.state,
                          zipCode: property.propertyData?.zipCode,
                          beds: property.propertyData?.beds,
                          baths: property.propertyData?.baths,
                          sqft: property.propertyData?.sqft,
                          thumbnail: property.thumbnail,
                          photos: property.photos,
                          detectedUnits: property.unitCount || 1,
                        }
                      }
                    })}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    Analyze
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MyProperties;