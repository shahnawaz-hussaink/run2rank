import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates } from '@/hooks/useGeolocation';

interface RunMapProps {
  center?: Coordinates;
  path?: Coordinates[];
  height?: string;
  showCurrentLocation?: boolean;
  isTracking?: boolean;
  zoom?: number;
}

export function RunMap({ 
  center, 
  path = [], 
  height = '300px',
  showCurrentLocation = true,
  isTracking = false,
  zoom = 15
}: RunMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathLineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default center if none provided
    const defaultCenter: L.LatLngExpression = center 
      ? [center.lat, center.lng] 
      : [40.7128, -74.0060]; // NYC default

    mapRef.current = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: zoom,
      zoomControl: true,
      attributionControl: false
    });

    // Dark-themed tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map center when center prop changes
  useEffect(() => {
    if (mapRef.current && center) {
      if (isTracking) {
        mapRef.current.panTo([center.lat, center.lng]);
      }
    }
  }, [center, isTracking]);

  // Update current location marker
  useEffect(() => {
    if (!mapRef.current || !center || !showCurrentLocation) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([center.lat, center.lng]);
    } else {
      markerRef.current = L.circleMarker([center.lat, center.lng], {
        radius: 10,
        fillColor: '#22d3ee',
        fillOpacity: 1,
        color: '#0891b2',
        weight: 3,
        className: isTracking ? 'pulse-live' : ''
      }).addTo(mapRef.current);
    }
  }, [center, showCurrentLocation, isTracking]);

  // Update path line
  useEffect(() => {
    if (!mapRef.current) return;

    if (pathLineRef.current) {
      mapRef.current.removeLayer(pathLineRef.current);
    }

    if (path.length > 1) {
      const latLngs: L.LatLngExpression[] = path.map(p => [p.lat, p.lng]);
      
      pathLineRef.current = L.polyline(latLngs, {
        color: '#10b981',
        weight: 4,
        opacity: 0.9,
        smoothFactor: 1,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapRef.current);

      // If not tracking, fit bounds to show full path
      if (!isTracking && path.length > 0) {
        mapRef.current.fitBounds(pathLineRef.current.getBounds(), { padding: [50, 50] });
      }
    }
  }, [path, isTracking]);

  return (
    <div 
      ref={containerRef} 
      className="map-container w-full rounded-xl"
      style={{ height }}
    />
  );
}
