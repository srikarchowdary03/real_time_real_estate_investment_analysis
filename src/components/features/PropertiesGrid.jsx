import React from 'react';
import PropertyCard from './propertycard';
import ExpandedPropertyView from './ExpandedPropertyView';

const PropertiesGrid = ({ 
  properties, 
  currentLocation, 
  filters, 
  viewMode, 
  selectedProperty,
  onPropertyHover,
  expandedPropertyId,
  onPropertyExpand
}) => {
  // Calculate optimal layout based on screen width
  const getLayoutConfig = () => {
    if (viewMode !== 'split') {
      return { marginRight: '0', columns: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' };
    }
    
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      
      if (width >= 1536) {
        return { marginRight: '40%', columns: 'grid-cols-3' };
      }
      else if (width >= 1280) {
        return { marginRight: '42%', columns: 'grid-cols-2' };
      }
      else if (width >= 1024) {
        return { marginRight: '45%', columns: 'grid-cols-2' };
      }
      else if (width >= 768) {
        return { marginRight: '50%', columns: 'grid-cols-1' };
      }
      else {
        return { marginRight: '0', columns: 'grid-cols-1' };
      }
    }
    
    return { marginRight: '0', columns: 'grid-cols-1' };
  };

  const { marginRight, columns } = getLayoutConfig();

  // Find the expanded property
  const expandedProperty = properties.find(p => p.property_id === expandedPropertyId);

  return (
    <>
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
              isExpanded={expandedPropertyId === property.property_id}
              onExpand={() => onPropertyExpand(property.property_id)}
            />
          ))}
        </div>
      </div>

      {/* Floating Modal Overlay - Rendered outside grid */}
      {expandedProperty && (
        <ExpandedPropertyView
          property={expandedProperty}
          onClose={() => onPropertyExpand(null)}
        />
      )}
    </>
  );
};

export default PropertiesGrid;