import { Coordinates } from '@/hooks/useGeolocation';

/**
 * Calculate convex hull of a set of points using Graham scan algorithm
 * This creates a boundary polygon from run path coordinates
 */
export function calculateConvexHull(points: Coordinates[]): Coordinates[] {
  if (points.length < 3) return points;

  // Remove duplicates
  const uniquePoints = points.filter((point, index, self) =>
    index === self.findIndex(p => p.lat === point.lat && p.lng === point.lng)
  );

  if (uniquePoints.length < 3) return uniquePoints;

  // Find the bottom-most point (or left-most in case of tie)
  let start = 0;
  for (let i = 1; i < uniquePoints.length; i++) {
    if (uniquePoints[i].lat < uniquePoints[start].lat ||
        (uniquePoints[i].lat === uniquePoints[start].lat && 
         uniquePoints[i].lng < uniquePoints[start].lng)) {
      start = i;
    }
  }

  // Swap start point to beginning
  [uniquePoints[0], uniquePoints[start]] = [uniquePoints[start], uniquePoints[0]];
  const pivot = uniquePoints[0];

  // Sort points by polar angle with respect to pivot
  const sorted = uniquePoints.slice(1).sort((a, b) => {
    const angleA = Math.atan2(a.lat - pivot.lat, a.lng - pivot.lng);
    const angleB = Math.atan2(b.lat - pivot.lat, b.lng - pivot.lng);
    if (angleA === angleB) {
      // If same angle, sort by distance
      const distA = (a.lat - pivot.lat) ** 2 + (a.lng - pivot.lng) ** 2;
      const distB = (b.lat - pivot.lat) ** 2 + (b.lng - pivot.lng) ** 2;
      return distA - distB;
    }
    return angleA - angleB;
  });

  // Graham scan
  const hull: Coordinates[] = [pivot];

  for (const point of sorted) {
    while (hull.length > 1 && !isCounterClockwise(hull[hull.length - 2], hull[hull.length - 1], point)) {
      hull.pop();
    }
    hull.push(point);
  }

  return hull;
}

/**
 * Check if three points make a counter-clockwise turn
 */
function isCounterClockwise(p1: Coordinates, p2: Coordinates, p3: Coordinates): boolean {
  return (p2.lng - p1.lng) * (p3.lat - p1.lat) - (p2.lat - p1.lat) * (p3.lng - p1.lng) > 0;
}

/**
 * Expand a polygon slightly to create a buffer zone
 */
export function expandPolygon(polygon: Coordinates[], bufferMeters: number = 50): Coordinates[] {
  if (polygon.length < 3) return polygon;

  const center = getCentroid(polygon);
  const expandFactor = 1 + (bufferMeters / 100000); // Approximate expansion

  return polygon.map(point => ({
    lat: center.lat + (point.lat - center.lat) * expandFactor,
    lng: center.lng + (point.lng - center.lng) * expandFactor
  }));
}

/**
 * Get centroid of polygon
 */
export function getCentroid(polygon: Coordinates[]): Coordinates {
  const sum = polygon.reduce(
    (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
    { lat: 0, lng: 0 }
  );
  return {
    lat: sum.lat / polygon.length,
    lng: sum.lng / polygon.length
  };
}

/**
 * Calculate area of polygon in square meters (approximate)
 */
export function calculatePolygonArea(polygon: Coordinates[]): number {
  if (polygon.length < 3) return 0;

  let area = 0;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].lng * polygon[j].lat;
    area -= polygon[j].lng * polygon[i].lat;
  }

  area = Math.abs(area) / 2;

  // Convert to approximate square meters (rough approximation)
  // 1 degree ≈ 111,000 meters
  const metersPerDegree = 111000;
  return area * metersPerDegree * metersPerDegree;
}

/**
 * Generate a color based on user ID for consistent territory coloring
 */
export function getUserTerritoryColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Check if a point is inside a polygon using ray casting
 */
export function isPointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;

    if (((yi > point.lat) !== (yj > point.lat)) &&
        (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}
