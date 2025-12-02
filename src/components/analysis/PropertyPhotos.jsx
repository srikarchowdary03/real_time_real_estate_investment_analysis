import { useState } from 'react';
import { Upload, X, Star } from 'lucide-react';

export default function PropertyPhotos({ property }) {
  const [photos, setPhotos] = useState(property.photos || []);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    // Handle file upload logic here
    console.log('Files to upload:', files);
  };

  const handleDelete = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index) => {
    const newPhotos = [...photos];
    const [photo] = newPhotos.splice(index, 1);
    newPhotos.unshift(photo);
    setPhotos(newPhotos);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Photos</h1>
        <p className="text-gray-600">
          Add photos of this property to display in reports and presentations.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 mb-6 hover:border-blue-500 transition-colors">
        <div className="text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload Photos
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop photos here, or click to browse
          </p>
          <label className="inline-block">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <span className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block">
              Choose Files
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: JPG, PNG, GIF (Max 10MB each)
          </p>
        </div>
      </div>

      {/* Photos Grid */}
      {photos && photos.length > 0 ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {photos.length} Photo{photos.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-sm text-gray-600">
              Click on a photo to set it as the primary image
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-12 bg-gray-100">
                  <img
                    src={photo.href || photo}
                    alt={`Property ${index + 1}`}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                    }}
                  />
                </div>

                {/* Primary Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Primary
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {index !== 0 && (
                    <button
                      onClick={() => handleSetPrimary(index)}
                      className="px-4 py-2 bg-white text-gray-900 rounded hover:bg-gray-100 font-medium text-sm"
                    >
                      Set as Primary
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(index)}
                    className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Photo Number */}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                  {index + 1} / {photos.length}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            No photos uploaded yet. Upload photos to get started.
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-2">💡 Tips for Great Property Photos</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Take photos in good lighting conditions (natural light works best)</li>
          <li>• Capture multiple angles of each room</li>
          <li>• Include exterior shots (front, back, sides)</li>
          <li>• Show special features (kitchen, bathrooms, upgrades)</li>
          <li>• The first photo will be used as the primary image in listings</li>
        </ul>
      </div>
    </div>
  );
}