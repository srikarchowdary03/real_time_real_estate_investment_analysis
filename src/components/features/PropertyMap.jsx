import { useState, useEffect, useRef, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import Supercluster from 'supercluster';
import { calculateQuickScore } from '../../utils/investmentCalculations';
import { filterPropertiesInBoundary } from '../../utils/boundaryHelpers';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Helper function to extract coordinates from various property data structures
const getPropertyCoordinates = (property) => {
  // Try multiple possible locations for coordinates
  const coords = 
    property.location?.address?.coordinate || 
    property.location?.coordinate ||
    property.coordinate ||
    property.location?.coordinates ||
    property.coordinates ||
    property.lat_long;

  if (!coords) return null;

  // Handle different coordinate formats
  let lat, lon;

  if (coords.lat !== undefined && coords.lon !== undefined) {
    lat = coords.lat;
    lon = coords.lon;
  } else if (coords.lat !== undefined && coords.lng !== undefined) {
    lat = coords.lat;
    lon = coords.lng;
  } else if (coords.latitude !== undefined && coords.longitude !== undefined) {
    lat = coords.latitude;
    lon = coords.longitude;
  } else if (Array.isArray(coords) && coords.length === 2) {
    [lat, lon] = coords;
  }

  // Validate coordinates
  if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
    return { lat: parseFloat(lat), lon: parseFloat(lon) };
  }

  return null;
};

