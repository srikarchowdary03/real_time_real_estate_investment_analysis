// src/components/features/PropertyMap.jsx
// FINAL FIXED VERSION - Drawing works, no map interference

import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { filterPropertiesInBoundary } from '../../utils/boundaryHelpers';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const PropertyMap = ({ 
  properties = [], 
  onPropertyClick,
  onBoundaryCreated,
  onBoundaryEdited,
  onBoundaryDeleted,
  className = '' 
}) => {
  const mapRef = useRef();
  const drawRef = useRef();
  const [viewState, setViewState] = useState({
    longitude: -71.0589,
    latitude: 42.3601,
    zoom: 12
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [currentBoundary, setCurrentBoundary] = useState(null);
  const [filteredProperties, setFilteredProperties] = useState(properties);

  // Calculate map center from properties
  useEffect(() => {
    if (properties && properties.length > 0) {
      const validProperties = properties.filter(
        p => p.location?.address?.coordinate?.lat && p.location?.address?.coordinate?.lon
      );

      if (validProperties.length > 0) {
        const latSum = validProperties.reduce((sum, p) => sum + p.location.address.coordinate.lat, 0);
        const lngSum = validProperties.reduce((sum, p) => sum + p.location.address.coordinate.lon, 0);
        
        setViewState({
          longitude: lngSum / validProperties.length,
          latitude: latSum / validProperties.length,
          zoom: 12
        });
      }
    }
  }, [properties]);

  // Filter properties when boundary changes
  useEffect(() => {
    if (currentBoundary) {
      const filtered = filterPropertiesInBoundary(properties, currentBoundary);
      setFilteredProperties(filtered);
    } else {
      setFilteredProperties(properties);
    }
  }, [currentBoundary, properties]);

  // Initialize Mapbox Draw
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: drawingEnabled,
        trash: drawingEnabled
      },
      defaultMode: drawingEnabled ? 'draw_polygon' : 'simple_select'
    });

    map.addControl(draw, 'top-right');
    drawRef.current = draw;

    // Handle drawing events
    const handleCreate = (e) => {
      const feature = e.features[0];
      const coords = feature.geometry.coordinates;

      if (feature.geometry.type === 'Polygon') {
        const points = coords[0].map(coord => [coord[1], coord[0]]); // [lat, lng]
        const boundary = {
          type: 'polygon',
          points: points
        };
        setCurrentBoundary(boundary);
        if (onBoundaryCreated) onBoundaryCreated(boundary);
      }
    };

    const handleUpdate = (e) => {
      const feature = e.features[0];
      const coords = feature.geometry.coordinates;

      if (feature.geometry.type === 'Polygon') {
        const points = coords[0].map(coord => [coord[1], coord[0]]);
        const boundary = {
          type: 'polygon',
          points: points
        };
        setCurrentBoundary(boundary);
        if (onBoundaryEdited) onBoundaryEdited(boundary);
      }
    };

    const handleDelete = () => {
      setCurrentBoundary(null);
      if (onBoundaryDeleted) onBoundaryDeleted();
    };

    map.on('draw.create', handleCreate);
    map.on('draw.update', handleUpdate);
    map.on('draw.delete', handleDelete);

    return () => {
      map.off('draw.create', handleCreate);
      map.off('draw.update', handleUpdate);
      map.off('draw.delete', handleDelete);
      if (map.hasControl(draw)) {
        map.removeControl(draw);
      }
    };
  }, [drawingEnabled, onBoundaryCreated, onBoundaryEdited, onBoundaryDeleted]);

  const toggleDrawing = () => {
    const newState = !drawingEnabled;
    setDrawingEnabled(newState);
    
    if (drawRef.current) {
      if (newState) {
        drawRef.current.changeMode('draw_polygon');
      } else {
        drawRef.current.changeMode('simple_select');
      }
    }
  };

  const clearBoundaries = () => {
    if (drawRef.current) {
      drawRef.current.deleteAll();
    }
    setCurrentBoundary(null);
    setDrawingEnabled(false);
    if (onBoundaryDeleted) onBoundaryDeleted();
  };

  const propertiesToShow = currentBoundary ? filteredProperties : properties;

  return (
    <div className={`relative ${className}`}>
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 space-y-2 max-w-[200px]">
        <button
          onClick={toggleDrawing}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
            drawingEnabled
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {drawingEnabled ? '✓ Drawing Active' : 'Draw Boundary'}
        </button>

        {currentBoundary && (
          <div className="space-y-2">
            <div className="text-sm bg-blue-50 p-3 rounded-lg">
              <div className="font-semibold text-blue-900 mb-1 text-xs">
                Properties in Area
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {filteredProperties.length}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                of {properties.length} total
              </div>
            </div>

            <button
              onClick={clearBoundaries}
              className="w-full px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
            >
              Clear Boundary
            </button>
          </div>
        )}

        {drawingEnabled && (
          <div className="text-xs text-gray-600 p-2 bg-yellow-50 rounded border border-yellow-200">
            <div className="font-semibold mb-1 text-yellow-800">📍 Instructions:</div>
            <ul className="space-y-1 text-yellow-700">
              <li>• Click points on map</li>
              <li>• Close shape by clicking first point</li>
              <li>• Or press Enter</li>
            </ul>
          </div>
        )}
      </div>

      {/* Mapbox Map */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => !drawingEnabled && setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={drawingEnabled ? [] : undefined}
        dragPan={!drawingEnabled}
        scrollZoom={!drawingEnabled}
        doubleClickZoom={!drawingEnabled}
      >
        {/* Property Markers */}
        {propertiesToShow.map((property, index) => {
          const lat = property.location?.address?.coordinate?.lat;
          const lng = property.location?.address?.coordinate?.lon;

          if (!lat || !lng) return null;

          const isInBoundary = currentBoundary && filteredProperties.includes(property);

          return (
            <Marker
              key={`${property.property_id}-${index}`}
              longitude={lng}
              latitude={lat}
              color={isInBoundary ? '#10b981' : '#3b82f6'}
              onClick={(e) => {
                if (!drawingEnabled) {
                  e.originalEvent.stopPropagation();
                  setSelectedProperty(property);
                }
              }}
            />
          );
        })}

        {/* Popup */}
        {selectedProperty && !drawingEnabled && (
          <Popup
            longitude={selectedProperty.location.address.coordinate.lon}
            latitude={selectedProperty.location.address.coordinate.lat}
            onClose={() => setSelectedProperty(null)}
            closeOnClick={false}
            maxWidth="300px"
          >
            <div className="min-w-[200px]">
              {selectedProperty.primary_photo?.href && (
                <img
                  src={selectedProperty.primary_photo.href}
                  alt={selectedProperty.location?.address?.line || 'Property'}
                  className="w-full h-32 object-cover rounded-t-lg"
                />
              )}

              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {selectedProperty.location?.address?.line || 'Address unavailable'}
                </h3>
                <p className="text-xs text-gray-600">
                  {selectedProperty.location?.address?.city}, {selectedProperty.location?.address?.state_code}
                </p>

                {selectedProperty.list_price && (
                  <p className="text-lg font-bold text-blue-600">
                    ${selectedProperty.list_price.toLocaleString()}
                  </p>
                )}

                <div className="flex gap-3 text-xs text-gray-600">
                  {selectedProperty.description?.beds && (
                    <span>{selectedProperty.description.beds} beds</span>
                  )}
                  {selectedProperty.description?.baths && (
                    <span>{selectedProperty.description.baths} baths</span>
                  )}
                  {selectedProperty.description?.sqft && (
                    <span>{selectedProperty.description.sqft.toLocaleString()} sqft</span>
                  )}
                </div>

                <button
                  onClick={() => onPropertyClick && onPropertyClick(selectedProperty)}
                  className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default PropertyMap;