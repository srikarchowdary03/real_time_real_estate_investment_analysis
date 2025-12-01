export default function PropertyDescription({ property }) {
  const address = property.address || 'Address not available';
  const city = property.city || '';
  const state = property.state || '';
  const zipCode = property.zipCode || '';
  const beds = property.beds || property.description?.beds || 0;
  const baths = property.baths || property.description?.baths || 0;
  const sqft = property.sqft || property.description?.sqft || 0;
  const yearBuilt = property.yearBuilt || property.year_built || 'N/A';
  const propertyType = property.propertyType || property.property_type || 'N/A';
  const lotSize = property.lotSize || property.lot_sqft || 'N/A';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Property Description</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50">
            📋 Records & Listings
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            🗺️ View on Map
          </button>
        </div>
      </div>

      {/* Property Name */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Property Name:
        </label>
        <input
          type="text"
          defaultValue={address}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Short Description */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Short Description:
        </label>
        <textarea
          placeholder="Add a description..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Add a short description of this property to display in its reports.
        </p>
      </div>

      {/* Tags & Labels */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Tags & Labels:
        </label>
        <input
          type="text"
          placeholder="Add a tag..."
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Add tags to help you categorize this property, track its status and quickly find it later. 
          You can manage tags in your{' '}
          <a href="#" className="text-blue-600 hover:underline">settings</a>.
        </p>
      </div>

      {/* Address Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-600">ADDRESS</h2>
          <button className="text-blue-600 hover:text-blue-800 text-sm">
            📋 Copy
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Street Address:
            </label>
            <input
              type="text"
              defaultValue={address}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              City:
            </label>
            <input
              type="text"
              defaultValue={city}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              State/Region:
            </label>
            <input
              type="text"
              defaultValue={state}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              ZIP/Postal Code:
            </label>
            <input
              type="text"
              defaultValue={zipCode}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">DESCRIPTION</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">API</span>
              Property Type:
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
              <option>{propertyType}</option>
              <option>House</option>
              <option>Condo</option>
              <option>Multi-Family</option>
              <option>Townhouse</option>
              <option>Land</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Bedrooms:
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
              <option>{beds}</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Bathrooms:
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
              <option>{baths}</option>
              {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Square Footage:
            </label>
            <input
              type="number"
              defaultValue={sqft}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Year Built:
            </label>
            <input
              type="text"
              defaultValue={yearBuilt}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Parking:
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
              <option value="">Select...</option>
              <option>None</option>
              <option>Street</option>
              <option>Garage - 1 car</option>
              <option>Garage - 2 cars</option>
              <option>Driveway</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Lot Size:
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                defaultValue={lotSize}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-600">
                Square Feet
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Zoning:
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              MLS Number:
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">NOTES</h2>
        <p className="text-sm text-gray-600 mb-2">
          Add notes, links to external listings or other information about this property.
        </p>
        <textarea
          rows={6}
          placeholder="Welcome to an exceptional opportunity in the heart of Golden Hill..."
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-center">
        <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Save Changes
        </button>
      </div>
    </div>
  );
}