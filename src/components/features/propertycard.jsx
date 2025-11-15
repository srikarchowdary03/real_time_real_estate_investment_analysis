import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed, Bath, Square, DollarSign } from 'lucide-react';
import { getPropertyData } from '../../services/zillowAPI';

const PropertyCard = ({ property, isSelected, onHover }) => {
  const navigate = useNavigate();
  const [zillowData, setZillowData] = useState(null);
  const [loadingZillow, setLoadingZillow] = useState(false);
  
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
  
  // Use Zillow photos if available, fallback to Realty API photos
  const image = (zillowData?.photos && zillowData.photos.length > 0) 
    ? zillowData.photos[0] 
    : (property.primary_photo?.href || property.photos?.[0]?.href || 'https://via.placeholder.com/400x300?text=No+Image');

  // Fetch Zillow data for rent estimate and better photos
  useEffect(() => {
    const fetchZillowData = async () => {
      if (!address || !city || !state || !zipCode) return;
      
      setLoadingZillow(true);
      try {
        const data = await getPropertyData(address, city, state, zipCode);
        setZillowData(data);
      } catch (error) {
        console.error('Error fetching Zillow data:', error);
      } finally {
        setLoadingZillow(false);
      }
    };

    fetchZillowData();
  }, [property.property_id]);

  // Calculate potential ROI if rent data is available
  const rentEstimate = zillowData?.rent;
  const monthlyROI = rentEstimate && price ? ((rentEstimate / price) * 100).toFixed(2) : null;

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
        
        {/* Rent Estimate Badge */}
        {rentEstimate && (
          <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold">
            Est. Rent: {formatPrice(rentEstimate)}/mo
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

        {/* Monthly ROI Badge */}
        {monthlyROI && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
              <DollarSign className="w-3 h-3" />
              <span>{monthlyROI}% Monthly Return</span>
            </div>
          </div>
        )}

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