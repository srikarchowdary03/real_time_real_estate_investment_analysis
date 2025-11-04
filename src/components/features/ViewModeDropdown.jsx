import React, { useState, useEffect } from 'react';
import { Map, List, LayoutGrid, ChevronDown } from 'lucide-react';

const ViewModeDropdown = ({ viewMode, onViewModeChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const viewModeOptions = [
    { value: 'list', label: 'List', icon: List },
    { value: 'split', label: 'Split', icon: LayoutGrid },
    { value: 'map', label: 'Map', icon: Map }
  ];

  const currentViewMode = viewModeOptions.find(v => v.value === viewMode);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.view-dropdown')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleViewModeSelect = (mode) => {
    onViewModeChange(mode);
    setShowDropdown(false);
  };

  return (
    <div className="relative view-dropdown">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-all font-semibold text-gray-700"
      >
        <currentViewMode.icon size={20} />
        <span className="hidden sm:inline">{currentViewMode.label}</span>
        <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
          {viewModeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleViewModeSelect(option.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                viewMode === option.value ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-700'
              }`}
            >
              <option.icon size={18} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewModeDropdown;