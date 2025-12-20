import { useState } from 'react';
import { Star, Image } from 'lucide-react';

export default function PropertyPhotos({ property }) {
  // Extract photos from multiple possible sources
  const getPhotos = () => {
    if (property?.photos?.length > 0) {
      return property.photos;
    }
    // If no photos array, try to construct from thumbnail
    if (property?.thumbnail) {
      return [{ href: property.thumbnail }];
    }
    if (property?.primary_photo?.href) {
      return [{ href: property.primary_photo.href }];
    }
    return [];
  };

  const [photos] = useState(getPhotos());
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Get the URL from photo object (handles both {href: url} and plain url string)
  const getPhotoUrl = (photo) => {
    if (typeof photo === 'string') return photo;
    return photo?.href || photo?.url || '';
  };

  const address = property?.address || 
                  property?.location?.address?.line || 
                  property?.propertyData?.address || 
                  'Property';

  if (!photos || photos.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Photos</h1>
          <p className="text-gray-600">{address}</p>
        </div>

        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Photos Available</h3>
          <p className="text-gray-600">
            This property doesn't have any photos yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Photos</h1>
        <p className="text-gray-600">{address}</p>
      </div>

      {/* Main Photo Viewer */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="relative bg-gray-900">
          <img
            src={getPhotoUrl(photos[selectedIndex])}
            alt={`${address} - Photo ${selectedIndex + 1}`}
            className="w-full h-96 md:h-[500px] object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/800x600/e2e8f0/64748b?text=Image+Not+Available';
            }}
          />
          
          {/* Photo Counter */}
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {selectedIndex + 1} / {photos.length}
          </div>

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setSelectedIndex(prev => prev === 0 ? photos.length - 1 : prev - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              >
                ←
              </button>
              <button
                onClick={() => setSelectedIndex(prev => prev === photos.length - 1 ? 0 : prev + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              >
                →
              </button>
            </>
          )}
        </div>
      </div>

      {/* Thumbnails Grid */}
      {photos.length > 1 && (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              All Photos ({photos.length})
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  selectedIndex === index 
                    ? 'border-blue-600 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <img
                  src={getPhotoUrl(photo)}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/200x200/e2e8f0/64748b?text=No+Image';
                  }}
                />
                
                {/* Primary Badge */}
                {index === 0 && (
                  <div className="absolute top-1 left-1 bg-blue-600 text-white p-1 rounded">
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                )}

                {/* Selected Indicator */}
                {selectedIndex === index && (
                  <div className="absolute inset-0 bg-blue-600/20" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}