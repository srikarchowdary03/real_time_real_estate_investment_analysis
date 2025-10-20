import L from 'leaflet';

// Price ranges for color coding
export const PRICE_RANGES = {
  LOW: 500000,
  MEDIUM: 700000,
  HIGH: 950000,
};

// Get marker color based on price
export const getMarkerColor = (price) => {
  if (price < PRICE_RANGES.LOW) return '#10B981'; // Green
  if (price < PRICE_RANGES.MEDIUM) return '#3B82F6'; // Blue
  if (price < PRICE_RANGES.HIGH) return '#F59E0B'; // Orange
  return '#EF4444'; // Red
};

// Get marker icon based on price
export const createCustomIcon = (price) => {
  const color = getMarkerColor(price);
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">
          $
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

// Format price for display
export const formatPrice = (price) => {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  } else if (price >= 1000) {
    return `$${(price / 1000).toFixed(0)}K`;
  }
  return `$${price.toLocaleString()}`;
};

// Get bounds for all properties
export const getMapBounds = (properties) => {
  if (!properties || properties.length === 0) return null;

  const validProperties = properties.filter(
    (p) => p.location?.address?.coordinate?.lat && p.location?.address?.coordinate?.lon
  );

  if (validProperties.length === 0) return null;

  const lats = validProperties.map((p) => p.location.address.coordinate.lat);
  const lons = validProperties.map((p) => p.location.address.coordinate.lon);

  return [
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)],
  ];
};

// Get default map center based on search location or properties
export const getMapCenter = (properties, defaultCenter = [42.3601, -71.0589]) => {
  if (!properties || properties.length === 0) return defaultCenter;

  const firstProperty = properties.find(
    (p) => p.location?.address?.coordinate?.lat && p.location?.address?.coordinate?.lon
  );

  if (!firstProperty) return defaultCenter;

  return [
    firstProperty.location.address.coordinate.lat,
    firstProperty.location.address.coordinate.lon,
  ];
};

// Custom cluster icon
export const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = 'small';
  let color = '#3B82F6'; // Blue

  if (count > 25) {
    size = 'large';
    color = '#EF4444'; // Red
  } else if (count > 15) {
    size = 'medium';
    color = '#F59E0B'; // Orange
  }

  const sizeMap = {
    small: 40,
    medium: 50,
    large: 60,
  };

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${sizeMap[size]}px;
        height: ${sizeMap[size]}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size === 'large' ? '18px' : size === 'medium' ? '16px' : '14px'};
        border: 4px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      ">
        ${count}
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: L.point(sizeMap[size], sizeMap[size], true),
  });
};