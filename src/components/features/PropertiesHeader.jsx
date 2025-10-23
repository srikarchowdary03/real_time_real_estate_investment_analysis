import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from 'lucide-react';
import PropertySearchBar from '../common/PropertySearchBar';
import PropertyFilters from '../features/PropertyFilters';
import ViewModeDropdown from '../features/ViewModeDropdown';

const PropertiesHeader = ({ 
  onSearch, 
  onFilterChange, 
  filters, 
  viewMode, 
  onViewModeChange 
}) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Home"
          >
            <HomeIcon className="w-6 h-6 text-red-600" />
          </button>

          <div className="flex-1 max-w-3xl">
            <PropertySearchBar 
              size="medium" 
              placeholder="Search by city, address, or ZIP code"
              onSearch={onSearch}
            />
          </div>

          {/* Filters Button */}
          <PropertyFilters 
            onFilterChange={onFilterChange}
            initialFilters={filters}
          />

          {/* View Mode Dropdown */}
          <ViewModeDropdown 
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default PropertiesHeader;