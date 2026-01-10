import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates } from '@/hooks/useGeolocation';
import { Territory, useTerritories } from '@/hooks/useTerritories';
import { useAuth } from '@/contexts/AuthContext';
import { UserPresence } from '@/hooks/useUserPresence';
import { getCentroid } from '@/lib/territoryUtils';

interface TerritoryMapProps {
  center?: Coordinates;
  path?: Coordinates[];
  height?: string;
  showCurrentLocation?: boolean;
  isTracking?: boolean;
  zoom?: number;
  pincode?: string;
  showTerritories?: boolean;
  previewTerritory?: Coordinates[];
  nearbyUsers?: UserPresence[];
}

// Territory color palette - vibrant and distinguishable
const TERRITORY_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

// Get consistent color for a user
const getUserColor = (userId: string, index: number): string => {
  // Use user ID hash for consistent color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % TERRITORY_COLORS.length;
  return TERRITORY_COLORS[colorIndex];
};

export function TerritoryMap({ 
  center, 
  path = [], 
  height = '300px',
  showCurrentLocation = true,
  isTracking = false,
  zoom = 15,
  pincode,
  showTerritories = true,
  previewTerritory,
  nearbyUsers = []
}: TerritoryMapProps) {
  const { user } = useAuth();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathLineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const territoryLayersRef = useRef<L.Layer[]>([]);
  const previewLayerRef = useRef<L.Polygon | null>(null);
  const nearbyUserMarkersRef = useRef<L.CircleMarker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const { territories } = useTerritories(showTerritories ? pincode || null : null);

  // Track if we've centered on user location already
  const hasCenteredRef = useRef(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultCenter: L.LatLngExpression = center 
      ? [center.lat, center.lng] 
      : [40.7128, -74.0060];

    mapRef.current = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: zoom,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(mapRef.current);

    setMapReady(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
        hasCenteredRef.current = false;
      }
    };
  }, []);

  // Update map center - center once on first location, then only when tracking
  useEffect(() => {
    if (!mapRef.current || !center) return;

    // Always center on first valid location
    if (!hasCenteredRef.current) {
      mapRef.current.setView([center.lat, center.lng], zoom);
      hasCenteredRef.current = true;
      console.log('Map: Centered on user location', center.lat.toFixed(6), center.lng.toFixed(6));
    } else if (isTracking) {
      // While tracking, keep panning to follow user
      mapRef.current.panTo([center.lat, center.lng]);
    }
  }, [center, isTracking, zoom]);

  // Update current location marker
  useEffect(() => {
    if (!mapRef.current || !center || !showCurrentLocation) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([center.lat, center.lng]);
    } else {
      markerRef.current = L.circleMarker([center.lat, center.lng], {
        radius: 12,
        fillColor: '#10b981',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 3
      }).addTo(mapRef.current);
      
      // Add pulsing effect element
      markerRef.current.bindTooltip('You are here', {
        permanent: false,
        direction: 'top',
        className: 'location-tooltip'
      });
    }
  }, [center, showCurrentLocation]);

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

      if (!isTracking && path.length > 0) {
        mapRef.current.fitBounds(pathLineRef.current.getBounds(), { padding: [50, 50] });
      }
    }
  }, [path, isTracking]);

  // Draw territories with colors and labels
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Clear existing territory layers
    territoryLayersRef.current.forEach(layer => {
      mapRef.current?.removeLayer(layer);
    });
    territoryLayersRef.current = [];

    // Draw each territory
    territories.forEach((territory, index) => {
      if (territory.territory_polygon.length < 3) return;

      const latLngs: L.LatLngExpression[] = territory.territory_polygon.map(
        p => [p.lat, p.lng]
      );

      const isOwnTerritory = territory.user_id === user?.id;
      const color = getUserColor(territory.user_id, index);
      
      // Create polygon with territory color
      const polygon = L.polygon(latLngs, {
        color: color,
        fillColor: color,
        fillOpacity: isOwnTerritory ? 0.4 : 0.25,
        weight: isOwnTerritory ? 3 : 2,
        dashArray: isOwnTerritory ? undefined : '5, 5'
      }).addTo(mapRef.current!);

      // Add popup with territory info
      polygon.bindPopup(`
        <div style="text-align: center; padding: 8px; min-width: 120px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 4px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${color};"></div>
            <strong style="color: #1f2937; font-size: 14px;">${territory.username}</strong>
          </div>
          <span style="color: #6b7280; font-size: 12px;">
            ${(territory.distance_meters / 1000).toFixed(2)} km covered
          </span>
          ${isOwnTerritory ? '<br/><span style="color: #10b981; font-size: 11px; font-weight: 500;">Your territory</span>' : ''}
        </div>
      `);

      territoryLayersRef.current.push(polygon);

      // Add label marker at centroid
      const centroid = getCentroid(territory.territory_polygon);
      const labelIcon = L.divIcon({
        className: 'territory-label',
        html: `
          <div style="
            background: ${color};
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            border: 2px solid white;
          ">
            ${territory.username?.split('@')[0] || 'Runner'}
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const labelMarker = L.marker([centroid.lat, centroid.lng], { 
        icon: labelIcon,
        interactive: false
      }).addTo(mapRef.current!);

      territoryLayersRef.current.push(labelMarker);
    });
  }, [territories, mapReady, user?.id]);

  // Draw preview territory (for current run before saving)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    if (previewLayerRef.current) {
      mapRef.current.removeLayer(previewLayerRef.current);
      previewLayerRef.current = null;
    }

    if (previewTerritory && previewTerritory.length >= 3) {
      const latLngs: L.LatLngExpression[] = previewTerritory.map(p => [p.lat, p.lng]);
      
      previewLayerRef.current = L.polygon(latLngs, {
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.3,
        weight: 2,
        dashArray: '10, 5'
      }).addTo(mapRef.current);
    }
  }, [previewTerritory, mapReady]);

  // Draw nearby users
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Clear existing markers
    nearbyUserMarkersRef.current.forEach(marker => {
      mapRef.current?.removeLayer(marker);
    });
    nearbyUserMarkersRef.current = [];

    // Add markers for nearby users
    nearbyUsers.forEach(nearbyUser => {
      const marker = L.circleMarker([nearbyUser.latitude, nearbyUser.longitude], {
        radius: 8,
        fillColor: nearbyUser.is_running ? '#ef4444' : '#3b82f6',
        fillOpacity: 0.9,
        color: '#ffffff',
        weight: 2
      }).addTo(mapRef.current!);

      marker.bindPopup(`
        <div style="text-align: center; padding: 4px;">
          <strong style="color: #1f2937;">${nearbyUser.username}</strong><br/>
          <span style="color: ${nearbyUser.is_running ? '#ef4444' : '#6b7280'}; font-size: 12px;">
            ${nearbyUser.is_running ? '🏃 Running' : 'Online'}
          </span>
        </div>
      `);

      nearbyUserMarkersRef.current.push(marker);
    });
  }, [nearbyUsers, mapReady]);

  return (
    <div 
      ref={containerRef} 
      className="map-container w-full rounded-xl"
      style={{ height }}
    />
  );
}
