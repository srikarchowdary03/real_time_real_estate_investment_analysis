import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed, Bath, Square } from 'lucide-react';

const PropertyCard = ({ property, isSelected, onHover }) => {
  const navigate = useNavigate();
  
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const address = property.location?.address?.line || 'Address not available';
  const city = property.location?.address?.city || '';
  const state = property.location?.address?.state_code || '';
  const zipCode = property.location?.address?.postal_code || '';
  const price = property.list_price || property.price;
  const beds = property.description?.beds || 0;
  const baths = property.description?.baths || 0;
  const sqft = property.description?.sqft || 0;
  const image = property.primary_photo?.href || property.photos?.[0]?.href || 'https://via.placeholder.com/400x300?text=No+Image';

  return (
    <div
      id={`property-${property.property_id}`}
      onMouseEnter={onHover}
      onClick={() => navigate(`/property/${property.property_id}`)}
      className={`bg-white rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isSelected ? 'ring-2 ring-red-600 shadow-xl' : 'border border-gray-200'
      }`}
    >
      {/* Property Image */}
      <div className="relative h-56 bg-gray-200 overflow-hidden">
        <img
          src={image}
          alt={address}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        {property.flags?.is_new_listing && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold">
            NEW
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-4">
        {/* Price */}
        <div className="text-2xl font-bold text-gray-900 mb-3">
          {formatPrice(price)}
        </div>

        {/* Beds, Baths, Sqft */}
        <div className="flex items-center gap-4 mb-3 text-gray-600">
          {beds > 0 && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span className="text-sm font-medium">{beds} bd</span>
            </div>
          )}
          {baths > 0 && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span className="text-sm font-medium">{baths} ba</span>
            </div>
          )}
          {sqft > 0 && (
            <div className="flex items-center gap-1">
              <Square className="w-4 h-4" />
              <span className="text-sm font-medium">{sqft.toLocaleString()} sqft</span>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="text-sm text-gray-600 leading-relaxed">
          <div className="font-medium text-gray-900 mb-1">
            {address}
          </div>
          <div>
            {city}{city && state && ', '}{state} {zipCode}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;