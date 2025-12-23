/**
 * @file Properties grid display component
 * @module components/features/PropertiesGrid
 * @description Displays property listings in responsive grid layout with integrated
 * expanded property view modal. Handles property deduplication, rent data merging,
 * responsive layout calculation, and integration with ExpandedPropertyView.
 * 
 * Key Features:
 * - Property deduplication by property_id
 * - Rent data state management and merging
 * - Responsive grid layout (1-5 columns based on screen size)
 * - Dynamic margin calculation for split view mode
 * - Integration with ExpandedPropertyView modal
 * - Parent notification when rent data loads
 * 
 * Performance:
 * - useMemo for deduplication to prevent re-filtering
 * - useCallback for rent data handler to prevent re-renders
 * - Efficient property merging with rent data
 * 
 * @requires react
 * @requires ./propertycard
 * @requires ./ExpandedPropertyView
 * 
 * @version 1.0.0
 */

import React, { useMemo, useCallback, useState } from 'react';
import PropertyCard from './propertycard';
import ExpandedPropertyView from './ExpandedPropertyView';

/**
 * Properties Grid Component
 * 
 * Responsive grid display for property listings. Manages property deduplication,
 * rent data state, and layout configuration. Renders PropertyCard components
 * and integrates ExpandedPropertyView modal for property details.
 * 
 * LAYOUT MODES:
 * - Split view: 1-3 columns with right margin for map
 * - List view: 1-5 columns across full width
 * - Map view: Grid hidden
 * 
 * DATA FLOW:
 * 1. Receives properties array from parent
 * 2. Deduplicates by property_id
 * 3. Merges in locally cached rent data (from ExpandedPropertyView)
 * 4. Passes merged data to PropertyCard components
 * 5. When ExpandedPropertyView loads rent data, updates local cache
 * 6. Notifies parent via onPropertyRentUpdate callback
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Array<Object>} props.properties - Array of property objects
 * @param {string} props.currentLocation - Current search location (unused, kept for compatibility)
 * @param {Object} props.filters - Active filters object
 * @param {string} props.viewMode - Current view mode (split/list/map)
 * @param {Object|null} props.selectedProperty - Currently selected property
 * @param {Function} [props.onPropertyHover] - Callback when property is hovered
 * @param {string|null} props.expandedPropertyId - ID of expanded property
 * @param {Function} [props.onPropertyExpand] - Callback to expand/collapse property
 * @param {Function} [props.onPropertyRentUpdate] - Callback when rent data loads
 * @returns {React.ReactElement} Properties grid with cards and modal
 * 
 * @example
 * <PropertiesGrid
 *   properties={searchResults}
 *   viewMode="split"
 *   selectedProperty={selected}
 *   onPropertyHover={handleHover}
 *   expandedPropertyId={expandedId}
 *   onPropertyExpand={handleExpand}
 *   onPropertyRentUpdate={(id, data) => console.log('Rent loaded:', id, data)}
 * />
 */