const PropertyMap = ({ 
  properties = [], 
  onPropertyClick,
  onBoundaryCreated,
  onBoundaryEdited,
  onBoundaryDeleted,
  className = '' 
}) => {
  const mapRef = useRef();
  const drawRef = useRef();
  const superclusterRef = useRef();
  
  const [viewState, setViewState] = useState({
    longitude: -71.0589,
    latitude: 42.3601,
    zoom: 12
  });
  
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [currentBoundary, setCurrentBoundary] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [hoveredCluster, setHoveredCluster] = useState(null);

  // Filter properties by boundary if one exists
  const displayProperties = currentBoundary 
    ? filterPropertiesInBoundary(properties, currentBoundary)
    : properties;

  // Debug: Log properties with/without coordinates
  useEffect(() => {
    if (properties.length > 0) {
      const withCoords = properties.filter(p => getPropertyCoordinates(p) !== null);
      console.log(`🗺️ Map Debug: ${withCoords.length} of ${properties.length} properties have valid coordinates`);
      
      if (withCoords.length === 0 && properties.length > 0) {
        console.warn('⚠️ No properties have coordinates! Check data structure:');
        console.log('Sample property:', properties[0]);
      }
    }
  }, [properties]);

  // Calculate map center from properties
  useEffect(() => {
    if (properties && properties.length > 0) {
      const validProperties = properties.filter(p => getPropertyCoordinates(p) !== null);

      if (validProperties.length > 0) {
        const coords = validProperties.map(p => getPropertyCoordinates(p));
        const latSum = coords.reduce((sum, c) => sum + c.lat, 0);
        const lngSum = coords.reduce((sum, c) => sum + c.lon, 0);
        
        const centerLat = latSum / validProperties.length;
        const centerLon = lngSum / validProperties.length;
        
        console.log(`📍 Map centering on: ${centerLat.toFixed(4)}, ${centerLon.toFixed(4)}`);
        
        setViewState({
          longitude: centerLon,
          latitude: centerLat,
          zoom: 13
        });
      }
    }
  }, [properties]);

  // Initialize Supercluster
  useEffect(() => {
    const cluster = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minPoints: 2
    });
    superclusterRef.current = cluster;
  }, []);

  // Prepare GeoJSON points for clustering with real Zillow data
  const points = useMemo(() => {
    const validPoints = displayProperties
      .map((property, index) => {
        const coords = getPropertyCoordinates(property);
        if (!coords) return null;

        // Prepare Zillow data object from property
        const zillowData = {
          rent: property.rent_estimate || property.monthly_rent || null,
          taxData: property.tax_data ? {
            annualAmount: property.tax_data.annual_amount || property.tax_data.tax_amount
          } : null,
          insurance: property.insurance_data ? {
            annual: property.insurance_data.annual_amount
          } : null,
          marketData: property.market_data ? {
            vacancyRate: property.market_data.vacancy_rate
          } : null,
          hoaFee: property.hoa_fee || property.monthly_hoa || null
        };

        // Get current mortgage rates if available
        const currentRates = property.mortgage_rates ? {
          rate30yr: property.mortgage_rates.rate_30_year
        } : null;

        // Calculate investment score using your actual function
        const scoreData = calculateQuickScore(
          property.list_price || 0,
          zillowData,
          currentRates
        );
        
        return {
          type: 'Feature',
          properties: {
            cluster: false,
            propertyId: property.property_id || index,
            property: property,
            score: scoreData.score,
            scoreData: scoreData
          },
          geometry: {
            type: 'Point',
            coordinates: [coords.lon, coords.lat]
          }
        };
      })
      .filter(Boolean);

    console.log(`🎯 Created ${validPoints.length} map points for clustering`);
    return validPoints;
  }, [displayProperties]);

  // Load points into supercluster
  useEffect(() => {
    if (superclusterRef.current && points.length > 0) {
      superclusterRef.current.load(points);
      console.log('✅ Loaded points into Supercluster');
    }
  }, [points]);

  // Get clusters for current viewport
  const clusters = useMemo(() => {
    if (!superclusterRef.current || !bounds || points.length === 0) return [];
    const clusterData = superclusterRef.current.getClusters(bounds, Math.floor(viewState.zoom));
    console.log(`🔍 Displaying ${clusterData.length} clusters/markers at zoom ${viewState.zoom.toFixed(1)}`);
    return clusterData;
  }, [bounds, viewState.zoom, points]);

  // Update bounds when map moves
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current.getMap();
    const updateBounds = () => {
      const mapBounds = map.getBounds();
      const newBounds = [
        mapBounds.getWest(),
        mapBounds.getSouth(),
        mapBounds.getEast(),
        mapBounds.getNorth()
      ];
      setBounds(newBounds);
    };

    updateBounds();
    map.on('moveend', updateBounds);
    
    return () => {
      map.off('moveend', updateBounds);
    };
  }, []);

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
        const boundary = { type: 'polygon', points: points };
        setCurrentBoundary(boundary);
        if (onBoundaryCreated) onBoundaryCreated(boundary);
      }
    };

    const handleUpdate = (e) => {
      const feature = e.features[0];
      const coords = feature.geometry.coordinates;

      if (feature.geometry.type === 'Polygon') {
        const points = coords[0].map(coord => [coord[1], coord[0]]);
        const boundary = { type: 'polygon', points: points };
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

  const handleClusterClick = (cluster) => {
    const expansionZoom = Math.min(
      superclusterRef.current.getClusterExpansionZoom(cluster.id),
      20
    );

    setViewState({
      ...viewState,
      longitude: cluster.geometry.coordinates[0],
      latitude: cluster.geometry.coordinates[1],
      zoom: expansionZoom,
      transitionDuration: 500
    });
  };

  // Get marker color based on score
  const getMarkerColor = (score) => {
    if (score === 'good') return '#10b981';
    if (score === 'okay') return '#fbbf24';
    if (score === 'unknown') return '#6b7280';
    return '#ef4444';
  };

  // Get cluster statistics
  const getClusterStats = (clusterId) => {
    if (!superclusterRef.current) return null;
    
    const leaves = superclusterRef.current.getLeaves(clusterId, Infinity);
    const scores = { good: 0, okay: 0, poor: 0, unknown: 0 };
    
    leaves.forEach(leaf => {
      const score = leaf.properties.score;
      if (scores.hasOwnProperty(score)) scores[score]++;
    });
    
    return scores;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Debug Info Panel (remove in production) */}
      {properties.length > 0 && points.length === 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 max-w-md">
          <div className="text-yellow-800 font-semibold mb-2">⚠️ No Map Markers</div>
          <div className="text-sm text-yellow-700">
            {properties.length} properties loaded but 0 have valid coordinates.
            <br />Check console for data structure details.
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <h3 className="text-xs font-bold mb-2 text-gray-900">Investment Score</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-700">Good Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span className="text-gray-700">Okay Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-700">Poor Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-gray-700">Unknown</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
          <div className="font-semibold mb-1">Criteria:</div>
          <ul className="space-y-0.5 text-[10px]">
            <li>✓ 1% Rule</li>
            <li>✓ Positive Cash Flow</li>
            <li>✓ Cap Rate &gt; 8%</li>
            <li>✓ CoC Return &gt; 8%</li>
          </ul>
        </div>
      </div>

      {/* Control Panel */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 space-y-2 max-w-[200px]">
        <button
          onClick={toggleDrawing}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
            drawingEnabled
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {drawingEnabled ? '✓ Drawing Active' : 'Draw Boundary'}
        </button>

        {currentBoundary && (
          <div className="space-y-2">
            <div className="text-sm bg-blue-50 p-3 rounded-lg">
              <div className="font-semibold text-blue-900 mb-1 text-xs">
                Properties in Area
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {displayProperties.length}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                of {properties.length} total
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
        
        {!currentBoundary && (
          <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
            <div className="font-semibold mb-1">Total Properties</div>
            <div className="text-2xl font-bold text-gray-900">{properties.length}</div>
            {points.length > 0 && (
              <div className="text-xs text-green-600 mt-1">
                {points.length} on map
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cluster Statistics Panel */}
      {hoveredCluster && (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 max-w-[200px]">
          <h4 className="text-xs font-bold mb-2 text-gray-900">Cluster Details</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold">{hoveredCluster.total}</span>
            </div>
            {hoveredCluster.good > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Good:</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-semibold text-green-600">{hoveredCluster.good}</span>
                </div>
              </div>
            )}
            {hoveredCluster.okay > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Okay:</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="font-semibold text-yellow-600">{hoveredCluster.okay}</span>
                </div>
              </div>
            )}
            {hoveredCluster.poor > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Poor:</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="font-semibold text-red-600">{hoveredCluster.poor}</span>
                </div>
              </div>
            )}
            {hoveredCluster.unknown > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unknown:</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  <span className="font-semibold text-gray-600">{hoveredCluster.unknown}</span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
            Click to zoom in
          </div>
        </div>
      )}

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
        <NavigationControl position="top-right" />
        
        {/* Clustered Markers */}
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount } = cluster.properties;

          if (isCluster) {
            const stats = getClusterStats(cluster.id);
            const size = 30 + Math.min((pointCount / points.length) * 40, 30);
            
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                longitude={longitude}
                latitude={latitude}
              >
                <div
                  onClick={() => handleClusterClick(cluster)}
                  onMouseEnter={() => setHoveredCluster({ 
                    total: pointCount, 
                    good: stats.good, 
                    okay: stats.okay, 
                    poor: stats.poor,
                    unknown: stats.unknown
                  })}
                  onMouseLeave={() => setHoveredCluster(null)}
                  className="cursor-pointer bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    border: '3px solid white'
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }

          const property = cluster.properties.property;
          const score = cluster.properties.score;
          const color = getMarkerColor(score);

          return (
            <Marker
              key={`property-${cluster.properties.propertyId}`}
              longitude={longitude}
              latitude={latitude}
              color={color}
              onClick={(e) => {
                if (!drawingEnabled) {
                  e.originalEvent.stopPropagation();
                  setSelectedProperty(property);
                }
              }}
            />
          );
        })}

        {/* Enhanced Popup */}
        {selectedProperty && !drawingEnabled && (() => {
          const coords = getPropertyCoordinates(selectedProperty);
          if (!coords) return null;

          return (
            <Popup
              longitude={coords.lon}
              latitude={coords.lat}
              onClose={() => setSelectedProperty(null)}
              closeOnClick={false}
              maxWidth="340px"
            >
              <div className="min-w-[300px]">
                {selectedProperty.primary_photo?.href && (
                  <img
                    src={selectedProperty.primary_photo.href}
                    alt={selectedProperty.location?.address?.line || 'Property'}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                )}

                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {selectedProperty.location?.address?.line || 'Address unavailable'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedProperty.location?.address?.city}, {selectedProperty.location?.address?.state_code}
                  </p>

                  {selectedProperty.list_price && (
                    <p className="text-2xl font-bold text-blue-600">
                      ${selectedProperty.list_price.toLocaleString()}
                    </p>
                  )}

                  <div className="flex gap-4 text-sm text-gray-600">
                    {selectedProperty.description?.beds && (
                      <span className="font-medium">{selectedProperty.description.beds} beds</span>
                    )}
                    {selectedProperty.description?.baths && (
                      <span className="font-medium">{selectedProperty.description.baths} baths</span>
                    )}
                    {selectedProperty.description?.sqft && (
                      <span className="font-medium">{selectedProperty.description.sqft.toLocaleString()} sqft</span>
                    )}
                  </div>

                  {/* Investment Metrics */}
                  {(() => {
                    const zillowData = {
                      rent: selectedProperty.rent_estimate || selectedProperty.monthly_rent || null,
                      taxData: selectedProperty.tax_data ? {
                        annualAmount: selectedProperty.tax_data.annual_amount || selectedProperty.tax_data.tax_amount
                      } : null,
                      insurance: selectedProperty.insurance_data ? {
                        annual: selectedProperty.insurance_data.annual_amount
                      } : null,
                      marketData: selectedProperty.market_data ? {
                        vacancyRate: selectedProperty.market_data.vacancy_rate
                      } : null,
                      hoaFee: selectedProperty.hoa_fee || selectedProperty.monthly_hoa || null
                    };

                    const currentRates = selectedProperty.mortgage_rates ? {
                      rate30yr: selectedProperty.mortgage_rates.rate_30_year
                    } : null;

                    const metrics = calculateQuickScore(
                      selectedProperty.list_price || 0,
                      zillowData,
                      currentRates
                    );

                    const scoreColors = {
                      good: 'bg-green-100 text-green-800 border-green-300',
                      okay: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                      poor: 'bg-red-100 text-red-800 border-red-300',
                      unknown: 'bg-gray-100 text-gray-800 border-gray-300'
                    };
                    
                    return (
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        <div className={`px-3 py-2 rounded-lg border-2 ${scoreColors[metrics.score]}`}>
                          <div className="text-xs font-medium uppercase tracking-wide">
                            Investment Score
                          </div>
                          <div className="text-lg font-bold mt-1">
                            {metrics.score.toUpperCase()}
                          </div>
                          {metrics.scoreReason && (
                            <div className="text-xs mt-1 opacity-80">
                              {metrics.scoreReason}
                            </div>
                          )}
                        </div>

                        {metrics.score !== 'unknown' && (
                          <>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {metrics.monthlyRent > 0 && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-xs text-gray-600">Monthly Rent</div>
                                  <div className="font-semibold text-gray-900">
                                    ${metrics.monthlyRent.toLocaleString()}
                                  </div>
                                </div>
                              )}
                              <div className="bg-gray-50 p-2 rounded">
                                <div className="text-xs text-gray-600">Cash Flow</div>
                                <div className={`font-semibold ${metrics.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${metrics.monthlyCashFlow.toLocaleString()}/mo
                                </div>
                              </div>
                              {metrics.capRate > 0 && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-xs text-gray-600">Cap Rate</div>
                                  <div className="font-semibold text-gray-900">
                                    {metrics.capRate}%
                                  </div>
                                </div>
                              )}
                              {metrics.cocReturn !== undefined && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-xs text-gray-600">CoC Return</div>
                                  <div className="font-semibold text-gray-900">
                                    {metrics.cocReturn}%
                                  </div>
                                </div>
                              )}
                            </div>

                            {metrics.passesOnePercent !== undefined && (
                              <div className={`text-xs p-2 rounded ${metrics.passesOnePercent ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {metrics.passesOnePercent ? '✓' : '✗'} 1% Rule: ${metrics.onePercentTarget?.toLocaleString() || 0} target
                              </div>
                            )}

                            {metrics.dataSource && Object.values(metrics.dataSource).some(v => v) && (
                              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                                <div className="font-semibold mb-1">Data Sources:</div>
                                <div className="space-y-0.5">
                                  {metrics.dataSource.rentFromAPI && <div>✓ Rent from API</div>}
                                  {metrics.dataSource.taxFromAPI && <div>✓ Tax from API</div>}
                                  {metrics.dataSource.insuranceFromAPI && <div>✓ Insurance from API</div>}
                                  {metrics.dataSource.rateFromAPI && <div>✓ Rate from API</div>}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {metrics.score === 'unknown' && metrics.message && (
                          <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                            {metrics.message}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => onPropertyClick && onPropertyClick(selectedProperty)}
                    className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    View Full Details
                  </button>
                </div>
              </div>
            </Popup>
          );
        })()}
      </Map>
    </div>
  );
};

export default PropertyMap;