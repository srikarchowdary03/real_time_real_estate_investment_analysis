import React, { useState } from 'react';
import { X, SlidersHorizontal, DollarSign, Bed, Bath, Home, Calendar, Maximize } from 'lucide-react';

const PropertyFilters = ({ onFilterChange, initialFilters = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    price_min: initialFilters.price_min || '',
    price_max: initialFilters.price_max || '',
    beds_min: initialFilters.beds_min || '',
    beds_max: initialFilters.beds_max || '',
    baths_min: initialFilters.baths_min || '',
    baths_max: initialFilters.baths_max || '',
    sqft_min: initialFilters.sqft_min || '',
    sqft_max: initialFilters.sqft_max || '',
    property_type: initialFilters.property_type || [],
    year_built_min: initialFilters.year_built_min || '',
    lot_size_min: initialFilters.lot_size_min || '',
  });

  const propertyTypes = [
    { value: 'single_family', label: 'Single Family' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhome', label: 'Townhouse' },
    { value: 'multi_family', label: 'Multi-Family' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'land', label: 'Land' },
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handlePropertyTypeToggle = (type) => {
    const currentTypes = filters.property_type || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    handleFilterChange('property_type', newTypes);
  };

  const applyFilters = () => {
    // Clean up empty values and convert strings to numbers
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      if (key === 'property_type') {
        if (filters[key].length > 0) {
          cleanFilters[key] = filters[key];
        }
      } else if (filters[key] !== '' && filters[key] !== null) {
        cleanFilters[key] = Number(filters[key]);
      }
    });
    
    onFilterChange(cleanFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      price_min: '',
      price_max: '',
      beds_min: '',
      beds_max: '',
      baths_min: '',
      baths_max: '',
      sqft_min: '',
      sqft_max: '',
      property_type: [],
      year_built_min: '',
      lot_size_min: '',
    };
    setFilters(emptyFilters);
    onFilterChange({});
    setIsOpen(false);
  };

  const activeFilterCount = Object.keys(filters).filter(key => {
    if (key === 'property_type') return filters[key].length > 0;
    return filters[key] !== '' && filters[key] !== null;
  }).length;

  return (
    <>
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-all font-semibold text-gray-700"
      >
        <SlidersHorizontal size={20} />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Filter Properties</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Filter Content */}
            <div className="p-6 space-y-8">
              {/* Price Range */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="text-red-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Price Range</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Price
                    </label>
                    <input
                      type="number"
                      placeholder="No min"
                      value={filters.price_min}
                      onChange={(e) => handleFilterChange('price_min', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Price
                    </label>
                    <input
                      type="number"
                      placeholder="No max"
                      value={filters.price_max}
                      onChange={(e) => handleFilterChange('price_max', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Bed className="text-red-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Bedrooms</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Beds
                    </label>
                    <select
                      value={filters.beds_min}
                      onChange={(e) => handleFilterChange('beds_min', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    >
                      <option value="">Any</option>
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num}+</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Beds
                    </label>
                    <select
                      value={filters.beds_max}
                      onChange={(e) => handleFilterChange('beds_max', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    >
                      <option value="">Any</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bathrooms */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Bath className="text-red-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Bathrooms</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Baths
                    </label>
                    <select
                      value={filters.baths_min}
                      onChange={(e) => handleFilterChange('baths_min', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    >
                      <option value="">Any</option>
                      {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(num => (
                        <option key={num} value={num}>{num}+</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Baths
                    </label>
                    <select
                      value={filters.baths_max}
                      onChange={(e) => handleFilterChange('baths_max', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    >
                      <option value="">Any</option>
                      {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Square Footage */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Maximize className="text-red-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Square Footage</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Sqft
                    </label>
                    <input
                      type="number"
                      placeholder="No min"
                      value={filters.sqft_min}
                      onChange={(e) => handleFilterChange('sqft_min', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Sqft
                    </label>
                    <input
                      type="number"
                      placeholder="No max"
                      value={filters.sqft_max}
                      onChange={(e) => handleFilterChange('sqft_max', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Property Type */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Home className="text-red-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Property Type</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {propertyTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => handlePropertyTypeToggle(type.value)}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                        filters.property_type.includes(type.value)
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-red-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Filters */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="text-red-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Additional Filters</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year Built (Min)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2000"
                      value={filters.year_built_min}
                      onChange={(e) => handleFilterChange('year_built_min', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lot Size (Min sqft)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={filters.lot_size_min}
                      onChange={(e) => handleFilterChange('lot_size_min', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-4">
              <button
                onClick={clearFilters}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyFilters;