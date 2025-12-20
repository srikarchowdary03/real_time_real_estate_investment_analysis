import { Home, Bed, Bath, Square, Calendar, Building, MapPin } from 'lucide-react';

export default function PropertyDescription({ property }) {
  // Extract data from multiple possible sources
  const address = property?.address || 
                  property?.location?.address?.line || 
                  property?.propertyData?.address || 
                  'Address not available';
  
  const city = property?.city || 
               property?.location?.address?.city || 
               property?.propertyData?.city || 
               '';
  
  const state = property?.state || 
                property?.location?.address?.state_code || 
                property?.propertyData?.state || 
                '';
  
  const zipCode = property?.zipCode || 
                  property?.zip || 
                  property?.location?.address?.postal_code || 
                  property?.propertyData?.zipCode || 
                  '';
  
  const beds = property?.beds || 
               property?.description?.beds || 
               property?.propertyData?.beds || 
               0;
  
  const baths = property?.baths || 
                property?.description?.baths || 
                property?.propertyData?.baths || 
                0;
  
  const sqft = property?.sqft || 
               property?.description?.sqft || 
               property?.propertyData?.sqft || 
               0;
  
  const yearBuilt = property?.yearBuilt || 
                    property?.year_built || 
                    property?.description?.year_built || 
                    'N/A';
  
  const propertyType = property?.propertyType || 
                       property?.prop_type || 
                       property?.description?.type || 
                       property?.type || 
                       'Residential';
  
  const lotSize = property?.lotSize || 
                  property?.lot_sqft || 
                  property?.description?.lot_sqft || 
                  null;

  const units = property?.detectedUnits || 
                property?.units || 
                property?.numberOfUnits || 
                1;

  const price = property?.price || 
                property?.list_price || 
                property?.propertyData?.price || 
                0;

  const formatPrice = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    if (!value) return 'N/A';
    return value.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Description</h1>
        <p className="text-gray-600">Property details and specifications</p>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{address}</h2>
            <p className="text-gray-600 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {city}{city && state ? ', ' : ''}{state} {zipCode}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{formatPrice(price)}</div>
            {units > 1 && (
              <div className="text-sm text-gray-500">{formatPrice(price / units)}/unit</div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Bed className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">{beds}</div>
            <div className="text-xs text-gray-500">Bedrooms</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Bath className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">{baths}</div>
            <div className="text-xs text-gray-500">Bathrooms</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Square className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">{formatNumber(sqft)}</div>
            <div className="text-xs text-gray-500">Sq. Ft.</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">{yearBuilt}</div>
            <div className="text-xs text-gray-500">Year Built</div>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5" />
          Property Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Property Type</span>
            <span className="font-medium text-gray-900 capitalize">{propertyType}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Units</span>
            <span className="font-medium text-gray-900">{units}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Bedrooms</span>
            <span className="font-medium text-gray-900">{beds}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Bathrooms</span>
            <span className="font-medium text-gray-900">{baths}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Square Footage</span>
            <span className="font-medium text-gray-900">{formatNumber(sqft)} sq ft</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Year Built</span>
            <span className="font-medium text-gray-900">{yearBuilt}</span>
          </div>
          
          {lotSize && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Lot Size</span>
              <span className="font-medium text-gray-900">{formatNumber(lotSize)} sq ft</span>
            </div>
          )}
          
          {sqft > 0 && price > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Price per Sq Ft</span>
              <span className="font-medium text-gray-900">{formatPrice(price / sqft)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Address Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Street Address</span>
            <span className="font-medium text-gray-900">{address}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">City</span>
            <span className="font-medium text-gray-900">{city || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">State</span>
            <span className="font-medium text-gray-900">{state || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">ZIP Code</span>
            <span className="font-medium text-gray-900">{zipCode || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}