import { Home, Edit, Image, TrendingUp, BarChart3, Trash2 } from 'lucide-react';

export default function PropertySidebar({ property, activeSection, onSectionChange, onBack }) {
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const address = property.address || 'Address not available';
  const city = property.city || '';
  const state = property.state || '';
  const zipCode = property.zipCode || '';
  const price = property.price || property.list_price || 0;
  const beds = property.beds || property.description?.beds || 0;
  const baths = property.baths || property.description?.baths || 0;
  const sqft = property.sqft || property.description?.sqft || 0;
  const image = property.image || property.primary_photo?.href || 'https://via.placeholder.com/400x300?text=No+Image';

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
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        <div className="absolute top-2 left-2">
          <span className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold">
            SAMPLE
          </span>
          <span className="bg-orange-600 text-white px-3 py-1 rounded text-xs font-semibold ml-1">
            RENTAL
          </span>
        </div>
        {/* Facebook Share Button */}
        <button className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700">
          Share
        </button>
      </div>

      {/* Property Details */}
      <div className="p-4 border-b">
        <div className="mb-3">
          <select className="w-full text-sm font-semibold text-gray-900 bg-transparent border-none focus:outline-none cursor-pointer">
            <option>Example: Rental Property</option>
          </select>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <div>{address}</div>
          <div>{city}, {state} {zipCode}</div>
          <div className="flex items-center gap-3 text-xs mt-2">
            {beds > 0 && <span>{beds} BR</span>}
            {baths > 0 && <span>· {baths} BA</span>}
            {sqft > 0 && <span>· {sqft.toLocaleString()} Sq.Ft.</span>}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-blue-600">{formatPrice(price)}</span>
          <span className="text-sm text-gray-500">7.2% Cap Rate</span>
        </div>
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

      {/* Delete Button */}
      <div className="p-4 border-t">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors">
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}