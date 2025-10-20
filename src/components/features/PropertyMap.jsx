import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useNavigate } from 'react-router-dom';
import { Bed, Bath, Square, MapPin } from 'lucide-react';
import {
  createCustomIcon,
  getMapCenter,
  getMapBounds,
  createClusterCustomIcon,
} from '../../utils/mapHelpers';
import 'leaflet/dist/leaflet.css';

// Component to update map view when properties change
const MapUpdater = ({ properties }) => {
  const map = useMap();

  useEffect(() => {
    if (properties && properties.length > 0) {
      const bounds = getMapBounds(properties);
      if (bounds) {
        try {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } catch (error) {
          console.warn('Could not fit bounds:', error);
        }
      }
    }
  }, [properties, map]);

  return null;
};

const PropertyMap = ({ properties, selectedProperty, onPropertyClick }) => {
  const navigate = useNavigate();

  // Get map center - memoized to prevent unnecessary recalculations
  const center = useMemo(() => getMapCenter(properties), [properties]);

  // Filter properties with valid coordinates - memoized
  const validProperties = useMemo(() => {
    return properties?.filter(
      (p) => p.location?.address?.coordinate?.lat && p.location?.address?.coordinate?.lon
    ) || [];
  }, [properties]);

  // Handle marker click
  const handleMarkerClick = (property) => {
    if (onPropertyClick) {
      onPropertyClick(property);
    }
  };

  // Handle view details click
  const handleViewDetails = (propertyId, e) => {
    e.stopPropagation();
    navigate(`/property/${propertyId}`);
  };

  if (validProperties.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-8">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-lg font-medium">No properties to display on map</p>
          <p className="text-gray-500 text-sm mt-2">
            Properties without valid coordinates cannot be shown
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        whenReady={(map) => {
          // Invalidate size when map is ready
          setTimeout(() => {
            map.target.invalidateSize();
          }, 100);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater properties={validProperties} />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          maxClusterRadius={50}
        >
          {validProperties.map((property) => {
            const lat = property.location.address.coordinate.lat;
            const lon = property.location.address.coordinate.lon;
            const price = property.list_price || 0;
            const propertyId = property.property_id;

            const address = property.location?.address?.line || 'Address not available';
            const city = property.location?.address?.city || '';
            const state = property.location?.address?.state_code || '';
            const beds = property.description?.beds || 0;
            const baths = property.description?.baths || 0;
            const sqft = property.description?.sqft || 0;
            const image = property.primary_photo?.href || property.photos?.[0]?.href;

            return (
              <Marker
                key={propertyId}
                position={[lat, lon]}
                icon={createCustomIcon(price)}
                eventHandlers={{
                  click: () => handleMarkerClick(property),
                }}
              >
                <Popup maxWidth={280} closeButton={true}>
                  <div className="p-2">
                    {/* Property Image */}
                    {image && (
                      <img
                        src={image}
                        alt={address}
                        className="w-full h-40 object-cover rounded-lg mb-3"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/280x160?text=No+Image';
                        }}
                      />
                    )}

                    {/* Price */}
                    <div className="text-xl font-bold text-gray-900 mb-2">
                      ${price.toLocaleString()}
                    </div>

                    {/* Beds, Baths, Sqft */}
                    <div className="flex items-center gap-3 mb-3 text-gray-600">
                      {beds > 0 && (
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          <span className="text-sm">{beds} bd</span>
                        </div>
                      )}
                      {baths > 0 && (
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          <span className="text-sm">{baths} ba</span>
                        </div>
                      )}
                      {sqft > 0 && (
                        <div className="flex items-center gap-1">
                          <Square className="w-4 h-4" />
                          <span className="text-sm">{sqft.toLocaleString()} sqft</span>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div className="text-sm text-gray-600 mb-3">
                      <div className="font-medium">{address}</div>
                      <div>
                        {city}{city && state && ', '}{state}
                      </div>
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={(e) => handleViewDetails(propertyId, e)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Property Count Badge */}
      <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg z-[1000]">
        <span className="text-sm font-semibold text-gray-700">
          {validProperties.length} {validProperties.length === 1 ? 'Property' : 'Properties'} on Map
        </span>
      </div>

      {/* Price Legend */}
      <div className="absolute bottom-4 left-4 bg-white px-4 py-3 rounded-lg shadow-lg z-[1000]">
        <div className="text-xs font-semibold text-gray-700 mb-2">Price Range</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600">&lt; $500K</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-600">$500K - $700K</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs text-gray-600">$700K - $950K</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-600">&gt; $950K</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyMap;