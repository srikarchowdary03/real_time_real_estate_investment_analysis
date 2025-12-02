import React, { useMemo } from 'react';
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
  // Deduplicate properties by property_id
  const uniqueProperties = useMemo(() => {
    const seen = new Set();
    return properties.filter(property => {
      const id = property.property_id;
      if (!id || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }, [properties]);

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
  const expandedProperty = uniqueProperties.find(p => p.property_id === expandedPropertyId);

  return (
    <>
      <div 
        className={`
          transition-all duration-300
          ${viewMode === 'split' 
            ? 'overflow-y-auto px-4 pb-8' 
            : 'w-full'
          }
        `}
        style={{
          height: viewMode === 'split' ? 'calc(100vh - 150px)' : 'auto',
          marginRight: marginRight,
        }}
      >
        {/* NOTE: Header is rendered in Properties.jsx, not here - to prevent duplicate */}
        
        {/* Property Cards Grid */}
        <div 
          className={`
            grid gap-6 transition-all duration-300
            ${columns}
          `}
        >
          {uniqueProperties.map((property, index) => (
            <PropertyCard 
              key={`${property.property_id}-${property.listing_id || index}`}
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