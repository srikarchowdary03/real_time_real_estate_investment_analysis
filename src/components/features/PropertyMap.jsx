// src/components/features/PropertyMap.jsx
// Color-coded markers - Boundary filters properties in BOTH map and grid

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, GeolocateControl, ScaleControl } from 'react-map-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { filterPropertiesInBoundary } from '../../utils/boundaryHelpers';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// ===== INVESTMENT SCORE CALCULATION =====
// Score based on actual property characteristics that vary
const calculateInvestmentScore = (property) => {
 const price = property.list_price || property.price || 0;
 const beds = property.description?.beds || property.beds || 0;
 const baths = property.description?.baths || property.baths || 0;
 const sqft = property.description?.sqft || property.sqft || 0;
 const lotSqft = property.description?.lot_sqft || property.lot_sqft || 0;
 const yearBuilt = property.description?.year_built || property.year_built || 0;
 const propertyType = property.description?.type || property.type || '';
 
 if (!price || price <= 0) return 50;
 
 let score = 50; // Base score
 
 // === 1. PRICE PER SQFT SCORING (Lower = Better for investment) ===
 if (sqft > 0) {
 const pricePerSqft = price / sqft;
 if (pricePerSqft < 100) score += 20; // Excellent value
 else if (pricePerSqft < 150) score += 15; // Great value
 else if (pricePerSqft < 200) score += 10; // Good value
 else if (pricePerSqft < 250) score += 5; // Fair value
 else if (pricePerSqft < 300) score += 0; // Average
 else if (pricePerSqft < 400) score -= 5; // Above average price
 else if (pricePerSqft < 500) score -= 10; // Expensive
 else score -= 15; // Very expensive
 }
 
 // === 2. BEDROOM VALUE SCORING (More beds per $100k = Better) ===
 if (beds > 0 && price > 0) {
 const bedsPerHundredK = beds / (price / 100000);
 if (bedsPerHundredK >= 1.5) score += 15; // Excellent bed/price ratio
 else if (bedsPerHundredK >= 1.0) score += 10;
 else if (bedsPerHundredK >= 0.7) score += 5;
 else if (bedsPerHundredK >= 0.5) score += 0;
 else if (bedsPerHundredK >= 0.3) score -= 5;
 else score -= 10; // Few beds for price
 }
 
 // === 3. RENT POTENTIAL SCORING (Based on realistic rent estimates) ===
 // Rent-to-price ratio varies by price range (lower priced = higher ratio)
 let rentMultiplier;
 if (price < 150000) rentMultiplier = 0.009; // 0.9% for cheap properties
 else if (price < 250000) rentMultiplier = 0.008; // 0.8%
 else if (price < 400000) rentMultiplier = 0.007; // 0.7%
 else if (price < 600000) rentMultiplier = 0.006; // 0.6%
 else if (price < 1000000) rentMultiplier = 0.005; // 0.5%
 else rentMultiplier = 0.004; // 0.4% for expensive
 
 // Adjust for bedrooms (more beds = more rent potential)
 if (beds >= 4) rentMultiplier *= 1.15;
 else if (beds >= 3) rentMultiplier *= 1.08;
 else if (beds <= 1) rentMultiplier *= 0.85;
 
 const estimatedRent = price * rentMultiplier;
 const grossYield = (estimatedRent * 12 / price) * 100;
 
 // Score based on gross yield
 if (grossYield >= 12) score += 15;
 else if (grossYield >= 10) score += 10;
 else if (grossYield >= 8) score += 5;
 else if (grossYield >= 6) score += 0;
 else if (grossYield >= 5) score -= 5;
 else score -= 10;
 
 // === 4. PROPERTY SIZE BONUS ===
 if (sqft >= 2500) score += 5; // Large home - more rental appeal
 else if (sqft >= 1800) score += 3;
 else if (sqft < 800) score -= 5; // Very small - limited appeal
 
 // === 5. MULTI-UNIT BONUS ===
 const typeStr = propertyType.toLowerCase();
 if (typeStr.includes('multi') || typeStr.includes('duplex') || 
 typeStr.includes('triplex') || typeStr.includes('fourplex')) {
 score += 15; // Multi-family is great for investment
 } else if (typeStr.includes('townhouse') || typeStr.includes('condo')) {
 score -= 5; // HOA fees reduce cash flow
 }
 
 // === 6. AGE CONSIDERATION ===
 const currentYear = new Date().getFullYear();
 if (yearBuilt > 0) {
 const age = currentYear - yearBuilt;
 if (age <= 5) score += 5; // New - less maintenance
 else if (age <= 15) score += 3; // Relatively new
 else if (age >= 50) score -= 5; // Old - more maintenance
 else if (age >= 80) score -= 10; // Very old
 }
 
 // === 7. PRICE RANGE SWEET SPOT ===
 // Mid-range properties often have best rent-to-price ratios
 if (price >= 150000 && price <= 350000) {
 score += 5; // Sweet spot for rentals
 } else if (price < 100000) {
 score += 3; // Cheap but potentially high yield
 } else if (price > 750000) {
 score -= 5; // Luxury - harder to cash flow
 }
 
 // Clamp score between 0-100
 return Math.max(0, Math.min(100, Math.round(score)));
};

