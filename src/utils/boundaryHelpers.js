// src/utils/boundaryHelpers.js
// Boundary filtering utilities with support for multiple coordinate formats

/**
 * Get coordinates from property (supports multiple formats)
 */
export const getPropertyCoordinates = (property) => {
  // Try nested structure first (raw API response)
  const nestedLat = property.location?.address?.coordinate?.lat;
  const nestedLon = property.location?.address?.coordinate?.lon;
  
  if (nestedLat && nestedLon) {
    return { lat: nestedLat, lon: nestedLon };
  }
  
  // Try flat structure (normalized properties)
  if (property.lat && property.lon) {
    return { lat: property.lat, lon: property.lon };
  }
  
  return null;
};

/**
 * Check if a point is inside a circle
 */
export const isPointInCircle = (point, center, radius) => {
  const [lat1, lng1] = point;
  const [lat2, lng2] = center;
  
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= radius;
};

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export const isPointInPolygon = (point, polygon) => {
  const [lat, lng] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[j];
    
    const intersect = ((lng1 > lng) !== (lng2 > lng)) &&
      (lat < (lat2 - lat1) * (lng - lng1) / (lng2 - lng1) + lat1);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
};

/**
 * Filter properties within boundary
 * Supports both nested and flat coordinate structures
 */
export const filterPropertiesInBoundary = (properties, boundary) => {
  if (!boundary || !properties || properties.length === 0) {
    return properties;
  }

  return properties.filter(property => {
    // Get coordinates using helper function
    const coords = getPropertyCoordinates(property);

    // Skip if no valid coordinates
    if (!coords) {
      return false;
    }

    const propertyPoint = [coords.lat, coords.lon];

    // Check based on boundary type
    if (boundary.type === 'circle') {
      return isPointInCircle(
        propertyPoint,
        boundary.center,
        boundary.radius
      );
    } else if (boundary.type === 'rectangle' || boundary.type === 'polygon') {
      return isPointInPolygon(propertyPoint, boundary.points);
    }

    return false;
  });
};

/**
 * Get count of properties within boundary
 */
export const getPropertiesCountInBoundary = (properties, boundary) => {
  const filtered = filterPropertiesInBoundary(properties, boundary);
  return filtered.length;
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Get the center point of a polygon
 */
export const getPolygonCenter = (polygon) => {
  if (!polygon || polygon.length === 0) return null;
  
  let latSum = 0;
  let lngSum = 0;
  
  polygon.forEach(([lat, lng]) => {
    latSum += lat;
    lngSum += lng;
  });
  
  return [
    latSum / polygon.length,
    lngSum / polygon.length
  ];
};

/**
 * Calculate approximate area of polygon in square meters
 */
export const calculatePolygonArea = (polygon) => {
  if (!polygon || polygon.length < 3) return 0;
  
  const R = 6371000; // Earth's radius in meters
  let area = 0;
  
  for (let i = 0; i < polygon.length; i++) {
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[(i + 1) % polygon.length];
    
    area += toRad(lng2 - lng1) * 
            (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  
  area = Math.abs(area * R * R / 2);
  return area;
};

/**
 * Format area for display
 */
export const formatArea = (areaInMeters) => {
  if (areaInMeters < 1000000) {
    return ${(areaInMeters / 1000).toFixed(2)} km²;
  }
  return ${areaInMeters.toFixed(0)} m²;
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceInMeters) => {
  if (distanceInMeters < 1000) {
    return ${distanceInMeters.toFixed(0)} m;
  }
  return ${(distanceInMeters / 1000).toFixed(2)} km;
};

/**
 * Calculate distance between two points in meters
 */
export const calculateDistance = (point1, point2) => {
  const [lat1, lng1] = point1;
  const [lat2, lng2] = point2;
  
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default {
  getPropertyCoordinates,
  isPointInCircle,
  isPointInPolygon,
  filterPropertiesInBoundary,
  getPropertiesCountInBoundary,
  getPolygonCenter,
  calculatePolygonArea,
  calculateDistance,
  formatArea,
  formatDistance,
};