const PropertiesGrid = ({ 
  properties, 
  currentLocation, 
  filters, 
  viewMode, 
  selectedProperty,
  onPropertyHover,
  expandedPropertyId,
  onPropertyExpand,
  onPropertyRentUpdate  // NEW: Callback when rent data is loaded
}) => {
 /**
   * Local cache of rent data by property ID
   * 
   * Stores RentCast data fetched by ExpandedPropertyView to avoid
   * re-fetching when user reopens same property. Keyed by property_id.
   * 
   * @type {Array}
   * @property {number} [propertyId].rentEstimate - Per-unit rent
   * @property {number} [propertyId].totalMonthlyRent - Total rent
   * @property {number} [propertyId].unitCount - Number of units
   */
  const [propertyRentData, setPropertyRentData] = useState({});

    /**
   * Deduplicate properties by property_id
   * 
   * Filters out duplicate properties that might appear in search results.
   * Uses Set to track seen IDs for O(n) performance. Memoized to prevent
   * re-filtering on every render.
   * 
   * @type {Array<Object>}
   * @memoized
   * 
   * @example
   * // Input: [prop1, prop2, prop1_duplicate, prop3]
   * // Output: [prop1, prop2, prop3]
   */
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

  /**
   * Merge rent data into properties
   * 
   * Combines property data with locally cached rent data from RentCast API.
   * Properties that have been expanded will have rentCastData merged in.
   * This allows PropertyCard to display verified rent without re-fetching.
   * 
   * @type {Array<Object>}
   * @memoized
   * 
   * @example
   * // Property without rent data: { property_id: 'M123', price: 250000 }
   * // Property with rent data: { property_id: 'M123', price: 250000, rentCastData: {...} }
   */
  const propertiesWithRentData = useMemo(() => {
    return uniqueProperties.map(property => {
      const rentData = propertyRentData[property.property_id];
      if (rentData) {
        return {
          ...property,
          rentCastData: rentData
        };
      }
      return property;
    });
  }, [uniqueProperties, propertyRentData]);

/**
   * Handle rent data loaded from ExpandedPropertyView
   * 
   * Callback invoked when ExpandedPropertyView successfully fetches RentCast data.
   * Updates local rent data cache and notifies parent component.
   * 
   * PERFORMANCE: useCallback prevents function recreation and child re-renders.
   * 
   * @function
   * @callback
   * @param {string} propertyId - Property ID that rent data is for
   * @param {Object} rentData - Complete rent data from RentCast
   * @param {number} rentData.rentEstimate - Per-unit rent
   * @param {number} rentData.totalMonthlyRent - Total monthly rent
   * @param {number} rentData.unitCount - Number of units
   * 
   * @example
   * // Called by ExpandedPropertyView after RentCast fetch
   * handleRentDataLoaded('M123456789', {
   *   rentEstimate: 2000,
   *   totalMonthlyRent: 4000,
   *   unitCount: 2
   * });
   * // -> Updates propertyRentData state
   * // -> Notifies parent via onPropertyRentUpdate
   */
  const handleRentDataLoaded = useCallback((propertyId, rentData) => {
    console.log('📊 Rent data loaded for property:', propertyId, rentData);
    
    // Update local state
    setPropertyRentData(prev => ({
      ...prev,
      [propertyId]: rentData
    }));

    // Notify parent if callback provided
    if (onPropertyRentUpdate) {
      onPropertyRentUpdate(propertyId, rentData);
    }
  }, [onPropertyRentUpdate]);

/**
   * Calculate optimal layout configuration
   * 
   * Determines grid columns and right margin based on view mode and screen width.
   * In split view, grid needs margin to make room for fixed map on right side.
   * 
   * Breakpoints (split view):
   * - 2xl (1536px+): 3 columns, 40% margin
   * - xl (1280px+): 2 columns, 42% margin
   * - lg (1024px+): 2 columns, 45% margin
   * - md (768px+): 1 column, 50% margin
   * - sm (<768px): 1 column, no margin
   * 
   * List/Map view: Full width, 1-5 columns responsive
   * 
   * @function
   * @returns {Object} Layout configuration
   * @returns {string} returns.marginRight - CSS margin-right value
   * @returns {string} returns.columns - Tailwind grid-cols classes
   * 
   * @example
   * // On 1536px screen in split view:
   * // Returns: { marginRight: '40%', columns: 'grid-cols-3' }
   * 
   * // On 1024px screen in list view:
   * // Returns: { marginRight: '0', columns: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' }
   */
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

   /**
   * Current layout configuration
   * @type {Object}
   */
  const { marginRight, columns } = getLayoutConfig();

  /**
   * Find the currently expanded property with merged rent data
   * 
   * Searches propertiesWithRentData for the property matching expandedPropertyId.
   * This ensures ExpandedPropertyView receives property with any cached rent data.
   * 
   * @type {Object|undefined}
   */
  const expandedProperty = propertiesWithRentData.find(p => p.property_id === expandedPropertyId);

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
        {/* Property Cards Grid */}
        <div 
          className={`
            grid gap-6 transition-all duration-300
            ${columns}
          `}
        >
          {propertiesWithRentData.map((property, index) => (
            <PropertyCard 
              key={`${property.property_id}-${property.listing_id || index}`}
              property={property}
              isSelected={selectedProperty?.property_id === property.property_id}
              onHover={() => onPropertyHover && onPropertyHover(property)}
              isExpanded={expandedPropertyId === property.property_id}
              onExpand={() => onPropertyExpand && onPropertyExpand(property.property_id)}
            />
          ))}
        </div>

        {/* Empty State */}
        {propertiesWithRentData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No properties found. Try adjusting your search criteria.</p>
          </div>
        )}
      </div>

      {/* Floating Modal Overlay - Rendered outside grid */}
      {expandedProperty && (
        <ExpandedPropertyView
          property={expandedProperty}
          onClose={() => onPropertyExpand && onPropertyExpand(null)}
          onRentDataLoaded={handleRentDataLoaded}
        />
      )}
    </>
  );
};

export default PropertiesGrid;