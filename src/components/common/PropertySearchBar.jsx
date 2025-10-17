import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { autoCompleteLocations } from '../../services/realtyAPI';

const PropertySearchBar = ({ size = 'large', placeholder, onSearch }) => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const isLarge = size === 'large';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (input) => {
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const data = await autoCompleteLocations(input, 10);
      if (data?.autocomplete) {
        setSuggestions(data.autocomplete);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput) {
        fetchSuggestions(searchInput);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearch = (location) => {
    const searchLocation = location || suggestions[selectedIndex];
    
    if (!searchLocation && !searchInput) return;

    if (onSearch) {
      onSearch(searchLocation || { _id: searchInput });
      return;
    }

    if (searchLocation) {
      const postalCode = searchLocation.postal_code;
      const city = searchLocation.city;
      const stateCode = searchLocation.state_code;
      
      if (postalCode) {
        navigate(`/properties?zip=${postalCode}`);
      } else if (city && stateCode) {
        navigate(`/properties?city=${city}&state=${stateCode}`);
      }
    } else {
      navigate(`/properties?search=${encodeURIComponent(searchInput)}`);
    }
    
    setShowSuggestions(false);
    setSearchInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSearch(suggestions[selectedIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const formatSuggestion = (item) => {
    if (item.area_type === 'address' && item.full_address) {
      return item.full_address[0];
    }
    if (item.area_type === 'city') {
      return `${item.city}, ${item.state_code}`;
    }
    if (item.area_type === 'postal_code') {
      return `${item.postal_code} - ${item.city}, ${item.state_code}`;
    }
    if (item.area_type === 'state') {
      return `${item.state}, ${item.state_code}`;
    }
    return item.area_name || item.city || item._id;
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'address': return '📍';
      case 'city': return '🏙️';
      case 'postal_code': return '📮';
      case 'state': return '🗺️';
      default: return '📌';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className={`bg-white ${isLarge ? 'rounded-lg shadow-lg' : 'rounded-md shadow-md'} border border-gray-200 p-2 flex flex-col sm:flex-row gap-2 hover:border-red-300 transition-colors`}>
        <div className="flex-1 flex items-center gap-3 px-4">
          <Search className={`${isLarge ? 'w-5 h-5' : 'w-4 h-4'} text-gray-400`} />
          <input
            type="text"
            placeholder={placeholder || "Search by city, address, or ZIP code"}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 ${isLarge ? 'py-3 text-lg' : 'py-2 text-base'} text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent`}
          />
          {loading && (
            <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-red-600 rounded-full" />
          )}
        </div>
        <button
          onClick={() => handleSearch()}
          className={`bg-red-600 text-white ${isLarge ? 'px-8 py-3 text-base' : 'px-6 py-2 text-sm'} rounded-md font-semibold hover:bg-red-700 transition-colors whitespace-nowrap`}
        >
          Search
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-xl max-h-96 overflow-y-auto z-50 border border-gray-200">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion._id || index}
              onClick={() => handleSearch(suggestion)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3 transition-colors ${
                selectedIndex === index ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="text-xl">{getSuggestionIcon(suggestion.area_type)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {formatSuggestion(suggestion)}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {suggestion.area_type === 'address' && suggestion.prop_status && 
                    `Status: ${suggestion.prop_status.join(', ')}`
                  }
                  {suggestion.area_type !== 'address' && 
                    `${suggestion.area_type.charAt(0).toUpperCase() + suggestion.area_type.slice(1)}`
                  }
                </div>
              </div>
              <span className="text-gray-400 text-lg">→</span>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && !loading && searchInput.length >= 2 && suggestions.length === 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-xl p-4 text-center text-gray-500 z-50 border border-gray-200">
          No locations found for "{searchInput}"
        </div>
      )}
    </div>
  );
};

export default PropertySearchBar;