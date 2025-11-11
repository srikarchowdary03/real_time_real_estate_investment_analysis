// src/utils/boundaryHelpers.js - FIXED VERSION
// Works with property.location.address.coordinate.lat/lon structure

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
 * Filter properties within boundary - FIXED FOR YOUR API STRUCTURE
 */
export const filterPropertiesInBoundary = (properties, boundary) => {
  if (!boundary || !properties || properties.length === 0) {
    return properties;
  }

  return properties.filter(property => {
    // FIXED: Get coordinates from correct structure
    const lat = property.location?.address?.coordinate?.lat;
    const lon = property.location?.address?.coordinate?.lon;

    // Skip if no valid coordinates
    if (!lat || !lon) {
      return false;
    }

    const propertyPoint = [lat, lon];

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
    return `${(areaInMeters / 1000).toFixed(2)} km²`;
  }
  return `${areaInMeters.toFixed(0)} m²`;
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceInMeters) => {
  if (distanceInMeters < 1000) {
    return `${distanceInMeters.toFixed(0)} m`;
  }
  return `${(distanceInMeters / 1000).toFixed(2)} km`;
};