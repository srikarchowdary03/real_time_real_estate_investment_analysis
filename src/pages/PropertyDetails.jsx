import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bed, Bath, Square, MapPin, Calendar, 
  Home, Ruler, Car, Heart, Share2, Phone, Mail,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { searchProperties } from '../services/realtyAPI';
import InvestmentCalculator from '../components/features/InvestmentCalculator';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchPropertyDetails(id);
    }
  }, [id]);

  const fetchPropertyDetails = async (propertyId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🏠 Fetching property details for:', propertyId);
      
      const results = await searchProperties({
        location: propertyId,
        limit: 1
      });
      
      if (results && results.length > 0) {
        setProperty(results[0]);
        console.log('✅ Property loaded:', results[0]);
      } else {
        setError('Property not found');
      }
    } catch (err) {
      console.error('❌ Error fetching property:', err);
      setError('Failed to load property details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const nextImage = () => {
    if (property?.photos) {
      setCurrentImageIndex((prev) => 
        prev === property.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property?.photos) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.photos.length - 1 : prev - 1
      );
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: property?.address || 'Property',
      text: `Check out this property for ${formatPrice(property?.price)}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-gray-200 border-t-red-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">{error || 'Property not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const photos = property.photos || (property.thumbnail ? [property.thumbnail] : []);
  const currentPhoto = typeof photos[currentImageIndex] === 'string' 
    ? photos[currentImageIndex] 
    : photos[currentImageIndex]?.href;
  const address = property.address || 'Address not available';
  const city = property.city || '';
  const state = property.state || '';
  const zipCode = property.zip || '';
  const price = property.price || 0;
  const beds = property.beds || 0;
  const baths = property.baths || 0;
  const sqft = property.sqft || 0;
  const lotSize = property.lotSize || 0;
  const yearBuilt = property.yearBuilt || null;
  const propertyType = property.propertyType || 'Single Family';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium hidden sm:inline">Back to Search</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-3 rounded-lg transition-all ${
                  isFavorite 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={handleShare}
                className="p-3 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative bg-black">
        <div className="container mx-auto">
          <div className="relative h-[400px] md:h-[500px] overflow-hidden">
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt={address}
                className="w-full h-full object-contain cursor-pointer"
                onClick={() => setIsGalleryOpen(true)}
                onError={(e) => {
                  e.target.src = 'https://placehold.co/1200x800/png?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <Home size={64} />
              </div>
            )}
            
            {property.isNewListing && (
              <div className="absolute top-6 left-6 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg">
                NEW LISTING
              </div>
            )}

            {photos.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                >
                  <ChevronRight size={24} />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                  {currentImageIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-4 px-4">
              {photos.slice(0, 10).map((photo, index) => {
                const photoSrc = typeof photo === 'string' ? photo : photo.href;
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-16 md:w-24 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-red-600 scale-105'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photoSrc}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/200x150/png?text=No+Image';
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {formatPrice(price)}
              </div>
              
              <div className="flex items-start gap-2 text-gray-600 mb-4">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0 text-red-600" />
                <div>
                  <div className="font-medium text-gray-900 text-lg">
                    {address}
                  </div>
                  <div>
                    {city}{city && state && ', '}{state} {zipCode}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 md:gap-6 pt-4 border-t">
                {beds > 0 && (
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-red-600" />
                    <span className="text-lg font-semibold">{beds}</span>
                    <span className="text-gray-600">Beds</span>
                  </div>
                )}
                {baths > 0 && (
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-red-600" />
                    <span className="text-lg font-semibold">{baths}</span>
                    <span className="text-gray-600">Baths</span>
                  </div>
                )}
                {sqft > 0 && (
                  <div className="flex items-center gap-2">
                    <Square className="w-5 h-5 text-red-600" />
                    <span className="text-lg font-semibold">{sqft.toLocaleString()}</span>
                    <span className="text-gray-600">Sqft</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex border-b overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'details'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('investment')}
                  className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'investment'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Investment Analysis
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Home</h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      Beautiful {beds} bedroom, {baths} bathroom {propertyType.toLowerCase()} located in {city}, {state}. 
                      This property features {sqft} square feet of living space and is perfect for families or investors.
                    </p>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Details</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-gray-600 flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          Property Type
                        </span>
                        <span className="font-medium">{propertyType}</span>
                      </div>
                      {yearBuilt && (
                        <div className="flex justify-between py-3 border-b">
                          <span className="text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Year Built
                          </span>
                          <span className="font-medium">{yearBuilt}</span>
                        </div>
                      )}
                      {lotSize > 0 && (
                        <div className="flex justify-between py-3 border-b">
                          <span className="text-gray-600 flex items-center gap-2">
                            <Ruler className="w-4 h-4" />
                            Lot Size
                          </span>
                          <span className="font-medium">{lotSize.toLocaleString()} sqft</span>
                        </div>
                      )}
                      {property.daysOnMarket && (
                        <div className="flex justify-between py-3 border-b">
                          <span className="text-gray-600">Days on Market</span>
                          <span className="font-medium">{property.daysOnMarket} days</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'investment' && (
                  <InvestmentCalculator property={property} />
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Agent</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
                    placeholder="I'm interested in this property..."
                  />
                </div>
                <button
                  onClick={() => alert('Thank you! An agent will contact you soon.')}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Request Information
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isGalleryOpen && currentPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-lg transition-colors z-10"
          >
            <X size={32} />
          </button>
          
          <img
            src={currentPhoto}
            alt="Property"
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onError={(e) => {
              e.target.src = 'https://placehold.co/1200x800/png?text=No+Image';
            }}
          />
          
          {photos.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 bg-white/90 hover:bg-white p-4 rounded-full z-10"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 bg-white/90 hover:bg-white p-4 rounded-full z-10"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;