// ===== SCORE-BASED COLORS =====
const getScoreColor = (score) => {
 if (score >= 80) return '#10B981';
 if (score >= 65) return '#22C55E';
 if (score >= 50) return '#EAB308';
 if (score >= 35) return '#F97316';
 return '#EF4444';
};

const getScoreLabel = (score) => {
 if (score >= 80) return 'Excellent';
 if (score >= 65) return 'Good';
 if (score >= 50) return 'Fair';
 if (score >= 35) return 'Risky';
 return 'Poor';
};

// ===== CUSTOM MARKER COMPONENT =====
const PropertyMarker = ({ property, onClick, isSelected }) => {
 const score = useMemo(() => calculateInvestmentScore(property), [property]);
 const color = getScoreColor(score);
 
 return (
 <div
 onClick={onClick}
 className="cursor-pointer transform transition-transform hover:scale-110"
 >
 <div
 style={{
 width: isSelected ? '36px' : '28px',
 height: isSelected ? '36px' : '28px',
 backgroundColor: color,
 borderRadius: '50% 50% 50% 0',
 transform: 'rotate(-45deg)',
 border: isSelected ? '3px solid white' : '2px solid white',
 boxShadow: isSelected 
 ? '0 4px 12px rgba(0,0,0,0.4)' 
 : '0 2px 6px rgba(0,0,0,0.3)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 }}
 >
 <span
 style={{
 transform: 'rotate(45deg)',
 color: 'white',
 fontSize: isSelected ? '12px' : '10px',
 fontWeight: 'bold',
 }}
 >
 {score}
 </span>
 </div>
 </div>
 );
};

// ===== MAIN COMPONENT =====
const PropertyMap = ({ 
 properties = [], 
 selectedProperty: externalSelectedProperty,
 onPropertyClick,
 onBoundaryChange, // NEW: Callback when boundary changes (filtered properties)
 onBoundaryCreated,
 onBoundaryEdited,
 onBoundaryDeleted,
 className = '' 
}) => {
 const mapRef = useRef();
 const drawRef = useRef();
 const [viewState, setViewState] = useState({
 longitude: -71.0589,
 latitude: 42.3601,
 zoom: 12
 });
 const [selectedProperty, setSelectedProperty] = useState(null);
 const [drawingEnabled, setDrawingEnabled] = useState(false);
 const [currentBoundary, setCurrentBoundary] = useState(null);
 const [filteredProperties, setFilteredProperties] = useState([]);
 const [hasBoundary, setHasBoundary] = useState(false);

 // Get coordinates from property
 const getCoords = (property) => {
 const lat = property.location?.address?.coordinate?.lat || property.lat;
 const lng = property.location?.address?.coordinate?.lon || property.lon;
 return (lat && lng) ? { lat, lng } : null;
 };

 // Calculate map center from properties
 useEffect(() => {
 const propsToUse = hasBoundary ? filteredProperties : properties;
 if (propsToUse && propsToUse.length > 0) {
 const validProperties = propsToUse.filter(p => getCoords(p));

 if (validProperties.length > 0) {
 const latSum = validProperties.reduce((sum, p) => sum + getCoords(p).lat, 0);
 const lngSum = validProperties.reduce((sum, p) => sum + getCoords(p).lng, 0);
 
 setViewState(prev => ({
 ...prev,
 longitude: lngSum / validProperties.length,
 latitude: latSum / validProperties.length,
 }));
 }
 }
 }, [properties, filteredProperties, hasBoundary]);

 // Filter properties when boundary changes
 useEffect(() => {
 if (currentBoundary) {
 const filtered = filterPropertiesInBoundary(properties, currentBoundary);
 setFilteredProperties(filtered);
 setHasBoundary(true);
 
 // Notify parent component of filtered properties
 if (onBoundaryChange) {
 onBoundaryChange(filtered, true);
 }
 } else {
 setFilteredProperties([]);
 setHasBoundary(false);
 
 // Notify parent to show all properties
 if (onBoundaryChange) {
 onBoundaryChange(properties, false);
 }
 }
 }, [currentBoundary, properties, onBoundaryChange]);

 // Handle property marker click
 const handleMarkerClick = useCallback((property, e) => {
 if (drawingEnabled) return;
 e?.originalEvent?.stopPropagation();
 setSelectedProperty(property);
 }, [drawingEnabled]);

 // Initialize Mapbox Draw
 useEffect(() => {
 if (!mapRef.current) return;

 const map = mapRef.current.getMap();
 
 const draw = new MapboxDraw({
 displayControlsDefault: false,
 controls: {
 polygon: drawingEnabled,
 trash: drawingEnabled
 },
 defaultMode: drawingEnabled ? 'draw_polygon' : 'simple_select'
 });

 map.addControl(draw, 'top-right');
 drawRef.current = draw;

 const handleCreate = (e) => {
 const feature = e.features[0];
 const coords = feature.geometry.coordinates;

 if (feature.geometry.type === 'Polygon') {
 const points = coords[0].map(coord => [coord[1], coord[0]]);
 const boundary = { type: 'polygon', points };
 setCurrentBoundary(boundary);
 setDrawingEnabled(false); // Exit drawing mode after creating
 if (onBoundaryCreated) onBoundaryCreated(boundary);
 }
 };

 const handleUpdate = (e) => {
 const feature = e.features[0];
 const coords = feature.geometry.coordinates;

 if (feature.geometry.type === 'Polygon') {
 const points = coords[0].map(coord => [coord[1], coord[0]]);
 const boundary = { type: 'polygon', points };
 setCurrentBoundary(boundary);
 if (onBoundaryEdited) onBoundaryEdited(boundary);
 }
 };

 const handleDelete = () => {
 setCurrentBoundary(null);
 if (onBoundaryDeleted) onBoundaryDeleted();
 };

 map.on('draw.create', handleCreate);
 map.on('draw.update', handleUpdate);
 map.on('draw.delete', handleDelete);

 return () => {
 map.off('draw.create', handleCreate);
 map.off('draw.update', handleUpdate);
 map.off('draw.delete', handleDelete);
 if (map.hasControl(draw)) {
 map.removeControl(draw);
 }
 };
 }, [drawingEnabled, onBoundaryCreated, onBoundaryEdited, onBoundaryDeleted]);

 const toggleDrawing = () => {
 const newState = !drawingEnabled;
 setDrawingEnabled(newState);
 
 if (drawRef.current) {
 if (newState) {
 drawRef.current.changeMode('draw_polygon');
 } else {
 drawRef.current.changeMode('simple_select');
 }
 }
 };

 const clearBoundaries = () => {
 if (drawRef.current) {
 drawRef.current.deleteAll();
 }
 setCurrentBoundary(null);
 setDrawingEnabled(false);
 if (onBoundaryDeleted) onBoundaryDeleted();
 };

 // Format price
 const formatPrice = (price) => {
 if (!price) return 'N/A';
 if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
 if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
 return `$${price.toLocaleString()}`;
 };

 // Estimate rent with variable multiplier based on price range
 const estimateRent = (property) => {
 const price = property.list_price || property.price || 0;
 const beds = property.description?.beds || property.beds || 0;
 const sqft = property.description?.sqft || property.sqft || 0;
 
 if (!price) return 0;
 
 // Rent-to-price ratio varies by price range
 let rentMultiplier;
 if (price < 150000) rentMultiplier = 0.009;
 else if (price < 250000) rentMultiplier = 0.008;
 else if (price < 400000) rentMultiplier = 0.007;
 else if (price < 600000) rentMultiplier = 0.006;
 else if (price < 1000000) rentMultiplier = 0.005;
 else rentMultiplier = 0.004;
 
 let rent = price * rentMultiplier;
 
 // Bedroom adjustments
 if (beds >= 4) rent *= 1.15;
 else if (beds >= 3) rent *= 1.08;
 else if (beds <= 1) rent *= 0.85;
 
 // Size adjustment
 if (sqft > 2000) rent *= 1.05;
 else if (sqft < 1000) rent *= 0.92;
 
 return Math.round(rent / 50) * 50;
 };

 // Properties to display on map - filtered when boundary exists
 const displayProperties = hasBoundary ? filteredProperties : properties;
 const totalCount = properties.length;
 const filteredCount = filteredProperties.length;

 return (
 <div className={`relative h-full ${className}`}>
 {/* Control Panel */}
 <div className="absolute top-4 left-4 z-10 bg-white rounded-xl shadow-lg p-4 space-y-3 max-w-[220px]">
 {/* Draw Button */}
 <button
 onClick={toggleDrawing}
 className={`w-full px-4 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2 ${
 drawingEnabled
 ? 'bg-blue-600 text-white hover:bg-blue-700'
 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
 }`}
 >
 {drawingEnabled ? (
 <>
 <span>✓</span> Drawing Active
 </>
 ) : (
 <>
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
 </svg>
 Draw Boundary
 </>
 )}
 </button>

 {/* Boundary Info */}
 {hasBoundary && (
 <div className="space-y-2">
 <div className="bg-blue-50 p-3 rounded-lg">
 <div className="text-xs font-semibold text-blue-900 mb-1">
 Properties in Area
 </div>
 <div className="text-2xl font-bold text-blue-600">
 {filteredCount}
 </div>
 <div className="text-xs text-blue-700">
 of {totalCount} total
 </div>
 </div>

 <button
 onClick={clearBoundaries}
 className="w-full px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
 >
 Clear Boundary
 </button>
 </div>
 )}

 {/* Drawing Instructions */}
 {drawingEnabled && (
 <div className="text-xs text-gray-600 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
 <div className="font-semibold mb-1 text-yellow-800">📍 Instructions:</div>
 <ul className="space-y-1 text-yellow-700">
 <li>• Click points on map</li>
 <li>• Close shape by clicking first point</li>
 </ul>
 </div>
 )}

 {/* Legend */}
 <div className="border-t pt-3">
 <div className="text-xs font-semibold text-gray-700 mb-2">Investment Score</div>
 <div className="space-y-1.5">
 {[
 { color: '#10B981', label: '80+ Excellent' },
 { color: '#22C55E', label: '65-79 Good' },
 { color: '#EAB308', label: '50-64 Fair' },
 { color: '#F97316', label: '35-49 Risky' },
 { color: '#EF4444', label: '0-34 Poor' },
 ].map(({ color, label }) => (
 <div key={label} className="flex items-center gap-2">
 <div 
 className="w-3 h-3 rounded-full" 
 style={{ backgroundColor: color }}
 />
 <span className="text-xs text-gray-600">{label}</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Property Count Badge */}
 <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md px-3 py-2">
 <span className="text-sm font-medium text-gray-700">
 {hasBoundary ? `${filteredCount} in area` : `${totalCount} properties`}
 </span>
 </div>

 {/* Mapbox Map */}
 <Map
 ref={mapRef}
 {...viewState}
 onMove={evt => !drawingEnabled && setViewState(evt.viewState)}
 style={{ width: '100%', height: '100%', minHeight: '500px' }}
 mapStyle="mapbox://styles/mapbox/streets-v12"
 mapboxAccessToken={MAPBOX_TOKEN}
 interactiveLayerIds={drawingEnabled ? [] : undefined}
 dragPan={!drawingEnabled}
 scrollZoom={!drawingEnabled}
 doubleClickZoom={!drawingEnabled}
 >
 {/* Map Controls */}
 <NavigationControl position="bottom-right" showCompass={true} />
 <FullscreenControl position="bottom-right" />
 <GeolocateControl 
 position="bottom-right" 
 trackUserLocation={true}
 showUserHeading={true}
 />
 <ScaleControl position="bottom-left" unit="imperial" />

 {/* Render ONLY filtered markers when boundary exists, otherwise all */}
 {displayProperties.map((property, index) => {
 const coords = getCoords(property);
 if (!coords) return null;

 const isSelected = externalSelectedProperty?.property_id === property.property_id ||
 selectedProperty?.property_id === property.property_id;

 return (
 <Marker
 key={`marker-${property.property_id}-${index}`}
 longitude={coords.lng}
 latitude={coords.lat}
 anchor="bottom"
 >
 <PropertyMarker
 property={property}
 isSelected={isSelected}
 onClick={(e) => handleMarkerClick(property, e)}
 />
 </Marker>
 );
 })}

 {/* Popup */}
 {selectedProperty && !drawingEnabled && (
 <Popup
 longitude={getCoords(selectedProperty)?.lng}
 latitude={getCoords(selectedProperty)?.lat}
 onClose={() => setSelectedProperty(null)}
 closeOnClick={false}
 maxWidth="320px"
 anchor="bottom"
 offset={25}
 >
 <div className="min-w-[280px]">
 {(selectedProperty.primary_photo?.href || selectedProperty.thumbnail) && (
 <img
 src={selectedProperty.primary_photo?.href || selectedProperty.thumbnail}
 alt="Property"
 className="w-full h-36 object-cover rounded-t-lg"
 onError={(e) => { e.target.style.display = 'none'; }}
 />
 )}

 <div className="p-3 space-y-2">
 {(() => {
 const score = calculateInvestmentScore(selectedProperty);
 const color = getScoreColor(score);
 const label = getScoreLabel(score);
 return (
 <div 
 className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold text-white"
 style={{ backgroundColor: color }}
 >
 <span>{score}</span>
 <span>•</span>
 <span>{label}</span>
 </div>
 );
 })()}

 <h3 className="font-semibold text-gray-900 text-sm leading-tight">
 {selectedProperty.location?.address?.line || selectedProperty.address || 'Address unavailable'}
 </h3>
 <p className="text-xs text-gray-500">
 {selectedProperty.location?.address?.city || selectedProperty.city}, {selectedProperty.location?.address?.state_code || selectedProperty.state}
 </p>

 <div className="flex items-center justify-between">
 <p className="text-lg font-bold text-gray-900">
 {formatPrice(selectedProperty.list_price || selectedProperty.price)}
 </p>
 <p className="text-sm text-green-600 font-medium">
 ~{formatPrice(estimateRent(selectedProperty))}/mo
 </p>
 </div>

 <div className="flex gap-3 text-xs text-gray-600 pb-2 border-b">
 {(selectedProperty.description?.beds || selectedProperty.beds) && (
 <span>{selectedProperty.description?.beds || selectedProperty.beds} beds</span>
 )}
 {(selectedProperty.description?.baths || selectedProperty.baths) && (
 <span>{selectedProperty.description?.baths || selectedProperty.baths} baths</span>
 )}
 {(selectedProperty.description?.sqft || selectedProperty.sqft) && (
 <span>{(selectedProperty.description?.sqft || selectedProperty.sqft).toLocaleString()} sqft</span>
 )}
 </div>

 {(() => {
 const price = selectedProperty.list_price || selectedProperty.price || 0;
 const rent = estimateRent(selectedProperty);
 const grossYield = price ? ((rent * 12) / price * 100).toFixed(1) : 0;
 const capRate = price ? ((rent * 12 * 0.65) / price * 100).toFixed(1) : 0;
 
 return (
 <div className="grid grid-cols-2 gap-2 text-xs">
 <div className="bg-gray-50 p-2 rounded">
 <p className="text-gray-500">Gross Yield</p>
 <p className="font-bold text-gray-900">{grossYield}%</p>
 </div>
 <div className="bg-gray-50 p-2 rounded">
 <p className="text-gray-500">Est. Cap Rate</p>
 <p className="font-bold text-gray-900">{capRate}%</p>
 </div>
 </div>
 );
 })()}

 <button
 onClick={() => onPropertyClick && onPropertyClick(selectedProperty)}
 className="w-full mt-2 px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
 >
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
 </svg>
 View Analysis
 </button>
 </div>
 </div>
 </Popup>
 )}
 </Map>
 </div>
 );
};

export default PropertyMap;