import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import {
  createCustomIcon,
  formatPrice,
  getMapBounds,
  getMapCenter,
  createClusterCustomIcon,
  getFitBoundsOptions,
} from '../../utils/mapHelpers';
import L from 'leaflet';

// Component to fit bounds when properties change
const FitBounds = ({ properties }) => {
  const map = useMap();

  useEffect(() => {
    if (properties && properties.length > 0) {
      const bounds = getMapBounds(properties);
      if (bounds) {
        const fitOptions = getFitBoundsOptions();
        map.fitBounds(bounds, fitOptions);
      }
    }
  }, [properties, map]);

  return null;
};

const PropertyMap = ({ properties, selectedProperty, onPropertyClick }) => {
  const mapRef = useRef(null);
  const center = getMapCenter(properties);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={12}
        ref={mapRef}
        className="w-full h-full"
        zoomControl={true}
        style={{ zIndex: 1, borderRadius: '0' }}
      >
        {/* Fit Bounds */}
        <FitBounds properties={properties} />

        {/* Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker Cluster Group */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
        >
          {properties.map((property, index) => {
            const lat = property.location?.address?.coordinate?.lat;
            const lon = property.location?.address?.coordinate?.lon;

            if (!lat || !lon) return null;

            const price = property.list_price || property.price || 0;
            const address = property.location?.address?.line || 'Address not available';
            const city = property.location?.address?.city || '';
            const state = property.location?.address?.state_code || '';
            const beds = property.description?.beds || 0;
            const baths = property.description?.baths || 0;
            const sqft = property.description?.sqft || 0;
            const image = property.primary_photo?.href || property.photos?.[0]?.href;

            return (
              <Marker
                key={property.property_id || index}
                position={[lat, lon]}
                icon={createCustomIcon(price)}
                eventHandlers={{
                  click: () => {
                    if (onPropertyClick) {
                      onPropertyClick(property);
                    }
                  },
                }}
              >
                <Popup maxWidth={300} className="custom-popup">
                  <div className="p-2">
                    {/* Property Image */}
                    {image && (
                      <img
                        src={image}
                        alt={address}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}

                    {/* Price */}
                    <div className="text-xl font-bold text-gray-900 mb-2">
                      {formatPrice(price)}
                    </div>

                    {/* Property Details */}
                    <div className="flex gap-3 text-sm text-gray-600 mb-2">
                      {beds > 0 && <span>{beds} beds</span>}
                      {baths > 0 && <span>{baths} baths</span>}
                      {sqft > 0 && <span>{sqft.toLocaleString()} sqft</span>}
                    </div>

                    {/* Address */}
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">{address}</div>
                      <div>
                        {city}
                        {city && state && ', '}
                        {state}
                      </div>
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => {
                        window.location.href = `/property/${property.property_id}`;
                      }}
                      className="mt-3 w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
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

      {/* Price Legend - Top Left */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
        <div className="text-xs font-bold text-gray-900 mb-2">PRICE RANGE</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
            <span className="text-xs text-gray-700">Under $500K</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div>
            <span className="text-xs text-gray-700">$500K - $700K</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
            <span className="text-xs text-gray-700">$700K - $950K</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
            <span className="text-xs text-gray-700">Over $950K</span>
          </div>
        </div>
      </div>

      {/* Property Count Badge - Bottom Left */}
      <div className="absolute top-4 right-4 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
        <div className="text-sm font-semibold text-gray-900">
          {properties.length} {properties.length === 1 ? 'property' : 'properties'}
        </div>
      </div>
    </div>
  );
};

export default PropertyMap;