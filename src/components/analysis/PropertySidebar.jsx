import { Home, Edit, Image, TrendingUp, BarChart3, Trash2, Heart, Check } from 'lucide-react';

export default function PropertySidebar({ property, activeSection, onSectionChange, onBack, isSaved = false }) {
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const address = property.address || property.location?.address?.line || 'Address not available';
  const city = property.city || property.location?.address?.city || '';
  const state = property.state || property.location?.address?.state_code || '';
  const zipCode = property.zipCode || property.zip || property.location?.address?.postal_code || '';
  const price = property.price || property.list_price || 0;
  const beds = property.beds || property.description?.beds || 0;
  const baths = property.baths || property.description?.baths || 0;
  const sqft = property.sqft || property.description?.sqft || 0;
  const image = property.image || property.thumbnail || property.primary_photo?.href || property.photos?.[0]?.href || 'https://via.placeholder.com/400x300?text=No+Image';
  
  // Get rent and calculate cap rate
  const rentEstimate = property.rentEstimate || 0;
  const annualNOI = (rentEstimate * 12) * 0.65;
  const capRate = price > 0 ? ((annualNOI / price) * 100).toFixed(1) : 0;
  const rentSource = property.rentSource || 'estimate';

  const menuSections = [
    {
      items: [
        { id: 'description', label: 'Property Description', icon: Home },
        { id: 'worksheet', label: 'Purchase Worksheet', icon: Edit },
        { id: 'photos', label: 'Photos', icon: Image }
      ]
    },
    {
      title: 'ANALYSIS',
      items: [
        { id: 'analysis', label: 'Property Analysis', icon: TrendingUp },
        { id: 'projections', label: 'Buy & Hold Projections', icon: BarChart3 }
      ]
    }
  ];

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-screen overflow-y-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="p-4 text-blue-600 hover:text-blue-800 flex items-center gap-2 border-b"
      >
        ← View all properties
      </button>

      {/* Property Image */}
      <div className="relative h-48 bg-gray-200">
        <img
          src={image}
          alt={address}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/400x300/e5e7eb/6b7280?text=No+Image';
          }}
        />
        <div className="absolute top-2 left-2 flex gap-1">
          {/* Saved Badge */}
          {isSaved && (
            <span className="inline-flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
              <Check className="w-3 h-3" />
              SAVED
            </span>
          )}
          {/* Rent Source Badge */}
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            rentSource === 'RentCast' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-orange-600 text-white'
          }`}>
            {rentSource === 'RentCast' ? 'RENTCAST' : 'RENTAL'}
          </span>
        </div>
        {/* Share Button */}
        <button 
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
          }}
          className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700"
        >
          Share
        </button>
      </div>

      {/* Property Details */}
      <div className="p-4 border-b">
        <div className="mb-3">
          <div className="text-sm font-semibold text-gray-900">
            Investment Property Analysis
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <div className="font-medium text-gray-900">{address}</div>
          <div>{city}, {state} {zipCode}</div>
          <div className="flex items-center gap-3 text-xs mt-2">
            {beds > 0 && <span>{beds} BR</span>}
            {baths > 0 && <span>· {baths} BA</span>}
            {sqft > 0 && <span>· {sqft.toLocaleString()} Sq.Ft.</span>}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-blue-600">{formatPrice(price)}</span>
          {capRate > 0 && (
            <span className="text-sm text-gray-500">{capRate}% Cap Rate</span>
          )}
        </div>

        {/* Rent Estimate */}
        {rentEstimate > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-600">Est. Rent:</span>
            <span className={`text-sm font-semibold ${
              rentSource === 'RentCast' ? 'text-emerald-600' : 'text-blue-600'
            }`}>
              {formatPrice(rentEstimate)}/mo
            </span>
            {rentSource === 'RentCast' && (
              <span className="text-xs text-emerald-600">✓ API</span>
            )}
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-2">
        {menuSections.map((section, idx) => (
          <div key={idx} className="mb-1">
            {section.title && (
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Saved Status Footer */}
      <div className="p-4 border-t bg-gray-50">
        {isSaved ? (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
            <Heart className="w-4 h-4" fill="currentColor" />
            <span className="font-medium">Property Saved</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Heart className="w-4 h-4" />
            <span>Not saved</span>
          </div>
        )}
      </div>
    </div>
  );
}