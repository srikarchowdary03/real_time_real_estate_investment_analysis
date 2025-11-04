import React from 'react';
import PropertyCard from './propertycard';

const PropertiesGrid = ({ 
  properties, 
  currentLocation, 
  filters, 
  viewMode, 
  selectedProperty,
  onPropertyHover,
  onPropertySelect
}) => {
  // Calculate optimal layout based on screen width
  const getLayoutConfig = () => {
    if (viewMode !== 'split') {
      return { marginRight: '0', columns: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' };
    }
    
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      
      // XL screens (1280px+): 3 columns, map gets remaining space
      if (width >= 1536) {
        return { marginRight: '40%', columns: 'grid-cols-3' }; // Map takes 40% of screen
      }
      // Large screens (1024-1535px): 2 columns, map gets remaining space
      else if (width >= 1280) {
        return { marginRight: '42%', columns: 'grid-cols-2' }; // Map takes 42%
      }
      // Medium screens (1024-1279px): 2 columns, smaller map
      else if (width >= 1024) {
        return { marginRight: '45%', columns: 'grid-cols-2' }; // Map takes 45%
      }
      // Tablet (768-1023px): 1 column, map takes half
      else if (width >= 768) {
        return { marginRight: '50%', columns: 'grid-cols-1' }; // Map takes 50%
      }
      // Mobile (below 768px): Hide map, show only list
      else {
        return { marginRight: '0', columns: 'grid-cols-1' };
      }
    }
    
    return { marginRight: '0', columns: 'grid-cols-1' };
  };

  const { marginRight, columns } = getLayoutConfig();

  return (
    <div 
      className={`
        transition-all duration-300
        ${viewMode === 'split' 
          ? 'overflow-y-auto px-4 py-8' 
          : 'w-full'
        }
      `}
      style={{
        height: viewMode === 'split' ? 'calc(100vh - 89px)' : 'auto',
        marginRight: marginRight,
      }}
    >
      {/* Results Header */}
      {currentLocation && (
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
      
      {/* Property Cards Grid */}
      <div 
        className={`
          grid gap-6 transition-all duration-300
          ${viewMode === 'split' ? columns : columns}
        `}
      >
        {properties.map((property, index) => (
          <PropertyCard 
            key={property.property_id || index} 
            property={property}
            isSelected={selectedProperty?.property_id === property.property_id}
            onHover={() => onPropertyHover(property)}
            onSelect={onPropertySelect}
          />
        ))}
      </div>
    </div>
  );
};

export default PropertiesGrid;