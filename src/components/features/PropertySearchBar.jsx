import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, Loader2, X, Building2, Hash } from 'lucide-react';
import { autoCompleteLocations } from '../../services/realtyAPI';

const PropertySearchBar = ({ 
  size = 'medium', 
  placeholder = 'Search by city, address, or ZIP code',
  onSearch = null, // Optional callback for parent component
  autoFocus = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // Size variants
  const sizeClasses = {
    small: {
      container: 'h-10',
      input: 'text-sm pl-9 pr-10',
      icon: 'w-4 h-4 left-3',
      clearBtn: 'right-2',
    },
    medium: {
      container: 'h-12',
      input: 'text-base pl-11 pr-12',
      icon: 'w-5 h-5 left-3.5',
      clearBtn: 'right-3',
    },
    large: {
      container: 'h-14 lg:h-16',
      input: 'text-lg pl-12 pr-14',
      icon: 'w-6 h-6 left-4',
      clearBtn: 'right-4',
    },
  };

  const currentSize = sizeClasses[size] || sizeClasses.medium;

  // Debounced fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching suggestions for:', searchQuery);
      const results = await autoCompleteLocations(searchQuery, 8);
      
      if (results && results.length > 0) {
        setSuggestions(results);
        setShowSuggestions(true);
        console.log('✅ Got suggestions:', results.length);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('❌ Autocomplete error:', err);
      setError('Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce API calls
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    console.log('📍 Selected:', suggestion);
    
    setQuery(suggestion.display);
    setShowSuggestions(false);
    setSuggestions([]);

    // Build navigation URL based on suggestion type
    let searchUrl = '/properties';
    
    if (suggestion.postalCode) {
      searchUrl = `/properties?zip=${suggestion.postalCode}`;
    } else if (suggestion.city && suggestion.state) {
      searchUrl = `/properties?city=${encodeURIComponent(suggestion.city)}&state=${suggestion.state}`;
    } else if (suggestion.value) {
      searchUrl = `/properties?search=${encodeURIComponent(suggestion.value)}`;
    }

    // If onSearch callback provided (for Properties page), call it
    if (onSearch) {
      onSearch(suggestion);
    }
    
    // Navigate to properties page with search params
    navigate(searchUrl);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    // If a suggestion is selected, use it
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelectSuggestion(suggestions[selectedIndex]);
      return;
    }

    // Otherwise, search with the raw query
    setShowSuggestions(false);
    
    const searchUrl = `/properties?search=${encodeURIComponent(query.trim())}`;
    
    if (onSearch) {
      onSearch({ value: query.trim() });
    }
    
    navigate(searchUrl);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Clear input
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Get icon for suggestion type
  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'postal_code':
        return <Hash className="w-4 h-4 text-blue-500" />;
      case 'city':
        return <Building2 className="w-4 h-4 text-green-500" />;
      case 'address':
        return <MapPin className="w-4 h-4 text-red-500" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get label for suggestion type
  const getSuggestionTypeLabel = (type) => {
    switch (type) {
      case 'postal_code':
        return 'ZIP Code';
      case 'city':
        return 'City';
      case 'neighborhood':
        return 'Neighborhood';
      case 'address':
        return 'Address';
      default:
        return 'Location';
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className={`relative ${currentSize.container}`}>
          {/* Search Icon */}
          <Search 
            className={`absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ${currentSize.icon}`} 
          />
          
          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`
              w-full h-full rounded-xl border-2 border-gray-200 
              focus:border-blue-500 focus:ring-4 focus:ring-blue-100
              outline-none transition-all duration-200
              bg-white shadow-sm hover:shadow-md
              ${currentSize.input}
            `}
          />

          {/* Loading Spinner or Clear Button */}
          <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-2 ${currentSize.clearBtn}`}>
            {isLoading && (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            )}
            
            {query && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}

            {/* Search Button for large size */}
            {size === 'large' && (
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-80 overflow-y-auto"
        >
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Suggestions
            </span>
          </div>
          
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.value}-${index}`}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                w-full px-4 py-3 flex items-center gap-3 text-left transition-colors
                ${selectedIndex === index 
                  ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                  : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                }
              `}
            >
              <div className="flex-shrink-0">
                {getSuggestionIcon(suggestion.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${selectedIndex === index ? 'text-blue-700' : 'text-gray-900'}`}>
                  {suggestion.display}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {getSuggestionTypeLabel(suggestion.type)}
                  {suggestion.city && suggestion.state && suggestion.type !== 'city' && (
                    <span> • {suggestion.city}, {suggestion.state}</span>
                  )}
                </p>
              </div>

              {selectedIndex === index && (
                <span className="text-xs text-blue-500 font-medium">
                  Enter ↵
                </span>
              )}
            </button>
          ))}

          {/* Search with current query option */}
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full px-4 py-3 flex items-center gap-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors border-t border-gray-200"
          >
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Search for "<span className="font-medium text-gray-900">{query}</span>"
            </span>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
};

export default PropertySearchBar;